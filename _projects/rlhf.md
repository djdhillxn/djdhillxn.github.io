---
layout: page
title: Aligning Qwen2.5-0.5B LLM with RLHF
description: Supervised fine-tuning, reward modeling, and PPO for language-model alignment
importance: -4
category: RL
github: "https://github.com/djdhillxn/trpo"
---

This project asks a practical question: what changes when reinforcement learning moves from continuous-control agents to language models? I adapted the PPO machinery from my [policy-optimization project](/projects/trpo) into an end-to-end reinforcement learning from human feedback pipeline for [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), using preference data from [NVIDIA HelpSteer3](https://huggingface.co/datasets/nvidia/HelpSteer3).

I implemented the central training and evaluation path directly, rather than using a packaged PPO trainer as the main engine, so I could inspect the token-level objectives, reference-policy constraint, value estimates, and failure modes.

#### Training pipeline

The pipeline has three stages:

1. **Supervised fine-tuning (SFT).** HelpSteer3 contains 40,476 human-annotated preference examples across general, STEM, code, and multilingual tasks, divided into 38,459 training and 2,017 validation records. The preferred responses are used to adapt the instruction model before reinforcement learning. Training uses LoRA adapters across the attention and MLP projection layers, reducing the number of trainable parameters while preserving the pretrained base model.
2. **Reward modeling.** A scalar reward head is trained on chosen/rejected response pairs. The pairwise ranking loss encourages the chosen response to receive a higher score, with preference margins used as example weights.
3. **PPO alignment.** The SFT model becomes both the initial policy and the frozen reference. The policy generates responses, the reward model scores them, and a KL penalty discourages the updated policy from drifting too far from the reference.

The PPO implementation computes response-token log probabilities, generalized advantage estimates, returns, clipped policy objectives, clipped value losses, and entropy regularization. Only generated response tokens contribute to the optimization; prompt tokens are masked out. I used LoRA for the trainable policy while keeping the reference and reward models frozen.

#### Engineering the experiment

Language-model PPO has several wonderfully inconvenient ways to fail. A policy can exploit the reward model, collapse to very short answers, drift far from the reference, or appear to train while an incorrectly resolved checkpoint quietly loads the base model.

To make those failures visible, I added:

- explicit checkpoint validation and reusable run manifests;
- adaptive KL control and reference-log-ratio monitoring;
- response-length, empty-output, and policy-drift safety guards;
- reward clipping and short-response penalties;
- periodic samples, metric exports, and plots; and
- a policy-suite evaluator for base, SFT, and PPO checkpoints on the same prompts.

The implementation uses PyTorch, Hugging Face Transformers and Datasets, PEFT/LoRA, and mixed-precision training. The current full-run configuration supports prompts up to 3,072 tokens and generations up to 512 tokens, with checkpoints saved throughout training for comparison rather than trusting only the final update.

#### Evaluation and findings

The saved reward-model run reached **66.46% pairwise validation accuracy** with an average chosen-versus-rejected reward margin of **5.02**. The subsequent PPO run completed 250 updates and remained numerically stable enough to evaluate, but the held-out comparison did not show an improvement: across 200 prompts, the base instruction model won 113 reward-model comparisons and PPO won 87, with a mean PPO reward delta of **-0.281**.

<!-- The evaluation also documents where PPO failed to improve, which became one of the useful results. -->

I consider that a result, not a footnote. Qualitative inspection exposed multilingual drift and a debug-like degenerate response, while the aggregate evaluation showed that optimizing the learned reward was not reliably improving held-out responses. In response, I tightened KL anchoring, added early-stop guards for policy drift and empty responses, strengthened checkpoint resolution, and expanded the evaluator beyond a single mean reward.

The main lesson was that an RLHF pipeline is only as credible as its controls. A decreasing loss or a few attractive examples are not sufficient evidence of alignment; the reward model, policy drift, response quality, and evaluation protocol all need independent scrutiny. In this experiment, knowing when PPO had *not* earned a victory lap became the most valuable part of the work.

The complete implementation, configurations, run notes, and evaluation artifacts are available in the [RLHF section of the TRPO repository](https://github.com/djdhillxn/trpo/tree/main/trpo_repro/rlhf).
