(function () {
  "use strict";

  const { barList, esc, fmt, pct, registerSection } = window.SpotifyDashboard;

  registerSection({
    name: "diversity-and-overlap",
    render(data) {
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
  });

  registerSection({
    name: "top-items",
    render(data) {
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
  });
})();
