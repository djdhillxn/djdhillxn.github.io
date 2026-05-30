(function () {
  "use strict";

  const { esc, registerSection } = window.SpotifyDashboard;

  registerSection({
    name: "missing-liked-songs",
    render() {
      return `
        <section class="spotify-panel" data-missing-panel>
          <h3 class="spotify-panel-title">Recommendations to enhance the playlists with adding songs that I have liked but are not part of any specific playlist.</h3>
          <div class="spotify-panel-subtitle">These are saved songs that do not appear in any named playlist. Suggestions use artist overlap with existing playlists(using jaccard similarity).</div>
          <div class="spotify-controls"><input class="spotify-search" data-missing-search placeholder="Search song, artist, album, or suggested playlist..."></div>
          <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Track</th><th>Artist</th><th>Album</th><th>Suggested playlist</th><th>Saved</th><th></th></tr></thead><tbody data-missing-body></tbody></table></div>
        </section>`;
    },
    update(root, data) {
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
  });
})();
