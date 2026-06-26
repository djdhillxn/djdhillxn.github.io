(function () {
  "use strict";

  const { esc, fmt, registerSection } = window.SpotifyDashboard;

  function uniqueSuggestedPlaylists(rows) {
    const seen = new Map();
    (rows || []).forEach((row) => {
      const suggestion = row.best_suggested_playlist;
      if (!suggestion?.playlist_id || seen.has(suggestion.playlist_id)) return;
      seen.set(suggestion.playlist_id, suggestion.playlist_name || "Unnamed playlist");
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }

  function formatDate(value) {
    return value ? String(value).slice(0, 10) : "—";
  }

  function durationLabel(ms) {
    const seconds = Math.round(Number(ms || 0) / 1000);
    if (!seconds) return "—";
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function csvEscape(value) {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  function downloadCsv(rows) {
    const header = ["track_name", "artist", "album", "saved_at", "suggested_playlist", "reason", "spotify_url"];
    const body = rows.map((row) => {
      const suggestion = row.best_suggested_playlist || {};
      return [
        row.track_name,
        row.primary_artist_name,
        row.album_name,
        formatDate(row.added_at),
        suggestion.playlist_name || "",
        suggestion.reason || "",
        row.spotify_url || ""
      ].map(csvEscape).join(",");
    });
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "spotify_missing_liked_songs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  registerSection({
    name: "missing-liked-songs",
    render(data) {
      const rows = data.liked_songs_missing_from_playlists || [];
      const playlistOptions = uniqueSuggestedPlaylists(rows).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join("");
      return `
        <section class="spotify-panel spotify-panel-accent spotify-panel-recommendations" data-missing-panel>
          <h3 class="spotify-panel-title">Recommendations to enhance the playlists with adding songs that I have liked but are not part of any specific playlist.</h3>
          <div class="spotify-panel-subtitle">These are saved songs that do not appear in any named playlist. Suggestions use artist overlap with existing playlists. The filters below make it easier to use this as a real playlist-cleanup tool.</div>
          <div class="spotify-stat-grid" data-missing-stats></div>
          <div class="spotify-controls spotify-controls-rich">
            <input class="spotify-search" data-missing-search placeholder="Search song, artist, album, or suggested playlist...">
            <select class="spotify-select" data-missing-playlist>
              <option value="">All suggested playlists</option>
              ${playlistOptions}
            </select>
            <select class="spotify-select" data-missing-sort>
              <option value="score">Strongest match first</option>
              <option value="recent">Recently saved first</option>
              <option value="oldest">Oldest saved first</option>
              <option value="artist">Artist A-Z</option>
            </select>
            <button class="spotify-button" type="button" data-missing-download>Download filtered CSV</button>
          </div>
          <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Track</th><th>Artist</th><th>Album</th><th>Suggested playlist</th><th>Saved</th><th>Length</th><th></th></tr></thead><tbody data-missing-body></tbody></table></div>
        </section>`;
    },
    update(root, data) {
      const input = root.querySelector("[data-missing-search]");
      const playlistFilter = root.querySelector("[data-missing-playlist]");
      const sortSelect = root.querySelector("[data-missing-sort]");
      const downloadButton = root.querySelector("[data-missing-download]");
      const body = root.querySelector("[data-missing-body]");
      const stats = root.querySelector("[data-missing-stats]");
      const rows = data.liked_songs_missing_from_playlists || [];
      let currentFiltered = [];
      if (!input || !playlistFilter || !sortSelect || !body || !stats || !downloadButton) return;

      const render = () => {
        const q = input.value.trim().toLowerCase();
        const playlistId = playlistFilter.value;
        currentFiltered = rows.filter((row) => {
          const suggestion = row.best_suggested_playlist || {};
          const hay = [row.track_name, row.primary_artist_name, row.album_name, suggestion.playlist_name].join(" ").toLowerCase();
          const matchesSearch = !q || hay.includes(q);
          const matchesPlaylist = !playlistId || suggestion.playlist_id === playlistId;
          return matchesSearch && matchesPlaylist;
        });

        const sortMode = sortSelect.value;
        currentFiltered.sort((a, b) => {
          if (sortMode === "recent") return String(b.added_at || "").localeCompare(String(a.added_at || ""));
          if (sortMode === "oldest") return String(a.added_at || "").localeCompare(String(b.added_at || ""));
          if (sortMode === "artist") return String(a.primary_artist_name || "").localeCompare(String(b.primary_artist_name || ""));
          return Number(b.best_suggested_playlist?.score || 0) - Number(a.best_suggested_playlist?.score || 0);
        });

        const withSuggestion = currentFiltered.filter((row) => row.best_suggested_playlist).length;
        stats.innerHTML = `
          <div class="spotify-stat-card"><div class="spotify-stat-label">Filtered candidates</div><div class="spotify-stat-value">${esc(fmt.format(currentFiltered.length))}</div></div>
          <div class="spotify-stat-card"><div class="spotify-stat-label">With suggestions</div><div class="spotify-stat-value">${esc(fmt.format(withSuggestion))}</div></div>
          <div class="spotify-stat-card"><div class="spotify-stat-label">Visible rows</div><div class="spotify-stat-value">${esc(fmt.format(Math.min(currentFiltered.length, 80)))}</div></div>`;

        const visible = currentFiltered.slice(0, 80);
        body.innerHTML = visible.map((row) => {
          const suggested = row.best_suggested_playlist;
          const saved = formatDate(row.added_at);
          const track = row.spotify_url ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">${esc(row.track_name)}</a>` : esc(row.track_name);
          return `<tr><td>${track}</td><td>${esc(row.primary_artist_name)}</td><td>${esc(row.album_name || "—")}</td><td>${suggested ? `<span class="spotify-pill">${esc(suggested.playlist_name)}</span><div class="spotify-muted">${esc(suggested.reason || "artist overlap")}</div><div class="spotify-muted">score ${esc(Number(suggested.score || 0).toFixed(2))}</div>` : `<span class="spotify-muted">No obvious match yet</span>`}</td><td>${esc(saved)}</td><td>${esc(durationLabel(row.duration_ms))}</td><td>${row.spotify_url ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">Open</a>` : ""}</td></tr>`;
        }).join("") || `<tr><td colspan="7" class="spotify-muted">No matching rows.</td></tr>`;
      };

      input.addEventListener("input", render);
      playlistFilter.addEventListener("change", render);
      sortSelect.addEventListener("change", render);
      downloadButton.addEventListener("click", () => downloadCsv(currentFiltered));
      render();
    }
  });
})();
