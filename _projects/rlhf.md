---
layout: page
title: Aligning Qwen2.5-0.5B LLM with RLHF
description: Long-context supervised fine-tuning, reward modeling, and token-level PPO
importance: -4
category: RL
github: "https://github.com/djdhillxn/trpo"
---

**[Open the interactive Base vs PPO response explorer]({{ '/projects/rlhf-comparison/' | relative_url }})**

This project extends my [policy-optimization work](/projects/trpo) from continuous-control agents to language-model post-training. I built an end-to-end reinforcement learning from human feedback pipeline for [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) using preference data from [NVIDIA HelpSteer3](https://huggingface.co/datasets/nvidia/HelpSteer3). The implementation covers supervised fine-tuning, pairwise reward modeling, KL-controlled token-level PPO, resumable policy evaluation, and qualitative auditing.

I implemented the central training and evaluation path directly instead of treating a packaged PPO trainer as a black box. This made it possible to inspect response-token objectives, value estimates, the frozen reference-policy constraint, checkpoint resolution, and the failure modes that appear when a policy optimizes an imperfect learned reward.

## Training pipeline

HelpSteer3 provides 38,459 training and 2,017 validation preference records spanning general, STEM, code, and multilingual prompts.

1. **Supervised fine-tuning.** The preferred responses train a LoRA adapter over the attention and MLP projection layers. Expanding the total sequence budget from 1,024 to 4,096 tokens reduced training-response truncation from roughly 38% to less than 1%.
2. **Reward modeling.** A scalar reward head is trained with a pairwise ranking loss so that chosen responses score above rejected responses. The final two-epoch, 4,096-token reward model reached **71.62% validation pairwise accuracy** across 1,917 usable pairs.
3. **PPO alignment.** The SFT checkpoint initializes both the trainable policy and frozen reference. PPO optimizes generated response tokens using clipped policy and value objectives, generalized advantage estimates, and a KL penalty that limits drift from the reference.

The final PPO run used prompts up to 3,072 tokens, responses up to 512 tokens, LoRA rank 16, a `3e-7` learning rate, one PPO epoch per rollout batch, and conservative KL control. It completed 397 of 400 requested updates without empty-response collapse.

## Full policy-suite evaluation

The evaluator generates Base, SFT, and PPO responses once for each of the 2,017 validation prompts and scores all three with the same reward model. The primary suite allows up to 1,024 generated tokens while keeping prompt plus response within the 4,096-token training budget.

| Policy | Three-way wins | Win rate | Mean reward | Median response tokens | Cap-hit rate |
|---|---:|---:|---:|---:|---:|
| Base | 978 | 48.49% | -3.3634 | 334 | 8.08% |
| SFT | 475 | 23.55% | -3.6114 | 360 | 10.16% |
| PPO | 467 | 23.15% | -3.5771 | 363 | 11.60% |
| Tie | 97 | 4.81% | - | - | - |

| Pairwise comparison | Right-policy wins | Right win rate | Mean right-minus-left reward |
|---|---:|---:|---:|
| Base vs SFT | 763 | 37.83% | -0.2480 |
| Base vs PPO | 785 | 38.92% | -0.2137 |
| SFT vs PPO | 892 | 44.22% | +0.0343 |

Increasing the inference allowance substantially reduced truncation: cap-hit rates fell from roughly 30% in the earlier 512-token suite to 8-12% in the primary run. The older and newer suites also used different generation batch sizes, however, so their metric changes are a run-to-run comparison rather than a controlled one-variable token-limit ablation.

## What the aggregate metrics miss

I audited all 2,017 rows using reward margins, response length, cap hits, repeated word-level 4-grams, and manual inspection of selected extremes. PPO produced useful local improvements, including more supportive responses and better coverage of some multi-part instructions. It also had the highest measured repetition rate: **16.11%** of PPO responses crossed a 25% repeated 4-gram threshold, compared with 7.49% for Base.

The audit found 36 PPO responses that combined a reward above `2.0` with substantial repetition. Some of the largest apparent PPO victories were visibly broken loops, prompt restatements, or irrelevant continuations. Other failures included fabricated citations and incorrect scientific procedures. These examples exposed reward-model blind spots in both directions: the judge sometimes rewarded broken responses and sometimes rejected comparatively useful ones.

## Interpretation

The final PPO checkpoint is stable and changes behavior measurably, but it does not outperform the original instruction model overall. Base wins most comparisons, while PPO produces a meaningful minority of local improvements alongside more stopping and repetition failures. The result I would defend is therefore the complete, inspectable RLHF system and its diagnostics, not a claim that PPO universally improved Qwen2.5-0.5B-Instruct.

The next priorities are a controlled evaluation with fixed batching, blinded human preference review, reward-model hard negatives drawn from the observed failures, explicit stopping and repetition objectives, and comparisons against direct preference methods.

The implementation, configurations, experiment history, generated responses, and audit tooling are available in the [TRPO/RLHF repository](https://github.com/djdhillxn/trpo).
