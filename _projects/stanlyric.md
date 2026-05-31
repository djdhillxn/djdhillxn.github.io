---
layout: page
title: StanLyric
description: BM25 lyric-fragment search for identifying songs from remembered lines
importance: -4
category: NLP
img: assets/img/8milecover.jpg
---

<link rel="stylesheet" href="{{ '/assets/css/stanlyric/stanlyric.css' | relative_url }}">

StanLyric is a lyric-first music search project. The first version focuses on one useful retrieval task: **type a lyric fragment and identify the songs most likely to contain it.** It runs BM25 directly in the browser from a static search artifact, so the page does not need a backend server or live API. Find the code for training the retrieval model [here](https://github.com/djdhillxn/stanlyric).

<div
  class="stanlyric-app"
  data-stanlyric-app
  data-index-url="{{ '/assets/json/stanlyric/stanlyric_web_index.json' | relative_url }}"
  data-sample-index-url="{{ '/assets/json/stanlyric/stanlyric_web_index.sample.json' | relative_url }}"
>
  <section class="stanlyric-hero">
    <div>
      <p class="stanlyric-kicker">lyric fragment search</p>
      <h2>Find the song stuck in your head.</h2>
      <p class="stanlyric-lede">
        Enter a few remembered lines. StanLyric tokenizes the fragment, scores the lyric corpus using BM25-Okapi, and explains why the top candidate was retrieved.
      </p>
    </div>
    <div class="stanlyric-hero-card">
      <span class="stanlyric-pill">BM25-Okapi</span>
      <span class="stanlyric-pill">static GitHub Pages app</span>
    </div>
  </section>

  <section class="stanlyric-panel stanlyric-search-panel">
    <div class="stanlyric-panel-header">
      <div>
        <p class="stanlyric-kicker">search</p>
        <h3>Type a lyric fragment</h3>
      </div>
      <div class="stanlyric-status" data-stanlyric-status>Loading StanLyric index...</div>
    </div>

    <label class="stanlyric-label" for="stanlyric-query">Lyrics you remember</label>
    <textarea id="stanlyric-query" data-stanlyric-query rows="5" placeholder="e.g. midnight road under neon rain city lights whisper my name"></textarea>

    <div class="stanlyric-controls">
      <label>
        Results
        <select data-stanlyric-topk>
          <option value="5">Top 5</option>
          <option value="10" selected>Top 10</option>
          <option value="15">Top 15</option>
          <option value="20">Top 20</option>
        </select>
      </label>
      <label>
        Chart bars
        <select data-stanlyric-chartk>
          <option value="5">5</option>
          <option value="10" selected>10</option>
          <option value="15">15</option>
          <option value="20">20</option>
        </select>
      </label>
      <button type="button" class="stanlyric-button" data-stanlyric-search disabled>Search lyrics</button>
      <button type="button" class="stanlyric-button stanlyric-button-secondary" data-stanlyric-example disabled>Try example</button>
    </div>
  </section>

  <section class="stanlyric-grid">
    <div class="stanlyric-panel" data-stanlyric-summary>
      <p class="stanlyric-muted">Run a query to see the top song, confidence, matched terms, and score gap.</p>
    </div>
    <div class="stanlyric-panel" data-stanlyric-explanation>
      <p class="stanlyric-muted">The explanation panel will show the query terms that contributed most by IDF.</p>
    </div>
  </section>

  <section class="stanlyric-panel">
    <div class="stanlyric-panel-header">
      <div>
        <p class="stanlyric-kicker">visualization</p>
        <h3>Top BM25 scores</h3>
      </div>
      <span class="stanlyric-muted">A larger first-rank gap usually means a cleaner lyric match.</span>
    </div>
    <div class="stanlyric-chart" data-stanlyric-chart></div>
  </section>

  <section class="stanlyric-panel">
    <div class="stanlyric-panel-header">
      <div>
        <p class="stanlyric-kicker">ranked candidates</p>
        <h3>Search results</h3>
      </div>
      <span class="stanlyric-muted">Snippets are shown only when the exported artifact includes lyric text.</span>
    </div>
    <div data-stanlyric-results></div>
  </section>

</div>

<script src="{{ '/assets/js/stanlyric/stanlyric.js' | relative_url }}" defer></script>

## Technical implementation

StanLyric is an information-retrieval system over a lyrics corpus. Each song is treated as one document, and the user-provided lyric fragment is treated as a query. The current version uses BM25-Okapi because it is lightweight, interpretable, and especially strong when the query contains rare phrase fragments or distinctive words.

The offline pipeline builds a browser-ready artifact from the prepared StanLyric corpus. The artifact stores song metadata, document lengths, inverse document frequency values, and an inverted index of token frequencies. At runtime, the browser tokenizes the query and computes BM25 scores only for matching postings. This keeps the portfolio page static while still allowing interactive retrieval.

The explanation panel is intentionally simple: it shows which query terms appeared in the retrieved song, which query terms were missing, the term frequency inside the top song, each matched term's IDF, and the approximate BM25 contribution. This makes the system more transparent than a black-box recommender.

StanLyric is kept separate from the Spotify dashboard for now. The Spotify project analyzes personal listening and playlist curation, while StanLyric focuses on lyric-level retrieval. Later, the two can be connected by using Spotify playlists as taste profiles and StanLyric as the lyrics-aware discovery layer.

The lyrics corpus comes from the [Lyrics-MIDI-Dataset](https://huggingface.co/datasets/asigalov61/Lyrics-MIDI-Dataset)
on Hugging Face. 

<!-- The public portfolio version should show song metadata, retrieval scores, matched terms, and short snippets only. For local/offline development, the export script can include full lyric text in the browser artifact, but that should not be committed to a public GitHub Pages site unless you have the rights to redistribute the lyrics. -->
