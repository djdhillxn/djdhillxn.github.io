---
layout: page
title: Aligning Qwen2.5-0.5B LLM with RLHF
description: Long-context supervised fine-tuning, reward modeling, and token-level PPO
importance: -4
category: RL
github: "https://github.com/djdhillxn/trpo"
---

<link rel="stylesheet" href="{{ '/assets/css/rlhf/project.css' | relative_url }}">

**[Open the interactive Base vs PPO response explorer]({{ '/projects/rlhf-comparison/' | relative_url }})**

This project extends my [policy-optimization work](/projects/trpo) from continuous-control agents to language-model post-training. I built an end-to-end reinforcement learning from human feedback pipeline for [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) using preference data from [NVIDIA HelpSteer3](https://huggingface.co/datasets/nvidia/HelpSteer3). The implementation covers supervised fine-tuning, pairwise reward modeling, KL-controlled token-level PPO, resumable policy evaluation, and qualitative auditing.

I implemented the central training and evaluation path directly instead of treating a packaged PPO trainer as a black box. This made it possible to inspect response-token objectives, value estimates, the frozen reference-policy constraint, checkpoint resolution, and the failure modes that appear when a policy optimizes an imperfect learned reward.

The rest of this write-up follows the project from method to evidence. I first describe the SFT, reward-model, and PPO training pipeline; I then report the full policy-suite evaluation and use the qualitative audit to examine what the aggregate metrics miss. The final sections interpret the mixed result, outline the next experiments I would prioritize, and summarize what I learned.

## Training pipeline

HelpSteer3 provides 38,459 training and 2,017 validation preference records spanning general, STEM, code, and multilingual prompts.

1. **Supervised fine-tuning.** The preferred responses train a LoRA adapter over the attention and MLP projection layers. Expanding the total sequence budget from 1,024 to 4,096 tokens reduced training-response truncation from roughly 38% to less than 1%.
2. **Reward modeling.** A scalar reward head is trained with a pairwise ranking loss so that chosen responses score above rejected responses. The final two-epoch, 4,096-token reward model reached **71.62% validation pairwise accuracy** across 1,917 usable pairs.
3. **PPO alignment.** The SFT checkpoint initializes both the trainable policy and frozen reference. PPO optimizes generated response tokens using clipped policy and value objectives, generalized advantage estimates, and a KL penalty that limits drift from the reference.

The final PPO run used prompts up to 3,072 tokens, responses up to 512 tokens, LoRA rank 16, a `3e-7` learning rate, one PPO epoch per rollout batch, and conservative KL control. It completed 397 of 400 requested updates without empty-response collapse.

## Full policy-suite evaluation

The evaluator generates Base, SFT, and PPO responses once for each of the 2,017 validation prompts and scores all three with the same reward model. The primary suite allows up to 1,024 generated tokens while keeping prompt plus response within the 4,096-token training budget.

<div class="rlhf-eval-tables">
  <section class="rlhf-eval-table-card" aria-labelledby="rlhf-three-way-heading">
    <h3 id="rlhf-three-way-heading">Three-way results</h3>
    <div class="rlhf-eval-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Policy</th>
            <th>Three-way wins</th>
            <th>Win rate</th>
            <th>Mean reward</th>
            <th>Median response tokens</th>
            <th>Cap-hit rate</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Base</td><td>978</td><td>48.49%</td><td>-3.3634</td><td>334</td><td>8.08%</td></tr>
          <tr><td>SFT</td><td>475</td><td>23.55%</td><td>-3.6114</td><td>360</td><td>10.16%</td></tr>
          <tr><td>PPO</td><td>467</td><td>23.15%</td><td>-3.5771</td><td>363</td><td>11.60%</td></tr>
          <tr><td>Tie</td><td>97</td><td>4.81%</td><td>-</td><td>-</td><td>-</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="rlhf-eval-table-card" aria-labelledby="rlhf-pairwise-heading">
    <h3 id="rlhf-pairwise-heading">Pairwise results</h3>
    <div class="rlhf-eval-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Comparison</th>
            <th>Right-policy wins</th>
            <th>Right win rate</th>
            <th>Mean right-minus-left reward</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Base vs SFT</td><td>763</td><td>37.83%</td><td>-0.2480</td></tr>
          <tr><td>Base vs PPO</td><td>785</td><td>38.92%</td><td>-0.2137</td></tr>
          <tr><td>SFT vs PPO</td><td>892</td><td>44.22%</td><td>+0.0343</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</div>

Increasing the inference allowance substantially reduced truncation: cap-hit rates fell from roughly 30% in the earlier 512-token suite to 8-12% in the primary run. The older and newer suites also used different generation batch sizes, however, so their metric changes are a run-to-run comparison rather than a controlled one-variable token-limit ablation.

## What the aggregate metrics miss

I audited all 2,017 rows using reward margins, response length, cap hits, repeated word-level 4-grams, and manual inspection of selected extremes. PPO produced useful local improvements, including more supportive responses and better coverage of some multi-part instructions. It also had the highest measured repetition rate: **16.11%** of PPO responses crossed a 25% repeated 4-gram threshold, compared with 7.49% for Base.

The audit found 36 PPO responses that combined a reward above `2.0` with substantial repetition. Some of the largest apparent PPO victories were visibly broken loops, prompt restatements, or irrelevant continuations. Other failures included fabricated citations and incorrect scientific procedures. These examples exposed reward-model blind spots in both directions: the judge sometimes rewarded broken responses and sometimes rejected comparatively useful ones.

## Interpretation

The final PPO checkpoint is stable and changes behavior measurably, but it does not outperform the original instruction model overall. Base wins most comparisons, while PPO produces a meaningful minority of local improvements alongside more stopping and repetition failures. The result I would defend is therefore the complete, inspectable RLHF system and its diagnostics, not a claim that PPO universally improved Qwen2.5-0.5B-Instruct.

## Future work

This was my first end-to-end introduction to RLHF, and the mixed result gave me a practical map of where alignment systems fail. My next iteration would begin with controlled evaluation and blinded human review, then retrain the reward model with hard negatives from the audit, including repetition loops, prompt restatements, fabricated citations, and incorrect technical answers. I also want to test explicit stopping and repetition objectives, length-aware PPO curricula, stronger reward models, and direct preference methods such as DPO against the same SFT checkpoint.

## Conclusion

I learned that making PPO training run stably is only one part of LLM alignment; the quality of the preference data, reward model, stopping behavior, and evaluation protocol can matter just as much as the optimizer. This project gave me a working system in which those interactions are visible and measurable, along with a concrete foundation for better-controlled alignment experiments. I am continuing to iterate on the pipeline rather than treating this first result as a finished benchmark.

The implementation, configurations, experiment history, generated responses, and audit tooling are available in the [TRPO/RLHF repository](https://github.com/djdhillxn/trpo).
