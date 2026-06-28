import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function communityColor(communityId, communityRankById) {
  const rank = communityRankById.get(communityId) || communityId + 1;
  return new THREE.Color(COMMUNITY_COLORS[(rank - 1) % COMMUNITY_COLORS.length]);
}

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) element.textContent = value;
}

function normalizedText(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), wait);
  };
}

class StanLyricEmbeddingAtlas {
  constructor(root) {
    this.root = root;
    this.canvasHost = root.querySelector('[data-atlas-canvas]');
    this.status = root.querySelector('[data-atlas-status]');
    this.tooltip = root.querySelector('[data-atlas-tooltip]');
    this.details = root.querySelector('[data-atlas-details]');
    this.searchInput = root.querySelector('[data-atlas-search]');
    this.suggestions = root.querySelector('[data-atlas-suggestions]');
    this.communitySelect = root.querySelector('[data-atlas-community]');
    this.resetButton = root.querySelector('[data-atlas-reset]');
    this.rotateButton = root.querySelector('[data-atlas-rotate]');
    this.fullscreenButton = root.querySelector('[data-atlas-fullscreen]');
    this.closeDetailsButton = root.querySelector('[data-atlas-close-details]');

    this.payload = null;
    this.positions = null;
    this.baseColors = null;
    this.points = null;
    this.hoveredIndex = -1;
    this.selectedIndex = -1;
    this.communityFilter = 'all';
    this.pointer = new THREE.Vector2(2, 2);
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 1.45;
    this.renderRequested = true;
    this.searchRows = [];
    this.communityRankById = new Map();
    this.communityById = new Map();
  }

