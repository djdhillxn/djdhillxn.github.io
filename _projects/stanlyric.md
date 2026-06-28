---
layout: page
title: StanLyric
description: BM25 lyric-fragment search for identifying songs from remembered lines
importance: -4
category: NLP
img: assets/img/8milecover.jpg
img_size: small
---

<link rel="stylesheet" href="{{ '/assets/css/stanlyric/stanlyric.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/stanlyric/embedding-atlas.css' | relative_url }}">

<figure class="stanlyric-reference-figure">
  <div class="stanlyric-reference-crop">
    <img src="{{ '/assets/img/eminems-lyric-sheet-when-he-was-on-the-set-of-8-mile-v0.webp' | relative_url }}" alt="Eminem lyric sheet from the set of 8 Mile" loading="lazy">
  </div>
  <figcaption>
    Reference: <a href="https://www.reddit.com/r/HipHopImages/comments/248t86/eminems_lyric_sheet_when_he_was_on_the_set_of_8/">r/HipHopImages</a>
  </figcaption>
</figure>
<div class="stanlyric-intro">
  <p>
    Do you sometimes remember lyrics but don't know which song it came from?
      Or maybe you do know, but for the fun of it, would like to try this app here,
      then we should get going!
      Don't worry, a few lines is all we need, but more is also merrier, 
      at least in our case here.     
  </p>
</div>
<div
  class="stanlyric-app"
  data-stanlyric-app
  data-index-url="{{ '/assets/json/stanlyric/stanlyric_web_index.json' | relative_url }}"
  data-sample-index-url="{{ '/assets/json/stanlyric/stanlyric_web_index.sample.json' | relative_url }}"
>
  <section class="stanlyric-hero">
    <p class="stanlyric-kicker">lyric-to-song</p>
    <!-- <h2>Find the song stuck in your head.</h2> -->
    <h2>Find the forgotten song from its unforgotten lyrics</h2>
    <!-- <p class="stanlyric-lede">
    </p> -->
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
    <textarea id="stanlyric-query" data-stanlyric-query rows="5" placeholder="e.g. ope there goes rabbit, he choked, he's mad, but he won't give up that easy"></textarea>

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

<div class="stanlyric-intro">
  <p>
    StanLyric tokenizes the fragment, scores the lyric corpus using BM25-Okapi, and explains why the top candidate was retrieved. Find the code for training the song name retrieval model <a href="https://github.com/djdhillxn/stanlyric">here</a>.   
  </p>
</div>

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

  <section
    id="stanlyric-embedding-atlas"
    class="stanlyric-atlas"
    data-stanlyric-atlas
    data-atlas-url="{{ '/assets/json/stanlyric/stanlyric_embedding_atlas.json' | relative_url }}"
  >
    <header class="stanlyric-atlas-header">
      <div class="stanlyric-atlas-heading">
        <p class="stanlyric-kicker">semantic map</p>
        <h3>Song Embedding Atlas</h3>
        <p>Cohere Embed v4 song representations, projected with 3D UMAP and partitioned with weighted Leiden communities.</p>
      </div>
      <div class="stanlyric-atlas-metrics" aria-label="atlas statistics">
        <div class="stanlyric-atlas-metric">
          <span>Songs</span>
          <strong data-atlas-song-count>--</strong>
        </div>
        <div class="stanlyric-atlas-metric">
          <span>Communities</span>
          <strong data-atlas-community-count>--</strong>
        </div>
        <div class="stanlyric-atlas-metric">
          <span>UMAP trust</span>
          <strong data-atlas-trustworthiness>--</strong>
        </div>
        <div class="stanlyric-atlas-metric">
          <span>PCA 3D variance</span>
          <strong data-atlas-pca-variance>--</strong>
        </div>
      </div>
    </header>

    <div class="stanlyric-atlas-stage">
      <div class="stanlyric-atlas-canvas" data-atlas-canvas></div>

      <div class="stanlyric-atlas-toolbar">
        <div class="stanlyric-atlas-search">
          <i class="fas fa-search" aria-hidden="true"></i>
          <label class="sr-only" for="stanlyric-atlas-search">Search title or artist</label>
          <input
            id="stanlyric-atlas-search"
            type="search"
            data-atlas-search
            placeholder="Search title or artist"
            autocomplete="off"
            spellcheck="false"
          >
          <div class="stanlyric-atlas-suggestions" data-atlas-suggestions hidden></div>
        </div>

        <label class="sr-only" for="stanlyric-atlas-community">Filter by community</label>
        <select id="stanlyric-atlas-community" data-atlas-community>
          <option value="all">All communities</option>
        </select>

        <div class="stanlyric-atlas-icon-group">
          <button
            type="button"
            class="stanlyric-atlas-icon-button"
            data-atlas-reset
            title="Reset view"
            aria-label="Reset view"
          ><i class="fas fa-crosshairs" aria-hidden="true"></i></button>
          <button
            type="button"
            class="stanlyric-atlas-icon-button"
            data-atlas-rotate
            title="Pause rotation"
            aria-label="Pause rotation"
            aria-pressed="true"
          ><i class="fas fa-pause" aria-hidden="true"></i></button>
          <button
            type="button"
            class="stanlyric-atlas-icon-button"
            data-atlas-fullscreen
            title="Enter fullscreen"
            aria-label="Enter fullscreen"
          ><i class="fas fa-expand" aria-hidden="true"></i></button>
        </div>
      </div>

      <div class="stanlyric-atlas-status" data-atlas-status>
        <i class="fas fa-circle-notch" aria-hidden="true"></i>
        <span>Loading song space...</span>
      </div>

      <div class="stanlyric-atlas-tooltip" data-atlas-tooltip hidden>
        <strong data-tooltip-title></strong>
        <span data-tooltip-artist></span>
        <span data-tooltip-community></span>
      </div>

      <aside class="stanlyric-atlas-details" data-atlas-details hidden>
        <button
          type="button"
          class="stanlyric-atlas-icon-button stanlyric-atlas-details-close"
          data-atlas-close-details
          title="Close song details"
          aria-label="Close song details"
        ><i class="fas fa-times" aria-hidden="true"></i></button>
        <p class="stanlyric-atlas-detail-community">
          <span class="stanlyric-atlas-swatch" data-detail-swatch></span>
          <span data-detail-community></span>
          <span aria-hidden="true">/</span>
          <span data-detail-community-size></span>
        </p>
        <h4 data-detail-title></h4>
        <p class="stanlyric-atlas-detail-artist" data-detail-artist></p>
        <p class="stanlyric-atlas-detail-id" data-detail-doc-id></p>
        <p class="stanlyric-atlas-neighbor-heading">Strongest semantic neighbors</p>
        <div class="stanlyric-atlas-neighbor-list" data-detail-neighbors></div>
      </aside>
    </div>
  </section>

