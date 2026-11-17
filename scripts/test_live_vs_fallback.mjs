/**
 * Verification test for live backend vs. fallback transitions.
 * Tests that:
 * 1. Live backend produces real ML recommendations with is_fallback: false.
 * 2. When the backend is offline/sleeping, high-speed fallback is triggered with is_fallback: true.
 */
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const catalogueData = JSON.parse(fs.readFileSync(path.join(rootDir, 'frontend/public/data/catalogue.json'), 'utf-8'));
const popularityData = JSON.parse(fs.readFileSync(path.join(rootDir, 'frontend/public/data/popularity.json'), 'utf-8'));

// Mock fetch for relative static files only
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const urlStr = String(url);
  if (urlStr.includes('/data/catalogue.json')) return { ok: true, status: 200, json: async () => catalogueData };
  if (urlStr.includes('/data/popularity.json')) return { ok: true, status: 200, json: async () => popularityData };
  return originalFetch(url, opts);
};

// Start uvicorn on port 8000 (default in api.js)
const py = spawn(path.join(rootDir, '.venv/bin/uvicorn'), ['backend.app.main:app', '--port', '8000'], { stdio: 'ignore' });

async function checkHealth() {
  for (let i = 0; i < 40; i++) {
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:8000/health', (res) => resolve(res.statusCode === 200));
        req.on('error', () => resolve(false));
      });
      if (ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

(async () => {
  console.log('Starting local backend server on port 8000...');
  const ready = await checkHealth();
  if (!ready) {
    py.kill();
    console.error('Failed to start local backend server.');
    process.exit(1);
  }
  console.log('Backend server online. Testing Live ML Inference...');

  const { api } = await import(path.join(rootDir, 'frontend/src/services/api.js'));

  // Test 1: Live backend Popularity
  const popLive = await api.getPopularityRecommendations([27205], 5);
  console.log('  [PASS] Live Popularity: is_fallback =', popLive.is_fallback, '| Top title =', popLive.movies[0]?.title);

  // Test 2: Live backend TF-IDF
  const ratings = { '98344': 5.0, '351863': 4.5, '73941': 3.0, '257109': 1.5, '315669': 2.0 };
  const tfidfLive = await api.getTfidfRecommendations(ratings, 5);
  console.log('  [PASS] Live TF-IDF: is_fallback =', tfidfLive.is_fallback, '| Top title =', tfidfLive.movies[0]?.title, '| Score =', tfidfLive.movies[0]?.score);

  // Test 3: Live backend Genre
  const genreLive = await api.getGenreRecommendations(ratings, 5);
  console.log('  [PASS] Live Genre: is_fallback =', genreLive.is_fallback, '| Top title =', genreLive.movies[0]?.title, '| Score =', genreLive.movies[0]?.score);

  // Test 4: Live waitForBackend responds ready: true on attempt 1
  const liveWait = await api.waitForBackend({ maxAttempts: 2, timeoutPerAttempt: 2000, intervalMs: 200 });
  console.log('  [PASS] Live waitForBackend: ready =', liveWait.ready, '| Attempts =', liveWait.attempts);

  // Terminate backend to simulate cold start / sleep
  py.kill();
  await new Promise((r) => setTimeout(r, 600));
  console.log('\nSimulating sleeping backend / cold-start timeout...');

  // Test 5: Offline Fallback Popularity
  const popFallback = await api.getPopularityRecommendations([27205], 5, 500);
  console.log('  [PASS] Offline Popularity: is_fallback =', popFallback.is_fallback, '| Count =', popFallback.movies.length);

  // Test 6: Offline Fallback TF-IDF
  const tfidfFallback = await api.getTfidfRecommendations(ratings, 5, 500);
  console.log('  [PASS] Offline TF-IDF: is_fallback =', tfidfFallback.is_fallback, '| Count =', tfidfFallback.movies.length);

  // Test 7: Offline Fallback Genre
  const genreFallback = await api.getGenreRecommendations(ratings, 5, 500);
  console.log('  [PASS] Offline Genre: is_fallback =', genreFallback.is_fallback, '| Count =', genreFallback.movies.length);

  // Test 8: Offline waitForBackend exhausts attempts and provides meaningful error
  const offlineWait = await api.waitForBackend({ maxAttempts: 2, timeoutPerAttempt: 300, intervalMs: 100 });
  console.log('  [PASS] Offline waitForBackend: ready =', offlineWait.ready, '| Has error =', Boolean(offlineWait.error));

  if (popLive.is_fallback === false && tfidfLive.is_fallback === false && genreLive.is_fallback === false && liveWait.ready === true &&
      popFallback.is_fallback === true && tfidfFallback.is_fallback === true && genreFallback.is_fallback === true && offlineWait.ready === false) {
    console.log('\n======================================================');
    console.log('ALL LIVE VS FALLBACK INTEGRATION TESTS PASSED!');
    console.log('======================================================\n');
  } else {
    console.error('\nVerification failed.');
    process.exit(1);
  }
})();
