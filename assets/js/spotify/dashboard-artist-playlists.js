(function () {
  "use strict";

  const { barList, esc, fmt, registerSection, statCard } = window.SpotifyDashboard;

  function visiblePlaylists(data) {
    return (data.playlists || []).filter((playlist) => Number(playlist.total_tracks || 0) > 0);
  }

  registerSection({
    name: "artist-landscape",
    render(data) {
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
  });

  registerSection({
    name: "playlist-explorer",
    render(data) {
      const playlists = visiblePlaylists(data);
      if (!playlists.length) return "";
      const options = playlists.map((p, i) => `<option value="${i}">${esc(p.name)} (${fmt.format(p.total_tracks || 0)} tracks)</option>`).join("");
      return `
        <section class="spotify-panel" data-playlist-panel>
          <h3 class="spotify-panel-title">Playlist explorer</h3>
          <div class="spotify-panel-subtitle">Select a playlist to see which artists dominate it.</div>
          <div class="spotify-controls"><select class="spotify-select" data-playlist-select>${options}</select></div>
          <div data-playlist-output></div>
        </section>`;
    },
    update(root, data) {
      const select = root.querySelector("[data-playlist-select]");
      const output = root.querySelector("[data-playlist-output]");
      if (!select || !output) return;
      const playlists = visiblePlaylists(data);
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
  });
})();
