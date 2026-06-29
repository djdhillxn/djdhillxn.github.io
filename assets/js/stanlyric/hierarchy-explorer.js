import {
  HIERARCHY_LEVELS,
  levelLabel,
  nodeColorHex,
} from './hierarchy-colors.js';

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

class StanLyricHierarchyExplorer {
  constructor(root) {
    this.root = root;
    this.status = root.querySelector('[data-hierarchy-status]');
    this.regionSelect = root.querySelector('[data-hierarchy-region]');
    this.communitySelect = root.querySelector('[data-hierarchy-community]');
    this.neighborhoodSelect = root.querySelector('[data-hierarchy-neighborhood]');
    this.locateButton = root.querySelector('[data-hierarchy-locate]');
    this.catalogPreviousButton = root.querySelector('[data-hierarchy-songs-previous]');
    this.catalogNextButton = root.querySelector('[data-hierarchy-songs-next]');
    this.nodeById = new Map();
    this.nodeByLevelId = new Map();
    this.childrenByParent = new Map();
    this.songIndicesByNode = new Map();
    this.activeNode = null;
    this.activeSongRows = [];
    this.catalogPage = 0;
    this.catalogPageSize = 20;
  }

  async init() {
    try {
      const [hierarchyResponse, atlasResponse] = await Promise.all([
        fetch(this.root.dataset.hierarchyUrl, { cache: 'force-cache' }),
        fetch(this.root.dataset.atlasUrl, { cache: 'force-cache' }),
      ]);
      if (!hierarchyResponse.ok) {
        throw new Error(
          `Hierarchy request failed with HTTP ${hierarchyResponse.status}.`,
        );
      }
      if (!atlasResponse.ok) {
        throw new Error(`Atlas request failed with HTTP ${atlasResponse.status}.`);
      }
      this.payload = await hierarchyResponse.json();
      this.atlas = await atlasResponse.json();
      this.validatePayload();
      this.indexHierarchy();
      this.indexSongs();
      this.populateSummary();
      this.populateRegions();
      this.bindControls();
      this.selectNode(this.regions[0].id);
      this.status.hidden = true;
      this.root.classList.add('is-ready');
    } catch (error) {
      console.error(error);
      this.status.textContent = 'The hierarchy evidence could not be loaded.';
      this.status.classList.add('is-error');
    }
  }

  validatePayload() {
    const hierarchySongs = this.payload?.songs;
    const atlasSongs = this.atlas?.songs;
    const songCount = this.payload?.summary?.songs;
    if (
      this.payload?.schema_version !== 1
      || !Array.isArray(this.payload?.nodes)
      || !this.payload?.summary?.strict_nesting
      || hierarchySongs?.doc_ids?.length !== songCount
      || this.atlas?.schema_version !== 1
      || atlasSongs?.doc_ids?.length !== songCount
      || atlasSongs?.titles?.length !== songCount
      || atlasSongs?.artist_indices?.length !== songCount
    ) {
      throw new Error('Unrecognized StanLyric hierarchy payload.');
    }
    for (let index = 0; index < songCount; index += 1) {
      if (hierarchySongs.doc_ids[index] !== atlasSongs.doc_ids[index]) {
        throw new Error('Atlas and hierarchy song rows are not aligned.');
      }
    }
  }

  indexHierarchy() {
    this.payload.nodes.forEach((node) => {
      this.nodeById.set(node.id, node);
      this.nodeByLevelId.set(`${node.level}:${node.level_id}`, node);
      if (node.parent) {
        const children = this.childrenByParent.get(node.parent) || [];
        children.push(node);
        this.childrenByParent.set(node.parent, children);
      }
    });
    this.childrenByParent.forEach((children) => {
      children.sort((left, right) => left.rank - right.rank);
    });
    this.regions = this.payload.nodes
      .filter((node) => node.level === 'region')
      .sort((left, right) => left.rank - right.rank);
  }

