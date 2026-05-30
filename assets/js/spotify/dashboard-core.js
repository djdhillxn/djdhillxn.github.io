(function () {
  "use strict";

  const sections = [];
  const fmt = new Intl.NumberFormat("en-US");
  const pct = (value) => `${Math.round(Number(value || 0) * 100)}%`;
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  }[ch]));

  function statCard(label, value) {
    return `<div class="spotify-stat-card"><div class="spotify-stat-label">${esc(label)}</div><div class="spotify-stat-value">${esc(value)}</div></div>`;
  }

  function barList(items, metricKey, labelKey = "artist_name", valueFormatter = fmt.format, limit = 12) {
    const sliced = (items || []).slice(0, limit);
    const maxValue = Math.max(...sliced.map((d) => Number(d[metricKey] || 0)), 1);
    return `<div class="spotify-bar-list">${sliced.map((item) => {
      const value = Number(item[metricKey] || 0);
      const width = Math.max(2, (value / maxValue) * 100);
      const label = esc(item[labelKey]);
      const link = item.spotify_url
        ? `<a class="spotify-bar-label spotify-link" href="${esc(item.spotify_url)}" target="_blank" rel="noopener">${label}</a>`
        : `<div class="spotify-bar-label">${label}</div>`;
      return `<div class="spotify-bar-row">${link}<div class="spotify-bar-track" aria-hidden="true"><div class="spotify-bar-fill" style="width:${width}%"></div></div><div class="spotify-bar-value">${esc(valueFormatter(value))}</div></div>`;
    }).join("")}</div>`;
  }

  function registerSection(section) {
    sections.push(section);
  }

  function renderDashboard(root, data) {
    root.innerHTML = sections.map((section) => section.render(data)).join("");
    sections.forEach((section) => {
      if (section.update) section.update(root, data);
    });
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

  window.SpotifyDashboard = {
    barList,
    esc,
    fmt,
    init,
    pct,
    registerSection,
    statCard
  };
})();
