---
layout: page
title: StanLyric
description: BM25 lyric-fragment search for identifying songs from remembered lines
importance: -4
category: NLP
img: assets/img/8milecover.jpg
img_size: small
---

{% assign stanlyric_hierarchy_asset_version = '20260710-labels' %}

<link rel="stylesheet" href="{{ '/assets/css/stanlyric/stanlyric.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/stanlyric/embedding-atlas.css' | relative_url }}?v={{ stanlyric_hierarchy_asset_version }}">
<link rel="stylesheet" href="{{ '/assets/css/stanlyric/hierarchy-explorer.css' | relative_url }}?v={{ stanlyric_hierarchy_asset_version }}">

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
      <button type="button" class="stanlyric-button" data-stanlyric-search disabled>Search lyrics</button>
      <button type="button" class="stanlyric-button stanlyric-button-secondary" data-stanlyric-example disabled>Try example</button>
    </div>
  </section>
  <section class="stanlyric-grid">
    <div class="stanlyric-panel" data-stanlyric-summary>
      <p class="stanlyric-muted">Run a query to see the top song, confidence, matched terms, and score gap.</p>
    </div>
    <div class="stanlyric-panel" data-stanlyric-explanation>
      <p class="stanlyric-muted">The explanation panel will decompose each matched term from raw frequency through its final BM25 contribution.</p>
    </div>
  </section>
  <section class="stanlyric-panel">
    <div class="stanlyric-panel-header">
      <div>
        <p class="stanlyric-kicker">BM25 score visualization</p>
        <h3>Ranked search results</h3>
      </div>
      <span class="stanlyric-muted">Top BM25 score bars show relative strength; a larger first-rank gap usually means a cleaner lyric match. Snippets are shown only when the exported artifact includes lyric text.</span>
    </div>
    <div data-stanlyric-results></div>
  </section>

  <section
    id="stanlyric-embedding-atlas"
    class="stanlyric-atlas"
    data-stanlyric-atlas
    data-atlas-url="{{ '/assets/json/stanlyric/stanlyric_embedding_atlas.json' | relative_url }}"
    data-hierarchy-url="{{ '/assets/json/stanlyric/stanlyric_hierarchy.json' | relative_url }}?v={{ stanlyric_hierarchy_asset_version }}"
  >
    <header class="stanlyric-atlas-header">
      <div class="stanlyric-atlas-heading">
        <p class="stanlyric-kicker">semantic map</p>
        <h3>Song Embedding Atlas</h3>
        <p>
          Cohere Embed v4 song representations project the cleaned
          <strong data-atlas-song-count>36,545</strong>-song corpus into a 3D UMAP atlas.
          Switch between <strong data-atlas-region-count>20</strong> broad Regions,
          <strong data-atlas-community-count>139</strong> stable Communities, and
          <strong data-atlas-neighborhood-count>175</strong> fine-grained Neighborhoods.
          Methods and evaluation are detailed in the
          <a href="{{ '/assets/pdf/stanlyric_cohere_hierarchy_report.pdf' | relative_url }}" target="_blank" rel="noopener">technical report</a>.
        </p>
        <p class="stanlyric-atlas-projection-note" data-atlas-projection-note>
          The 3D projection reports UMAP trustworthiness of 0.753, top-15 neighbor overlap of 0.129, and a PCA three-dimensional explained-variance baseline of 6.1%.
        </p>
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

        <div class="stanlyric-atlas-levels" aria-label="Color songs by hierarchy level">
          <button type="button" class="stanlyric-atlas-level-button is-active" data-atlas-level="region" aria-pressed="true">Regions</button>
          <button type="button" class="stanlyric-atlas-level-button" data-atlas-level="community" aria-pressed="false">Communities</button>
          <button type="button" class="stanlyric-atlas-level-button" data-atlas-level="neighborhood" aria-pressed="false">Neighborhoods</button>
        </div>

        <label class="sr-only" for="stanlyric-atlas-hierarchy-node">Filter the active hierarchy level</label>
        <select id="stanlyric-atlas-hierarchy-node" data-atlas-hierarchy-node>
          <option value="all">All regions</option>
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
            data-atlas-lock-selection
            title="Lock selected song"
            aria-label="Lock selected song"
            aria-pressed="false"
            disabled
          ><i class="fas fa-lock-open" aria-hidden="true"></i></button>
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
        <h4 data-detail-title></h4>
        <p class="stanlyric-atlas-detail-artist" data-detail-artist></p>
        <p class="stanlyric-atlas-detail-id" data-detail-doc-id></p>
        <div class="stanlyric-atlas-detail-hierarchy" data-detail-hierarchy></div>
        <p class="stanlyric-atlas-neighbor-heading">Strongest semantic neighbors</p>
        <div class="stanlyric-atlas-neighbor-list" data-detail-neighbors></div>
      </aside>
    </div>
  </section>

  <section
    class="stanlyric-hierarchy"
    data-stanlyric-hierarchy
    data-hierarchy-url="{{ '/assets/json/stanlyric/stanlyric_hierarchy.json' | relative_url }}?v={{ stanlyric_hierarchy_asset_version }}"
    data-atlas-url="{{ '/assets/json/stanlyric/stanlyric_embedding_atlas.json' | relative_url }}"
  >
    <header class="stanlyric-hierarchy-header">
      <div class="stanlyric-hierarchy-heading">
        <p class="stanlyric-kicker">hierarchy explorer</p>
        <h3>From lyric regions to song neighborhoods</h3>
        <p>Follow the strict Region → Community → Neighborhood structure, then inspect the language, artists, representative songs, and graph evidence that explain each node.</p>
      </div>
      <div class="stanlyric-hierarchy-summary" aria-label="hierarchy statistics">
        <div>
          <span>Regions</span>
          <strong data-hierarchy-region-count>--</strong>
        </div>
        <div>
          <span>Communities</span>
          <strong data-hierarchy-community-count>--</strong>
        </div>
        <div>
          <span>Neighborhoods</span>
          <strong data-hierarchy-neighborhood-count>--</strong>
        </div>
        <div>
          <span>Adaptive splits</span>
          <strong data-hierarchy-split-count>--</strong>
        </div>
      </div>
    </header>

    <p class="stanlyric-hierarchy-status" data-hierarchy-status>
      Loading hierarchy evidence...
    </p>

    <div class="stanlyric-hierarchy-navigator">
      <div class="stanlyric-hierarchy-field">
        <label for="stanlyric-hierarchy-region">Region</label>
        <select id="stanlyric-hierarchy-region" data-hierarchy-region></select>
      </div>
      <div class="stanlyric-hierarchy-field">
        <label for="stanlyric-hierarchy-community">Community</label>
        <select id="stanlyric-hierarchy-community" data-hierarchy-community disabled></select>
      </div>
      <div class="stanlyric-hierarchy-field">
        <label for="stanlyric-hierarchy-neighborhood">Neighborhood</label>
        <select id="stanlyric-hierarchy-neighborhood" data-hierarchy-neighborhood disabled></select>
      </div>
      <button
        type="button"
        class="stanlyric-hierarchy-locate"
        data-hierarchy-locate
        title="Show this node in the 3D atlas"
        aria-label="Show this node in the 3D atlas"
      ><i class="fas fa-crosshairs" aria-hidden="true"></i></button>
    </div>

    <nav class="stanlyric-hierarchy-breadcrumb" data-hierarchy-breadcrumb aria-label="Selected hierarchy path"></nav>

    <div class="stanlyric-hierarchy-identity">
      <span class="stanlyric-hierarchy-node-type" data-hierarchy-node-level>--</span>
      <span class="stanlyric-hierarchy-node-id" data-hierarchy-node-id>--</span>
      <span class="stanlyric-hierarchy-node-label" data-hierarchy-node-label>--</span>
    </div>

    <div class="stanlyric-hierarchy-node-copy" data-hierarchy-node-copy hidden>
      <p class="stanlyric-hierarchy-node-summary" data-hierarchy-node-summary></p>
      <p class="stanlyric-hierarchy-node-description" data-hierarchy-node-description></p>
      <div class="stanlyric-hierarchy-label-meta">
        <span class="stanlyric-hierarchy-label-confidence" data-hierarchy-label-confidence></span>
        <div class="stanlyric-hierarchy-label-evidence" data-hierarchy-label-evidence></div>
      </div>
    </div>

    <div class="stanlyric-hierarchy-metrics" aria-label="selected hierarchy node statistics">
      <div class="stanlyric-hierarchy-metric">
        <span>Songs</span>
        <strong data-hierarchy-size>--</strong>
      </div>
      <div class="stanlyric-hierarchy-metric">
        <span>Assignment stability</span>
        <strong data-hierarchy-stability>--</strong>
      </div>
      <div class="stanlyric-hierarchy-metric">
        <span>Embedding cohesion</span>
        <strong data-hierarchy-cohesion>--</strong>
      </div>
      <div class="stanlyric-hierarchy-metric">
        <span>Graph retention</span>
        <strong data-hierarchy-retention>--</strong>
      </div>
      <div class="stanlyric-hierarchy-metric">
        <span>Distinct artists</span>
        <strong data-hierarchy-artists>--</strong>
      </div>
    </div>
    <p class="stanlyric-hierarchy-diagnostics" data-hierarchy-diagnostics></p>

    <section class="stanlyric-hierarchy-branches">
      <h4 class="stanlyric-hierarchy-section-heading" data-hierarchy-children-heading>Child nodes</h4>
      <div class="stanlyric-hierarchy-child-list" data-hierarchy-children></div>
    </section>

    <div class="stanlyric-hierarchy-evidence">
      <section class="stanlyric-hierarchy-evidence-section">
        <h4 class="stanlyric-hierarchy-section-heading">Distinctive lyric language</h4>
        <div class="stanlyric-hierarchy-terms" data-hierarchy-terms></div>
      </section>

      <section class="stanlyric-hierarchy-evidence-section">
        <h4 class="stanlyric-hierarchy-section-heading">Most represented artists</h4>
        <div class="stanlyric-hierarchy-artists" data-hierarchy-artists-list></div>
      </section>
    </div>

    <section class="stanlyric-hierarchy-catalog">
      <div class="stanlyric-hierarchy-catalog-header">
        <div>
          <h4 class="stanlyric-hierarchy-section-heading" data-hierarchy-song-catalog-heading>Songs</h4>
          <p>Ranked by local membership agreement, then semantic-edge strength and hierarchy stability.</p>
        </div>
        <span data-hierarchy-song-range>--</span>
      </div>
      <div class="stanlyric-hierarchy-song-catalog" data-hierarchy-song-catalog></div>
      <div class="stanlyric-hierarchy-catalog-pagination">
        <button type="button" data-hierarchy-songs-previous disabled>
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
          Previous 20
        </button>
        <button type="button" data-hierarchy-songs-next disabled>
          Next 20
          <i class="fas fa-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </section>

    <div class="stanlyric-hierarchy-evidence stanlyric-hierarchy-song-examples">
      <section class="stanlyric-hierarchy-evidence-section">
        <h4 class="stanlyric-hierarchy-section-heading">Centroid representatives</h4>
        <ol class="stanlyric-hierarchy-song-list" data-hierarchy-representatives></ol>
      </section>

      <section class="stanlyric-hierarchy-evidence-section">
        <h4 class="stanlyric-hierarchy-section-heading">Boundary songs</h4>
        <ol class="stanlyric-hierarchy-song-list" data-hierarchy-boundaries></ol>
      </section>
    </div>

    <p class="stanlyric-hierarchy-language-note">
      <i class="fas fa-info-circle" aria-hidden="true"></i>
      Community language is extracted directly from the lyrics corpus and may include explicit terms; it is presented as data, not endorsement.
    </p>
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
<script type="module" src="{{ '/assets/js/stanlyric/embedding-atlas.js' | relative_url }}?v={{ stanlyric_hierarchy_asset_version }}"></script>
<script type="module" src="{{ '/assets/js/stanlyric/hierarchy-explorer.js' | relative_url }}?v={{ stanlyric_hierarchy_asset_version }}"></script>