  indexSongs() {
    const hierarchySongs = this.payload.songs;
    const atlasSongs = this.atlas.songs;
    const artists = this.atlas.artists;
    this.songs = atlasSongs.doc_ids.map((docId, index) => ({
      index,
      docId,
      title: atlasSongs.titles[index],
      artist: artists[atlasSongs.artist_indices[index]] || 'Unknown artist',
    }));

    this.songs.forEach((song) => {
      HIERARCHY_LEVELS.forEach((level) => {
        const levelId = hierarchySongs[`${level}_ids`][song.index];
        const node = this.nodeByLevelId.get(`${level}:${levelId}`);
        if (!node) return;
        const indices = this.songIndicesByNode.get(node.id) || [];
        indices.push(song.index);
        this.songIndicesByNode.set(node.id, indices);
      });
    });
  }

  populateSummary() {
    const { summary } = this.payload;
    setText(this.root, '[data-hierarchy-region-count]', formatInteger.format(summary.regions));
    setText(
      this.root,
      '[data-hierarchy-community-count]',
      formatInteger.format(summary.communities),
    );
    setText(
      this.root,
      '[data-hierarchy-neighborhood-count]',
      formatInteger.format(summary.neighborhoods),
    );
    setText(
      this.root,
      '[data-hierarchy-split-count]',
      formatInteger.format(summary.split_communities),
    );
  }

  populateRegions() {
    this.replaceOptions(this.regionSelect, this.regions);
    this.replaceOptions(
      this.communitySelect,
      [],
      'Select a Region first',
    );
    this.replaceOptions(
      this.neighborhoodSelect,
      [],
      'Select a Community first',
    );
  }

