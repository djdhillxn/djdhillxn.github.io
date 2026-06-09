(function () {
  "use strict";

  const { barList, esc, fmt, pct, registerSection, statCard } = window.SpotifyDashboard;

  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

  function toMonthLabel(month) {
    if (!month || typeof month !== "string") return "—";
    const [year, rawMonth] = month.split("-").map(Number);
    if (!year || !rawMonth) return month;
    return monthFmt.format(new Date(Date.UTC(year, rawMonth - 1, 1)));
  }

  function uniqueBy(items, keyFn) {
    const seen = new Set();
    const out = [];
    (items || []).forEach((item) => {
      const key = keyFn(item);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(item);
    });
    return out;
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function shortDuration(ms) {
    const minutes = Math.round(Number(ms || 0) / 60000);
    if (!minutes) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }

  function artistKey(artist) {
    return artist.artist_id || artist.artist_name;
  }

  function countMissingArtists(data) {
    const counter = new Map();
    (data.liked_songs_missing_from_playlists || []).forEach((track) => {
      const ids = track.artist_ids || [];
      const names = track.artist_names || [];
      ids.forEach((id, idx) => {
        if (!id) return;
        const existing = counter.get(id) || { artist_id: id, artist_name: names[idx] || id, missing_count: 0 };
        existing.missing_count += 1;
        counter.set(id, existing);
      });
    });
    return counter;
  }

  function buildArtistCurationRows(data) {
    const missingByArtist = countMissingArtists(data);
    const playlistByArtist = new Map((data.overall_playlist_top_artists || []).map((artist) => [artistKey(artist), artist]));

    return (data.liked_top_artists || []).map((likedArtist) => {
      const key = artistKey(likedArtist);
      const missing = missingByArtist.get(key);
      const likedCount = Number(likedArtist.unique_track_count || 0);
      const missingCount = Number(missing?.missing_count || 0);
      const coveredCount = Math.max(0, likedCount - missingCount);
      const playlistArtist = playlistByArtist.get(key);
      return {
        artist_id: likedArtist.artist_id,
        artist_name: likedArtist.artist_name,
        spotify_url: likedArtist.spotify_url,
        liked_count: likedCount,
        missing_count: missingCount,
        covered_count: coveredCount,
        coverage_rate: likedCount ? coveredCount / likedCount : 0,
        playlist_unique_count: Number(playlistArtist?.unique_track_count || 0),
        playlist_count: Number(playlistArtist?.playlist_count || 0),
        artist_image_url: likedArtist.artist_image_url || playlistArtist?.artist_image_url || null
      };
    }).filter((row) => row.liked_count > 0);
  }

  function tableRows(rows, emptyMessage, renderer, colspan = 6) {
    return rows.length
      ? rows.map(renderer).join("")
      : `<tr><td colspan="${colspan}" class="spotify-muted">${esc(emptyMessage)}</td></tr>`;
  }

  function topSuggestedPlaylistCounts(data) {
    const counts = new Map();
    (data.liked_songs_missing_from_playlists || []).forEach((track) => {
      const suggestion = track.best_suggested_playlist;
      if (!suggestion?.playlist_id) return;
      const existing = counts.get(suggestion.playlist_id) || {
        playlist_id: suggestion.playlist_id,
        playlist_name: suggestion.playlist_name,
        spotify_url: suggestion.spotify_url,
        candidate_count: 0,
        total_score: 0
      };
      existing.candidate_count += 1;
      existing.total_score += Number(suggestion.score || 0);
      counts.set(suggestion.playlist_id, existing);
    });
    return Array.from(counts.values())
      .map((row) => ({ ...row, avg_score: row.candidate_count ? row.total_score / row.candidate_count : 0 }))
      .sort((a, b) => b.candidate_count - a.candidate_count || b.avg_score - a.avg_score);
  }

  function playlistLink(row) {
    return row.spotify_url
      ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">${esc(row.name)}</a>`
      : esc(row.name);
  }

  function artistLink(artist) {
    if (!artist?.artist_name) return "—";
    return artist.spotify_url
      ? `<a class="spotify-link" href="${esc(artist.spotify_url)}" target="_blank" rel="noopener">${esc(artist.artist_name)}</a>`
      : esc(artist.artist_name);
  }

  function artistShare(playlist, artist, fallbackShare = 0) {
    if (!artist) return fallbackShare;
    const explicitShare = Number(artist.artist_share_of_playlist || 0);
    if (explicitShare) return explicitShare;
    const appearances = Number(artist.playlist_appearances || artist.unique_track_count || 0);
    const totalTracks = Number(playlist.total_tracks || 0);
    return totalTracks ? appearances / totalTracks : fallbackShare;
  }

  registerSection({
    name: "saved-timeline",
    render(data) {
      const timeline = data.saved_timeline || [];
      if (!timeline.length) return "";

      const maxCount = Math.max(...timeline.map((row) => Number(row.liked_count || 0)), 1);
      const total = timeline.reduce((acc, row) => acc + Number(row.liked_count || 0), 0);
      const peak = [...timeline].sort((a, b) => Number(b.liked_count || 0) - Number(a.liked_count || 0))[0];
      const first = timeline[0];
      const latest = timeline[timeline.length - 1];
      const recent = timeline.slice(-12);
      const recentTotal = recent.reduce((acc, row) => acc + Number(row.liked_count || 0), 0);
      const peakMonths = [...timeline].sort((a, b) => Number(b.liked_count || 0) - Number(a.liked_count || 0)).slice(0, 8);

      return `
        <section class="spotify-panel spotify-panel-timeline">
          <h3 class="spotify-panel-title">Saved-song timeline</h3>
          <div class="spotify-panel-subtitle">Uses the liked-song <code>added_at</code> dates already in the exported JSON. It is not listening history, but it shows when songs entered the library.</div>
          <div class="spotify-stat-grid">
            ${statCard("Saved months", fmt.format(timeline.length))}
            ${statCard("Busiest month", `${toMonthLabel(peak?.month)} · ${fmt.format(peak?.liked_count || 0)}`)}
            ${statCard("Recent 12 months", fmt.format(recentTotal))}
            ${statCard("Range", `${toMonthLabel(first?.month)} → ${toMonthLabel(latest?.month)}`)}
          </div>
          <div class="spotify-timeline" aria-label="Liked songs saved by month">
            ${timeline.map((row) => {
              const count = Number(row.liked_count || 0);
              const height = Math.max(6, (count / maxCount) * 120);
              return `<div class="spotify-timeline-bar" title="${esc(toMonthLabel(row.month))}: ${fmt.format(count)} liked songs" style="height:${height}px"><span>${esc(count)}</span></div>`;
            }).join("")}
          </div>
          <div class="spotify-grid-two spotify-grid-tight">
            <section class="spotify-mini-panel">
              <h4>Peak discovery months</h4>
              ${barList(peakMonths, "liked_count", "month", (v) => `${fmt.format(v)} songs`, 8).replace(/>(\d{4}-\d{2})</g, (_m, month) => `>${esc(toMonthLabel(month))}<`)}
            </section>
            <section class="spotify-mini-panel">
              <h4>How to read this</h4>
              <p class="spotify-muted">A spike means many songs were saved that month. It can mark a phase, a trip, a breakup, a gym era, a rediscovery run, or simply a month when the library expanded quickly.</p>
            </section>
          </div>
        </section>`;
    }
  });

  registerSection({
    name: "curation-gaps",
    render(data) {
      const rows = buildArtistCurationRows(data);
      const mostMissing = rows.filter((row) => row.missing_count > 0).sort((a, b) => b.missing_count - a.missing_count || a.coverage_rate - b.coverage_rate).slice(0, 12);
      const bestCovered = rows.filter((row) => row.liked_count >= 5 && row.coverage_rate >= 0.8).sort((a, b) => b.liked_count - a.liked_count || b.coverage_rate - a.coverage_rate).slice(0, 8);
      const weakestCoverage = rows.filter((row) => row.liked_count >= 5 && row.missing_count > 0).sort((a, b) => a.coverage_rate - b.coverage_rate || b.liked_count - a.liked_count).slice(0, 8);

      return `
        <section class="spotify-panel spotify-panel-curation">
          <h3 class="spotify-panel-title">Curation gap by artist</h3>
          <div class="spotify-panel-subtitle">This compares liked-song artist counts with liked songs that are still missing from named playlists.</div>
          <div class="spotify-grid-two">
            <div>
              <h4 class="spotify-subsection-title">Most missing liked songs</h4>
              <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Artist</th><th>Liked</th><th>Missing</th><th>Covered</th></tr></thead><tbody>
                ${tableRows(mostMissing, "No missing artist gaps found.", (row) => `<tr><td>${row.spotify_url ? `<a class="spotify-link" href="${esc(row.spotify_url)}" target="_blank" rel="noopener">${esc(row.artist_name)}</a>` : esc(row.artist_name)}</td><td>${fmt.format(row.liked_count)}</td><td>${fmt.format(row.missing_count)}</td><td>${pct(row.coverage_rate)}</td></tr>`)}
              </tbody></table></div>
            </div>
            <div>
              <h4 class="spotify-subsection-title">Weakest coverage among favorites</h4>
              <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Artist</th><th>Liked</th><th>Missing</th><th>Covered</th></tr></thead><tbody>
                ${tableRows(weakestCoverage, "No low-coverage favorite artists found.", (row) => `<tr><td>${esc(row.artist_name)}</td><td>${fmt.format(row.liked_count)}</td><td>${fmt.format(row.missing_count)}</td><td>${pct(row.coverage_rate)}</td></tr>`)}
              </tbody></table></div>
            </div>
          </div>
          <div class="spotify-mini-panel spotify-mini-panel-good">
            <h4>Already well-curated favorites</h4>
            <div class="spotify-pill-row">${bestCovered.map((row) => `<span class="spotify-pill">${esc(row.artist_name)} · ${pct(row.coverage_rate)}</span>`).join("") || `<span class="spotify-muted">No high-coverage favorites yet.</span>`}</div>
          </div>
        </section>`;
    }
  });

  registerSection({
    name: "playlist-health",
    render(data) {
      const suggestions = topSuggestedPlaylistCounts(data);
      const suggestionByPlaylist = new Map(suggestions.map((row) => [row.playlist_id, row]));
      const diversityByPlaylist = new Map((data.playlist_diversity || []).map((row) => [row.playlist_id, row]));
      const playlists = (data.playlists || []).filter((playlist) => Number(playlist.total_tracks || 0) > 0).map((playlist) => {
        const diversity = diversityByPlaylist.get(playlist.playlist_id) || {};
        const suggestion = suggestionByPlaylist.get(playlist.playlist_id) || {};
        const topArtist = (playlist.top_artists || [])[0] || {};
        return {
          ...playlist,
          normalized_artist_entropy: Number(diversity.normalized_artist_entropy || 0),
          top_artist_name: topArtist.artist_name || diversity.top_artist_name,
          top_artist_share: artistShare(playlist, topArtist, Number(diversity.top_artist_share || 0)),
          candidate_count: Number(suggestion.candidate_count || 0),
          avg_suggestion_score: Number(suggestion.avg_score || 0)
        };
      });
      if (!playlists.length) return "";

      const mostConcentrated = [...playlists].sort((a, b) => b.top_artist_share - a.top_artist_share || b.total_tracks - a.total_tracks).slice(0, 8);

      return `
        <section class="spotify-panel spotify-panel-health" data-health-panel>
          <h3 class="spotify-panel-title">Playlist health check</h3>
          <div class="spotify-panel-subtitle">A maintenance view: which playlists can be expanded, which are artist-heavy, and which are already broad.</div>
          <section class="spotify-mini-panel spotify-mini-panel-wide">
            <h4>Most artist-concentrated playlists</h4>
            <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Playlist</th><th>Top artist</th><th>Share</th><th>Second artist</th><th>Share</th></tr></thead><tbody>
              ${tableRows(mostConcentrated, "No concentration data found.", (row) => {
                const topArtists = row.top_artists || [];
                const topArtist = topArtists[0];
                const secondArtist = topArtists.find((artist) => artistKey(artist) !== artistKey(topArtist));
                return `<tr><td>${playlistLink(row)}</td><td>${artistLink(topArtist)}</td><td>${pct(artistShare(row, topArtist, row.top_artist_share))}</td><td>${artistLink(secondArtist)}</td><td>${pct(artistShare(row, secondArtist))}</td></tr>`;
              }, 5)}
            </tbody></table></div>
          </section>
          <div class="spotify-controls spotify-controls-right">
            <input class="spotify-search" data-health-search placeholder="Search playlists...">
            <select class="spotify-select" data-health-sort>
              <option value="candidate_count">Sort by suggested songs</option>
              <option value="total_tracks">Sort by track count</option>
              <option value="normalized_artist_entropy">Sort by diversity</option>
              <option value="top_artist_share">Sort by top-artist share</option>
            </select>
          </div>
          <div class="spotify-table-wrap"><table class="spotify-table"><thead><tr><th>Playlist</th><th>Tracks</th><th>Artists</th><th>Diversity</th><th>Top artist share</th><th>Suggested additions</th></tr></thead><tbody data-health-body></tbody></table></div>
        </section>`;
    },
    update(root, data) {
      const search = root.querySelector("[data-health-search]");
      const sort = root.querySelector("[data-health-sort]");
      const body = root.querySelector("[data-health-body]");
      if (!search || !sort || !body) return;

      const suggestions = topSuggestedPlaylistCounts(data);
      const suggestionByPlaylist = new Map(suggestions.map((row) => [row.playlist_id, row]));
      const diversityByPlaylist = new Map((data.playlist_diversity || []).map((row) => [row.playlist_id, row]));
      const playlists = (data.playlists || []).filter((playlist) => Number(playlist.total_tracks || 0) > 0).map((playlist) => {
        const diversity = diversityByPlaylist.get(playlist.playlist_id) || {};
        const suggestion = suggestionByPlaylist.get(playlist.playlist_id) || {};
        const topArtist = (playlist.top_artists || [])[0] || {};
        return {
          ...playlist,
          normalized_artist_entropy: Number(diversity.normalized_artist_entropy || 0),
          top_artist_share: artistShare(playlist, topArtist, Number(diversity.top_artist_share || 0)),
          candidate_count: Number(suggestion.candidate_count || 0)
        };
      });

      const render = () => {
        const q = search.value.trim().toLowerCase();
        const sortKey = sort.value;
        const rows = playlists
          .filter((playlist) => !q || String(playlist.name || "").toLowerCase().includes(q))
          .sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0))
          .slice(0, 20);

        body.innerHTML = tableRows(rows, "No matching playlists.", (row) => `<tr>
          <td>${playlistLink(row)}</td>
          <td>${fmt.format(row.total_tracks || 0)}</td>
          <td>${fmt.format(row.unique_artists || 0)}</td>
          <td>${Number(row.normalized_artist_entropy || 0).toFixed(2)}</td>
          <td>${pct(row.top_artist_share)}</td>
          <td>${fmt.format(row.candidate_count || 0)}</td>
        </tr>`);
      };

      search.addEventListener("input", render);
      sort.addEventListener("change", render);
      render();
    }
  });

  registerSection({
    name: "artist-map",
    render(data) {
      const likedByArtist = new Map((data.liked_top_artists || []).map((row) => [artistKey(row), row]));
      const playlistByArtist = new Map((data.overall_playlist_top_artists || []).map((row) => [artistKey(row), row]));
      const keys = new Set([...likedByArtist.keys(), ...playlistByArtist.keys()]);
      const rows = Array.from(keys).map((key) => {
        const liked = likedByArtist.get(key) || {};
        const playlist = playlistByArtist.get(key) || {};
        return {
          artist_id: liked.artist_id || playlist.artist_id,
          artist_name: liked.artist_name || playlist.artist_name,
          spotify_url: liked.spotify_url || playlist.spotify_url,
          liked_count: Number(liked.unique_track_count || 0),
          playlist_count: Number(playlist.unique_track_count || 0),
          playlist_span: Number(playlist.playlist_count || 0)
        };
      }).filter((row) => row.liked_count || row.playlist_count);

      if (!rows.length) return "";
      const top = rows.sort((a, b) => (b.liked_count + b.playlist_count) - (a.liked_count + a.playlist_count)).slice(0, 60);
      const maxLiked = Math.max(...top.map((row) => row.liked_count), 1);
      const maxPlaylist = Math.max(...top.map((row) => row.playlist_count), 1);
      const labelled = new Set(top.slice(0, 12).map((row) => row.artist_id || row.artist_name));

      return `
        <section class="spotify-panel spotify-panel-map">
          <h3 class="spotify-panel-title">Artist curation map</h3>
          <div class="spotify-panel-subtitle">A lightweight two-axis map: horizontal position is liked-song count, vertical position is playlist representation. It shows whether an artist is saved, curated, or both.</div>
          <div class="spotify-map-wrap">
            <div class="spotify-map-axis spotify-map-axis-x">More liked songs →</div>
            <div class="spotify-map-axis spotify-map-axis-y">More playlist songs ↑</div>
            ${top.map((row) => {
              const x = 7 + (row.liked_count / maxLiked) * 86;
              const y = 93 - (row.playlist_count / maxPlaylist) * 86;
              const size = Math.max(9, Math.min(26, 8 + Math.sqrt(row.liked_count + row.playlist_count) * 1.5));
              const key = row.artist_id || row.artist_name;
              const title = `${row.artist_name}: ${row.liked_count} liked, ${row.playlist_count} playlist songs`;
              return `<a class="spotify-map-dot" href="${esc(row.spotify_url || "#")}" ${row.spotify_url ? `target="_blank" rel="noopener"` : ""} title="${esc(title)}" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px"><span>${labelled.has(key) ? esc(row.artist_name) : ""}</span></a>`;
            }).join("")}
          </div>
          <div class="spotify-map-legend">
            <span>Bottom-right: saved but under-curated</span>
            <span>Top-left: playlist-heavy</span>
            <span>Top-right: core identity artists</span>
          </div>
        </section>`;
    }
  });

  registerSection({
    name: "affinity-comparison",
    render(data) {
      const spotifyArtists = data.spotify_top_items?.artists || {};
      const longTerm = spotifyArtists.long_term || [];
      const mediumTerm = spotifyArtists.medium_term || [];
      const shortTerm = spotifyArtists.short_term || [];
      if (!longTerm.length && !mediumTerm.length && !shortTerm.length) return "";

      const playlistTop = data.overall_playlist_top_artists || [];
      const likedTop = data.liked_top_artists || [];
      const playlistIds = new Set(playlistTop.map(artistKey));
      const likedIds = new Set(likedTop.map(artistKey));
      const longIds = new Set(longTerm.map(artistKey));
      const mediumIds = new Set(mediumTerm.map(artistKey));
      const shortIds = new Set(shortTerm.map(artistKey));
      const allSpotifyIds = new Set([...longIds, ...mediumIds, ...shortIds]);

      const core = longTerm.filter((artist) => playlistIds.has(artistKey(artist)) && likedIds.has(artistKey(artist))).slice(0, 10);
      const currentButNotCurated = uniqueBy([...shortTerm, ...mediumTerm], artistKey)
        .filter((artist) => !playlistIds.has(artistKey(artist)))
        .slice(0, 10);
      const curatedButNotAffinity = playlistTop
        .filter((artist) => !allSpotifyIds.has(artistKey(artist)))
        .slice(0, 10);

      const artistLink = (artist) => artist.spotify_url
        ? `<a class="spotify-link" href="${esc(artist.spotify_url)}" target="_blank" rel="noopener">${esc(artist.artist_name)}</a>`
        : esc(artist.artist_name);

      return `
        <section class="spotify-panel spotify-panel-affinity-compare">
          <h3 class="spotify-panel-title">Affinity vs curation</h3>
          <div class="spotify-panel-subtitle">Spotify's top-artist rankings are treated as a separate signal from liked songs and playlists. Disagreement is useful: it shows what is currently active but not organized, or curated but not currently dominant.</div>
          <div class="spotify-grid-three">
            <section class="spotify-mini-panel">
              <h4>Core across all signals</h4>
              <ol class="spotify-compact-list">${core.map((artist) => `<li>${artistLink(artist)}</li>`).join("") || `<li class="spotify-muted">No overlap found.</li>`}</ol>
            </section>
            <section class="spotify-mini-panel">
              <h4>Current but under-curated</h4>
              <ol class="spotify-compact-list">${currentButNotCurated.map((artist) => `<li>${artistLink(artist)}</li>`).join("") || `<li class="spotify-muted">No clear gap found.</li>`}</ol>
            </section>
            <section class="spotify-mini-panel">
              <h4>Curated but not current affinity</h4>
              <ol class="spotify-compact-list">${curatedButNotAffinity.map((artist) => `<li>${artistLink(artist)} <span class="spotify-muted">· ${fmt.format(artist.unique_track_count || 0)} songs</span></li>`).join("") || `<li class="spotify-muted">No stale curation signal found.</li>`}</ol>
            </section>
          </div>
        </section>`;
    }
  });

  registerSection({
    name: "nostalgia-picks",
    render() {
      return `
        <section class="spotify-panel spotify-panel-nostalgia" data-nostalgia-panel>
          <h3 class="spotify-panel-title">Nostalgia resurfacer</h3>
          <div class="spotify-panel-subtitle">A small utility for rediscovering older liked songs that still have not made it into a playlist.</div>
          <div class="spotify-controls">
            <button class="spotify-button" type="button" data-nostalgia-refresh>Shuffle picks</button>
            <select class="spotify-select" data-nostalgia-mode>
              <option value="oldest">Oldest missing liked songs</option>
              <option value="high-score">Strongest playlist matches</option>
              <option value="recent">Recent missing liked songs</option>
            </select>
          </div>
          <div class="spotify-card-list" data-nostalgia-output></div>
        </section>`;
    },
    update(root, data) {
      const output = root.querySelector("[data-nostalgia-output]");
      const button = root.querySelector("[data-nostalgia-refresh]");
      const mode = root.querySelector("[data-nostalgia-mode]");
      if (!output || !button || !mode) return;
      const rows = data.liked_songs_missing_from_playlists || [];

      const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
      const render = () => {
        let pool = [...rows];
        if (mode.value === "oldest") pool.sort((a, b) => String(a.added_at || "").localeCompare(String(b.added_at || "")));
        if (mode.value === "recent") pool.sort((a, b) => String(b.added_at || "").localeCompare(String(a.added_at || "")));
        if (mode.value === "high-score") pool.sort((a, b) => Number(b.best_suggested_playlist?.score || 0) - Number(a.best_suggested_playlist?.score || 0));
        const picks = shuffle(pool.slice(0, 60)).slice(0, 6);
        output.innerHTML = picks.map((track) => {
          const suggestion = track.best_suggested_playlist;
          const cover = track.album_image_url ? `<img src="${esc(track.album_image_url)}" alt="" loading="lazy">` : `<div class="spotify-card-cover-placeholder"></div>`;
          return `<article class="spotify-track-card">
            ${cover}
            <div>
              <div class="spotify-track-card-title">${track.spotify_url ? `<a class="spotify-link" href="${esc(track.spotify_url)}" target="_blank" rel="noopener">${esc(track.track_name)}</a>` : esc(track.track_name)}</div>
              <div class="spotify-muted">${esc(track.primary_artist_name || "Unknown artist")} · ${esc(track.album_name || "Unknown album")}</div>
              <div class="spotify-muted">Saved ${esc(formatDate(track.added_at))} · ${esc(shortDuration(track.duration_ms))}</div>
              <div>${suggestion ? `<span class="spotify-pill">${esc(suggestion.playlist_name)}</span>` : `<span class="spotify-muted">No suggested playlist yet</span>`}</div>
            </div>
          </article>`;
        }).join("") || `<div class="spotify-muted">No missing liked songs available.</div>`;
      };

      button.addEventListener("click", render);
      mode.addEventListener("change", render);
      render();
    }
  });
})();
