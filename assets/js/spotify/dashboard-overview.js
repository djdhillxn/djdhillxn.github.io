(function () {
  "use strict";

  const { esc, fmt, pct, registerSection, statCard } = window.SpotifyDashboard;

  registerSection({
    name: "overview",
    render(data) {
      const summary = data.summary || {};
      const generated = data.generated_at ? new Date(data.generated_at).toLocaleString() : "unknown";
      return `
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
        </div>`;
    }
  });
})();
