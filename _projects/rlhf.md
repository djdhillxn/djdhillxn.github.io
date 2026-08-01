---
layout: page
title: Post Training Qwen2.5-0.5B with RLHF on Heterogeneous, Long-Form Preference Data
description: Supervised Fine-Tuning, Reward Modeling, and Guarded PPO on diverse data from HelpSteer3
importance: -4
category: RL
github: "https://github.com/djdhillxn/rlhf"
portfolio_order: 20
portfolio_tags: [RLHF, PPO, reward modeling, LLM alignment, TRL]
portfolio_summary: |
  Motivated after applying PPO on Atari and MuJoCo, I wanted to apply policy optimization to language-model post-training. I built an RLHF pipeline around Qwen2.5-0.5B-Instruct and HelpSteer3: supervised fine-tuning, pairwise reward modeling, and guarded token-level PPO with LoRA, a frozen reference policy, value learning, KL control, and qualitative response auditing.

  The final pipeline used 36K+ filtered preference pairs, a reward model with 65.6% held-out pairwise accuracy, and 12K domain-balanced PPO rollouts with responses up to 768 tokens. The full explorer exposes 2,017 held-out prompts. The guarded PPO policy remained stable and less prone to stopping and repetition failures than an earlier high-reward checkpoint, but it did not beat Base under the learned reward proxy; the project therefore emphasizes inspectable training, reward-hacking safeguards, and honest qualitative analysis.
---
<!-- RLHF Trained Qwen2.5-0.5 Instruct LLM model with SFT training on HelpSteer3 dataset. Performed Reward model training using HelpSteer3. Executed Qwen2.5-0.5 Instruct human alignment using RLHF using PPO with reference SFT model and using trained reward model. See codes. -->

<!-- [RLHF using PPO](/projects/rlhf) Motivated after applying PPO on Atari and MuJoCo, I asked whether a complete RLHF pipeline could remain measurable on a half-billion-parameter model when the preference task itself was broad and often long-form. I built the experiment around Qwen2.5-0.5B-Instruct and NVIDIA HelpSteer3, spanning supervised fine-tuning, pairwise reward modeling, token-level PPO, and qualitative response auditing.

--> 
<!-- explores whether preference feedback can make a small instruction-tuned language model more helpful. I built an end-to-end pipeline around Qwen2.5-0.5B and HelpSteer3: supervised fine-tuning, pairwise reward modeling, and a custom token-level PPO loop with LoRA, GAE, and KL control.  -->
<link rel="stylesheet" href="{{ '/assets/css/rlhf/project.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/rlhf/response-explorer.css' | relative_url }}">
<a href="#technical-notes">Read technical notes here.</a>

<div
  id="response-explorer"
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

## Technical notes

**Project question: a small model, but not a small alignment problem.**  
I wanted to test whether the complete RLHF process could remain useful and
inspectable under a modest compute budget without simplifying the data into a
short, single-domain task. HelpSteer3 made that question concrete: its 40,476
preference records span general, code, STEM, and multilingual prompts, with
responses ranging from compact answers to code and multi-step explanations.
An early length audit showed that a 1,024-token total training budget would
truncate roughly 40% of SFT and reward-model examples. Expanding it to 4,096
tokens reduced truncation to about 1%. The goal was not to claim that a 0.5B
policy solves general alignment, but to train the full pipeline and make both
its gains and its failures available for inspection.