</div>

<script src="{{ '/assets/js/stanlyric/stanlyric.js' | relative_url }}" defer></script>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
  }
}
</script>
<script type="module" src="{{ '/assets/js/stanlyric/embedding-atlas.js' | relative_url }}"></script>

## Technical implementation

StanLyric is a lyric-first music search project. The first version focuses on one useful retrieval task: <strong>type a lyric fragment and identify the songs most likely to contain it.</strong> It runs BM25 directly in the browser from a static search artifact, so the page does not need a backend server or live API. 

The embedding atlas adds a second retrieval view over the cleaned 36,545-song corpus. Cohere Embed v4 maps each song to 1,024 dimensions; 3D UMAP provides the browser coordinates, while Leiden partitions UMAP's weighted high-dimensional neighborhood graph. The page ships only quantized coordinates, song metadata, community assignments, and six strong graph neighbors per song. Projection quality is reported with trustworthiness and neighbor overlap; PCA's first three components are retained as a linear explained-variance baseline.

StanLyric is an information-retrieval system over a lyrics corpus. Each song is treated as one document, and the user-provided lyric fragment is treated as a query. The current version uses BM25-Okapi, short for **Best Matching 25**, because it is lightweight, interpretable, and especially strong when the query contains rare phrase fragments or distinctive words.

For a query $$Q$$ and song document $$D$$, the implementation adds one contribution for each query term $$q$$:

$$
\operatorname{BM25}(D,Q)
=
\sum_{q \in Q}
\operatorname{IDF}(q)
\cdot
\frac{f(q,D)(k_1+1)}
{f(q,D)+k_1\left(1-b+b\frac{|D|}{\operatorname{avgdl}}\right)}
$$

Here, $$f(q,D)$$ is the term frequency: how often the query word appears in that song's lyrics. The inverse document frequency is based on how many of the $$N$$ songs contain the term:

$$
\operatorname{IDF}(q)
=
\log\left(
\frac{N-n(q)+0.5}
{n(q)+0.5}
\right)
$$

The value $$n(q)$$ is the number of songs containing $$q$$. This gives more weight to unusual words that occur in relatively few songs; a word such as *rabbit* is therefore more discriminative than a common word such as *the*. During offline export, exceptionally common terms whose raw IDF would be negative are assigned a small positive floor based on $$\epsilon=0.25$$ and the corpus-average IDF. Repeating a term helps, but the term-frequency fraction in the BM25 formula saturates its contribution, so ten occurrences are not treated as ten times stronger than one.

The denominator also normalizes for document length. Without it, long lyrics would tend to score highly simply because they contain more words and have more opportunities to match. The ratio $$\lvert D\rvert/\operatorname{avgdl}$$ compares a song's token count with the corpus average. In the current 44,480-song artifact, the average document length is approximately **267 tokens**.

StanLyric uses $$k_1=1.5$$ and $$b=0.75$$. The $$k_1$$ parameter controls how quickly repeated term frequency reaches diminishing returns. The $$b$$ parameter controls the strength of length normalization: $$b=0$$ would ignore document length, while $$b=1$$ would apply the full normalization. A value of 0.75 provides substantial normalization without letting length dominate the score.

The offline pipeline builds a browser-ready artifact from the prepared StanLyric corpus. The artifact stores song metadata, document lengths, inverse document frequency values, and an inverted index of token frequencies. At runtime, the browser tokenizes the query and computes BM25 scores only for matching postings. This keeps the portfolio page static while still allowing interactive retrieval.

The explanation panel is intentionally simple: it shows which query terms appeared in the retrieved song, which were missing, the term frequency in the top song, each matched term's IDF, and the approximate BM25 contribution. All these efforts are aimed at making the retrieval system more transparent!

<!-- 
StanLyric is kept separate from the Spotify dashboard for now. The Spotify project analyzes personal listening and playlist curation, while StanLyric focuses on lyric-level retrieval. Later, the two can be connected by using Spotify playlists as taste profiles and StanLyric as the lyrics-aware discovery layer. 
-->

The lyrics corpus comes from the [Lyrics-MIDI-Dataset](https://huggingface.co/datasets/asigalov61/Lyrics-MIDI-Dataset)
on Hugging Face. 

<!-- The public portfolio version should show song metadata, retrieval scores, matched terms, and short snippets only. For local/offline development, the export script can include full lyric text in the browser artifact, but that should not be committed to a public GitHub Pages site unless you have the rights to redistribute the lyrics. -->
