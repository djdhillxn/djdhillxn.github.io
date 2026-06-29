const COMMUNITY_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#5b8def',
  '#f78fb3',
  '#7bed9f',
  '#ff9f43',
  '#a29bfe',
  '#45aaf2',
  '#eccc68',
  '#26de81',
  '#fd79a8',
  '#2bcbba',
  '#fc5c65',
  '#778ca3',
  '#fed330',
  '#20bf6b',
  '#eb3b5a',
  '#8854d0',
  '#0fb9b1',
  '#fa8231',
  '#4b7bec',
  '#d1d8e0',
  '#a5b1c2',
];

const formatInteger = new Intl.NumberFormat('en-US');
const formatPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) element.textContent = value;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function cleanTopicTerms(value, limit = 6) {
  const selected = [];
  const tokenSets = [];
  for (const candidate of String(value).split(',')) {
    const term = candidate.trim();
    const tokens = term.split(/\s+/).filter(Boolean);
    const tokenSet = new Set(tokens);
    if (!term || (tokens.length > 1 && tokenSet.size === 1)) continue;
    const duplicate = tokenSets.some((existing) => (
      tokenSet.size === existing.size
      && [...tokenSet].every((token) => existing.has(token))
    ));
    if (duplicate) continue;
    selected.push(term);
    tokenSets.push(tokenSet);
    if (selected.length >= limit) break;
  }
  return selected.join(' / ');
}

class StanLyricCommunityInsights {
  constructor(root) {
    this.root = root;
    this.select = root.querySelector('[data-insights-community]');
    this.status = root.querySelector('[data-insights-status]');
    this.atlasSelect = document.querySelector('[data-atlas-community]');
    this.communities = [];
    this.byId = new Map();
  }

  async init() {
    try {
      const response = await fetch(this.root.dataset.insightsUrl, {
        cache: 'force-cache',
      });
      if (!response.ok) {
        throw new Error(`Community insight request failed with HTTP ${response.status}.`);
      }
      const payload = await response.json();
      if (payload?.schema_version !== 1 || !Array.isArray(payload.communities)) {
        throw new Error('Unrecognized StanLyric community insight payload.');
      }
      this.payload = payload;
      this.communities = payload.communities
        .slice()
        .sort((left, right) => left.rank - right.rank);
      this.communities.forEach((community) => {
        this.byId.set(String(community.id), community);
      });
      this.populateSelect();
      this.bindControls();
      this.render(this.communities[0]);
      this.status.hidden = true;
      this.root.classList.add('is-ready');
    } catch (error) {
      console.error(error);
      this.status.textContent = 'Community interpretation data could not be loaded.';
      this.status.classList.add('is-error');
    }
  }

  populateSelect() {
    this.communities.forEach((community) => {
      const option = document.createElement('option');
      option.value = String(community.id);
      option.textContent = `${String(community.rank).padStart(2, '0')} / ${community.label}`;
      this.select.appendChild(option);
    });
  }

  bindControls() {
    this.select.addEventListener('change', () => {
      const community = this.byId.get(this.select.value);
      if (!community) return;
      this.render(community);
      this.focusAtlasCommunity(community.id);
    });

    if (this.atlasSelect) {
      this.atlasSelect.addEventListener('change', () => {
        const community = this.byId.get(this.atlasSelect.value);
        if (!community) return;
        this.select.value = String(community.id);
        this.render(community);
      });
    }
  }

  focusAtlasCommunity(communityId) {
    if (!this.atlasSelect || this.atlasSelect.value === String(communityId)) return;
    this.atlasSelect.value = String(communityId);
    this.atlasSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  render(community) {
    const metrics = community.metrics;
    const accent = COMMUNITY_COLORS[(community.rank - 1) % COMMUNITY_COLORS.length];
    this.root.style.setProperty('--community-accent', accent);
    setText(this.root, '[data-insights-rank]', `Community ${community.rank}`);
    setText(this.root, '[data-insights-label]', community.label);
    setText(this.root, '[data-insights-size]', formatInteger.format(community.size));
    setText(
      this.root,
      '[data-insights-cohesion]',
      metrics.embedding_cohesion.toFixed(3),
    );
    setText(
      this.root,
      '[data-insights-internal-strength]',
      formatPercent.format(metrics.internal_strength_fraction),
    );
    setText(
      this.root,
      '[data-insights-artist-count]',
      formatInteger.format(metrics.artist_count),
    );
    setText(
      this.root,
      '[data-insights-diagnostics]',
      `Conductance ${metrics.conductance.toFixed(3)} / cosine silhouette ${metrics.silhouette_estimate.toFixed(3)} / leading artist ${metrics.dominant_artist} at ${formatPercent.format(metrics.dominant_artist_share)}`,
    );

    this.renderTerms(community.terms);
    this.renderTopics(community.nmf_topics);
    this.renderSongs(
      '[data-insights-representatives]',
      community.representative_songs.slice(0, 5),
      (song) => `centroid cosine ${song.centroid_similarity.toFixed(3)}`,
    );
    this.renderSongs(
      '[data-insights-boundaries]',
      community.boundary_songs.slice(0, 5),
      (song) => (
        `${formatPercent.format(song.external_strength_ratio)} external / `
        + `touches ${song.neighbor_community_count} communities`
      ),
    );
  }

  renderTerms(terms) {
    const host = this.root.querySelector('[data-insights-terms]');
    host.replaceChildren();
    terms.slice(0, 10).forEach((term) => {
      const row = element('div', 'stanlyric-community-term');
      const word = element('strong', '', term.term);
      const evidence = element(
        'span',
        '',
        `${formatPercent.format(term.prevalence)} of songs / ${term.lift.toFixed(1)}x lift`,
      );
      row.title = `c-TF-IDF ${term.ctfidf.toFixed(5)}; log-odds z ${term.log_odds_z.toFixed(2)}`;
      row.append(word, evidence);
      host.appendChild(row);
    });
  }

  renderTopics(topics) {
    const host = this.root.querySelector('[data-insights-topics]');
    host.replaceChildren();
    const visibleTopics = topics.slice(0, 4);
    const maxShare = Math.max(...visibleTopics.map((topic) => topic.mean_share), 0.01);
    visibleTopics.forEach((topic) => {
      const row = element('div', 'stanlyric-community-topic');
      const header = element('div', 'stanlyric-community-topic-header');
      const title = element('strong', '', `NMF topic ${topic.topic_id + 1}`);
      const score = element(
        'span',
        '',
        `${formatPercent.format(topic.mean_share)} share / ${topic.lift.toFixed(1)}x lift`,
      );
      header.append(title, score);
      const terms = element(
        'p',
        '',
        cleanTopicTerms(topic.terms),
      );
      const track = element('div', 'stanlyric-community-topic-track');
      const bar = element('span');
      bar.style.width = `${Math.max((topic.mean_share / maxShare) * 100, 3)}%`;
      track.appendChild(bar);
      row.append(header, terms, track);
      host.appendChild(row);
    });
  }

  renderSongs(selector, songs, detailFormatter) {
    const host = this.root.querySelector(selector);
    host.replaceChildren();
    songs.forEach((song) => {
      const row = element('li', 'stanlyric-community-song');
      const identity = element('span', 'stanlyric-community-song-identity');
      identity.append(
        element('strong', '', song.title),
        element('span', '', song.artist),
      );
      row.append(identity, element('small', '', detailFormatter(song)));
      host.appendChild(row);
    });
  }
}

document.querySelectorAll('[data-community-insights]').forEach((root) => {
  const insights = new StanLyricCommunityInsights(root);
  insights.init();
});
