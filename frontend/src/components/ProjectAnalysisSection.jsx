import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Cpu,
  BarChart3,
  Layers,
  Target,
  Award,
  AlertTriangle,
  ShieldAlert,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Terminal,
} from 'lucide-react';
import { MathEquation } from './MathEquation';

const REPO_URL = 'https://github.com/kurupashwin482-web/MovieMatch';

export const ProjectAnalysisSection = () => {
  const [activeSection, setActiveSection] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    problem: true,
    data: true,
    preprocessing: true,
    eda: true,
    models: true,
    evaluation: true,
    results: true,
    errors: true,
    limitations: true,
    reproducibility: true,
  });

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setExpandedSections({
      problem: true,
      data: true,
      preprocessing: true,
      eda: true,
      models: true,
      evaluation: true,
      results: true,
      errors: true,
      limitations: true,
      reproducibility: true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      problem: false,
      data: false,
      preprocessing: false,
      eda: false,
      models: false,
      evaluation: false,
      results: false,
      errors: false,
      limitations: false,
      reproducibility: false,
    });
  };

  return (
    <div className="project-analysis-container">
      {/* Page Header */}
      <div className="analysis-header-card">
        <div className="analysis-header-badge">
          <BookOpen size={16} />
          <span>ES 335: Machine Learning &bull; Individual Project Presentation</span>
        </div>
        <h1 className="analysis-main-title">
          MovieMatch: Algorithmic Architecture & Empirical Study
        </h1>
        <p className="analysis-lead-text">
          A comprehensive comparative evaluation of Bayesian Shrinkage, 20,000-dimensional TF-IDF Content Modeling,
          and Multi-Hot Genre-Quality Hybridization for real-time movie recommendation.
        </p>

        <div className="analysis-meta-row">
          <div className="meta-item">
            <span className="meta-label">Author</span>
            <span className="meta-value">Ashwin Kurup</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Course</span>
            <span className="meta-value">ES 335: Machine Learning</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Catalogue Scope</span>
            <span className="meta-value">12,794 Modern Films (2010–2017)</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Evaluation Dataset</span>
            <span className="meta-value">GroupLens MovieLens (26M Ratings)</span>
          </div>
        </div>

        <div className="analysis-controls-row">
          <div className="quick-nav-pills">
            <button
              type="button"
              className={`quick-pill ${activeSection === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveSection('all'); expandAll(); }}
            >
              All Sections
            </button>
            <a href="#sec-problem" className="quick-pill">Problem</a>
            <a href="#sec-data" className="quick-pill">Data</a>
            <a href="#sec-preprocessing" className="quick-pill">Preprocessing</a>
            <a href="#sec-eda" className="quick-pill">EDA</a>
            <a href="#sec-models" className="quick-pill">Models</a>
            <a href="#sec-eval" className="quick-pill">Evaluation</a>
            <a href="#sec-results" className="quick-pill">Results</a>
            <a href="#sec-errors" className="quick-pill">Errors</a>
            <a href="#sec-limitations" className="quick-pill">Limitations</a>
            <a href="#sec-reproducibility" className="quick-pill">Reproducibility</a>
          </div>

          <div className="expand-collapse-btns">
            <button type="button" className="btn-secondary-sm" onClick={expandAll}>
              Expand All
            </button>
            <button type="button" className="btn-secondary-sm" onClick={collapseAll}>
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Problem Formulation */}
      <section id="sec-problem" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('problem')}>
          <div className="section-title-group">
            <Target className="section-icon text-indigo" size={22} />
            <div>
              <span className="section-number">Section 01</span>
              <h2 className="section-heading">Problem Formulation</h2>
            </div>
          </div>
          {expandedSections.problem ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.problem && (
          <div className="section-content-body">
            <div className="callout-box">
              <h4 className="callout-title">Core Research Question</h4>
              <p>
                <em>
                  "How do different recommendation approaches compare when suggesting movies: a simple popularity baseline,
                  a word-based plot analyzer (TF-IDF), or a genre-matching hybrid? How well do they recommend movies to new visitors,
                  avoid suggesting low-quality films, and accurately predict what users will actually enjoy?"
                </em>
              </p>
            </div>

            <div className="grid-two-col">
              <div className="content-card">
                <h3 className="card-subtitle">Project Goals</h3>
                <p>
                  To design, build, evaluate, and deploy a complete movie recommendation website with four goals:
                </p>
                <ul className="bullet-list">
                  <li>
                    <strong>Instant Suggestions for New Visitors:</strong> Recommend popular, highly rated movies right away, even before the visitor has rated anything (solving the cold-start problem).
                  </li>
                  <li>
                    <strong>Matching Plot Themes:</strong> Analyze movie descriptions across 20,000 words to match specific plot themes (such as time travel, heists, or space missions).
                  </li>
                  <li>
                    <strong>Balancing Taste with Quality:</strong> Recommend movies in genres the user likes, while factoring in overall movie quality so low-rated films are not recommended just because of their genre.
                  </li>
                  <li>
                    <strong>Fast and Private:</strong> Run smoothly in the browser using local storage, without requiring any account creation or login.
                  </li>
                </ul>
              </div>

              <div className="content-card">
                <h3 className="card-subtitle">Mathematical Definition of the Prediction Task</h3>
                <p>
                  Given a candidate catalogue of films <MathEquation display={false} math="\mathcal{M} = \{m_1, m_2, \dots, m_N\}" /> and an active user{' '}
                  <MathEquation display={false} math="u" /> who has submitted ratings for an observed subset{' '}
                  <MathEquation display={false} math="\mathcal{R}_u = \{(m, r_{um}) \mid r_{um} \in [0.5, 5.0]\}" />:
                </p>
                <div className="formula-block">
                  <span className="formula-label">Top-K Selection:</span>
                  <MathEquation
                    display={true}
                    math="\operatorname*{Top-K}(u) = \operatorname*{argmax}_{m \in \mathcal{M} \setminus \text{Rated}(u)}^{(K)} S(u, m)"
                    ariaLabel="Top-K Selection Formula"
                  />
                </div>
                <p className="caption-text">
                  <strong>What this means:</strong> We want to pick the top 10 movies for a user from the movies they haven't seen yet. Each model calculates a score <MathEquation display={false} math="S(u, m)" /> for every unrated candidate movie, sorts them from highest to lowest score, and returns the top 10.
                </p>
              </div>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Unit of Observation: What One Row Represents</h3>
              <div className="table-wrapper">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Dataset File</th>
                      <th>Source</th>
                      <th>One Row Represents</th>
                      <th>Primary Key / Foreign Keys</th>
                      <th>Role in MovieMatch</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>movies_metadata.csv</code></td>
                      <td>TMDB API / Kaggle</td>
                      <td>A single film and its descriptive textual & production metadata</td>
                      <td><code>id</code> (TMDB ID)</td>
                      <td>Supplies textual plot overviews, poster paths, and genre tags</td>
                    </tr>
                    <tr>
                      <td><code>ratings.csv</code></td>
                      <td>GroupLens MovieLens</td>
                      <td>A single rating event from a user for a specific film</td>
                      <td><code>userId</code>, <code>movieId</code>, <code>timestamp</code></td>
                      <td>Supplies ground-truth user preferences for offline evaluation</td>
                    </tr>
                    <tr>
                      <td><code>links.csv</code></td>
                      <td>GroupLens Research</td>
                      <td>A relational cross-reference between external film identifier systems</td>
                      <td><code>movieId</code> &harr; <code>imdbId</code>, <code>tmdbId</code></td>
                      <td>Bridges MovieLens interaction matrix with TMDB rich metadata</td>
                    </tr>
                    <tr>
                      <td><code>movies_clean.csv</code></td>
                      <td>Processed Pipeline</td>
                      <td>A verified post-2010 film with unified rating metrics and overview</td>
                      <td><code>tmdbId</code></td>
                      <td>The central catalogue (12,794 films) powering all recommenders</td>
                    </tr>
                    <tr>
                      <td><code>popularity_ranking.csv</code></td>
                      <td>Processed Pipeline</td>
                      <td>A catalogue film scored by its Bayesian weighted rating</td>
                      <td><code>tmdbId</code>, <code>weighted_rating</code></td>
                      <td>Static lookup table for immediate cold-start recommendations</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Data Understanding */}
      <section id="sec-data" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('data')}>
          <div className="section-title-group">
            <Database className="section-icon text-cyan" size={22} />
            <div>
              <span className="section-number">Section 02</span>
              <h2 className="section-heading">Data Understanding & Architecture</h2>
            </div>
          </div>
          {expandedSections.data ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.data && (
          <div className="section-content-body">
            <div className="stat-cards-grid">
              <div className="stat-card">
                <span className="stat-val">26,024,289</span>
                <span className="stat-lbl">Total MovieLens Ratings</span>
              </div>
              <div className="stat-card">
                <span className="stat-val">45,466</span>
                <span className="stat-lbl">Raw TMDB Film Entries</span>
              </div>
              <div className="stat-card">
                <span className="stat-val">12,794</span>
                <span className="stat-lbl">Clean Modern Catalogue</span>
              </div>
              <div className="stat-card">
                <span className="stat-val">20</span>
                <span className="stat-lbl">Distinct Movie Genres</span>
              </div>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Relational Dataset Connectivity</h3>
              <p>
                The project relies on a multi-stage foreign key bridge connecting two disparate data repositories:
              </p>
              <div className="schema-flow-card">
                <div className="schema-node">
                  <span className="node-badge">GroupLens</span>
                  <strong>ratings.csv</strong>
                  <span className="node-col">userId, movieId, rating, timestamp</span>
                </div>
                <div className="schema-arrow">&harr; (movieId) &harr;</div>
                <div className="schema-node">
                  <span className="node-badge">Relational Bridge</span>
                  <strong>links.csv</strong>
                  <span className="node-col">movieId, imdbId, tmdbId</span>
                </div>
                <div className="schema-arrow">&harr; (tmdbId = id) &harr;</div>
                <div className="schema-node">
                  <span className="node-badge">TMDB</span>
                  <strong>movies_metadata.csv</strong>
                  <span className="node-col">id, title, overview, genres, poster_path</span>
                </div>
              </div>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Data Quality Observations & Challenges</h3>
              <ul className="bullet-list">
                <li>
                  <strong>ID Type Mismatches:</strong> The raw metadata file contained corrupted rows where dates or text were inserted into the ID column.
                  Strict regex filtering (<code>str.isnumeric()</code>) and integer casting were required.
                </li>
                <li>
                  <strong>Duplicate Movie Records:</strong> 934 duplicate IDs were detected in the raw TMDB metadata. Deduplication was performed to prevent duplicate recommendations.
                </li>
                <li>
                  <strong>Missing Plot Overviews:</strong> 954 movies (2.4%) in the cleaned catalogue lacked plot descriptions. Imputing empty strings allowed the TF-IDF vectorizer to run without discarding films from the catalogue.
                </li>
                <li>
                  <strong>Rating Sparsity:</strong> Over 99.4% of the user-item interaction matrix is unobserved. Naive collaborative filtering would suffer extreme cold start, justifying content-based and hybrid methods.
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Data Preprocessing */}
      <section id="sec-preprocessing" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('preprocessing')}>
          <div className="section-title-group">
            <Layers className="section-icon text-amber" size={22} />
            <div>
              <span className="section-number">Section 03</span>
              <h2 className="section-heading">Data Preprocessing & Decisions</h2>
            </div>
          </div>
          {expandedSections.preprocessing ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.preprocessing && (
          <div className="section-content-body">
            <div className="pipeline-steps-grid">
              <div className="pipeline-step-card">
                <div className="step-num-badge">01</div>
                <h4>Catalogue Temporal Filtering</h4>
                <p>
                  <strong>Action:</strong> Filtered catalogue for movies released from <strong>2010 onwards</strong> (<code>release_year &ge; 2010</code>).
                </p>
                <p className="step-reason">
                  <strong>Rationale:</strong> Modern films feature complete textual overviews (97.6% coverage), high-resolution poster mappings, and high interest for web visitors.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-num-badge">02</div>
                <h4>Genre String Parsing</h4>
                <p>
                  <strong>Action:</strong> Extracted JSON genre objects (e.g. <code>[&#123;"id": 28, "name": "Action"&#125;]</code>) into clean string arrays.
                </p>
                <p className="step-reason">
                  <strong>Rationale:</strong> Standardized into 20 clean categorical tags, enabling multi-hot binary indicator matrix construction.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-num-badge">03</div>
                <h4>Global Rating Aggregation</h4>
                <p>
                  <strong>Action:</strong> Computed empirical mean rating (<span className="math-code">R</span>) and total rating count (<span className="math-code">v</span>) for each movie.
                </p>
                <p className="step-reason">
                  <strong>Rationale:</strong> Provided empirical parameters for Bayesian shrinkage formula and normalized movie quality scores.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-num-badge">04</div>
                <h4>Text Normalization</h4>
                <p>
                  <strong>Action:</strong> Stripped whitespace, imputed missing values with empty strings, and extracted unigrams & bigrams.
                </p>
                <p className="step-reason">
                  <strong>Rationale:</strong> Enabled Scikit-Learn's <code>TfidfVectorizer</code> to fit a 20,000-dimensional vocabulary without crashing.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 4: Exploratory Data Analysis */}
      <section id="sec-eda" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('eda')}>
          <div className="section-title-group">
            <BarChart3 className="section-icon text-emerald" size={22} />
            <div>
              <span className="section-number">Section 04</span>
              <h2 className="section-heading">Exploratory Data Analysis (EDA)</h2>
            </div>
          </div>
          {expandedSections.eda ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.eda && (
          <div className="section-content-body">
            <div className="grid-two-col">
              {/* Plot 1: Rating Distribution */}
              <div className="eda-chart-card">
                <h4 className="chart-card-title">1. Distribution of User Ratings</h4>
                <div className="svg-chart-container">
                  <svg viewBox="0 0 400 180" className="eda-svg">
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="65" x2="380" y2="65" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="110" x2="380" y2="110" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="150" x2="380" y2="150" stroke="#374151" />

                    {/* Bars for ratings 0.5 to 5.0 */}
                    {/* [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0] */}
                    <rect x="50" y="142" width="24" height="8" rx="2" fill="#ef4444" opacity="0.8" />
                    <rect x="82" y="132" width="24" height="18" rx="2" fill="#ef4444" opacity="0.8" />
                    <rect x="114" y="136" width="24" height="14" rx="2" fill="#f97316" opacity="0.8" />
                    <rect x="146" y="118" width="24" height="32" rx="2" fill="#f97316" opacity="0.8" />
                    <rect x="178" y="122" width="24" height="28" rx="2" fill="#eab308" opacity="0.8" />
                    <rect x="210" y="82" width="24" height="68" rx="2" fill="#eab308" opacity="0.8" />
                    <rect x="242" y="86" width="24" height="64" rx="2" fill="#84cc16" opacity="0.8" />
                    <rect x="274" y="42" width="24" height="108" rx="2" fill="#22c55e" opacity="0.8" />
                    <rect x="306" y="98" width="24" height="52" rx="2" fill="#22c55e" opacity="0.8" />
                    <rect x="338" y="70" width="24" height="80" rx="2" fill="#10b981" opacity="0.8" />

                    {/* X-axis labels */}
                    <text x="62" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">0.5</text>
                    <text x="94" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">1.0</text>
                    <text x="126" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">1.5</text>
                    <text x="158" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">2.0</text>
                    <text x="190" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">2.5</text>
                    <text x="222" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">3.0</text>
                    <text x="254" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">3.5</text>
                    <text x="286" y="165" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">4.0</text>
                    <text x="318" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">4.5</text>
                    <text x="350" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">5.0</text>
                  </svg>
                </div>
                <p className="chart-explanation">
                  <strong>Observation:</strong> Ratings are generally high, with an empirical global average of <strong>3.52 stars</strong>.
                  4.0 is the most frequent rating. This is why in offline evaluation, any movie rated &ge; 3.5 is counted as a positive hit ("relevant").
                </p>
              </div>

              {/* Plot 2: Release Year Distribution */}
              <div className="eda-chart-card">
                <h4 className="chart-card-title">2. Catalogue Distribution by Release Year</h4>
                <div className="svg-chart-container">
                  <svg viewBox="0 0 400 180" className="eda-svg">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="65" x2="380" y2="65" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="110" x2="380" y2="110" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="150" x2="380" y2="150" stroke="#374151" />

                    {/* Years 2010 to 2017 */}
                    <rect x="52" y="65" width="30" height="85" rx="3" fill="#6366f1" />
                    <rect x="94" y="58" width="30" height="92" rx="3" fill="#6366f1" />
                    <rect x="136" y="52" width="30" height="98" rx="3" fill="#6366f1" />
                    <rect x="178" y="45" width="30" height="105" rx="3" fill="#6366f1" />
                    <rect x="220" y="38" width="30" height="112" rx="3" fill="#818cf8" />
                    <rect x="262" y="42" width="30" height="108" rx="3" fill="#818cf8" />
                    <rect x="304" y="48" width="30" height="102" rx="3" fill="#818cf8" />
                    <rect x="346" y="90" width="30" height="60" rx="3" fill="#4f46e5" />

                    <text x="67" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'10</text>
                    <text x="109" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'11</text>
                    <text x="151" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'12</text>
                    <text x="193" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'13</text>
                    <text x="235" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'14</text>
                    <text x="277" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'15</text>
                    <text x="319" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'16</text>
                    <text x="361" y="165" fill="#9ca3af" fontSize="9" textAnchor="middle">'17</text>
                  </svg>
                </div>
                <p className="chart-explanation">
                  <strong>Observation:</strong> Movie releases are steady, between 1,500 and 1,900 films each year from 2010 through 2016, with partial coverage for 2017.
                  This ensures our dataset offers a balanced, contemporary movie selection.
                </p>
              </div>

              {/* Plot 3: Rating Count Power Law */}
              <div className="eda-chart-card">
                <h4 className="chart-card-title">3. The Long-Tail Problem (Rating Volumes)</h4>
                <div className="svg-chart-container">
                  <svg viewBox="0 0 400 180" className="eda-svg">
                    <line x1="40" y1="20" x2="380" y2="20" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="80" x2="380" y2="80" stroke="#232838" strokeDasharray="3" />
                    <line x1="40" y1="150" x2="380" y2="150" stroke="#374151" />

                    {/* Smooth power-law decay curve */}
                    <path
                      d="M 50 25 Q 75 120 120 138 T 240 146 T 370 148 L 370 150 L 50 150 Z"
                      fill="url(#tailGrad)"
                      opacity="0.7"
                    />
                    <path
                      d="M 50 25 Q 75 120 120 138 T 240 146 T 370 148"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      fill="none"
                    />

                    <defs>
                      <linearGradient id="tailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    <circle cx="50" cy="25" r="4" fill="#fbbf24" />
                    <text x="65" y="30" fill="#fbbf24" fontSize="10" fontWeight="700">Blockbusters (35k+ reviews)</text>

                    <circle cx="280" cy="147" r="4" fill="#9ca3af" />
                    <text x="270" y="135" fill="#9ca3af" fontSize="9">The Long Tail (1–5 reviews)</text>

                    <text x="210" y="165" fill="#9ca3af" fontSize="10" textAnchor="middle">Movie Rank by Volume (Log Scale)</text>
                  </svg>
                </div>
                <p className="chart-explanation">
                  <strong>Observation:</strong> Review counts follow an extreme curve: the top 5% of movies account for over 60% of all ratings.
                  This shows why a simple average fails: an obscure movie with just one 5-star review would otherwise outrank world-famous masterpieces.
                </p>
              </div>

              {/* Plot 4: Genre Frequency */}
              <div className="eda-chart-card">
                <h4 className="chart-card-title">4. Movie Distribution Across Top Genres</h4>
                <div className="svg-chart-container">
                  <svg viewBox="0 0 400 180" className="eda-svg">
                    {/* Horizontal bars */}
                    <text x="95" y="32" fill="#e5e7eb" fontSize="10" textAnchor="end">Drama</text>
                    <rect x="105" y="22" width="240" height="13" rx="2" fill="#3b82f6" />
                    <text x="350" y="32" fill="#9ca3af" fontSize="9">6,564</text>

                    <text x="95" y="55" fill="#e5e7eb" fontSize="10" textAnchor="end">Comedy</text>
                    <rect x="105" y="45" width="154" height="13" rx="2" fill="#3b82f6" />
                    <text x="265" y="55" fill="#9ca3af" fontSize="9">4,213</text>

                    <text x="95" y="78" fill="#e5e7eb" fontSize="10" textAnchor="end">Thriller</text>
                    <rect x="105" y="68" width="92" height="13" rx="2" fill="#60a5fa" />
                    <text x="202" y="78" fill="#9ca3af" fontSize="9">2,504</text>

                    <text x="95" y="101" fill="#e5e7eb" fontSize="10" textAnchor="end">Action</text>
                    <rect x="105" y="91" width="61" height="13" rx="2" fill="#60a5fa" />
                    <text x="171" y="101" fill="#9ca3af" fontSize="9">1,674</text>

                    <text x="95" y="124" fill="#e5e7eb" fontSize="10" textAnchor="end">Romance</text>
                    <rect x="105" y="114" width="55" height="13" rx="2" fill="#93c5fd" />
                    <text x="165" y="124" fill="#9ca3af" fontSize="9">1,515</text>

                    <text x="95" y="147" fill="#e5e7eb" fontSize="10" textAnchor="end">Horror</text>
                    <rect x="105" y="137" width="48" height="13" rx="2" fill="#93c5fd" />
                    <text x="158" y="147" fill="#9ca3af" fontSize="9">1,310</text>

                    <text x="95" y="170" fill="#e5e7eb" fontSize="10" textAnchor="end">Sci-Fi</text>
                    <rect x="105" y="160" width="33" height="13" rx="2" fill="#bfdbfe" />
                    <text x="143" y="170" fill="#9ca3af" fontSize="9">902</text>
                  </svg>
                </div>
                <p className="chart-explanation">
                  <strong>Observation:</strong> Drama and Comedy appear in over 60% of all catalogue entries.
                  Because these broad genres contain both wonderful and terrible films, disliking one poorly written comedy should not subtract points from every comedy movie.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5: Baseline and Recommendation Models */}
      <section id="sec-models" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('models')}>
          <div className="section-title-group">
            <Cpu className="section-icon text-purple" size={22} />
            <div>
              <span className="section-number">Section 05</span>
              <h2 className="section-heading">Recommendation Models & Formulations</h2>
            </div>
          </div>
          {expandedSections.models ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.models && (
          <div className="section-content-body">
            <div className="model-cards-container">
              {/* Model 1: Popularity */}
              <div className="model-spec-card">
                <div className="model-spec-header">
                  <span className="model-badge popularity">Approach 1 &bull; Baseline</span>
                  <h3 className="model-title">Bayesian Popularity Recommender (IMDb Formula)</h3>
                </div>
                <div className="model-body">
                  <p>
                    A non-personalized baseline that suggests universally popular, highly rated movies.
                    It solves the cold-start problem immediately because it works with zero visitor ratings.
                  </p>
                  <div className="formula-box">
                    <span className="formula-title">IMDb Bayesian Weighted Rating Formula:</span>
                    <MathEquation
                      display={true}
                      math="\text{WR}(m) = \left( \frac{v}{v + m} \right) \cdot R + \left( \frac{m}{v + m} \right) \cdot C"
                      ariaLabel="IMDb Bayesian Weighted Rating Formula"
                    />
                    <ul className="formula-vars">
                      <li><strong>v:</strong> Total number of reviews for the movie <MathEquation display={false} math="m" /> (<code>rating_count</code>).</li>
                      <li><strong>R:</strong> Average rating of the movie <MathEquation display={false} math="m" /> (<code>avg_rating</code>).</li>
                      <li><strong>m:</strong> Review volume threshold (<MathEquation display={false} math="m = 17.0" /> in sample, <MathEquation display={false} math="m = 43.0" /> in full catalogue).</li>
                      <li><strong>C:</strong> Catalogue-wide average rating (<MathEquation display={false} math="C \approx 3.05" /> in sample, <MathEquation display={false} math="C \approx 3.52" /> in full catalogue).</li>
                    </ul>
                  </div>
                  <p className="model-takeaway">
                    <strong>How this works:</strong> A movie with only one 5-star review shouldn't beat acclaimed classics with thousands of reviews.
                    If a movie has few reviews (<MathEquation display={false} math="v \ll m" />), its score is pulled toward the catalogue average <MathEquation display={false} math="C" />.
                    As reviews grow (<MathEquation display={false} math="v \gg m" />), the movie's own average rating <MathEquation display={false} math="R" /> takes over.
                  </p>
                </div>
              </div>

              {/* Model 2: TF-IDF */}
              <div className="model-spec-card">
                <div className="model-spec-header">
                  <span className="model-badge tfidf">Approach 2 &bull; Content</span>
                  <h3 className="model-title">TF-IDF Content-Based Profile Matching</h3>
                </div>
                <div className="model-body">
                  <p>
                    Builds an individual taste profile by analyzing words in movie plot summaries,
                    then scores unrated movies based on how closely their plot words match your tastes.
                  </p>
                  <div className="formula-box">
                    <span className="formula-title">Signed Linear User Preference Profile:</span>
                    <MathEquation
                      display={true}
                      math="\vec{p}_u = \sum_{i \in \text{Rated}(u)} w(r_{ui}) \cdot \vec{v}_i"
                      ariaLabel="Signed Linear User Profile"
                    />
                    <span className="formula-title mt-2">Rating Weight Function:</span>
                    <MathEquation
                      display={true}
                      math="w(r) = \begin{cases} 0.1, & \text{if } r = 3.0 \\ r - 3.0, & \text{otherwise} \end{cases}"
                      ariaLabel="Rating Weight Function"
                    />
                    <span className="formula-title mt-2">Cosine Similarity Scoring:</span>
                    <MathEquation
                      display={true}
                      math="\operatorname{sim}(\vec{p}_u, \vec{v}_m) = \frac{\vec{p}_u \cdot \vec{v}_m}{\|\vec{p}_u\|_2 \, \|\vec{v}_m\|_2}"
                      ariaLabel="TF-IDF Cosine Similarity"
                    />
                  </div>
                  <p className="model-takeaway">
                    <strong>How this works:</strong> We turn plot summaries into numbers across 20,000 words and word pairs (unigrams and bigrams).
                    Movies you like (4 or 5 stars) boost their keywords (e.g., "superhero", "space", "detective"); movies you dislike (1 or 2 stars) subtract weight.
                    Cosine similarity then measures the match between your word profile and candidate movies.
                  </p>
                </div>
              </div>

              {/* Model 3: Genre Hybrid */}
              <div className="model-spec-card">
                <div className="model-spec-header">
                  <span className="model-badge genre">Approach 3 &bull; Hybrid</span>
                  <h3 className="model-title">Multi-Hot Genre & Bayesian Quality Hybrid</h3>
                </div>
                <div className="model-body">
                  <p>
                    Represents movies using 20 genre tags (Action, Comedy, Sci-Fi, etc.) and blends your personal
                    genre preferences with overall movie quality so you only receive well-reviewed recommendations.
                  </p>
                  <div className="formula-box">
                    <span className="formula-title">Positive-Only Genre Preference Profile:</span>
                    <MathEquation
                      display={true}
                      math="\vec{g}_u = \sum_{i \in \text{Rated}(u)} \max(0, \, r_{ui} - 3.0) \cdot \vec{g}_i"
                      ariaLabel="Positive-Only Genre Preference Profile"
                    />
                    <span className="formula-title mt-2">Hybrid Quality Score Formula:</span>
                    <MathEquation
                      display={true}
                      math="S_{\text{hybrid}}(u, m) = \alpha \cdot \operatorname{sim}_{\text{genre}}(\vec{g}_u, \vec{g}_m) + (1 - \alpha) \cdot Q(m)"
                      ariaLabel="Hybrid Quality Score Formula"
                    />
                    <ul className="formula-vars">
                      <li><MathEquation display={false} math="\operatorname{sim}_{\text{genre}}(\vec{g}_u, \vec{g}_m) = \frac{\vec{g}_u \cdot \vec{g}_m}{\|\vec{g}_u\|_2 \, \|\vec{g}_m\|_2}" />: Cosine similarity between your genre profile and the movie's genre tags.</li>
                      <li><strong>Q(m):</strong> Normalized Bayesian movie quality score scaled between <MathEquation display={false} math="[0, 1]" />.</li>
                      <li><MathEquation display={false} math="\alpha = 0.50" />: Equal 50/50 balance between your personal taste and overall movie quality.</li>
                    </ul>
                  </div>
                  <p className="model-takeaway">
                    <strong>Why Positive-Only & Quality Blending:</strong> We only add points for movies rated above 3 stars so disliking one movie doesn't ruin the whole genre.
                    Blending in the quality score (<MathEquation display={false} math="\alpha = 0.5" />) ensures you get top-rated movies in your favorite genres instead of obscure low-budget films.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 6: Evaluation Methodology */}
      <section id="sec-eval" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('evaluation')}>
          <div className="section-title-group">
            <Target className="section-icon text-rose" size={22} />
            <div>
              <span className="section-number">Section 06</span>
              <h2 className="section-heading">Offline Evaluation Methodology</h2>
            </div>
          </div>
          {expandedSections.evaluation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.evaluation && (
          <div className="section-content-body">
            <div className="grid-two-col">
              <div className="content-card">
                <h3 className="card-subtitle">How We Split the Data Fairly</h3>
                <ul className="bullet-list">
                  <li>
                    <strong>Active Users:</strong> We evaluated on active users who rated at least <strong>100 catalogue movies</strong>, ensuring sufficient history to test properly.
                  </li>
                  <li>
                    <strong>TF-IDF Testing:</strong> Used 80% of each user's rating history to build their word profile, and hid the remaining 20% to test what the model recommended (tested across <strong>4,574 active users</strong>).
                  </li>
                  <li>
                    <strong>Genre Testing:</strong> Used 60% of ratings for training, 20% for tuning the blending weight &alpha;, and 20% for final test evaluation across <strong>1,540 active users</strong>.
                  </li>
                  <li>
                    <strong>No Data Leakage:</strong> The models never saw test ratings while constructing profiles or tuning parameters.
                  </li>
                </ul>
              </div>

              <div className="content-card">
                <h3 className="card-subtitle">How Recommendations Are Scored (Top 10)</h3>
                <p>
                  A test movie counts as a successful hit ("relevant") if the user gave it a favorable rating of <MathEquation display={false} math="r \ge 3.5" /> stars:
                </p>
                <div className="metric-definitions-box">
                  <div className="metric-def">
                    <strong>Precision@10:</strong>
                    <MathEquation
                      display={true}
                      math="\operatorname{Precision}@K(u) = \frac{|\operatorname{Top-K}(u) \cap \text{Relevant}_u|}{K}"
                      ariaLabel="Precision at K"
                    />
                    <span className="metric-sub">Out of the 10 movies we recommended, how many did the user actually like?</span>
                  </div>
                  <div className="metric-def">
                    <strong>Recall@10:</strong>
                    <MathEquation
                      display={true}
                      math="\operatorname{Recall}@K(u) = \frac{|\operatorname{Top-K}(u) \cap \text{Relevant}_u|}{|\text{Relevant}_u|}"
                      ariaLabel="Recall at K"
                    />
                    <span className="metric-sub">Out of all the movies the user liked in their test set, how many did our top-10 list capture?</span>
                  </div>
                  <div className="metric-def">
                    <strong>NDCG@10:</strong>
                    <MathEquation
                      display={true}
                      math="\operatorname{NDCG}@K(u) = \frac{\operatorname{DCG}@K(u)}{\operatorname{IDCG}@K(u)}, \quad \operatorname{DCG}@K(u) = \sum_{i=1}^K \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}"
                      ariaLabel="NDCG at K"
                    />
                    <span className="metric-sub">Ranking Quality Score: Rewards systems that place the user's favorite movies near the very top of the list rather than at the bottom.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 7: Results and Comparison */}
      <section id="sec-results" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('results')}>
          <div className="section-title-group">
            <Award className="section-icon text-yellow" size={22} />
            <div>
              <span className="section-number">Section 07</span>
              <h2 className="section-heading">Experimental Results & Comparisons</h2>
            </div>
          </div>
          {expandedSections.results ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.results && (
          <div className="section-content-body">
            <div className="table-wrapper">
              <table className="analysis-table results-table">
                <thead>
                  <tr>
                    <th>Recommendation Model</th>
                    <th>Representation Space</th>
                    <th>Precision@10</th>
                    <th>Recall@10</th>
                    <th>NDCG@10</th>
                    <th>Evaluated Users</th>
                    <th>Verdict & Practical Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Bayesian Popularity</strong></td>
                    <td>Global Bayesian Prior</td>
                    <td><span className="text-muted">Baseline</span></td>
                    <td><span className="text-muted">Baseline</span></td>
                    <td><span className="text-muted">Baseline</span></td>
                    <td>All visitors</td>
                    <td><span className="badge-pill bg-blue">Essential Baseline</span> &bull; Solves cold-start instantly.</td>
                  </tr>
                  <tr>
                    <td><strong>TF-IDF Content Recommender</strong></td>
                    <td>20,000-dim Text Sparse</td>
                    <td><strong>2.04%</strong> (0.0204)</td>
                    <td><strong>0.96%</strong> (0.0096)</td>
                    <td><strong>2.26%</strong> (0.0226)</td>
                    <td>4,574 users</td>
                    <td><span className="badge-pill bg-purple">Explainable</span> &bull; Captures plot tropes, but suffers text sparsity.</td>
                  </tr>
                  <tr className="highlight-row">
                    <td><strong>Genre-Based Hybrid (&alpha; = 0.5)</strong></td>
                    <td>20-dim Multi-Hot + Quality</td>
                    <td><strong>16.98%</strong> (0.1698)</td>
                    <td><strong>5.27%</strong> (0.0527)</td>
                    <td><strong>18.36%</strong> (0.1836)</td>
                    <td>1,540 test users</td>
                    <td><span className="badge-pill bg-green">Best Performer</span> &bull; 8.3x higher Precision, 8.1x higher NDCG.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual Performance Comparison Chart */}
            <div className="content-card mt-4">
              <h3 className="card-subtitle">Model Performance Comparison (Relative Multiples)</h3>
              <div className="chart-bars-wrap">
                <div className="chart-bar-group">
                  <span className="bar-label">Precision@10</span>
                  <div className="bar-track">
                    <div className="bar-fill tfidf" style={{ width: '12%' }}>
                      <span>TF-IDF: 2.04%</span>
                    </div>
                    <div className="bar-fill genre" style={{ width: '100%' }}>
                      <span>Genre Hybrid: 16.98% (8.3x)</span>
                    </div>
                  </div>
                </div>

                <div className="chart-bar-group">
                  <span className="bar-label">Recall@10</span>
                  <div className="bar-track">
                    <div className="bar-fill tfidf" style={{ width: '18%' }}>
                      <span>TF-IDF: 0.96%</span>
                    </div>
                    <div className="bar-fill genre" style={{ width: '100%' }}>
                      <span>Genre Hybrid: 5.27% (5.5x)</span>
                    </div>
                  </div>
                </div>

                <div className="chart-bar-group">
                  <span className="bar-label">NDCG@10</span>
                  <div className="bar-track">
                    <div className="bar-fill tfidf" style={{ width: '12%' }}>
                      <span>TF-IDF: 2.26%</span>
                    </div>
                    <div className="bar-fill genre" style={{ width: '100%' }}>
                      <span>Genre Hybrid: 18.36% (8.1x)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hyperparameter Grid Search Table */}
            <div className="content-card mt-4">
              <h3 className="card-subtitle">Validation Grid Search: Tuning Balancing Parameter &alpha; (1,540 Users)</h3>
              <div className="table-wrapper">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Profile Method</th>
                      <th>&alpha; (Genre Weight)</th>
                      <th>1 - &alpha; (Quality Weight)</th>
                      <th>Val Precision@10</th>
                      <th>Val Recall@10</th>
                      <th>Val NDCG@10</th>
                      <th>Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="highlight-row">
                      <td><strong>Positive-Only</strong></td>
                      <td><strong>0.50</strong></td>
                      <td><strong>0.50</strong></td>
                      <td><strong>16.66%</strong></td>
                      <td><strong>5.20%</strong></td>
                      <td><strong>18.04%</strong></td>
                      <td><CheckCircle2 size={15} className="inline text-green" /> <strong>Optimal Configuration</strong></td>
                    </tr>
                    <tr>
                      <td>Signed Linear</td>
                      <td>0.50</td>
                      <td>0.50</td>
                      <td>14.44%</td>
                      <td>3.97%</td>
                      <td>15.76%</td>
                      <td>Signed weighting accidentally penalizes broad genres</td>
                    </tr>
                    <tr>
                      <td>Signed Linear</td>
                      <td>0.70</td>
                      <td>0.30</td>
                      <td>12.58%</td>
                      <td>3.42%</td>
                      <td>13.92%</td>
                      <td>Decreasing quality weight reduces accuracy</td>
                    </tr>
                    <tr>
                      <td>Positive-Only</td>
                      <td>0.70</td>
                      <td>0.30</td>
                      <td>10.62%</td>
                      <td>3.35%</td>
                      <td>12.12%</td>
                      <td>Higher genre weight degrades ranking quality</td>
                    </tr>
                    <tr>
                      <td>Positive-Only</td>
                      <td>1.00 (Pure Genre)</td>
                      <td>0.00 (No Quality)</td>
                      <td>2.43%</td>
                      <td>0.69%</td>
                      <td>2.87%</td>
                      <td>Collapses without quality score (recommends obscure flops)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="caption-text mt-2">
                <strong>Key Result:</strong> Pure genre matching without quality blending (&alpha; = 1.0) achieves a Recall@10 of only 0.69% because it recommends obscure, poorly reviewed movies.
                Blending genre matching with overall movie quality (&alpha; = 0.5) boosts Recall@10 by <strong>7.5x</strong> (to 5.20%), confirming that users care about both genre match and movie quality.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 8: Error Analysis */}
      <section id="sec-errors" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('errors')}>
          <div className="section-title-group">
            <AlertTriangle className="section-icon text-orange" size={22} />
            <div>
              <span className="section-number">Section 08</span>
              <h2 className="section-heading">Error Analysis & Representative Cases</h2>
            </div>
          </div>
          {expandedSections.errors ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.errors && (
          <div className="section-content-body">
            <div className="case-studies-grid">
              {/* Case 1 */}
              <div className="case-card success">
                <div className="case-badge success">Case Study A &bull; Successful Synergy</div>
                <h4>Action & Sci-Fi Enthusiast</h4>
                <p>
                  <strong>User Ratings:</strong> <em>Inception</em> (5.0★), <em>Interstellar</em> (4.5★), <em>The Dark Knight Rises</em> (4.5★).
                </p>
                <p>
                  <strong>Genre Hybrid Result:</strong> Recommends <em>Edge of Tomorrow</em>, <em>Mad Max: Fury Road</em>, and <em>The Martian</em>.
                </p>
                <p className="case-explanation">
                  <strong>Why It Worked:</strong> Both genre match and movie quality scores were very high, resulting in acclaimed, well-known sci-fi action movies that matched the user's taste.
                </p>
              </div>

              {/* Case 2 */}
              <div className="case-card failure">
                <div className="case-badge failure">Case Study B &bull; Text Vocabulary Mismatch</div>
                <h4>Space Exploration Plot Synopses</h4>
                <p>
                  <strong>User Seed:</strong> 5.0★ rating on <em>Interstellar</em> (keywords: "wormhole", "astronaut", "interstellar").
                </p>
                <p>
                  <strong>TF-IDF Result:</strong> Failed to retrieve <em>Gravity</em> in top-10.
                </p>
                <p className="case-explanation">
                  <strong>Why It Failed:</strong> <em>Gravity</em>'s plot overview emphasizes "debris", "medical engineer", and "space shuttle". Because the exact words did not match, TF-IDF missed it despite both being space exploration movies.
                </p>
              </div>

              {/* Case 3 */}
              <div className="case-card warning">
                <div className="case-badge warning">Case Study C &bull; Quality Blindness in Pure Genre</div>
                <h4>Pure Genre Matching Without Quality (&alpha; = 1.0)</h4>
                <p>
                  <strong>User Seed:</strong> 5.0★ on <em>The Avengers</em> (Action, Adventure, Sci-Fi).
                </p>
                <p>
                  <strong>Unfiltered Genre Result:</strong> Recommends low-budget direct-to-video superhero flops with 1.8★ IMDb ratings.
                </p>
                <p className="case-explanation">
                  <strong>Why It Failed:</strong> Multi-hot genre vectors treat all superhero movies the same. Without blending in quality scores, the system cannot tell the difference between a blockbuster masterpiece and a 1.8-star direct-to-video flop.
                </p>
              </div>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Why Are Offline Test Scores Low? (The 82.7% Zero-Recall Explanation)</h3>
              <p>
                In offline testing across 4,574 active users, <strong>82.71% of test users had a Recall@10 of 0</strong>.
                Here is why this is normal for recommender systems, and why it does not mean the system is failing:
              </p>
              <ul className="bullet-list">
                <li>
                  <strong>Unrated Does Not Mean Disliked:</strong> In an offline test, a movie only counts as a hit if the user specifically reviewed it in the test dataset. If the model recommends *Inception* and the user would love *Inception* but never entered a review for it, the test counts it as a miss (score of 0).
                </li>
                <li>
                  <strong>Finding a Needle in a Haystack:</strong> The model must choose just 10 movies out of 12,794 candidates (<MathEquation display={false} math="K = 10" />). Because test users only reviewed 5 to 15 movies in total, predicting those exact specific items out of thousands of choices is challenging.
                </li>
                <li>
                  <strong>Fair Model Comparisons:</strong> Even though absolute numbers look small due to unrated movies, comparing models side-by-side is completely fair. Genre Hybrid still achieved <strong>8.3x higher Precision</strong> and <strong>7.5x higher Recall</strong> than pure unweighted models, proving it performs best.
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 9: Limitations */}
      <section id="sec-limitations" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('limitations')}>
          <div className="section-title-group">
            <ShieldAlert className="section-icon text-red" size={22} />
            <div>
              <span className="section-number">Section 09</span>
              <h2 className="section-heading">Project Limitations</h2>
            </div>
          </div>
          {expandedSections.limitations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.limitations && (
          <div className="section-content-body">
            <div className="grid-two-col">
              <div className="content-card">
                <h3 className="card-subtitle">Dataset Limitations</h3>
                <ul className="bullet-list">
                  <li>
                    <strong>Catalogue Years (2010–2017):</strong> The dataset is limited to movies released between 2010 and 2017. Pre-2010 classics and new releases after 2017 are not included in the catalogue.
                  </li>
                  <li>
                    <strong>Short Plot Summaries:</strong> Plot overviews are short summaries (typically 30 to 60 words), which limits how deeply the text model can understand story themes.
                  </li>
                  <li>
                    <strong>Blockbuster Skew:</strong> Most user ratings belong to famous Hollywood studio releases, giving less visibility to smaller indie films.
                  </li>
                </ul>
              </div>

              <div className="content-card">
                <h3 className="card-subtitle">Model Limitations</h3>
                <ul className="bullet-list">
                  <li>
                    <strong>No Collaborative Filtering:</strong> The models analyze movie content (plots and genres) rather than finding patterns across communities of similar users (like Netflix matrix factorization).
                  </li>
                  <li>
                    <strong>Exact Word Overlap:</strong> TF-IDF only matches exact words. It cannot recognize that "astronaut" and "spaceman" mean the same thing without neural language embeddings.
                  </li>
                  <li>
                    <strong>20 Broad Genres:</strong> The system cannot distinguish between subgenres (such as a psychological thriller vs. a slasher horror film).
                  </li>
                  <li>
                    <strong>Minimum 5 Ratings Required:</strong> Personalized tabs remain locked until at least 5 movies are rated, ensuring the system has enough data to build an accurate profile.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 10: Reproducibility & References */}
      <section id="sec-reproducibility" className="analysis-section-card">
        <div className="section-title-bar" onClick={() => toggleSection('reproducibility')}>
          <div className="section-title-group">
            <FileCode className="section-icon text-blue" size={22} />
            <div>
              <span className="section-number">Section 10</span>
              <h2 className="section-heading">Reproducibility & References</h2>
            </div>
          </div>
          {expandedSections.reproducibility ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedSections.reproducibility && (
          <div className="section-content-body">
            <div className="content-card">
              <h3 className="card-subtitle">Source Repository & Research Notebooks</h3>
              <p>
                All source code, data preparation scripts, research notebooks, and web applications are publicly available on GitHub:
              </p>
              <div className="links-grid mt-2">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link-card"
                >
                  <GitBranch size={20} className="link-icon" />
                  <div>
                    <strong>GitHub Source Repository</strong>
                    <span>kurupashwin482-web / MovieMatch</span>
                  </div>
                  <ExternalLink size={16} className="ext-icon" />
                </a>

                <a
                  href={`${REPO_URL}/blob/main/Notebooks/01_data_preparation.ipynb`}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link-card"
                >
                  <FileCode size={20} className="link-icon text-indigo" />
                  <div>
                    <strong>Notebook 01: Data Preparation & EDA</strong>
                    <span>Data cleaning, quality checks, 4 Matplotlib plots</span>
                  </div>
                  <ExternalLink size={16} className="ext-icon" />
                </a>

                <a
                  href={`${REPO_URL}/blob/main/Notebooks/02_popularity.ipynb`}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link-card"
                >
                  <FileCode size={20} className="link-icon text-amber" />
                  <div>
                    <strong>Notebook 02: Popularity Baseline</strong>
                    <span>IMDb Bayesian Weighted Rating & shrinkage analysis</span>
                  </div>
                  <ExternalLink size={16} className="ext-icon" />
                </a>

                <a
                  href={`${REPO_URL}/blob/main/Notebooks/03_tfidf_recommender.ipynb`}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link-card"
                >
                  <FileCode size={20} className="link-icon text-emerald" />
                  <div>
                    <strong>Notebook 03: TF-IDF Content Model</strong>
                    <span>20k sparse matrix, 4,574 active user offline evaluation</span>
                  </div>
                  <ExternalLink size={16} className="ext-icon" />
                </a>

                <a
                  href={`${REPO_URL}/blob/main/Notebooks/04_Genre_Based_Movie_Recommendation_System.ipynb`}
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link-card"
                >
                  <FileCode size={20} className="link-icon text-rose" />
                  <div>
                    <strong>Notebook 04: Genre Hybrid Recommender</strong>
                    <span>Multi-hot encoding, grid search tuning, test evaluation</span>
                  </div>
                  <ExternalLink size={16} className="ext-icon" />
                </a>
              </div>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Artifact & Dataset Storage Locations</h3>
              <ul className="bullet-list">
                <li><code>dataset/raw/movies_metadata.csv</code>: Raw 45k-row TMDB film metadata with poster paths.</li>
                <li><code>dataset/raw/ratings_small.csv</code> / <code>links_small.csv</code>: GroupLens interaction datasets.</li>
                <li><code>dataset/processed/movies_clean.csv</code>: 12,794 cleaned post-2010 catalogue records.</li>
                <li><code>dataset/processed/popularity_ranking.csv</code>: 12,652 pre-ranked Bayesian popularity records.</li>
                <li><code>Backend Artifacts/tfidf_matrix.pkl</code>: 12,794 &times; 20,000 Scipy CSR sparse matrix (18.6 MB).</li>
                <li><code>Backend Artifacts/genre_model.pkl</code>: Multi-hot matrix, normalized quality scores, and optimal &alpha; = 0.5.</li>
              </ul>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Local Setup & Quick Reproduction Commands</h3>
              <div className="code-terminal-card">
                <div className="terminal-header">
                  <Terminal size={14} />
                  <span>bash &bull; Local Reproduction</span>
                </div>
                <pre className="terminal-code">
{`# 1. Clone the repository
git clone https://github.com/kurupashwin482-web/MovieMatch.git
cd MovieMatch

# 2. Setup Python environment and run backend tests
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PYTHONPATH=. pytest backend/tests/ -v

# 3. Setup and run frontend build
cd frontend
npm ci
npm run build`}
                </pre>
              </div>
            </div>

            <div className="content-card mt-4">
              <h3 className="card-subtitle">Academic References & Citations</h3>
              <ol className="reference-list">
                <li>
                  <strong>MovieLens Dataset:</strong> Harper, F. M., & Konstan, J. A. (2015). <em>The MovieLens Datasets: History and Context.</em> ACM Transactions on Interactive Intelligent Systems (TiiS), 5(4), 1-19.
                </li>
                <li>
                  <strong>The Movies Dataset:</strong> Banik, R. (2017). <em>The Movies Dataset.</em> Kaggle Dataset Repository.
                </li>
                <li>
                  <strong>Information Retrieval & TF-IDF:</strong> Manning, C. D., Raghavan, P., & Schütze, H. (2008). <em>Introduction to Information Retrieval.</em> Cambridge University Press.
                </li>
                <li>
                  <strong>Recommender Systems:</strong> Ricci, F., Rokach, L., & Shapira, B. (2015). <em>Recommender Systems Handbook.</em> Springer.
                </li>
                <li>
                  <strong>Scikit-Learn:</strong> Pedregosa, F., et al. (2011). <em>Scikit-learn: Machine Learning in Python.</em> Journal of Machine Learning Research, 12, 2825-2830.
                </li>
                <li>
                  <strong>FastAPI Framework:</strong> Ramírez, S. (2018). <em>FastAPI: Modern, High-Performance Web Framework.</em>
                </li>
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