The goal is to use preference data from [NVIDIA HelpSteer3](https://huggingface.co/datasets/nvidia/HelpSteer3)
to align the [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) LLM toward responses that a human would prefer over boring or mechanistic bags of words. The 3-step process begins with supervised fine-tuning (SFT) using the preferred responses in the training dataset. Then I train a reward model on HelpSteer3 prompt-response pairs, where one response is preferred over the other. The reward model learns to assign higher scores to preferred responses and lower scores to rejected responses. Finally, I use that reward model to train the LLM policy toward preferred responses using PPO, with a frozen SFT reference policy, KL control, and value estimates for token-level optimization.

<!-- The PPO step is discussed in detail below. -->

I learned that making PPO run stably is only one part of LLM alignment; the quality of the preference data, the reward model, the stopping behavior, and the evaluation protocol can matter just as much as the optimizer. This project gave me a working system in which those interactions are visible and measurable. After training, I used the Base, SFT, and PPO policies to generate responses to all validation prompts and scored them with the same learned reward model. For human review, I built the response explorer at the top of this page so I could move from a number in a table to the actual text that produced it. Even though I used the smallest model in the Qwen2.5 family because of my own compute budget, the project became a substantial learning curve: I read through the development of RLHF and policy optimization, implemented the complete training sequence, and learned most from the places where a high reward did not mean a good answer.

<!-- Using a half-billion-parameter model kept the project within my compute budget while making its capacity limits visible. As a learning project, it also pushed me to trace the development of RLHF from 2017 onward and connect the theory to observed failure modes. -->

<!-- **[Find the full interactive Base vs PPO response explorer here](#response-explorer)**. -->

The RLHF pipeline is implemented in my [RLHF repository](https://github.com/djdhillxn/rlhf), where the concise report, technical companion, resolved configurations, and experiment records document the implementation in more detail.

<!-- The implementation covers supervised fine-tuning, pairwise reward modeling, and KL-controlled token-level PPO.  -->

## Training pipeline

HelpSteer3 provides 38,459 training and 2,017 validation preference records spanning general, STEM, code, and multilingual prompts. After filtering invalid or tied preference rows, the final TRL training run used 36,264 rows for SFT and reward-model training and 1,917 reward-model validation pairs. Its breadth is operationally important: code, multi-step explanations, multilingual conversations, and long prompt histories make sequence handling part of the method rather than a cosmetic configuration choice.

1. **Supervised fine-tuning.** The preferred responses train a response-only LoRA adapter over Qwen2.5-0.5B-Instruct. Expanding the total sequence budget from 1,024 to 4,096 tokens reduced SFT truncation from 38.47% to 0.83% and reward-model pair truncation from 40.82% to 1.00%. The final SFT run used one epoch, LoRA rank 16, an effective batch size of 32, and reached 72.02% validation mean token accuracy.
2. **Reward modeling.** A scalar reward head is trained with a Bradley–Terry pairwise ranking loss so chosen responses score above rejected ones. The final reward model starts from the merged SFT model, uses LoRA rank 32 and two total epochs, and reached **65.62% validation pairwise accuracy** across 1,917 usable pairs. This score is a learned preference proxy, not an oracle; its weaker STEM and general-domain accuracy became important when interpreting PPO.
3. **Guarded PPO alignment.** The SFT checkpoint initializes both the trainable policy and the frozen reference, while the reward model initializes the value model. The completed PPO run generated **12,032 on-policy responses over 188 updates**, with every batch balanced across general, code, STEM, and multilingual prompts and each response allowed up to **768 new tokens**.

The final PPO stage was designed around preventing obvious ways of gaming an imperfect reward model. Reward scores were clipped to empirical 0.5th and 99.5th percentile bounds estimated from a stratified sample; a response that missed EOS received the calibrated lower-bound score; a smooth 4-gram repetition penalty activated only beyond the preferred-response 95th percentile; and KL regularization kept the policy anchored to the SFT reference. The run also saved complete policy, value, optimizer, scheduler, RNG, rollout-position, and guardrail state for exact resume.

Long responses made GPU execution a separate problem. A dense `batch × response × vocabulary` score tensor would consume roughly 27.8 GiB by itself at the final batch and response sizes. The final path generated token IDs without retaining all vocabulary scores, used a rollout-only KV cache, recomputed log-probabilities only for sampled response tokens in bounded chunks, trimmed all-masked prompt columns, shared the reference backbone, and separated policy/value backward graphs. This kept the completed run to about 37.6 GiB peak allocated memory without changing the PPO objective or effective batch size.

## Discussion

I started out resolved to understand every moving part of the RLHF process, so the project first used custom SFT, reward-model, and token-level PPO code. Those implementations were useful precisely because they failed in visible ways: truncated responses, empty outputs, wrong checkpoint paths, weak EOS handling, unstable reward scales, and high-reward repetition. I later moved the main trainer loops to Hugging Face TRL, while keeping the repository-owned preprocessing, model initialization, reward calibration, exact-resume wrapper, evaluation suite, and response explorer. The custom code exposed assumptions; TRL gave me a cleaner substrate on which to finish the experiment.

The final guarded run is the iteration I am freezing. It completed its declared 12,000-episode budget as 12,032 rollouts, rather than stopping at the earlier 100-update checkpoint. During the second half of training, EOS became more frequent, cap hits and response length declined, repetition eased, and the value loss settled near the reward scale. That is evidence that the PPO process learned without numerical or empty-output collapse. It is not evidence that the learned reward model captured every human preference.

With my evaluation code, I can perform Base vs SFT, Base vs PPO, and SFT vs PPO comparisons from the same generated response table. The quantitative judge is the trained reward model; the qualitative judge is the actual response. The latter matters because a policy can optimize what the reward model likes while becoming longer, repetitive, factually wrong, or merely well-formatted. That need for skeptical auditing motivated the response explorer and the 4-gram, EOS, cap, and reward-margin metadata shown with every row. I don't have infinite compute, alright! It is also the reason I chose the half-a-billion-parameter model and made the evaluation resumable one policy at a time.

## Evaluation

The final evaluator generated Base, SFT, and guarded PPO responses once for each of the 2,017 HelpSteer3 validation prompts. Every policy used the same tokenizer, prompt budget of 3,072 tokens, response budget of 768 new tokens, and sampled decoding settings. The same two-epoch reward model scored all responses. These are reward-model comparisons, not a blinded human preference study.

<div class="rlhf-eval-tables rlhf-eval-tables-focused">
  <section class="rlhf-eval-table-card" aria-labelledby="rlhf-base-ppo-heading">
    <h3 id="rlhf-base-ppo-heading">Base vs guarded PPO</h3>
    <div class="rlhf-eval-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Policy</th>
            <th>Mean tokens</th>
            <th>Median tokens</th>
            <th>Cap-hit rate</th>
            <th>Repeated 4-grams &gt;25%</th>
            <th>Mean reward</th>
            <th>Pairwise wins</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Base</td><td>373.5</td><td>333</td><td>16.21%</td><td>165 (8.18%)</td><td>0.2229</td><td>1,179</td></tr>
          <tr><td>PPO</td><td>384.1</td><td>355</td><td>16.31%</td><td>326 (16.16%)</td><td>0.1753</td><td>817</td></tr>
          <tr><td>Tie</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>21</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="rlhf-eval-table-card rlhf-eval-summary-card" aria-labelledby="rlhf-summary-heading">
    <h3 id="rlhf-summary-heading">What I take from the result</h3>
    <p>
      Under the learned reward model, guarded PPO wins <strong>817 / 2,017</strong> Base comparisons, a <strong>40.51%</strong> win rate, and <strong>974 / 2,017</strong> SFT comparisons, a <strong>48.29%</strong> win rate.
    </p>
    <p>
      This is not a claim that PPO beat Qwen. The more useful result is that the policy completed long-form PPO without collapse while keeping its median length and cap-hit rate near the baselines, and the explorer makes the remaining reward-model mismatches inspectable.
    </p>
  </section>
</div>

<div class="rlhf-domain-card" aria-labelledby="rlhf-domain-heading">
  <h3 id="rlhf-domain-heading">PPO versus Base by domain</h3>
  <p>
    The learned reward proxy favors Base in every domain. The bars make that limitation visible rather than hiding it behind selected examples.
  </p>
  <div class="rlhf-domain-legend" aria-hidden="true">
    <span><i class="rlhf-domain-base"></i> Base wins</span>
    <span><i class="rlhf-domain-ppo"></i> PPO wins</span>
    <span><i class="rlhf-domain-tie"></i> Ties</span>
  </div>
  <div class="rlhf-domain-bars">
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>General</strong><span>931 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="General: PPO 42.96%, Base 55.53%, ties 1.50%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:55.53%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:42.96%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:1.50%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 42.96%</div>
    </div>
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>Code</strong><span>438 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="Code: PPO 35.84%, Base 63.70%, ties 0.46%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:63.70%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:35.84%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:0.46%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 35.84%</div>
    </div>
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>STEM</strong><span>245 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="STEM: PPO 39.18%, Base 60.41%, ties 0.41%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:60.41%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:39.18%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:0.41%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 39.18%</div>
    </div>
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>Multilingual</strong><span>403 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="Multilingual: PPO 40.69%, Base 58.31%, ties 0.99%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:58.31%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:40.69%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:0.99%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 40.69%</div>
    </div>
  </div>
  <div class="rlhf-eval-table-scroll rlhf-domain-table">
    <table>
      <thead>
        <tr><th>Domain</th><th>Prompts</th><th>PPO wins</th><th>Base wins</th><th>Ties</th><th>PPO win rate</th></tr>
      </thead>
      <tbody>
        <tr><td>General</td><td>931</td><td>400</td><td>517</td><td>14</td><td>42.96%</td></tr>
        <tr><td>Code</td><td>438</td><td>157</td><td>279</td><td>2</td><td>35.84%</td></tr>
        <tr><td>STEM</td><td>245</td><td>96</td><td>148</td><td>1</td><td>39.18%</td></tr>
        <tr><td>Multilingual</td><td>403</td><td>164</td><td>235</td><td>4</td><td>40.69%</td></tr>
      </tbody>
    </table>
  </div>
</div>

## Qualitative analysis of responses

<!-- What the aggregate metrics miss -->

The automated audit uses reward margins, response length, cap hits, EOS behavior, repeated word-level 4-grams, and selected sensitive-term checks to create review queues. It found 9 qualified PPO candidates, 120 strong PPO-loss candidates, 326 repetition-risk rows, and 155 high-reward repetition or stopping mismatches. These groups overlap; they are routes into the data, not quality labels.

The guarded policy is much easier to inspect than the earlier checkpoint that maximized the proxy more aggressively. Its median response is 355 tokens, its cap-hit rate is 16.31%, and 16.16% of responses cross the 25% repeated-4-gram threshold. Base is still cleaner on repetition at 8.18%, so the guardrails alleviated rather than eliminated the problem. Manual inspection finds useful local improvements—clearer structure, better coverage of some multi-part prompts, supportive wording, and compact answers—but also invalid code, confused factual reasoning, prompt restatement, fabricated details, and occasional loops that the reward model still scores highly.

That is the main lesson I would defend. PPO can be numerically stable and remain close to its reference while still optimizing blind spots in a scalar judge. The final policy does not universally improve Qwen2.5-0.5B-Instruct, but the complete training and explorer make the distinction between reward, behavior, and visible response quality concrete. I am freezing this phase here rather than running another unqualified block of PPO against the same imperfect reward model.

## Future work

<!-- The short version of what I would do next: -->

**Independent preference review:** Run a blinded human or strong-LLM comparison on a stratified subset and measure where it agrees with the learned reward model.  
**Hard-negative reward modeling:** Add audited loops, prompt restatements, fabricated citations, malformed code, and incorrect STEM answers to a new reward-model training set.  
**Task-specific checks:** Execute code where possible and use factual or symbolic checks for correctness-sensitive prompts.  
**Controlled token-budget studies:** Compare 512, 768, and 1,024 generated-token budgets while holding checkpoint, prompt order, seed, batch size, and software environment fixed.  
**Preference-objective baselines:** Evaluate the prepared DPO path from the same SFT checkpoint only when it can be judged with the same full suite.  
**Scale carefully:** Repeat the pipeline on a stronger model after the evaluator and reward model become more trustworthy.

I would also be able to reuse this response explorer, the heuristic queues, and the evaluation infrastructure to study other alignment methods without reducing the result to one aggregate score.

<!-- ## About this project's motivation

I got motivated to work on this project after learning in detail about policy optimization methods and using them to run [training experiments](/projects/trpo) on Atari games and MuJoCo locomotion tasks. -->
