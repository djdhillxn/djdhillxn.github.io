---
layout: page
title: Projects
permalink: /projects/
description: #actionable insights and pragmatic programming experiences derived from each
nav: true
nav_order: 1
---
<div class="projects projects-home">
  <p class="projects-home-intro">
    All the project's code, along with more, are available at my <a href="https://github.com/djdhillxn">GitHub</a>.
    The cat symbol beside each project goes to that project's GitHub repository.
  </p>
  {%- assign sorted_projects = site.projects | sort: "portfolio_order" -%}
  {%- for project in sorted_projects -%}
    {%- unless project.portfolio_exclude -%}
      {%- include project_feature.html project=project -%}
    {%- endunless -%}
  {%- endfor -%}
</div>
<!-- The GitHub icon beside each project title opens the corresponding repository. Each project title opens its full write-up, demo, report, or interactive artifact. I keep the summaries here intentionally self-contained so that the main ideas and results can be understood without leaving this page. -->

<div class="portfolio-project-note" markdown="1">

**This portfolio** A long term project in itself.

Working on building this portfolio has brought back memories of childhood and refreshed my knowledge of certain computer languages that I was introduced to in secondary school in my 6th grade. These computer languages were the ones which inspired me to join the world of engineering. These languages are html and css.

Over the summer of 26, I also got to work on several passion projects included browser-side music retrieval systems, topic modeling over song lyrics, playlist recommendation heuristics, and contextual bandits for movie recommendations.

</div>
