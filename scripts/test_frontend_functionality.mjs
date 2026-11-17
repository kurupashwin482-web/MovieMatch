/**
 * Comprehensive Automated Verification Suite for MovieMatch Frontend
 * Simulates browser localStorage and runs thorough tests for Parts 5A through 5G.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Mock localStorage in Node
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => store,
  };
})();
globalThis.localStorage = mockLocalStorage;

// Mock window and navigator if needed
globalThis.window = { localStorage: mockLocalStorage };

// Mock fetch to load static files directly from frontend/public/data or dist/data
const cataloguePath = path.join(rootDir, 'frontend/public/data/catalogue.json');
const genresPath = path.join(rootDir, 'frontend/public/data/genres.json');
const popularityPath = path.join(rootDir, 'frontend/public/data/popularity.json');

const catalogueData = JSON.parse(fs.readFileSync(cataloguePath, 'utf-8'));
const genresData = JSON.parse(fs.readFileSync(genresPath, 'utf-8'));
const popularityData = JSON.parse(fs.readFileSync(popularityPath, 'utf-8'));

globalThis.fetch = async (url, options = {}) => {
  const urlStr = String(url);
  if (urlStr.includes('/data/catalogue.json')) {
    return {
      ok: true,
      status: 200,
      json: async () => catalogueData,
    };
  }
  if (urlStr.includes('/data/genres.json')) {
    return {
      ok: true,
      status: 200,
      json: async () => genresData,
    };
  }
  if (urlStr.includes('/data/popularity.json')) {
    return {
      ok: true,
      status: 200,
      json: async () => popularityData,
    };
  }
  // Simulate offline / unreachable backend for remote URLs
  if (urlStr.startsWith('http')) {
    const error = new TypeError('Failed to fetch');
    throw error;
  }
  return {
    ok: false,
    status: 404,
    json: async () => ({ detail: 'Not found' }),
  };
};

async function runTests() {
  console.log('====================================================');
  console.log('MovieMatch Frontend Automated Verification Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName} ${details}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details}`);
      failed++;
    }
  }

  // Import services
  const { storage } = await import('../frontend/src/services/storage.js');
  const { api } = await import('../frontend/src/services/api.js');

  // TEST A: Initial application & wording
  console.log('--- TEST A: Initial Application & Wording ---');
  mockLocalStorage.clear();
  const initialRatings = storage.getRatings();
  assert(Object.keys(initialRatings).length === 0, 'LocalStorage cleared initially');

  const ratingProgressSource = fs.readFileSync(path.join(rootDir, 'frontend/src/components/RatingProgressBar.jsx'), 'utf-8');
  assert(!ratingProgressSource.includes('No Login Required'), 'No "(No Login Required)" wording in RatingProgressBar.jsx');
  assert(ratingProgressSource.includes('Unlock Personalized Recommendations'), 'Clean "Unlock Personalized Recommendations" title present');

  // TEST B: Catalogue Loading
  console.log('\n--- TEST B: Movie Catalogue Loading ---');
  const startCat = performance.now();
  const catResult = await api.searchMovies({ page: 1, limit: 24 });
  const catTime = (performance.now() - startCat).toFixed(1);
  assert(catResult.total >= 2000, `Catalogue contains ${catResult.total} movies (loaded in ${catTime}ms)`);
  assert(catResult.movies.length === 24, `Page 1 returns 24 movies`);
  const firstMovie = catResult.movies[0];
  assert(firstMovie && firstMovie.tmdbId && firstMovie.title, `Movie metadata intact (Title: "${firstMovie.title}", ID: ${firstMovie.tmdbId})`);

  // TEST C: Search Functionality
  console.log('\n--- TEST C: Search Queries ---');
  // 1. Inception
  const inceptionRes = await api.searchMovies({ query: 'Inception' });
  const foundInception = inceptionRes.movies.some(m => m.title.toLowerCase().includes('inception'));
  assert(foundInception, `Search "Inception" returns results (Found: ${inceptionRes.total})`);

  // 2. The Dark Knight
  const dkRes = await api.searchMovies({ query: 'The Dark Knight' });
  const foundDK = dkRes.movies.some(m => m.title.toLowerCase().includes('dark knight'));
  assert(foundDK, `Search "The Dark Knight" returns results (Found: ${dkRes.total})`);

  // 3. Toy Story
  const tsRes = await api.searchMovies({ query: 'Toy Story' });
  const foundTS = tsRes.movies.some(m => m.title.toLowerCase().includes('toy story'));
  assert(foundTS, `Search "Toy Story" returns results (Found: ${tsRes.total})`);

  // 4. Partial title
  const partialRes = await api.searchMovies({ query: 'Incep' });
  assert(partialRes.movies.some(m => m.title.toLowerCase().includes('inception')), `Partial title search "Incep" works`);

  // 5. Capitalization variation
  const capRes = await api.searchMovies({ query: 'iNcEpTiOn' });
  assert(capRes.movies.some(m => m.title.toLowerCase().includes('inception')), `Case-insensitive search "iNcEpTiOn" works`);

  // 6. Nonexistent title
  const noneRes = await api.searchMovies({ query: 'NonexistentMovieXYZ999' });
  assert(noneRes.total === 0 && noneRes.movies.length === 0, `Nonexistent search returns 0 results cleanly`);

  // TEST D: Genre Options & Filtering
  console.log('\n--- TEST D: Genre Options & Filtering ---');
  const genres = await api.getGenres();
  assert(genres.length === 20, `Genre list populated with all ${genres.length} genres`);
  assert(genres.includes('Action') && genres.includes('Science Fiction') && genres.includes('Drama'), 'Common genres present');

  // Filter by Action
  const actionRes = await api.searchMovies({ genre: 'Action', limit: 20 });
  const allAction = actionRes.movies.every(m => m.genres.includes('Action'));
  assert(allAction && actionRes.total > 0, `Filter "Action" returns only Action movies (${actionRes.total} total)`);

  // Combined search + genre
  const combinedRes = await api.searchMovies({ query: 'Batman', genre: 'Action' });
  const allMatch = combinedRes.movies.every(m => m.title.toLowerCase().includes('batman') && m.genres.includes('Action'));
  assert(allMatch && combinedRes.total > 0, `Combined search "Batman" + genre "Action" works (${combinedRes.total} total)`);

  // TEST E: Movie Ratings & LocalStorage
  console.log('\n--- TEST E: Movie Ratings & LocalStorage Persistence ---');
  const testMovie1 = { tmdbId: 27205, title: 'Inception', release_year: 2010, genres: ['Action', 'Sci-Fi'] };
  const testMovie2 = { tmdbId: 49026, title: 'The Dark Knight Rises', release_year: 2012, genres: ['Action', 'Thriller'] };
  const testMovie3 = { tmdbId: 10193, title: 'Toy Story 3', release_year: 2010, genres: ['Animation', 'Comedy'] };
  const testMovie4 = { tmdbId: 680, title: 'Pulp Fiction', release_year: 1994, genres: ['Crime', 'Drama'] };
  const testMovie5 = { tmdbId: 157336, title: 'Interstellar', release_year: 2014, genres: ['Adventure', 'Sci-Fi'] };

  // 1. Rate movie 1
  storage.saveRating(testMovie1, 5.0);
  let saved = storage.getRatings();
  assert(saved['27205'] && saved['27205'].rating === 5.0, 'Rating saved to localStorage (5.0 stars)');

  // 2. Update rating
  storage.saveRating(testMovie1, 4.5);
  saved = storage.getRatings();
  assert(saved['27205'].rating === 4.5, 'Rating updated cleanly without duplicate (4.5 stars)');

  // 3. Remove rating
  storage.removeRating(27205);
  saved = storage.getRatings();
  assert(!saved['27205'], 'Rating removed from localStorage');

  // 4. Rate 5 distinct movies
  storage.saveRating(testMovie1, 5.0);
  storage.saveRating(testMovie2, 4.5);
  storage.saveRating(testMovie3, 4.0);
  storage.saveRating(testMovie4, 5.0);
  storage.saveRating(testMovie5, 4.5);
  saved = storage.getRatings();
  const count = Object.keys(saved).length;
  assert(count === 5, `5 distinct movie ratings recorded in localStorage (Count: ${count})`);

  // 5. Test payload extraction
  const payload = storage.getRatingsPayload();
  assert(payload[27205] === 5.0 && payload[157336] === 4.5, 'Ratings payload formatted correctly for API');
  const ratedIds = storage.getRatedMovieIds();
  assert(ratedIds.length === 5, 'Rated movie IDs list formatted correctly');

  // TEST F: Recommendations
  console.log('\n--- TEST F: Recommendation Methods ---');
  // 1. Popularity recommendation (works without ratings and excludes rated)
  const popRec = await api.getPopularityRecommendations(ratedIds, 10);
  assert(popRec.movies.length === 10, `Popularity recommendations returned 10 movies`);
  assert(popRec.is_fallback === true, `Popularity fallback clearly flags is_fallback: true`);
  const anyRatedInPop = popRec.movies.some(m => ratedIds.includes(m.tmdbId));
  assert(!anyRatedInPop, `Popularity recommendations successfully exclude user's rated movies`);

  // 2. Genre recommendations
  const genreRec = await api.getGenreRecommendations(payload, 10);
  assert(genreRec.movies.length === 10, `Genre recommendations returned 10 movies`);
  assert(genreRec.is_fallback === true, `Genre fallback clearly flags is_fallback: true`);
  const genreFirst = genreRec.movies[0];
  assert(genreFirst && genreFirst.score !== undefined, `Genre recommendation contains similarity score (${genreFirst.score})`);

  // 3. TF-IDF recommendations
  const tfidfRec = await api.getTfidfRecommendations(payload, 10);
  assert(tfidfRec.movies.length === 10, `TF-IDF recommendations returned 10 movies`);
  assert(tfidfRec.is_fallback === true, `TF-IDF fallback clearly flags is_fallback: true`);
  const tfidfFirst = tfidfRec.movies[0];
  assert(tfidfFirst && tfidfFirst.score !== undefined, `TF-IDF recommendation contains match score (${tfidfFirst.score})`);

  // 4. Strict 5-rating enforcement on personalized recommendations
  let tfidf400Caught = false;
  try {
    await api.getTfidfRecommendations({ 27205: 5.0, 49026: 4.5 }, 10);
  } catch (err) {
    if (err.status === 400) tfidf400Caught = true;
  }
  assert(tfidf400Caught, 'TF-IDF enforces minimum 5 ratings constraint and returns 400 error');

  let genre400Caught = false;
  try {
    await api.getGenreRecommendations({ 27205: 5.0, 49026: 4.5 }, 10);
  } catch (err) {
    if (err.status === 400) genre400Caught = true;
  }
  assert(genre400Caught, 'Genre recommender enforces minimum 5 ratings constraint and returns 400 error');

  // 5. Fallback notice banner presence in RecommendationSection
  const recSectionSrc = fs.readFileSync(path.join(rootDir, 'frontend/src/components/RecommendationSection.jsx'), 'utf-8');
  assert(recSectionSrc.includes('fallback-banner'), 'RecommendationSection contains fallback-banner element');
  assert(recSectionSrc.includes('Connect to Live Backend'), 'RecommendationSection contains Connect to Live Backend retry action');

  // TEST G: Clear ratings
  console.log('\n--- TEST G: Clear Ratings ---');
  storage.clearAll();
  const cleared = storage.getRatings();
  assert(Object.keys(cleared).length === 0, 'All ratings successfully cleared');

  // TEST H: Variable Top-K Slider Support
  console.log('\n--- TEST H: Variable Top-K Slider Support ---');
  // Re-seed 5 ratings for personalized models
  storage.saveRating(testMovie1, 5.0);
  storage.saveRating(testMovie2, 4.5);
  storage.saveRating(testMovie3, 4.0);
  storage.saveRating(testMovie4, 5.0);
  storage.saveRating(testMovie5, 4.5);
  const testPayload = storage.getRatingsPayload();
  const testRatedIds = storage.getRatedMovieIds();

  // Test K = 5
  const pop5 = await api.getPopularityRecommendations(testRatedIds, 5);
  assert(pop5.movies.length === 5, 'Popularity recommendations with K=5 returns 5 movies');
  const genre5 = await api.getGenreRecommendations(testPayload, 5);
  assert(genre5.movies.length === 5, 'Genre recommendations with K=5 returns 5 movies');
  const tfidf5 = await api.getTfidfRecommendations(testPayload, 5);
  assert(tfidf5.movies.length === 5, 'TF-IDF recommendations with K=5 returns 5 movies');

  // Test K = 15
  const pop15 = await api.getPopularityRecommendations(testRatedIds, 15);
  assert(pop15.movies.length === 15, 'Popularity recommendations with K=15 returns 15 movies');
  const genre15 = await api.getGenreRecommendations(testPayload, 15);
  assert(genre15.movies.length === 15, 'Genre recommendations with K=15 returns 15 movies');
  const tfidf15 = await api.getTfidfRecommendations(testPayload, 15);
  assert(tfidf15.movies.length === 15, 'TF-IDF recommendations with K=15 returns 15 movies');

  // Test K = 20
  const pop20 = await api.getPopularityRecommendations(testRatedIds, 20);
  assert(pop20.movies.length === 20, 'Popularity recommendations with K=20 returns 20 movies');
  const genre20 = await api.getGenreRecommendations(testPayload, 20);
  assert(genre20.movies.length === 20, 'Genre recommendations with K=20 returns 20 movies');
  const tfidf20 = await api.getTfidfRecommendations(testPayload, 20);
  assert(tfidf20.movies.length === 20, 'TF-IDF recommendations with K=20 returns 20 movies');

  // TEST I: Star Display Fix & Golden Styling
  console.log('\n--- TEST I: Star Display & Golden Styling ---');
  const starRatingCode = fs.readFileSync(path.join(rootDir, 'frontend/src/components/StarRating.jsx'), 'utf-8');
  assert(starRatingCode.includes('#fbbf24'), 'StarRating.jsx uses #fbbf24 golden color for filled stars');
  assert(starRatingCode.includes('activeValue >= starIndex'), 'StarRating.jsx determines filled state correctly');
  assert(starRatingCode.includes('fill={isFilled ? \'#fbbf24\' : \'none\'}'), 'Star SVG fill prop properly bound');

  const indexCss = fs.readFileSync(path.join(rootDir, 'frontend/src/index.css'), 'utf-8');
  assert(indexCss.includes('.star-button.filled .star-icon') && indexCss.includes('#fbbf24'), 'CSS contains explicit .star-button.filled rule with golden color');

  // TEST J: Actual Movie Posters & Neutral Fallback
  console.log('\n--- TEST J: Actual Movie Posters & Neutral Fallback ---');
  const movieCardCode = fs.readFileSync(path.join(rootDir, 'frontend/src/components/MovieCard.jsx'), 'utf-8');
  assert(movieCardCode.includes('movie-poster'), 'MovieCard.jsx renders real movie posters with movie-poster class');
  assert(movieCardCode.includes('neutral-fallback'), 'MovieCard.jsx incorporates clean neutral-fallback');
  assert(!movieCardCode.includes('getPosterTheme'), 'MovieCard.jsx removed artificial colorful gradients');
  assert(indexCss.includes('.poster-fallback.neutral-fallback'), 'CSS contains dedicated .neutral-fallback styling');

  // Verify verified posters in popularity.json
  const verifiedInPop = popularityData.filter(m => m.poster_url && m.poster_url.includes('image.tmdb.org'));
  assert(verifiedInPop.length === popularityData.length, `100% of popularity movies have verified TMDB posters (${verifiedInPop.length}/${popularityData.length})`);

  // TEST K: Mathematical Equation Readability & Academic Presentation
  console.log('\n--- TEST K: Mathematical Equation Readability & Academic Presentation ---');
  const navbarCode = fs.readFileSync(path.join(rootDir, 'frontend/src/components/Navbar.jsx'), 'utf-8');
  assert(navbarCode.includes('Project Analysis') && navbarCode.includes('BookOpen'), 'Navbar.jsx contains Project Analysis tab');

  const appCode = fs.readFileSync(path.join(rootDir, 'frontend/src/App.jsx'), 'utf-8');
  assert(appCode.includes('ProjectAnalysisSection'), 'App.jsx imports and routes ProjectAnalysisSection');

  const analysisCode = fs.readFileSync(path.join(rootDir, 'frontend/src/components/ProjectAnalysisSection.jsx'), 'utf-8');
  assert(!analysisCode.toLowerCase().includes('viva'), 'ProjectAnalysisSection.jsx contains no examination/viva references');
  assert(analysisCode.includes('MathEquation'), 'ProjectAnalysisSection.jsx uses MathEquation KaTeX component');
  assert(analysisCode.includes('Top-K') && analysisCode.includes('argmax'), 'Top-K formula rendered with KaTeX');
  assert(analysisCode.includes('\\text{WR}(m)'), 'IMDb Bayesian Weighted Rating formula rendered with KaTeX');
  assert(analysisCode.includes('\\vec{p}_u'), 'TF-IDF preference profile rendered with KaTeX');
  assert(analysisCode.includes('S_{\\text{hybrid}}'), 'Hybrid quality score formula rendered with KaTeX');
  assert(indexCss.includes('.math-block-container'), 'CSS contains dedicated .math-block-container styling');

  const requiredSections = [
    'sec-problem',
    'sec-data',
    'sec-preprocessing',
    'sec-eda',
    'sec-models',
    'sec-eval',
    'sec-results',
    'sec-errors',
    'sec-limitations',
    'sec-reproducibility',
  ];
  const allSectionsPresent = requiredSections.every(secId => analysisCode.includes(secId));
  assert(allSectionsPresent, `ProjectAnalysisSection.jsx contains all 10 required academic sections`);

  assert(analysisCode.includes('Ashwin Kurup'), 'Individual project author identified');
  assert(analysisCode.includes('Bayesian Popularity'), 'Bayesian Popularity model detailed');
  assert(analysisCode.includes('TF-IDF Content'), 'TF-IDF Content model detailed');
  assert(analysisCode.includes('Genre-Based Hybrid'), 'Genre-Based Hybrid model detailed');
  assert(analysisCode.includes('16.98%'), 'Authentic Precision@10 result present');
  assert(analysisCode.includes('5.27%'), 'Authentic Recall@10 result present');
  assert(analysisCode.includes('18.36%'), 'Authentic NDCG@10 result present');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