  replaceOptions(select, nodes, placeholder = null) {
    select.replaceChildren();
    if (placeholder !== null) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = placeholder;
      select.appendChild(option);
    }
    nodes.forEach((node) => {
      const option = document.createElement('option');
      option.value = node.id;
      option.textContent = `${node.id} · ${node.label} · ${formatInteger.format(node.size)}`;
      select.appendChild(option);
    });
    select.disabled = nodes.length === 0;
  }

  bindControls() {
    this.regionSelect.addEventListener('change', () => {
      const region = this.nodeById.get(this.regionSelect.value);
      if (!region) return;
      this.populateCommunities(region);
      this.selectNode(region.id, { updateSelectors: false });
    });

    this.communitySelect.addEventListener('change', () => {
      const community = this.nodeById.get(this.communitySelect.value);
      if (!community) {
        this.replaceOptions(
          this.neighborhoodSelect,
          [],
          'Select a Community first',
        );
        this.selectNode(this.regionSelect.value, { updateSelectors: false });
        return;
      }
      this.populateNeighborhoods(community);
      this.selectNode(community.id, { updateSelectors: false });
    });

    this.neighborhoodSelect.addEventListener('change', () => {
      const nodeId = this.neighborhoodSelect.value || this.communitySelect.value;
      if (nodeId) this.selectNode(nodeId, { updateSelectors: false });
    });

    this.locateButton.addEventListener('click', () => {
      if (!this.activeNode) return;
      window.dispatchEvent(new CustomEvent('stanlyric:atlas-filter-node', {
        detail: { nodeId: this.activeNode.id, scroll: true },
      }));
    });

    this.catalogPreviousButton.addEventListener('click', () => {
      if (this.catalogPage === 0) return;
      this.catalogPage -= 1;
      this.renderCatalogPage();
    });

    this.catalogNextButton.addEventListener('click', () => {
      const pageCount = Math.ceil(this.activeSongRows.length / this.catalogPageSize);
      if (this.catalogPage >= pageCount - 1) return;
      this.catalogPage += 1;
      this.renderCatalogPage();
    });

    window.addEventListener('stanlyric:hierarchy-focus-node', (event) => {
      if (!event.detail?.nodeId) return;
      this.selectNode(event.detail.nodeId, {
        scroll: Boolean(event.detail.scroll),
      });
    });

    window.addEventListener('stanlyric:atlas-song-selected', (event) => {
      const nodeId = event.detail?.hierarchy?.neighborhood;
      if (nodeId) this.selectNode(nodeId);
    });
  }

  populateCommunities(region, selectedId = '') {
    const communities = this.childrenByParent.get(region.id) || [];
    this.replaceOptions(
      this.communitySelect,
      communities,
      `View all ${levelLabel('community', true).toLowerCase()} in ${region.id}`,
    );
    this.communitySelect.disabled = false;
    this.communitySelect.value = selectedId;
    this.replaceOptions(
      this.neighborhoodSelect,
      [],
      'Select a Community first',
    );
  }

  populateNeighborhoods(community, selectedId = '') {
    const neighborhoods = this.childrenByParent.get(community.id) || [];
    this.replaceOptions(
      this.neighborhoodSelect,
      neighborhoods,
      `View ${community.id} as a whole`,
    );
    this.neighborhoodSelect.disabled = false;
    this.neighborhoodSelect.value = selectedId;
  }

  selectNode(nodeId, { updateSelectors = true, scroll = false } = {}) {
    const node = this.nodeById.get(nodeId);
    if (!node) return;
    if (updateSelectors) this.syncSelectors(node);
    this.activeNode = node;
    this.render(node);
    if (scroll) {
      this.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  syncSelectors(node) {
    const path = this.pathForNode(node);
    const region = path.find((entry) => entry.level === 'region');
    const community = path.find((entry) => entry.level === 'community');
    const neighborhood = path.find((entry) => entry.level === 'neighborhood');
    if (!region) return;

    this.regionSelect.value = region.id;
    this.populateCommunities(region, community?.id || '');
    if (community) {
      this.populateNeighborhoods(community, neighborhood?.id || '');
    }
  }

  pathForNode(node) {
    const path = [node];
    let cursor = node;
    while (cursor.parent) {
      cursor = this.nodeById.get(cursor.parent);
      if (!cursor) break;
      path.unshift(cursor);
    }
    return path;
  }

  render(node) {
    const metrics = node.metrics;
    const accent = nodeColorHex(node);
    this.root.style.setProperty('--hierarchy-accent', accent);
    this.locateButton.style.setProperty('--hierarchy-accent', accent);

    setText(this.root, '[data-hierarchy-node-level]', levelLabel(node.level));
    setText(this.root, '[data-hierarchy-node-id]', node.id);
    setText(this.root, '[data-hierarchy-node-label]', node.label);
    setText(this.root, '[data-hierarchy-size]', formatInteger.format(node.size));
    setText(
      this.root,
      '[data-hierarchy-stability]',
      formatPercent.format(metrics.assignment_stability),
    );
    setText(
      this.root,
      '[data-hierarchy-cohesion]',
      metrics.embedding_cohesion.toFixed(3),
    );
    setText(
      this.root,
      '[data-hierarchy-retention]',
      formatPercent.format(metrics.internal_strength_fraction),
    );
    setText(
      this.root,
      '[data-hierarchy-artists]',
      formatInteger.format(metrics.artist_count),
    );
    setText(
      this.root,
      '[data-hierarchy-diagnostics]',
      `Conductance ${metrics.conductance.toFixed(3)} · cosine silhouette ${metrics.silhouette_estimate.toFixed(3)} · leading artist ${metrics.dominant_artist} at ${formatPercent.format(metrics.dominant_artist_share)} · normalized artist entropy ${metrics.artist_entropy_normalized.toFixed(3)}`,
    );

    this.renderBreadcrumb(this.pathForNode(node));
    this.renderTerms(node.terms);
    this.activeSongRows = this.songRowsForNode(node);
    this.catalogPage = 0;
    this.renderArtists(this.activeSongRows);
    this.renderCatalogPage();
    this.renderSongs(
      '[data-hierarchy-representatives]',
      node.representative_songs,
      (song) => `centroid cosine ${song.centroid_similarity.toFixed(3)}`,
    );
    this.renderSongs(
      '[data-hierarchy-boundaries]',
      node.boundary_songs,
      (song) => (
        `${formatPercent.format(song.external_strength_ratio)} external · `
        + `${song.neighbor_node_count} neighboring ${levelLabel(node.level, true).toLowerCase()}`
      ),
    );
    this.renderChildren(node);
  }

  renderBreadcrumb(path) {
    const host = this.root.querySelector('[data-hierarchy-breadcrumb]');
    host.replaceChildren();
    path.forEach((node, index) => {
      if (index > 0) {
        host.appendChild(element('i', 'fas fa-chevron-right'));
      }
      const button = element('button', 'stanlyric-hierarchy-crumb');
      button.type = 'button';
      button.title = `View ${node.id}: ${node.label}`;
      const dot = element('span', 'stanlyric-hierarchy-dot');
      dot.style.backgroundColor = nodeColorHex(node);
      button.append(
        dot,
        element('span', '', node.id),
        element('strong', '', node.label),
      );
      button.addEventListener('click', () => this.selectNode(node.id));
      host.appendChild(button);
    });
  }

  renderTerms(terms) {
    const host = this.root.querySelector('[data-hierarchy-terms]');
    host.replaceChildren();
    terms.slice(0, 10).forEach((term) => {
      const row = element('div', 'stanlyric-hierarchy-term');
      const word = element('strong', '', term.term);
      const evidence = element(
        'span',
        '',
        `${formatPercent.format(term.prevalence)} prevalence · ${term.lift.toFixed(1)}x lift`,
      );
      row.title = (
        `binary c-TF-IDF ${term.ctfidf.toFixed(5)}; `
        + `distinctiveness ${term.distinctiveness.toFixed(5)}; `
        + `log-odds z ${term.log_odds_z.toFixed(2)}`
      );
      row.append(word, evidence);
      host.appendChild(row);
    });
  }

  songRowsForNode(node) {
    const indices = this.songIndicesByNode.get(node.id) || [];
    const stabilityValues = this.payload.songs[`${node.level}_stability`];
    return indices
      .map((index) => {
        const neighborEvidence = this.neighborEvidence(index, node);
        return {
          ...this.songs[index],
          stability: stabilityValues[index],
          ...neighborEvidence,
        };
      })
      .sort((left, right) => (
        right.localAgreement - left.localAgreement
        || right.meanNeighborStrength - left.meanNeighborStrength
        || right.stability - left.stability
        || left.title.localeCompare(right.title)
        || left.artist.localeCompare(right.artist)
      ));
  }

  neighborEvidence(songIndex, node) {
    const { neighbor_count: neighborCount, songs } = this.atlas;
    const hierarchyIds = this.payload.songs[`${node.level}_ids`];
    let matchingWeight = 0;
    let totalWeight = 0;
    let validNeighbors = 0;
    for (let slot = 0; slot < neighborCount; slot += 1) {
      const offset = songIndex * neighborCount + slot;
      const neighborIndex = songs.neighbor_indices[offset];
      const weight = songs.neighbor_weights[offset];
      if (neighborIndex < 0 || !Number.isFinite(weight)) continue;
      validNeighbors += 1;
      totalWeight += weight;
      if (hierarchyIds[neighborIndex] === node.level_id) {
        matchingWeight += weight;
      }
    }
    return {
      localAgreement: totalWeight > 0 ? matchingWeight / totalWeight : 0,
      meanNeighborStrength: validNeighbors > 0
        ? totalWeight / (validNeighbors * 1000)
        : 0,
    };
  }

  renderArtists(songRows) {
    const host = this.root.querySelector('[data-hierarchy-artists-list]');
    host.replaceChildren();
    const counts = new Map();
    songRows.forEach((song) => {
      counts.set(song.artist, (counts.get(song.artist) || 0) + 1);
    });
    [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 10)
      .forEach(([artist, count], index) => {
        const row = element('div', 'stanlyric-hierarchy-artist');
        row.append(
          element('span', 'stanlyric-hierarchy-artist-rank', String(index + 1)),
          element('strong', '', artist),
          element(
            'span',
            'stanlyric-hierarchy-artist-evidence',
            `${formatInteger.format(count)} songs · ${formatPercent.format(count / songRows.length)}`,
          ),
        );
        host.appendChild(row);
      });
  }

  renderCatalogPage() {
    const host = this.root.querySelector('[data-hierarchy-song-catalog]');
    const heading = this.root.querySelector('[data-hierarchy-song-catalog-heading]');
    const range = this.root.querySelector('[data-hierarchy-song-range]');
    const pageCount = Math.max(
      Math.ceil(this.activeSongRows.length / this.catalogPageSize),
      1,
    );
    this.catalogPage = Math.min(this.catalogPage, pageCount - 1);
    const start = this.catalogPage * this.catalogPageSize;
    const visibleSongs = this.activeSongRows.slice(start, start + this.catalogPageSize);
    const end = start + visibleSongs.length;

    heading.textContent = `Songs in ${this.activeNode.id}`;
    range.textContent = this.activeSongRows.length
      ? `${formatInteger.format(start + 1)}–${formatInteger.format(end)} of ${formatInteger.format(this.activeSongRows.length)}`
      : 'No songs';
    this.catalogPreviousButton.disabled = this.catalogPage === 0;
    this.catalogNextButton.disabled = this.catalogPage >= pageCount - 1;
    host.replaceChildren();

    visibleSongs.forEach((song, index) => {
      const button = element('button', 'stanlyric-hierarchy-catalog-song');
      button.type = 'button';
      button.title = `Locate ${song.title} in the 3D atlas`;
      const rank = element(
        'span',
        'stanlyric-hierarchy-catalog-rank',
        String(start + index + 1).padStart(2, '0'),
      );
      const identity = element('span', 'stanlyric-hierarchy-catalog-identity');
      identity.append(
        element('strong', '', song.title),
        element('span', '', song.artist),
      );
      const evidence = element(
        'small',
        '',
        `${formatPercent.format(song.localAgreement)} local · `
        + `${formatPercent.format(song.meanNeighborStrength)} edge strength · `
        + `${formatPercent.format(song.stability)} stable`,
      );
      const icon = element('i', 'fas fa-crosshairs');
      button.append(rank, identity, evidence, icon);
      button.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('stanlyric:atlas-select-song', {
          detail: { docId: song.docId, scroll: true },
        }));
      });
      host.appendChild(button);
    });
  }

  renderSongs(selector, songs, detailFormatter) {
    const host = this.root.querySelector(selector);
    host.replaceChildren();
    songs.slice(0, 5).forEach((song) => {
      const row = element('li', 'stanlyric-hierarchy-song');
      const button = element('button', 'stanlyric-hierarchy-song-button');
      button.type = 'button';
      button.title = `Locate ${song.title} in the 3D atlas`;
      const identity = element('span', 'stanlyric-hierarchy-song-identity');
      identity.append(
        element('strong', '', song.title),
        element('span', '', song.artist),
      );
      const detail = element('small', '', detailFormatter(song));
      const icon = element('i', 'fas fa-crosshairs');
      button.append(identity, detail, icon);
      button.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('stanlyric:atlas-select-song', {
          detail: { docId: song.doc_id, scroll: true },
        }));
      });
      row.appendChild(button);
      host.appendChild(row);
    });
  }

  renderChildren(node) {
    const host = this.root.querySelector('[data-hierarchy-children]');
    const heading = this.root.querySelector('[data-hierarchy-children-heading]');
    const children = this.childrenByParent.get(node.id) || [];
    host.replaceChildren();
    if (!children.length) {
      heading.textContent = 'Terminal neighborhood';
      host.appendChild(element(
        'p',
        'stanlyric-hierarchy-terminal',
        'This is the finest accepted partition. Further splitting did not pass the configured stability and semantic-coherence gates.',
      ));
      return;
    }

    const childLevel = children[0].level;
    heading.textContent = `${levelLabel(childLevel, true)} inside ${node.id}`;
    children.forEach((child) => {
      const button = element('button', 'stanlyric-hierarchy-child');
      button.type = 'button';
      const dot = element('span', 'stanlyric-hierarchy-dot');
      dot.style.backgroundColor = nodeColorHex(child);
      const identity = element('span', 'stanlyric-hierarchy-child-identity');
      identity.append(
        element('strong', '', `${child.id} · ${child.label}`),
        element(
          'small',
          '',
          `${formatInteger.format(child.size)} songs · ${formatPercent.format(child.metrics.assignment_stability)} stable`,
        ),
      );
      const icon = element('i', 'fas fa-chevron-right');
      button.append(dot, identity, icon);
      button.addEventListener('click', () => this.selectNode(child.id));
      host.appendChild(button);
    });
  }
}

document.querySelectorAll('[data-stanlyric-hierarchy]').forEach((root) => {
  const explorer = new StanLyricHierarchyExplorer(root);
  explorer.init();
});
