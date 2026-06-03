(function () {
  'use strict';

  const DEFAULT_EXAMPLE = "ope there goes rabbit, he choked, he's mad, but he won't give up that easy";
  const RESULT_METHOD = 'BM25-Okapi';

  function normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    const normalized = normalizeText(text);
    return normalized ? normalized.split(' ').filter(Boolean) : [];
  }

  function uniquePreserveOrder(items) {
    const seen = new Set();
    const output = [];
    items.forEach((item) => {
      if (!seen.has(item)) {
        seen.add(item);
        output.push(item);
      }
    });
    return output;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatNumber(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return '0';
    return Number(value).toFixed(digits);
  }

  function formatPercent(value, digits = 1) {
    if (!Number.isFinite(Number(value))) return '0%';
    return `${(Number(value) * 100).toFixed(digits)}%`;
  }

  function highlightTerms(text, terms) {
    const safe = escapeHtml(text);
    const escapedTerms = Array.from(terms || [])
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!escapedTerms.length) return safe;
    const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
    return safe.replace(regex, '<mark>$1</mark>');
  }

  async function fetchJsonWithFallback(primaryUrl, fallbackUrl) {
    const errors = [];
    for (const url of [primaryUrl, fallbackUrl].filter(Boolean)) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          errors.push(`${url}: ${response.status}`);
          continue;
        }
        const payload = await response.json();
        return { payload, url, isFallback: url === fallbackUrl && url !== primaryUrl };
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
    throw new Error(errors.join('; ') || 'No JSON URL configured.');
  }

  class StanLyricBrowserSearch {
    constructor(indexPayload) {
      this.payload = indexPayload || {};
      this.metadata = this.payload.metadata || {};
      this.docs = this.payload.docs || [];
      this.docLens = this.payload.doc_lens || [];
      this.idf = this.payload.idf || {};
      this.postings = this.payload.postings || {};
      this.config = Object.assign({ k1: 1.5, b: 0.75 }, this.payload.bm25 || {});
      this.avgdl = Number(this.payload.avgdl || this.metadata.avgdl || 1) || 1;
      this.lastQueryCache = null;
    }

    get size() {
      return this.docs.length;
    }

    search(query, topK = 10) {
      const queryTokens = tokenize(query);
      const uniqueTerms = uniquePreserveOrder(queryTokens);
      const scores = new Float64Array(this.size);
      const touched = new Set();
      const termStats = new Map();

      queryTokens.forEach((term) => {
        const idf = Number(this.idf[term]);
        const postings = this.postings[term];
        if (!Number.isFinite(idf) || !Array.isArray(postings)) return;
        const perTermStats = termStats.get(term) || new Map();
        postings.forEach((pair) => {
          const docIndex = pair[0];
          const tf = pair[1];
          const contribution = this._scoreTerm(tf, this.docLens[docIndex] || 0, idf);
          scores[docIndex] += contribution;
          touched.add(docIndex);
          perTermStats.set(docIndex, {
            tf,
            idf,
            contribution: (perTermStats.get(docIndex)?.contribution || 0) + contribution,
          });
        });
        termStats.set(term, perTermStats);
      });

      const candidates = Array.from(touched)
        .map((docIndex) => ({ docIndex, score: scores[docIndex] }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, topK));

      const confidences = this._scoresToConfidence(candidates.map((item) => item.score));
      const sortedTouchedScores = Array.from(touched).map((docIndex) => scores[docIndex]).sort((a, b) => a - b);

      const results = candidates.map((item, idx) => {
        const doc = this.docs[item.docIndex] || {};
        const explanation = this.explainDoc(item.docIndex, uniqueTerms, termStats);
        return {
          rank: idx + 1,
          docIndex: item.docIndex,
          doc_id: doc.doc_id || `doc_${item.docIndex}`,
          title: doc.title || 'Untitled song',
          artist: doc.artist || 'Unknown artist',
          source: doc.source || '',
          album: doc.album || doc.album_name || '',
          year: doc.year || doc.release_year || '',
          genre: doc.genre || doc.genres || '',
          language: doc.language || '',
          lyrics_char_len: doc.lyrics_char_len || '',
          bm25_score: item.score,
          confidence: confidences[idx] || 0,
          score_percentile: this._scorePercentile(sortedTouchedScores, item.score),
          matched_terms: explanation.matchedTerms,
          missing_terms: explanation.missingTerms,
          term_rows: explanation.termRows,
          snippet: this.bestSnippet(doc.lyrics || doc.full_lyrics || '', new Set(uniqueTerms)),
          full_lyrics: doc.full_lyrics || doc.lyrics || '',
          method: RESULT_METHOD,
        };
      });

      this.lastQueryCache = { query, queryTokens, uniqueTerms, results, scores };
      return results;
    }

    explainDoc(docIndex, uniqueTerms, termStats) {
      const termRows = [];
      const missingTerms = [];

      uniqueTerms.forEach((term) => {
        const byDoc = termStats.get(term);
        const stat = byDoc ? byDoc.get(docIndex) : null;
        if (stat) {
          termRows.push({
            term,
            doc_tf: stat.tf,
            idf: stat.idf,
            contribution: stat.contribution,
          });
        } else {
          missingTerms.push(term);
        }
      });

      termRows.sort((a, b) => {
        if (b.idf !== a.idf) return b.idf - a.idf;
        return b.contribution - a.contribution;
      });

      return {
        matchedTerms: termRows.map((row) => row.term),
        missingTerms,
        termRows,
      };
    }

    bestSnippet(lyricText, queryTerms) {
      const text = String(lyricText || '').trim();
      if (!text) return '';
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return text.slice(0, 420);

      let bestIndex = 0;
      let bestScore = -Infinity;
      lines.forEach((line, index) => {
        const lineTerms = new Set(tokenize(line));
        let overlap = 0;
        let rareBonus = 0;
        queryTerms.forEach((term) => {
          if (lineTerms.has(term)) {
            overlap += 1;
            rareBonus += Number(this.idf[term] || 0);
          }
        });
        const score = overlap + 0.1 * rareBonus;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });

      const start = Math.max(0, bestIndex - 2);
      const end = Math.min(lines.length, bestIndex + 3);
      let snippet = lines.slice(start, end).join('\n');
      if (snippet.length > 520) snippet = `${snippet.slice(0, 520).replace(/\s+\S*$/, '')}...`;
      return snippet;
    }

    _scoreTerm(tf, docLen, idf) {
      const k1 = Number(this.config.k1 || 1.5);
      const b = Number(this.config.b || 0.75);
      const denomConst = k1 * (1 - b + b * (Number(docLen) || 0) / Math.max(this.avgdl, 1e-9));
      return idf * ((tf * (k1 + 1)) / (tf + denomConst || 1));
    }

    _scoresToConfidence(scores) {
      if (!scores.length) return [];
      const maxScore = Math.max(...scores);
      if (scores.every((score) => Math.abs(score - maxScore) < 1e-12)) {
        return scores.map(() => 1 / scores.length);
      }
      const exps = scores.map((score) => Math.exp(score - maxScore));
      const denom = exps.reduce((sum, value) => sum + value, 0) || 1;
      return exps.map((value) => value / denom);
    }

    _scorePercentile(sortedScores, score) {
      if (!sortedScores.length) return 0;
      let lo = 0;
      let hi = sortedScores.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (sortedScores[mid] <= score) lo = mid + 1;
        else hi = mid;
      }
      return (100 * lo) / sortedScores.length;
    }
  }

  function renderSummary(container, results, queryTokens, corpusSize) {
    if (!results.length) {
      container.innerHTML = '<p class="stanlyric-muted">No matching songs were retrieved. Try a longer or more distinctive lyric fragment.</p>';
      return;
    }
    const top = results[0];
    const second = results[1];
    const gap = second ? top.bm25_score - second.bm25_score : top.bm25_score;
    container.innerHTML = `
      <p class="stanlyric-kicker">top candidate</p>
      <h3 class="stanlyric-top-title">${escapeHtml(top.title)}</h3>
      <p class="stanlyric-artist">${escapeHtml(top.artist)}</p>
      <div class="stanlyric-stat-grid">
        <div class="stanlyric-stat"><span>BM25 score</span><strong>${formatNumber(top.bm25_score, 3)}</strong></div>
        <div class="stanlyric-stat"><span>Top-k confidence</span><strong>${formatPercent(top.confidence, 1)}</strong></div>
        <div class="stanlyric-stat"><span>Score gap</span><strong>${formatNumber(gap, 3)}</strong></div>
        <div class="stanlyric-stat"><span>Corpus percentile</span><strong>${formatNumber(top.score_percentile, 1)}</strong></div>
      </div>
      <div class="stanlyric-source-note">
        Matched ${top.matched_terms.length} of ${queryTokens.length} unique query terms across ${corpusSize.toLocaleString()} indexed songs. Method: ${escapeHtml(top.method)}.
      </div>
    `;
  }

  function renderExplanation(container, results) {
    if (!results.length) {
      container.innerHTML = '<p class="stanlyric-muted">No explanation available yet.</p>';
      return;
    }
    const top = results[0];
    const rows = top.term_rows.slice(0, 10).map((row) => `
      <div class="stanlyric-term-row">
        <code>${escapeHtml(row.term)}</code>
        <span>tf ${row.doc_tf}</span>
        <span>idf ${formatNumber(row.idf, 2)}</span>
        <span>+${formatNumber(row.contribution, 2)}</span>
      </div>
    `).join('');
    const missing = top.missing_terms.length
      ? `<p class="stanlyric-muted">Missing query terms: ${top.missing_terms.map((term) => `<span class="stanlyric-chip">${escapeHtml(term)}</span>`).join(' ')}</p>`
      : '<p class="stanlyric-muted">Every unique query term appeared in the top result.</p>';
    container.innerHTML = `
      <p class="stanlyric-kicker">explanation</p>
      <h3>Why this result?</h3>
      <p class="stanlyric-muted">Rare matched terms are more influential because BM25 uses inverse document frequency. The contribution column approximates how much each term added to the top score.</p>
      <div class="stanlyric-explain-list">${rows || '<p class="stanlyric-muted">No query terms from the index matched this result.</p>'}</div>
      ${missing}
    `;
  }

  function renderChart(container, results, chartK) {
    const rows = results.slice(0, chartK);
    if (!rows.length) {
      container.innerHTML = '<p class="stanlyric-muted">Run a query to plot candidate scores.</p>';
      return;
    }
    const width = 920;
    const rowHeight = 38;
    const labelWidth = 230;
    const valueWidth = 82;
    const height = rows.length * rowHeight + 18;
    const maxScore = Math.max(...rows.map((row) => row.bm25_score), 1e-9);
    const bars = rows.map((row, index) => {
      const y = index * rowHeight + 10;
      const barWidth = Math.max(4, ((width - labelWidth - valueWidth - 30) * row.bm25_score) / maxScore);
      const label = `${row.rank}. ${row.title}${row.artist ? ` — ${row.artist}` : ''}`;
      return `
        <text x="0" y="${y + 19}" font-size="13" fill="currentColor">${escapeHtml(label.slice(0, 36))}</text>
        <rect x="${labelWidth}" y="${y}" width="${barWidth}" height="24" rx="8" fill="currentColor" opacity="0.72"></rect>
        <text x="${labelWidth + barWidth + 8}" y="${y + 17}" font-size="12" fill="currentColor">${formatNumber(row.bm25_score, 2)}</text>
      `;
    }).join('');
    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Top BM25 score chart">${bars}</svg>`;
  }

  function renderResults(container, results) {
    if (!results.length) {
      container.innerHTML = '<p class="stanlyric-muted">No ranked results to show.</p>';
      return;
    }
    const snippetNote = results.some((row) => !row.snippet)
      ? '<div class="stanlyric-source-note stanlyric-results-note">Matched lyric snippets are unavailable in this public web artifact because it was exported without lyric text.</div>'
      : '';
    container.innerHTML = `${snippetNote}<div class="stanlyric-result-list">${results.map((row) => renderResultCard(row)).join('')}</div>`;
  }

  function formatMetadataValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    return String(value || '').trim();
  }

  function renderSongMetadata(row) {
    const fields = [
      ['Album', row.album],
      ['Year', row.year],
      ['Genre', row.genre],
      ['Language', row.language],
      ['Lyric chars', row.lyrics_char_len],
    ].map(([label, value]) => [label, formatMetadataValue(value)])
      .filter(([, value]) => value);

    if (!fields.length) return '';
    return `<div class="stanlyric-result-meta">${fields.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</span>`).join('')}</div>`;
  }

  function renderResultIds(row) {
    const ids = [
      ['Dataset ID', row.doc_id],
      ['Source hash', row.source],
    ].filter(([, value]) => value);

    if (!ids.length) return '';
    return `<p class="stanlyric-result-id">${ids.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</span>`).join('')}</p>`;
  }

  function renderResultCard(row) {
    const matched = row.matched_terms.slice(0, 10).map((term) => `<span class="stanlyric-chip">${escapeHtml(term)}</span>`).join(' ');
    const metadata = renderSongMetadata(row);
    const resultIds = renderResultIds(row);
    const snippet = row.snippet
      ? `<div class="stanlyric-snippet">${highlightTerms(row.snippet, new Set(row.matched_terms))}</div>`
      : '';
    const fullLyrics = row.full_lyrics
      ? `<details class="stanlyric-details"><summary>Show full lyrics from local artifact</summary><div class="stanlyric-full-lyrics">${highlightTerms(row.full_lyrics, new Set(row.matched_terms))}</div></details>`
      : '';
    return `
      <article class="stanlyric-result-card">
        <div class="stanlyric-result-head">
          <div>
            <p class="stanlyric-result-title">${escapeHtml(row.title)}</p>
            <p class="stanlyric-muted">${escapeHtml(row.artist)}</p>
          </div>
          <span class="stanlyric-rank">#${row.rank}</span>
        </div>
        ${metadata}
        <div class="stanlyric-controls" aria-label="result statistics">
          <span class="stanlyric-chip"><strong>score</strong> ${formatNumber(row.bm25_score, 3)}</span>
          <span class="stanlyric-chip"><strong>confidence</strong> ${formatPercent(row.confidence, 1)}</span>
          <span class="stanlyric-chip"><strong>percentile</strong> ${formatNumber(row.score_percentile, 1)}</span>
          <span class="stanlyric-chip"><strong>method</strong> ${escapeHtml(row.method)}</span>
        </div>
        <p class="stanlyric-muted">Matched terms: ${matched || 'none'}</p>
        ${resultIds}
        ${snippet}
        ${fullLyrics}
      </article>
    `;
  }

  function setStatus(app, message, className = '') {
    const status = app.querySelector('[data-stanlyric-status]');
    if (!status) return;
    status.className = `stanlyric-status ${className}`.trim();
    status.textContent = message;
  }

  function initApp(app) {
    const urls = {
      index: app.dataset.indexUrl,
      sampleIndex: app.dataset.sampleIndexUrl,
    };
    const queryEl = app.querySelector('[data-stanlyric-query]');
    const topKEl = app.querySelector('[data-stanlyric-topk]');
    const chartKEl = app.querySelector('[data-stanlyric-chartk]');
    const searchButton = app.querySelector('[data-stanlyric-search]');
    const exampleButton = app.querySelector('[data-stanlyric-example]');
    const summaryEl = app.querySelector('[data-stanlyric-summary]');
    const explanationEl = app.querySelector('[data-stanlyric-explanation]');
    const chartEl = app.querySelector('[data-stanlyric-chart]');
    const resultsEl = app.querySelector('[data-stanlyric-results]');

    let engine = null;
    let lastResults = [];
    let lastQueryTokens = [];

    fetchJsonWithFallback(urls.index, urls.sampleIndex)
      .then(({ payload, isFallback }) => {
        engine = new StanLyricBrowserSearch(payload);
        const note = isFallback ? 'Loaded sample StanLyric index' : 'Loaded StanLyric index';
        setStatus(app, `${note}: ${engine.size.toLocaleString()} songs`, 'is-ready');
        searchButton.disabled = false;
        exampleButton.disabled = false;
        if (!queryEl.value.trim()) queryEl.value = DEFAULT_EXAMPLE;
      })
      .catch((error) => {
        setStatus(app, `Could not load index: ${error.message}`);
      });

    function runSearch() {
      if (!engine) return;
      const query = queryEl.value.trim();
      if (!query) {
        setStatus(app, 'Type a lyric fragment first.');
        return;
      }
      const topK = Number(topKEl.value || 10);
      const chartK = Number(chartKEl.value || 10);
      const t0 = performance.now();
      lastResults = engine.search(query, topK);
      lastQueryTokens = uniquePreserveOrder(tokenize(query));
      const elapsed = Math.max(1, performance.now() - t0);
      setStatus(app, `Retrieved ${lastResults.length} results in ${elapsed.toFixed(0)} ms`, 'is-ready');
      renderSummary(summaryEl, lastResults, lastQueryTokens, engine.size);
      renderExplanation(explanationEl, lastResults);
      renderChart(chartEl, lastResults, chartK);
      renderResults(resultsEl, lastResults);
    }

    searchButton.addEventListener('click', runSearch);
    exampleButton.addEventListener('click', () => {
      queryEl.value = DEFAULT_EXAMPLE;
      runSearch();
    });
    queryEl.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') runSearch();
    });
    chartKEl.addEventListener('change', () => renderChart(chartEl, lastResults, Number(chartKEl.value || 10)));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-stanlyric-app]').forEach(initApp);
  });
})();