## Technical implementation

StanLyric is a lyric-first music search project. Its first goal is simple: type a lyric fragment and find the songs most likely to contain it. It runs BM25 in the browser from a static search artifact, so the page does not need a backend server or live API. StanLyric breaks the fragment into tokens, scores the lyric corpus with BM25-Okapi, and explains why the top candidate was retrieved. Find the code for training the song name retrieval model <a href="https://github.com/djdhillxn/stanlyric">here</a>.   

The embedding atlas adds a second retrieval view over the cleaned 36,545-song corpus. Cohere Embed v4 maps each song to 1,024 dimensions, and 3D UMAP provides the browser coordinates. Projection quality is reported using trustworthiness and original-space neighbor overlap; the first three PCA components serve as a transparent linear explained-variance baseline. The page ships quantized coordinates, song metadata, six strong graph neighbors per song, and compact hierarchy assignments rather than dense vectors.

The semantic structure is a strict three-level Leiden hierarchy built with the Constant Potts Model. A multiseed resolution sweep selects 139 middle Communities using adjusted Rand agreement, normalized variation of information, adjacent-resolution stability, and balance constraints. Those Communities are aggregated into 20 broad Regions. Large Communities are then split only when the proposed Neighborhoods pass minimum-size, seed-stability, internal-edge-retention, embedding-cohesion-gain, and topic-separation gates. This produces 175 Neighborhoods, with every Neighborhood contained by exactly one Community and every Community contained by exactly one Region.

