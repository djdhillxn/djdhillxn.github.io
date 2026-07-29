---
layout: page
title: Aligning Qwen2.5-0.5B with RLHF and PPO
description: TRL supervised fine-tuning, reward modeling, and PPO alignment on HelpSteer3
importance: -4
category: RL
github: "https://github.com/djdhillxn/rlhf"
portfolio_order: 20
portfolio_tags: [RLHF, PPO, reward modeling, LLM alignment, TRL]
portfolio_summary: |
  Motivated after applying PPO on Atari and MuJoCo, I wanted to apply it to LLM alignment. I built an end-to-end RLHF pipeline around Qwen2.5-0.5B-Instruct and NVIDIA HelpSteer3: supervised fine-tuning, pairwise reward modeling, and token-level PPO with LoRA, KL control, reward-model scoring, and qualitative response auditing.

  The final training data used 36K+ HelpSteer3 preference pairs. The reward model reached 65.6% held-out preference accuracy, and the response explorer exposes 2,017 held-out evaluation prompts. Under the learned reward model, the PPO policy achieved a 50.9% win rate against Base and 57.7% against SFT, with important caveats around verbosity, repetition, and reward-model mismatch.
---

<!-- RLHF Trained Qwen2.5-0.5 Instruct LLM model with SFT training on HelpSteer3 dataset. Performed Reward model training using HelpSteer3. Executed Qwen2.5-0.5 Instruct human alignment using RLHF using PPO with reference SFT model and using trained reward model. See codes. -->

<!-- [RLHF using PPO](/projects/rlhf) Motivated after applying PPO on Atari and MuJoCo, I wanted to apply it to LLMs. I built an RLHF pipeline around Qwen2.5-0.5B-Instruct and HelpSteer3: supervised fine-tuning, pairwise reward modeling, and token-level PPO with LoRA, KL control, reward-model scoring, and qualitative response auditing.
--> 
<!-- explores whether preference feedback can make a small instruction-tuned language model more helpful. I built an end-to-end pipeline around Qwen2.5-0.5B and HelpSteer3: supervised fine-tuning, pairwise reward modeling, and a custom token-level PPO loop with LoRA, GAE, and KL control.  -->


<link rel="stylesheet" href="{{ '/assets/css/rlhf/project.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/rlhf/response-explorer.css' | relative_url }}">

<p class="rlhf-technical-notes-link"><a href="#technical-notes">Read technical notes here.</a></p>

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

