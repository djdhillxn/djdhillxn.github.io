---
layout: page
title: Estimation of the Warfarin Dose
description: Personalized dose selection with contextual bandits
img: #assets/img/1.jpg
importance: -1
category: RL
github: "https://github.com/djdhillxn/warfarin"
---

Warfarin has a narrow therapeutic range, yet the appropriate dose can vary substantially with a patient's demographics, medications, clinical history, and genetics. This project studies whether an online learner can use that context to choose among three weekly dose classes: **low** (below 21 mg), **medium** (21-49 mg), and **high** (above 49 mg).

<!-- Warfarin Project on multi-arm bandits for warfarin drug dosage estimation. Implemented contextual bandits using LinUCB and LinTS. Online learning on 5,528 patients data. Performed data cleaning and imputations using various methods. -->

Implemented Contextual bandits for learning online the dosages of warfarin, including LinUCB and LinTS. The project grew into a broader investigation of data preparation, exploration, and model structure. It is an experimental study, not a clinical prescribing tool.

I used **5,528 patient records** from the International Warfarin Pharmacogenetics Consortium dataset. The preprocessing work handles mixed clinical, medication, demographic, and genetic variables; preserves informative missingness; compares K-nearest-neighbor and iterative Bayesian-ridge imputation; and excludes identifiers and post-treatment outcomes that could leak the target. I then compared fixed and published IWPC dosing references with LinUCB, ridge and hybrid ridge variants, a sparse Lasso-based UCB policy, and Linear Thompson Sampling.

The strongest learned configuration so far, a hybrid ridge policy with shared ordinal dose structure, reaches approximately **68.36% mean online accuracy** over repeated patient permutations. This improves on the 61.18% fixed-dose baseline and the roughly 64% clinical formula, while remaining slightly below the pharmacogenetic reference near 69%. The [GitHub repository and its README](https://github.com/djdhillxn/warfarin) contain the full preprocessing rationale, model implementations, experiment notebooks, diagnostics, and generated reports.