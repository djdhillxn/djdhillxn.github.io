(function () {
  "use strict";

  const fmt = new Intl.NumberFormat("en-US");
  const pct = (value) => `${Math.round((Number(value || 0)) * 100)}%`;
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));

  function statCard(label, value) {
    return `<div class="spotify-stat-card"><div class="spotify-stat-label">${esc(label)}</div><div class="spotify-stat-value">${esc(value)}</div></div>`;
  }

  function barList(items, metricKey, labelKey = "artist_name", valueFormatter = fmt.format, limit = 12) {
    const sliced = (items || []).slice(0, limit);
    const maxValue = Math.max(...sliced.map((d) => Number(d[metricKey] || 0)), 1);
    return `<div class="spotify-bar-list">${sliced.map((item) => {
      const value = Number(item[metricKey] || 0);
      const width = Math.max(2, (value / maxValue) * 100);
      const link = item.spotify_url ? `<a class="spotify-bar-label spotify-link" href="${esc(item.spotify_url)}" target="_blank" rel="noopener">${esc(item[labelKey])}</a>` : `<div class="spotify-bar-label">${esc(item[labelKey])}</div>`;
      return `<div class="spotify-bar-row">${link}<div class="spotify-bar-track" aria-hidden="true"><div class="spotify-bar-fill" style="width:${width}%"></div></div><div class="spotify-bar-value">${esc(valueFormatter(value))}</div></div>`;
    }).join("")}</div>`;
  }

  function renderArtistLandscape(data) {
    return `
      <div class="spotify-grid-two">
        <section class="spotify-panel">
          <h3 class="spotify-panel-title">Top artists across playlists</h3>
          <div class="spotify-panel-subtitle">Ranked by unique tracks represented in your named playlists.</div>
          ${barList(data.overall_playlist_top_artists, "unique_track_count", "artist_name", (v) => `${fmt.format(v)} songs`)}
        </section>
        <section class="spotify-panel">
          <h3 class="spotify-panel-title">Top artists in liked songs</h3>
          <div class="spotify-panel-subtitle">Ranked by songs saved in your Spotify library.</div>
          ${barList(data.liked_top_artists, "unique_track_count", "artist_name", (v) => `${fmt.format(v)} liked`)}
        </section>
      </div>`;
  }

  function renderPlaylistExplorer(data) {
    const playlists = data.playlists || [];
    if (!playlists.length) return "";
    const options = playlists.map((p, i) => `<option value="${i}">${esc(p.name)} (${fmt.format(p.total_tracks || 0)} tracks)</option>`).join("");
    return `
      <section class="spotify-panel" data-playlist-panel>
        <h3 class="spotify-panel-title">Playlist explorer</h3>
        <div class="spotify-panel-subtitle">Select a playlist to see which artists dominate it.</div>
        <div class="spotify-controls"><select class="spotify-select" data-playlist-select>${options}</select></div>
        <div data-playlist-output></div>
      </section>`;
  }

  function updatePlaylistExplorer(root, data) {
    const select = root.querySelector("[data-playlist-select]");
    const output = root.querySelector("[data-playlist-output]");
    if (!select || !output) return;
    const playlists = data.playlists || [];
    const render = () => {
      const playlist = playlists[Number(select.value || 0)];
      if (!playlist) return;
      output.innerHTML = `
        <div class="spotify-stat-grid">
          ${statCard("Tracks", fmt.format(playlist.total_tracks || 0))}
          ${statCard("Unique artists", fmt.format(playlist.unique_artists || 0))}
          ${statCard("Unique tracks", fmt.format(playlist.unique_tracks || 0))}
        </div>
        ${barList(playlist.top_artists || [], "playlist_appearances", "artist_name", (v) => `${fmt.format(v)} appearances`, 10)}`;
    };
    select.addEventListener("change", render);
    render();
  }

  function renderMissingLikedSongs(data) {
    const rows = data.liked_songs_missing_from_playlists || [];
    return `
      <section class="spotify-panel" data-missing-panel>
        <h3 class="spotify-panel-title">Liked songs missing from playlists</h3>
        <div class="spotify-panel-subtitle">These are saved songs that do not appear in any named playlist. Suggestions use artist overlap with existing playlists.</div>
        <div class="spotify-controls"><input class="spotify-search" data-missing-search placeholder="Search song, artist, album, or suggested playlist..."></div>
        <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Track</th><th>Artist</th><th>Album</th><th>Suggested playlist</th><th>Saved</th><th></th></tr></thead><tbody data-missing-body></tbody></table></div>
      </section>`;
  }

  function updateMissingLikedSongs(root, data) {
    const input = root.querySelector("[data-missing-search]");
    const body = root.querySelector("[data-missing-body]");
    const rows = data.liked_songs_missing_from_playlists || [];
    if (!input || !body) return;
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const filtered = rows.filter((row) => {
        const suggestion = row.best_suggested_playlist?.playlist_name || "";
        const hay = [row.track_name, row.primary_artist_name, row.album_name, suggestion].join(" ").toLowerCase();
        return !q || hay.includes(q);
      }).slice(0, 60);
      body.innerHTML = filtered.map((row) => {
        const suggested = row.best_suggested_playlist;
        const saved = row.added_at ? row.added_at.slice(0, 10) : "—";
        const track = row.spotify_url ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">${esc(row.track_name)}</a>` : esc(row.track_name);
        return `<tr><td>${track}</td><td>${esc(row.primary_artist_name)}</td><td>${esc(row.album_name || "—")}</td><td>${suggested ? `<span class="spotify-pill">${esc(suggested.playlist_name)}</span><div class="spotify-muted">${esc(suggested.reason || "artist overlap")}</div>` : `<span class="spotify-muted">No obvious match yet</span>`}</td><td>${esc(saved)}</td><td>${row.spotify_url ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">Open</a>` : ""}</td></tr>`;
      }).join("") || `<tr><td colspan="6" class="spotify-muted">No matching rows.</td></tr>`;
    };
    input.addEventListener("input", render);
    render();
  }

  function renderDiversityAndOverlap(data) {
    const diversity = (data.playlist_diversity || []).slice(0, 8);
    const overlap = (data.playlist_overlap || []).slice(0, 8);
    return `
      <div class="spotify-grid-two">
        <section class="spotify-panel">
          <h3 class="spotify-panel-title">Most artist-diverse playlists</h3>
          <div class="spotify-panel-subtitle">Higher entropy means tracks are distributed across more artists.</div>
          ${barList(diversity, "normalized_artist_entropy", "name", (v) => Number(v).toFixed(2), 8)}
        </section>
        <section class="spotify-panel">
          <h3 class="spotify-panel-title">Closest playlist pairs</h3>
          <div class="spotify-panel-subtitle">Based on shared songs and shared artists.</div>
          <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Playlists</th><th>Shared tracks</th><th>Artist overlap</th></tr></thead><tbody>
            ${overlap.map((row) => `<tr><td>${esc(row.playlist_a_name)} ↔ ${esc(row.playlist_b_name)}</td><td>${fmt.format(row.shared_tracks || 0)}</td><td>${pct(row.artist_jaccard)}</td></tr>`).join("") || `<tr><td colspan="3" class="spotify-muted">No overlap data yet.</td></tr>`}
          </tbody></table></div>
        </section>
      </div>`;
  }

  function renderTopItems(data) {
    const top = data.spotify_top_items || {};
    const artists = top.artists || {};
    const longTerm = artists.long_term || [];
    const tracks = (top.tracks || {}).long_term || [];
    if (!longTerm.length && !tracks.length) return "";
    return `
      <div class="spotify-grid-two">
        <section class="spotify-panel">
          <h3 class="spotify-panel-title">Spotify affinity: long-term artists</h3>
          <div class="spotify-panel-subtitle">Spotify's calculated top artists, separate from playlist counts.</div>
          ${barList(longTerm, "rank", "artist_name", (v) => `rank ${fmt.format(v)}`, 10)}
        </section>
        <section class="spotify-panel">
          <h3 class="spotify-panel-title">Spotify affinity: long-term tracks</h3>
          <div class="spotify-panel-subtitle">Spotify's calculated top tracks, shown as a sanity check against curated data.</div>
          <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>#</th><th>Track</th><th>Artist</th></tr></thead><tbody>
            ${tracks.slice(0, 10).map((row) => `<tr><td>${row.rank}</td><td>${row.spotify_url ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">${esc(row.track_name)}</a>` : esc(row.track_name)}</td><td>${esc(row.primary_artist_name)}</td></tr>`).join("")}
          </tbody></table></div>
        </section>
      </div>`;
  }

  function renderDashboard(root, data) {
    const summary = data.summary || {};
    const generated = data.generated_at ? new Date(data.generated_at).toLocaleString() : "unknown";
    root.innerHTML = `
      <section class="spotify-hero">
        <div class="spotify-kicker">Spotify Library Intelligence</div>
        <div class="spotify-title">What I curate, what I save, and what I forgot to organize.</div>
        <div class="spotify-subtitle">This dashboard analyzes playlists and liked songs from the Spotify Web API. It measures artist dominance, playlist diversity, overlap, and saved songs that are missing from named playlists.</div>
        <div class="spotify-updated">Generated: ${esc(generated)}</div>
      </section>
      <div class="spotify-stat-grid">
        ${statCard("Playlists", fmt.format(summary.playlist_count || 0))}
        ${statCard("Liked songs", fmt.format(summary.liked_track_count || 0))}
        ${statCard("Playlist coverage", pct(summary.coverage_rate || 0))}
        ${statCard("Missing liked songs", fmt.format(summary.liked_tracks_missing_from_playlists || 0))}
        ${statCard("Playlist artists", fmt.format(summary.unique_artists_playlists || 0))}
        ${statCard("Liked artists", fmt.format(summary.unique_artists_liked || 0))}
      </div>
      ${renderArtistLandscape(data)}
      ${renderPlaylistExplorer(data)}
      ${renderMissingLikedSongs(data)}
      ${renderDiversityAndOverlap(data)}
      ${renderTopItems(data)}
    `;
    updatePlaylistExplorer(root, data);
    updateMissingLikedSongs(root, data);
  }

  async function init() {
    const roots = document.querySelectorAll("[data-spotify-dashboard]");
    for (const root of roots) {
      const url = root.getAttribute("data-dashboard-url");
      if (!url) continue;
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        renderDashboard(root, data);
      } catch (error) {
        root.innerHTML = `<div class="spotify-error"><strong>Could not load Spotify dashboard data.</strong><br><span class="spotify-muted">${esc(error.message)}. Make sure assets/json/spotify/dashboard_data.json exists.</span></div>`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