Each hierarchy level receives the same interpretation contract. Binary song-incidence c-TF-IDF finds distinctive unigrams and bigrams without letting repeated choruses multiply their weight. Corpus prevalence lift and smoothed log-odds separate characteristic language from merely frequent lyric vocabulary. Representative songs are nearest to each node's centroid in the original 1,024-dimensional cosine space, while boundary songs place substantial graph strength outside the node. Cohesion, weighted conductance, internal edge strength, artist diversity, sampled cosine silhouette, per-song assignment stability, and weighted local-neighbor agreement remain visible as diagnostics.

StanLyric is an information retrieval system for a lyrics corpus. Each song is one document, and the user-provided lyric fragment is one query. The current version uses BM25-Okapi, short for **Best Matching 25**, because it is lightweight, interpretable, and especially strong when the query contains rare phrase fragments or distinctive words.

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

Here, $$f(q,D)$$ is the raw term frequency: how often the query word appears in that song's lyrics. The explanation calls the fraction multiplying IDF the **BM25 TF weight**. It is the saturated, document-length-normalized version of raw TF, so it does not need to lie between zero and one. The interface also exposes query TF, the number of times the term appears in the submitted fragment. The exact contribution is therefore shown as:

$$
\text{BM25 TF weight}(q,D)
\times \text{query TF}(q,Q)
\times \operatorname{IDF}(q)
=
\text{term contribution}(q,D)
$$