The goal is to use preference data from [NVIDIA HelpSteer3](https://huggingface.co/datasets/nvidia/HelpSteer3)
to align the [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) LLM toward responses that a human would prefer over boring or mechanistic bags of words. The 3-step process begins with supervised fine-tuning (SFT) using the preferred responses in the training dataset. Then I train a reward model on HelpSteer3 prompt-response pairs, where one response is preferred over the other. The reward model learns to assign higher scores to preferred responses and lower scores to rejected responses. Finally, I use that reward model to train the LLM policy toward preferred responses using reinforcement learning methods such as PPO, with a frozen SFT reference policy, KL control, and value estimates for token-level optimization.

<!-- The PPO step is discussed in detail below. -->

I learned that making PPO training run stably is only one part of LLM alignment; the quality of the preference data, the reward model, the stopping behavior, and the evaluation protocol can matter just as much as the optimizer. This project gave me a working system in which those interactions are visible and measurable, and a concrete foundation for better-controlled alignment experiments. After training, I used the fine-tuned aligned model to generate responses to validation prompts and evaluate its performance using the trained reward model. For human review, I built a response explorer app to compare the outputs of the base and aligned models side by side. Even though the model used was the smallest possible weight, owing to my own compute budgets, I took this project as a learning curve by reading about the progression of developement of the RLHF domain from 2017 onwards and it introduced me to several ideas new to me.

**[Find the full interactive Base vs PPO response explorer here](#response-explorer)**.
The RLHF pipeline is implemented in my [RLHF repository](https://github.com/djdhillxn/rlhf), with more documentation on experiments, evaluation, and response analysis.

<!-- The implementation covers supervised fine-tuning, pairwise reward modeling, and KL-controlled token-level PPO.  -->

## Training pipeline

HelpSteer3 provides 38,459 training and 2,017 validation preference records spanning general, STEM, code, and multilingual prompts. After filtering invalid or tied preference rows, the final TRL training run used 36,264 rows for SFT and reward-model training and 1,917 reward-model validation pairs.

1. **Supervised fine-tuning.** First, the preferred responses train a LoRA adapter over Qwen2.5-0.5B-Instruct. Expanding the total sequence budget from 1,024 to 4,096 tokens reduced response truncation from roughly 38% to less than 1%. The final SFT run used one epoch, LoRA rank 16, an effective batch size of 32, and reached 72.02% eval mean token accuracy.
2. **Reward modeling.** Next, a scalar reward head is trained with a Bradley-Terry pairwise ranking loss so chosen responses score above rejected ones. The final reward model starts from the merged SFT model and uses LoRA rank 32, reward centering, and 2 total epochs. It reached **65.62% validation pairwise audit accuracy** across 1,917 usable pairs.
3. **PPO alignment.** The SFT checkpoint initializes both the trainable policy and frozen reference. PPO then optimizes generated response tokens using clipped policy and value objectives, reward whitening, an RM-initialized critic, and a KL penalty that limits drift from the reference.

The final PPO run followed the most important N+ implementation details I studied: dropout disabled during PPO, behavior log-probabilities matched to the sampling temperature, EOS-aware fixed-length generation, a missing-EOS reward of `-1.0`, Adam epsilon `1e-5`, reward whitening, and a reward-model-initialized value model. The run used prompts up to 3,072 tokens, PPO responses up to 768 new tokens, temperature 0.7, KL coefficient 0.07, a `3e-6` learning rate, and four PPO epochs per rollout batch. It was configured for 12,000 episodes, and I evaluated the selected policy after 6,400 episodes / 100 optimizer steps. I closely followed the N+ implementation paper for practical RLHF/PPO details that are easy to miss but matter in training.

## Discussion

I started out resolved to understand every moving part of the RLHF process, so I wrote my own custom code instead of relying on a ready-made pipeline. I am learning best practices for reward model training and keeping in mind the scaling laws for reward model overoptimization. The length of response outputs must also be controlled. I think the SFT is reasonable as it is, while the reward model and the PPO step need extra attention and iteration. Before moving on to more recent or advanced methods such as GRPO, I want to demonstrate that I can achieve sensible results with PPO alone. Another major factor to consider is the token limits for the context, prompt, and response. This project is my first introduction to Reinforcement Learning from Human Feedback (RLHF), and I know I need to run more experiments throughout the steps of this 3-way process to achieve stronger results. But I am learning a lot. Learning about what things fail. That's precious. This LLM alignment is tricky, and the reward model will surely try to find ways to proxy its way to high rewards, only to later unravel that the outputs for these high-reward responses can fall under the adjectives of repetition, data fabrication, and downright incorrect statements.

With my own evaluation code, I have the freedom to perform a range of evaluations in various ways, such as pairwise comparisons between Base and SFT, Base and PPO, and SFT and PPO. The SFT vs. PPO comparison helps identify whether PPO alignment is actually working. These more granular comparisons can be conducted quantitatively using the reward model and qualitatively through human inspection of anomalous, high-reward cases. The need for human inspection and auditing motivated me to build a visually less-boring response explorer. I might be able to use this explorer in several places across several projects. Qualitative auditing is also implemented using heuristics and 4-grams, and it is surprisingly useful. Further, the evaluation code has a resumable policy evaluation suite because I have limited computing resources, and things break down in the middle of runs. Checkpointing and resuming are the most obvious ways to handle this. I don't have infinite compute, alright! It's also the reason I chose the half-a-billion-parameter model.

After wrestling with the complications and illuminating failures in my own code, I eventually transitioned to Hugging Face TRL for the SFT, reward model, and PPO trainer loops. This shift made the final training process cleaner and more in line with established best practices. Despite adopting TRL for the main training, my repository still houses the HelpSteer3 preprocessing, chat formatting, and the response explorer. I built these tools along the way to support and evaluate the project. Having gone through both the hands-on, low-level implementation and the more standardized TRL approach, I gained a perspective that custom code exposed failure points early, while TRL provided the stability needed for robust results. The response explorer linked above now exposes the full 2,017-prompt validation set, rather than just a curated subset. It keeps the Base and PPO outputs side by side and adds rule-based triage labels so I can move quickly from aggregate metrics to concrete examples. The results are not perfect, and there is still a long way to go, but this final TRL run is the most sensible iteration I have obtained. The reward model is not perfect, and the PPO method still needs stronger safeguards against premature stopping and reward-quality issues. One ambitious goal anchoring future experiments is to determine whether a modest LLM can produce human-preferred responses with careful training on a high-quality preference dataset.

## Evaluation

The evaluator generated Base, SFT, and PPO responses once for each of the 2,017 HelpSteer3 validation prompts and scored every response with the same reward model. For this portfolio page, I focus on the most important comparison: **Base Qwen2.5-0.5B-Instruct vs the PPO-aligned policy**. The comparison below is therefore a reward-model-based comparison, not a human preference study. More granular Base vs SFT and SFT vs PPO tables are documented in the [RLHF repository](https://github.com/djdhillxn/rlhf).

The primary suite allows up to 1,024 generated tokens during evaluation while keeping the prompt budget at 3,072 tokens. The selected PPO policy itself was trained with 768-token rollouts.

<div class="rlhf-eval-tables rlhf-eval-tables-focused">
  <section class="rlhf-eval-table-card" aria-labelledby="rlhf-base-ppo-heading">
    <h3 id="rlhf-base-ppo-heading">Base vs PPO reward-model comparison</h3>
    <div class="rlhf-eval-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Policy</th>
            <th>Wins</th>
            <th>Win rate</th>
            <th>Mean reward</th>
            <th>Median tokens</th>
            <th>Cap-hit rate</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Base</td><td>981</td><td>48.64%</td><td>0.0803</td><td>331</td><td>8.82%</td></tr>
          <tr><td>PPO</td><td>1027</td><td>50.92%</td><td>0.7300</td><td>520</td><td>27.42%</td></tr>
          <tr><td>Tie</td><td>9</td><td>0.45%</td><td>-</td><td>-</td><td>-</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="rlhf-eval-table-card rlhf-eval-summary-card" aria-labelledby="rlhf-summary-heading">
    <h3 id="rlhf-summary-heading">Headline result</h3>
    <p>
      PPO wins <strong>1,027 / 2,017</strong> Base comparisons under the learned reward model, for a <strong>50.92%</strong> win rate and a mean PPO-minus-Base reward delta of <strong>+0.6497</strong>.
    </p>
    <p>
      The caveat is just as important: PPO answers are longer and hit the 1,024-token evaluation cap more often.
    </p>
  </section>
</div>

<div class="rlhf-domain-card" aria-labelledby="rlhf-domain-heading">
  <h3 id="rlhf-domain-heading">Where PPO helps most</h3>
  <p>
    The PPO policy is strongest on general prompts and weaker on code, STEM, and multilingual prompts. Bars show reward-model wins within each domain.
  </p>
  <div class="rlhf-domain-legend" aria-hidden="true">
    <span><i class="rlhf-domain-base"></i> Base wins</span>
    <span><i class="rlhf-domain-ppo"></i> PPO wins</span>
    <span><i class="rlhf-domain-tie"></i> Ties</span>
  </div>
  <div class="rlhf-domain-bars">
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>General</strong><span>931 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="General: PPO 56.82%, Base 42.86%, ties 0.32%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:42.86%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:56.82%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:0.32%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 56.82%</div>
    </div>
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>Code</strong><span>438 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="Code: PPO 42.92%, Base 57.08%, ties 0.00%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:57.08%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:42.92%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 42.92%</div>
    </div>
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>STEM</strong><span>245 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="STEM: PPO 48.16%, Base 51.43%, ties 0.41%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:51.43%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:48.16%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:0.41%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 48.16%</div>
    </div>
    <div class="rlhf-domain-row">
      <div class="rlhf-domain-label"><strong>Multilingual</strong><span>403 prompts</span></div>
      <div class="rlhf-domain-stack" aria-label="Multilingual: PPO 47.64%, Base 51.12%, ties 1.24%">
        <span class="rlhf-domain-segment rlhf-domain-base" style="width:51.12%"></span>
        <span class="rlhf-domain-segment rlhf-domain-ppo" style="width:47.64%"></span>
        <span class="rlhf-domain-segment rlhf-domain-tie" style="width:1.24%"></span>
      </div>
      <div class="rlhf-domain-value">PPO 47.64%</div>
    </div>
  </div>
  <div class="rlhf-eval-table-scroll rlhf-domain-table">
    <table>
      <thead>
        <tr><th>Domain</th><th>Prompts</th><th>PPO wins</th><th>Base wins</th><th>Ties</th><th>PPO win rate</th></tr>
      </thead>
      <tbody>
        <tr><td>General</td><td>931</td><td>529</td><td>399</td><td>3</td><td>56.82%</td></tr>
        <tr><td>Code</td><td>438</td><td>188</td><td>250</td><td>0</td><td>42.92%</td></tr>
        <tr><td>STEM</td><td>245</td><td>118</td><td>126</td><td>1</td><td>48.16%</td></tr>
        <tr><td>Multilingual</td><td>403</td><td>192</td><td>206</td><td>5</td><td>47.64%</td></tr>
      </tbody>
    </table>
  </div>
</div>

## Qualitative analysis of responses

<!-- What the aggregate metrics miss -->

I audited all 2,017 rows using reward margins, response length, cap hits, EOS behavior, repeated word-level 4-grams, and manual inspection of selected extremes. PPO produced useful local improvements, including increased supportive responses and better coverage of some multi-part instructions. It also had the highest repetition rate: **31.88%** of PPO responses crossed a 25% repeated 4-gram threshold, compared with **10.11%** for Base. This signals a substantial repetition cost alongside PPO’s gains. The full rule-based triage assigns 8 likely clean PPO wins, 354 modest clean PPO wins, 64 strong PPO regressions, 288 severe repetition failures, 228 repetition-risk cases, 151 reward-model false-positive risks, and 924 examples that need manual review. Some of the largest apparent PPO victories were visibly broken loops, prompt restatements, or irrelevant continuations. Other failures included fabricated citations and incorrect scientific procedures. These examples expose reward-model blind spots in both directions: the learned reward model sometimes rewarded broken responses and sometimes rejected comparatively useful ones. That makes a stronger, more skeptical read necessary.

The final PPO policy is stable and measurably changes behavior. It narrowly edges the base instruction model under the learned reward model, but it is not a universal improvement. PPO produces meaningful local wins alongside stopping and repetition failures. The result I would defend is the complete, inspectable RLHF system and its diagnostics, which support the conclusion that PPO improved some behaviors while introducing clear tradeoffs. I would not claim that PPO universally improved Qwen2.5-0.5B-Instruct. I hope you will treat the evidence as support for the system rather than as an endorsement of the training parameters I used. The PPO training I ran had only 100 update steps. I believe things could be better or worse if I trained longer, so I think I would need to rethink the PPO training step parameters to make them even more robust. I will continue to iterate on the pipeline to achieve better results and learn best practices empirically. I will do so when I get hold of some more compute!

## Future work

The short version of what I would do next:

- **Human preference review.** Use blinded human comparison on a stratified sample from the full validation explorer to calibrate where the learned reward model agrees with visible quality and where it fails.
- **Hard-negative reward modeling.** Retrain the reward model with examples from the audit: repetition loops, prompt restatements, fabricated citations, irrelevant continuations, malformed code, and incorrect STEM answers.
- **Controlled token-budget studies.** Compare 512, 768, and 1,024 generated-token evaluations with the same checkpoint, decoding settings, prompt order, batch size, and software environment.
- **Better PPO stopping rules.** Select checkpoints using reward win rate, KL, EOS rate, cap-hit rate, repetition, and human review rather than reward score alone.
- **Longer or curriculum PPO.** Continue PPO only when those diagnostics remain healthy, or train with a response-length curriculum instead of jumping straight to very long rollouts.
- **Preference-objective baselines.** Compare PPO against DPO/IPO/ORPO/GRPO-style methods from the same SFT checkpoint so the project can separate reward-model quality from the online RL algorithm.
- **Scale carefully.** Repeat the pipeline on a stronger 1.5B or 3B model after the evaluator and reward model become more trustworthy.

## About this project's motivation

I got motivated to work on this project after learning in detail about policy optimization methods and using them to run [training experiments](/projects/trpo) on Atari games and MuJoCo locomotion tasks.