  async init() {
    try {
      const response = await fetch(this.root.dataset.atlasUrl, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`Atlas data request failed with HTTP ${response.status}.`);
      }
      this.payload = await response.json();
      this.validatePayload();
      this.prepareData();
      this.buildScene();
      this.bindControls();
      this.populateInterface();
      this.setReady();
    } catch (error) {
      console.error(error);
      this.status.textContent = 'The song atlas could not be loaded.';
      this.status.classList.add('is-error');
    }
  }

  validatePayload() {
    const songs = this.payload?.songs;
    const songCount = this.payload?.corpus?.songs;
    if (
      this.payload?.schema_version !== 1
      || !songs
      || songs.titles?.length !== songCount
      || songs.coordinates?.length !== songCount * 3
    ) {
      throw new Error('Unrecognized or incomplete StanLyric atlas payload.');
    }
  }

  prepareData() {
    const { songs, artists, projection, communities } = this.payload;
    const songCount = this.payload.corpus.songs;
    const quantization = projection.coordinate_encoding.quantization;
    const extent = projection.coordinate_encoding.display_extent;

    this.positions = new Float32Array(songCount * 3);
    for (let i = 0; i < this.positions.length; i += 1) {
      this.positions[i] = (songs.coordinates[i] / quantization) * extent;
    }

    communities.forEach((community) => {
      this.communityRankById.set(community.id, community.rank);
      this.communityById.set(community.id, community);
    });

    this.baseColors = new Float32Array(songCount * 3);
    for (let index = 0; index < songCount; index += 1) {
      const color = communityColor(
        songs.community_ids[index],
        this.communityRankById,
      );
      color.toArray(this.baseColors, index * 3);
    }

    this.searchRows = songs.titles.map((title, index) => {
      const artist = artists[songs.artist_indices[index]] || '';
      return {
        index,
        title,
        artist,
        normalizedTitle: normalizedText(title),
        normalizedArtist: normalizedText(artist),
        searchText: normalizedText(`${title} ${artist}`),
      };
    });
  }

  buildScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#07090d');
    this.scene.fog = new THREE.FogExp2('#07090d', 0.0022);

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1000);
    this.camera.position.set(0, 18, 235);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvasHost.appendChild(this.renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(this.baseColors), 3),
    );
    geometry.computeBoundingSphere();

    const material = new THREE.PointsMaterial({
      size: 0.88,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    this.selectedMarker = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 20, 14),
      new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false }),
    );
    this.selectedMarker.visible = false;
    this.selectedMarker.renderOrder = 5;
    this.scene.add(this.selectedMarker);

    this.neighborGeometry = new THREE.BufferGeometry();
    this.neighborMarkers = new THREE.Points(
      this.neighborGeometry,
      new THREE.PointsMaterial({
        color: '#ffffff',
        size: 2.4,
        sizeAttenuation: true,
        depthTest: false,
      }),
    );
    this.neighborMarkers.renderOrder = 4;
    this.scene.add(this.neighborMarkers);

    this.neighborLineGeometry = new THREE.BufferGeometry();
    this.neighborLines = new THREE.LineSegments(
      this.neighborLineGeometry,
      new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.38,
        depthTest: false,
      }),
    );
    this.neighborLines.renderOrder = 3;
    this.scene.add(this.neighborLines);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.75;
    this.controls.panSpeed = 0.55;
    this.controls.minDistance = 16;
    this.controls.maxDistance = 430;
    this.controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.controls.autoRotateSpeed = 0.32;
    this.controls.saveState();
    this.controls.addEventListener('change', () => {
      this.renderRequested = true;
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvasHost);
    this.resize();
    this.renderer.setAnimationLoop(() => this.render());
  }

  bindControls() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', (event) => this.onPointerMove(event));
    canvas.addEventListener('pointerleave', () => this.clearHover());
    canvas.addEventListener('click', () => {
      if (this.hoveredIndex >= 0) this.selectSong(this.hoveredIndex, false);
    });

    this.searchInput.addEventListener(
      'input',
      debounce(() => this.showSearchSuggestions(), 90),
    );
    this.searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const match = this.searchMatches()[0];
        if (match) this.selectSong(match.index, true);
      }
      if (event.key === 'Escape') this.hideSuggestions();
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.stanlyric-atlas-search')) this.hideSuggestions();
    });

    this.communitySelect.addEventListener('change', () => {
      this.communityFilter = this.communitySelect.value;
      this.applyCommunityFilter();
    });
    this.resetButton.addEventListener('click', () => this.resetView());
    this.rotateButton.addEventListener('click', () => this.toggleRotation());
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    this.closeDetailsButton.addEventListener('click', () => this.clearSelection());
    document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
  }

  populateInterface() {
    const { corpus, projection, communities } = this.payload;
    setText(this.root, '[data-atlas-song-count]', formatInteger.format(corpus.songs));
    setText(
      this.root,
      '[data-atlas-community-count]',
      formatInteger.format(corpus.communities),
    );
    setText(
      this.root,
      '[data-atlas-trustworthiness]',
      projection.diagnostics.trustworthiness.toFixed(3),
    );
    setText(
      this.root,
      '[data-atlas-pca-variance]',
      formatPercent.format(
        projection.diagnostics.pca_cumulative_explained_variance_ratio,
      ),
    );

    communities
      .slice()
      .sort((left, right) => left.rank - right.rank)
      .forEach((community) => {
        const option = document.createElement('option');
        option.value = String(community.id);
        option.textContent = `Community ${community.rank} (${formatInteger.format(
          community.size,
        )})`;
        this.communitySelect.appendChild(option);
      });

    this.rotateButton.setAttribute(
      'aria-pressed',
      String(this.controls.autoRotate),
    );
    this.updateRotationButton();
  }

  setReady() {
    this.status.hidden = true;
    this.root.classList.add('is-ready');
    this.renderRequested = true;
  }

  resize() {
    const width = Math.max(this.canvasHost.clientWidth, 1);
    const height = Math.max(this.canvasHost.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderRequested = true;
  }

  render() {
    const controlsChanged = this.controls.update();
    if (controlsChanged || this.controls.autoRotate || this.renderRequested) {
      this.renderer.render(this.scene, this.camera);
      this.renderRequested = false;
    }
  }

  onPointerMove(event) {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersections = this.raycaster.intersectObject(this.points, false);
    const hit = intersections.find((intersection) => this.isPointActive(intersection.index));
    if (!hit) {
      this.clearHover();
      return;
    }

    this.hoveredIndex = hit.index;
    const song = this.songAt(hit.index);
    setText(this.tooltip, '[data-tooltip-title]', song.title);
    setText(this.tooltip, '[data-tooltip-artist]', song.artist);
    setText(
      this.tooltip,
      '[data-tooltip-community]',
      `Community ${song.community.rank}`,
    );
    const stageBounds = this.root.querySelector('.stanlyric-atlas-stage').getBoundingClientRect();
    const tooltipWidth = this.tooltip.offsetWidth || 220;
    const x = Math.min(
      Math.max(event.clientX - stageBounds.left + 14, 8),
      stageBounds.width - tooltipWidth - 8,
    );
    const y = Math.min(
      Math.max(event.clientY - stageBounds.top + 14, 8),
      stageBounds.height - 92,
    );
    this.tooltip.style.transform = `translate(${x}px, ${y}px)`;
    this.tooltip.hidden = false;
    this.renderer.domElement.style.cursor = 'pointer';
  }

  clearHover() {
    this.hoveredIndex = -1;
    this.tooltip.hidden = true;
    if (this.renderer) this.renderer.domElement.style.cursor = 'grab';
  }

  isPointActive(index) {
    return (
      this.communityFilter === 'all'
      || String(this.payload.songs.community_ids[index]) === this.communityFilter
    );
  }

  songAt(index) {
    const songs = this.payload.songs;
    const communityId = songs.community_ids[index];
    return {
      index,
      docId: songs.doc_ids[index],
      title: songs.titles[index],
      artist: this.payload.artists[songs.artist_indices[index]] || 'Unknown artist',
      communityId,
      community: this.communityById.get(communityId),
    };
  }

  selectSong(index, focusCamera) {
    this.selectedIndex = index;
    const song = this.songAt(index);
    const position = new THREE.Vector3().fromArray(this.positions, index * 3);
    this.selectedMarker.position.copy(position);
    this.selectedMarker.visible = true;
    this.updateNeighborGeometry(index, position);
    this.updateDetails(song);
    this.details.hidden = false;
    this.hideSuggestions();
    this.searchInput.value = `${song.title} - ${song.artist}`;

    if (focusCamera) {
      const direction = this.camera.position.clone().sub(this.controls.target).normalize();
      this.controls.target.copy(position);
      this.camera.position.copy(position).add(direction.multiplyScalar(46));
      this.controls.update();
    }
    this.renderRequested = true;
  }

  updateNeighborGeometry(index, selectedPosition) {
    const count = this.payload.neighbor_count;
    const neighborIndices = this.payload.songs.neighbor_indices;
    const markerPositions = [];
    const linePositions = [];
    for (let slot = 0; slot < count; slot += 1) {
      const neighborIndex = neighborIndices[index * count + slot];
      if (neighborIndex < 0) continue;
      const neighborPosition = new THREE.Vector3().fromArray(
        this.positions,
        neighborIndex * 3,
      );
      markerPositions.push(neighborPosition.x, neighborPosition.y, neighborPosition.z);
      linePositions.push(
        selectedPosition.x,
        selectedPosition.y,
        selectedPosition.z,
        neighborPosition.x,
        neighborPosition.y,
        neighborPosition.z,
      );
    }
    this.neighborGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(markerPositions, 3),
    );
    this.neighborLineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3),
    );
  }

  updateDetails(song) {
    setText(this.details, '[data-detail-title]', song.title);
    setText(this.details, '[data-detail-artist]', song.artist);
    setText(this.details, '[data-detail-doc-id]', song.docId);
    setText(
      this.details,
      '[data-detail-community]',
      `Community ${song.community.rank}`,
    );
    setText(
      this.details,
      '[data-detail-community-size]',
      `${formatInteger.format(song.community.size)} songs`,
    );

    const swatch = this.details.querySelector('[data-detail-swatch]');
    swatch.style.backgroundColor = `#${communityColor(
      song.communityId,
      this.communityRankById,
    ).getHexString()}`;

    const neighborList = this.details.querySelector('[data-detail-neighbors]');
    neighborList.replaceChildren();
    const count = this.payload.neighbor_count;
    for (let slot = 0; slot < count; slot += 1) {
      const offset = song.index * count + slot;
      const neighborIndex = this.payload.songs.neighbor_indices[offset];
      if (neighborIndex < 0) continue;
      const neighbor = this.songAt(neighborIndex);
      const weight = this.payload.songs.neighbor_weights[offset] / 1000;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'stanlyric-atlas-neighbor';
      button.addEventListener('click', () => this.selectSong(neighborIndex, true));

      const identity = document.createElement('span');
      identity.className = 'stanlyric-atlas-neighbor-identity';
      const title = document.createElement('strong');
      title.textContent = neighbor.title;
      const artist = document.createElement('small');
      artist.textContent = neighbor.artist;
      identity.append(title, artist);

      const score = document.createElement('span');
      score.className = 'stanlyric-atlas-neighbor-score';
      score.textContent = weight.toFixed(2);
      button.append(identity, score);
      neighborList.appendChild(button);
    }
  }

  clearSelection() {
    this.selectedIndex = -1;
    this.selectedMarker.visible = false;
    this.neighborGeometry.deleteAttribute('position');
    this.neighborLineGeometry.deleteAttribute('position');
    this.details.hidden = true;
    this.renderRequested = true;
  }

  searchMatches() {
    const query = normalizedText(this.searchInput.value);
    if (query.length < 2) return [];
    const matches = [];
    for (const row of this.searchRows) {
      if (row.searchText.includes(query)) {
        matches.push(row);
      }
    }
    return matches
      .sort((left, right) => {
        const leftScore = this.searchScore(left, query);
        const rightScore = this.searchScore(right, query);
        return (
          leftScore - rightScore
          || left.title.length - right.title.length
          || left.title.localeCompare(right.title)
        );
      })
      .slice(0, 8);
  }

  searchScore(row, query) {
    if (row.normalizedTitle === query) return 0;
    if (row.normalizedTitle.startsWith(query)) return 1;
    if (row.normalizedArtist === query) return 2;
    if (row.normalizedArtist.startsWith(query)) return 3;
    if (row.normalizedTitle.includes(query)) return 4;
    return 5;
  }

  showSearchSuggestions() {
    const matches = this.searchMatches();
    this.suggestions.replaceChildren();
    if (!matches.length) {
      this.hideSuggestions();
      return;
    }
    matches.forEach((match) => {
      const button = document.createElement('button');
      button.type = 'button';
      const title = document.createElement('strong');
      title.textContent = match.title;
      const artist = document.createElement('span');
      artist.textContent = match.artist;
      button.append(title, artist);
      button.addEventListener('click', () => this.selectSong(match.index, true));
      this.suggestions.appendChild(button);
    });
    this.suggestions.hidden = false;
  }

  hideSuggestions() {
    this.suggestions.hidden = true;
  }

  applyCommunityFilter() {
    const colors = this.points.geometry.getAttribute('color');
    const muted = new THREE.Color('#171c26');
    for (let index = 0; index < this.payload.corpus.songs; index += 1) {
      if (this.isPointActive(index)) {
        colors.setXYZ(
          index,
          this.baseColors[index * 3],
          this.baseColors[index * 3 + 1],
          this.baseColors[index * 3 + 2],
        );
      } else {
        colors.setXYZ(index, muted.r, muted.g, muted.b);
      }
    }
    colors.needsUpdate = true;
    this.clearHover();
    this.renderRequested = true;
  }

  resetView() {
    this.communityFilter = 'all';
    this.communitySelect.value = 'all';
    this.searchInput.value = '';
    this.applyCommunityFilter();
    this.clearSelection();
    this.controls.reset();
    this.renderRequested = true;
  }

  toggleRotation() {
    this.controls.autoRotate = !this.controls.autoRotate;
    this.rotateButton.setAttribute(
      'aria-pressed',
      String(this.controls.autoRotate),
    );
    this.updateRotationButton();
    this.renderRequested = true;
  }

  updateRotationButton() {
    const icon = this.rotateButton.querySelector('i');
    icon.className = this.controls.autoRotate ? 'fas fa-pause' : 'fas fa-play';
    this.rotateButton.title = this.controls.autoRotate
      ? 'Pause rotation'
      : 'Resume rotation';
    this.rotateButton.setAttribute('aria-label', this.rotateButton.title);
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement === this.root) {
        await document.exitFullscreen();
      } else {
        await this.root.requestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen is unavailable.', error);
    }
  }

  updateFullscreenButton() {
    const active = document.fullscreenElement === this.root;
    const icon = this.fullscreenButton.querySelector('i');
    icon.className = active ? 'fas fa-compress' : 'fas fa-expand';
    this.fullscreenButton.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
    this.fullscreenButton.setAttribute('aria-label', this.fullscreenButton.title);
    window.setTimeout(() => this.resize(), 0);
  }
}

document.querySelectorAll('[data-stanlyric-atlas]').forEach((root) => {
  const atlas = new StanLyricEmbeddingAtlas(root);
  atlas.init();
});