Query TF is one for a term that appears once in the query, so it usually leaves the simpler BM25 TF weight times IDF calculation unchanged.

The inverse document frequency is based on how many of the $$N$$ songs contain the term:

$$
\operatorname{IDF}(q)
=
\log\left(
\frac{N-n(q)+0.5}
{n(q)+0.5}
\right)
$$

The value $$n(q)$$ is the number of songs containing $$q$$. This gives more weight to unusual words that occur in relatively few songs; a word such as *rabbit* is therefore more useful than a common word such as *the*. During offline export, exceptionally common terms whose raw IDF would be negative are assigned a small positive floor based on $$\epsilon=0.25$$ and the corpus-average IDF. Repeating a term helps, but the term-frequency fraction in the BM25 formula saturates its contribution, so ten occurrences are not treated as ten times stronger than one.

The denominator also normalizes for document length. Without it, long lyrics would tend to score highly simply because they contain more words and have more chances to match. The ratio $$\lvert D\rvert/\operatorname{avgdl}$$ compares a song's token count with the corpus average. In the current deduplicated 36,545-song artifact, the average document length is approximately **266 tokens**.

StanLyric uses $$k_1=1.5$$ and $$b=0.75$$. The $$k_1$$ parameter controls how quickly repeated term frequency reaches diminishing returns. The $$b$$ parameter controls the strength of length normalization: $$b=0$$ would ignore document length, while $$b=1$$ would apply the full normalization. A value of 0.75 provides substantial normalization without letting length dominate the score.

The offline pipeline builds a browser-ready artifact from the prepared StanLyric corpus. The artifact stores song metadata, document lengths, inverse document frequency values, and an inverted index of token frequencies. At runtime, the browser tokenizes the query and computes BM25 scores only for matching postings. This keeps the portfolio page static while still allowing interactive retrieval.

The explanation panel shows which query terms appeared in the retrieved song, which were missing, and the exact scoring path for every matched term: raw TF, BM25 TF weight, query TF, IDF, and their resulting contribution. All these efforts are aimed at making the retrieval system more transparent!

<!-- 
StanLyric is kept separate from the Spotify dashboard for now. The Spotify project analyzes personal listening and playlist curation, while StanLyric focuses on lyric-level retrieval. Later, the two can be connected by using Spotify playlists as taste profiles and StanLyric as the lyrics-aware discovery layer. 
-->

The lyrics corpus comes from the [Lyrics-MIDI-Dataset](https://huggingface.co/datasets/asigalov61/Lyrics-MIDI-Dataset)
on Hugging Face. 

<!-- The public portfolio version should show song metadata, retrieval scores, matched terms, and short snippets only. For local/offline development, the export script can include full lyric text in the browser artifact, but that should not be committed to a public GitHub Pages site unless you have the rights to redistribute the lyrics. -->
