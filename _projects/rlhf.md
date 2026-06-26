---
layout: page
title: Aligning Qwen2.5-0.5B with RLHF and PPO
description: TRL supervised fine-tuning, reward modeling, and PPO alignment on HelpSteer3
importance: -4
category: RL
github: "https://github.com/djdhillxn/rlhf"
---

<link rel="stylesheet" href="{{ '/assets/css/rlhf/project.css' | relative_url }}">

The goal is to use preference data from [NVIDIA HelpSteer3](https://huggingface.co/datasets/nvidia/HelpSteer3)
to align the [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) LLM toward responses that a human would prefer over boring or mechanistic bags of words. The 3-step process is covered by first doing supervised fine-tuning (SFT) using the preferred responses in the training dataset. Then I train a reward model using HelpSteer3 prompt-response pairs, where one response is preferred over the other. The reward model learns to assign a higher score to the preferred response and a lower score to the rejected response. Finally, I use that reward model to train the LLM policy toward preferred responses using reinforcement learning methods such as PPO, with a frozen SFT reference policy, KL control, and value estimates for the token-level optimization.
<!-- The PPO step is discussed in detail below. -->

I learned that making PPO training run stably is only one part of LLM alignment; the quality of the preference data, reward model, stopping behavior, and evaluation protocol can matter just as much as the optimizer. This project gave me a working system in which those interactions are visible and measurable, along with a concrete foundation for better-controlled alignment experiments. I am continuing to iterate on the pipeline to achieve better results and learn best practices empirically.

After training I used the fine-tuned aligned model to produce responses to validation prompts and evaluate its performance with the trained reward model. 
**[Open the full interactive Base vs PPO response explorer]({{ '/projects/rlhf-comparison/' | relative_url }})**.
The RLHF pipeline is implemented at my [RLHF repository](https://github.com/djdhillxn/rlhf) along with more documentation about experiments, evaluation, and analyzing the responses.

<!-- The implementation covers supervised fine-tuning, pairwise reward modeling, KL-controlled token-level PPO.  -->

## Training pipeline

HelpSteer3 provides 38,459 training and 2,017 validation preference records spanning general, STEM, code, and multilingual prompts. After filtering invalid or tied preference rows, the final TRL training run used 36,264 SFT/reward-model training rows and 1,917 reward-model validation pairs.

1. **Supervised fine-tuning.** The preferred responses train a LoRA adapter over Qwen2.5-0.5B-Instruct. Expanding the total sequence budget from 1,024 to 4,096 tokens reduced training-response truncation from roughly 38% to less than 1%. The final SFT run used one epoch, LoRA rank 16, an effective batch size of 32, and reached 72.02% eval mean token accuracy.
2. **Reward modeling.** A scalar reward head is trained with a Bradley-Terry pairwise ranking loss so that chosen responses score above rejected responses. The final reward model starts from the merged SFT model, uses LoRA rank 32, reward centering, and two total epochs. It reached **65.62% validation pairwise audit accuracy** across 1,917 usable pairs.
3. **PPO alignment.** The SFT checkpoint initializes both the trainable policy and frozen reference. PPO optimizes generated response tokens using clipped policy/value objectives, reward whitening, an RM-initialized critic, and a KL penalty that limits drift from the reference.

The final PPO run followed the highest-impact N+ implementation details I studied: dropout disabled during PPO, behavior log-probabilities matched to the sampling temperature, EOS-aware fixed-length generation, a missing-EOS reward of `-1.0`, Adam epsilon `1e-5`, reward whitening, and a reward-model-initialized value model. The run used prompts up to 3,072 tokens, PPO responses up to 768 new tokens, temperature 0.7, KL coefficient 0.07, a `3e-6` learning rate, and four PPO epochs per rollout batch. It was configured for 12,000 episodes and I evaluated the selected policy after 6,400 episodes / 100 optimizer steps.

I closely followed the N+ implementation paper for practical RLHF/PPO details that are easy to miss but matter in training.

## Discussion

I am learning best practices for reward model training and keeping in mind the scaling laws for reward model overoptimization. The length of response outputs is also imperative to be controlled. I think the SFT is reasonable as it is, while the reward model and the PPO step need extra attention and iteration. Before going to more recent or advanced methods such as GRPO, I want to prove that I can get sensible results from PPO alone. Another major factor to decide about is the token limits for the context, the prompt, and the response.

<!-- , configurations, experiment history, generated responses, and audit tooling are available in the [TRPO/RLHF repository] -->

<!-- I also want to test explicit stopping and repetition objectives, length-aware PPO curricula, stronger reward models,  -->
This project is my first introduction to Reinforcement Learning from Human Feedback (RLHF), and I know I need to run more experiments across the steps in this 3-way process to arrive at stronger results. But, I am learning a lot. Learning about what things fail. That's precious. This LLM alignment is tricky and the reward model will surely try to find ways to proxy its way to good rewards only to unravel later that the outputs for these high reward responses can fall under the adjectives of repetition, data fabrication, and downright incorrect statements.

The project started with my own custom RLHF code because I wanted to understand the moving pieces instead of treating the pipeline like a black box. The final reported run uses Hugging Face TRL for the SFT, reward-model, and PPO trainer loops, while my repository still owns the HelpSteer3 preprocessing, chat formatting, evaluation suite, repetition diagnostics, curation notebooks, and response explorer. Having both stages was useful: the custom code made the failure modes visible, and TRL made the final training path cleaner and closer to established implementation practice.

Having my own evaluation code, I have the liberty to perform a range of evaluations in varying ways such as pairwise comparison of responses with the pairs: Base and SFT, Base and PPO, and SFT and PPO. The SFT vs PPO comparison is helpful to identify if the PPO alignment is actually doing some alignment or not. Those more granular comparisons can be done quantitatively through the reward model and further qualitatively through human inspection of the anomalous extreme reward cases. This necessity of human inspection/auditing motivated me to build the visually less boring response explorer. I might be able to use this explorer at several places in several projects.

The qualitative auditing is also implemented by making use of heuristics such as repeated 4-grams and is surprisingly useful. Further, the evaluation code has resumable policy evaluation because I have limited compute and things break down in the middle of runs and the most obvious way to go about doing this is if I have checkpointing and resuming capabilities. I don't have infinite compute alright! Also the reason I chose the half-a-billion parameter model.

The response explorer linked above now exposes the full 2,017-prompt validation set, not only a curated subset. It keeps the Base and PPO outputs side by side and adds rule-based triage labels so I can move quickly from aggregate metrics to concrete examples. The results are not perfect, and there is still a long way to go, but this final TRL run is the most sensible iteration I have obtained. The reward model is not perfect and the PPO method still needs better stopping and reward-quality safeguards. One ambitious goal anchoring future experiments is checking whether a modest LLM can give human-preferred responses with careful training from a high-quality preference dataset.

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

I audited all 2,017 rows using reward margins, response length, cap hits, EOS behavior, repeated word-level 4-grams, and manual inspection of selected extremes. PPO produced useful local improvements, including more supportive responses and better coverage of some multi-part instructions. It also had the highest measured repetition rate: **31.88%** of PPO responses crossed a 25% repeated 4-gram threshold, compared with **10.11%** for Base.

The full rule-based triage assigns 8 likely clean PPO wins, 354 modest clean PPO wins, 64 strong PPO regressions, 288 severe repetition failures, 228 repetition-risk cases, 151 reward-model false-positive risks, and 924 examples that need manual review. Some of the largest apparent PPO victories were visibly broken loops, prompt restatements, or irrelevant continuations. Other failures included fabricated citations and incorrect scientific procedures. These examples exposed reward-model blind spots in both directions: the learned reward model sometimes rewarded broken responses and sometimes rejected comparatively useful ones.

The final PPO policy is stable and changes behavior measurably. It narrowly edges the original instruction model under the learned reward model, but it is not a universal improvement. PPO produces a meaningful set of local wins alongside more stopping and repetition failures. The result I would defend is therefore the complete, inspectable RLHF system and its diagnostics, not a claim that PPO universally improved Qwen2.5-0.5B-Instruct.

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
