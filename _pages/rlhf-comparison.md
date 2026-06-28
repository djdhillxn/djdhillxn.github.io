---
layout: page
title: RLHF Response Explorer
description: Side-by-side Base and PPO generations from the final TRL RLHF evaluation on a validation set of 2017 prompts.
permalink: /projects/rlhf-comparison/
---

<link rel="stylesheet" href="{{ '/assets/css/rlhf/response-explorer.css' | relative_url }}">

[Back to the RLHF project write-up]({{ '/projects/rlhf/' | relative_url }})

<div
  class="rlhf-explorer"
  data-rlhf-explorer
  data-source-url="{{ '/assets/json/rlhf/portfolio_full_policy_comparisons_final_trl.json' | relative_url }}"
>
  <section class="rlhf-explorer-hero">
    <p class="rlhf-explorer-kicker">Qualitative policy evaluation</p>
    <h2>Compare the instruction model with its PPO-aligned policy.</h2>
    <p>
      Browse all 2,017 validation prompts from the final TRL PPO evaluation.
      Use the domain filters to narrow the list to general, code, STEM, or
      multilingual prompts. The Curated filter provides a balanced first pass
      through 50 positive and 50 negative cases and can be combined with any
      domain selection. Then inspect the full prompt context and the Base and
      PPO generations side by side.

      Reward model scores are shown as diagnostics. The triage label is a
      deterministic heuristic based on reward margins, EOS/cap behavior, and
      repeated 4-grams; it is not a human or LLM-as-judge quality verdict.

    </p>
  </section>

  <section class="rlhf-explorer-controls" aria-label="Example controls">
    <label for="rlhf-example-select">Evaluation example</label>
    <div class="rlhf-explorer-control-row">
      <select id="rlhf-example-select" data-rlhf-example-select disabled>
        <option>Loading full validation examples...</option>
      </select>
      <button type="button" data-rlhf-previous disabled>Previous</button>
      <button type="button" data-rlhf-next disabled>Next</button>
    </div>
    <div class="rlhf-explorer-filter-row" aria-label="Domain filters">
      <button type="button" class="is-active" data-rlhf-domain-filter="all" aria-pressed="true">All</button>
      <button type="button" data-rlhf-domain-filter="general" aria-pressed="false">General</button>
      <button type="button" data-rlhf-domain-filter="code" aria-pressed="false">Code</button>
      <button type="button" data-rlhf-domain-filter="stem" aria-pressed="false">STEM</button>
      <button type="button" data-rlhf-domain-filter="multilingual" aria-pressed="false">Multilingual</button>
      <span class="rlhf-explorer-filter-divider" aria-hidden="true"></span>
      <button
        type="button"
        class="rlhf-explorer-curated-filter"
        data-rlhf-curated-filter
        aria-pressed="false"
        title="Show the balanced 50-positive and 50-negative first-pass selection"
      >Curated (100)</button>
    </div>
    <p class="rlhf-explorer-status" data-rlhf-status role="status">
      Loading the static evaluation artifact...
    </p>
  </section>

  <section class="rlhf-explorer-review">
    <div>
      <p class="rlhf-explorer-kicker">Heuristic triage</p>
      <h3 data-rlhf-category>Waiting for data</h3>
    </div>
    <p data-rlhf-note></p>
  </section>

  <div class="rlhf-explorer-meta" data-rlhf-meta></div>

  <section class="rlhf-explorer-prompt">
    <div class="rlhf-explorer-section-heading">
      <div>
        <p class="rlhf-explorer-kicker">Prompt</p>
        <h3 data-rlhf-example-title>Evaluation example</h3>
      </div>
    </div>
    <div class="rlhf-explorer-copy rlhf-explorer-prompt-copy" data-rlhf-prompt></div>
  </section>

  <section class="rlhf-explorer-comparison" aria-label="Base and PPO response comparison">
    <article class="rlhf-explorer-response" data-rlhf-base-card>
      <header>
        <div>
          <p class="rlhf-explorer-kicker">Left</p>
          <h3>Base Qwen2.5-0.5B-Instruct</h3>
        </div>
        <span class="rlhf-explorer-policy-tag">Base</span>
      </header>
      <div class="rlhf-explorer-response-stats" data-rlhf-base-stats></div>
      <div class="rlhf-explorer-copy rlhf-explorer-response-copy" data-rlhf-base-response></div>
    </article>

    <article class="rlhf-explorer-response rlhf-explorer-response-ppo" data-rlhf-ppo-card>
      <header>
        <div>
          <p class="rlhf-explorer-kicker">Right</p>
          <h3>PPO-aligned policy</h3>
        </div>
        <span class="rlhf-explorer-policy-tag">PPO</span>
      </header>
      <div class="rlhf-explorer-response-stats" data-rlhf-ppo-stats></div>
      <div class="rlhf-explorer-copy rlhf-explorer-response-copy" data-rlhf-ppo-response></div>
    </article>
  </section>

  <p class="rlhf-explorer-caveat" data-rlhf-caveat>
    Reward scores come from the learned reward model and are not human quality
    labels.
  </p>

  <noscript>
    This explorer requires JavaScript to load the static comparison artifact.
  </noscript>
</div>

<script src="{{ '/assets/js/rlhf/response-explorer.js' | relative_url }}" defer></script>
