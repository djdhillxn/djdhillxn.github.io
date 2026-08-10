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
    {%- unless project.portfolio_exclude or project.show_in_blog -%}
      {%- include project_feature.html project=project -%}
    {%- endunless -%}
  {%- endfor -%}
</div>
<!-- The GitHub icon beside each project title opens the corresponding repository. Each project title opens its full write-up, demo, report, or interactive artifact. I keep the summaries here intentionally self-contained so that the main ideas and results can be understood without leaving this page. -->
