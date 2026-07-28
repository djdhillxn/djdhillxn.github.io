---
layout: page
title: Estimation of the Warfarin Dose
description: Personalized dose selection with contextual bandits
img:
importance: -1
category: RL
github: "https://github.com/djdhillxn/warfarin"
portfolio_order: 70
portfolio_tags: [contextual bandits, LinUCB, Thompson sampling, Lasso, interpretability]
#portfolio_image: assets/img/warfarin_lasso_top_coefficients_by_arm.png
#portfolio_image_alt: Sparse Lasso coefficient explanations for Warfarin dose arms
portfolio_summary: |
  I studied personalized Warfarin dose selection as an offline contextual-bandit problem over 5,528 International Warfarin Pharmacogenetics Consortium records. The learner chooses among low, medium, and high weekly dose arms from patient context, then receives feedback from the known therapeutic dose class.

  I evaluated LinUCB, regularized ridge and Lasso variants, and Linear Thompson Sampling against fixed-dose and pharmacogenetic references. The strongest learned configuration reached about 68.36% mean online accuracy, close to the pharmacogenetic reference near 69%, while sparse Lasso policies made the decision drivers easier to inspect. This is an experimental ML study, not a clinical prescribing tool.
---

Warfarin has a narrow therapeutic range, yet the appropriate dose can vary substantially with a patient's demographics, medications, clinical history, and genetics. This project studies whether an online learner can use that context to choose among three weekly dose classes: **low** (below 21 mg), **medium** (21-49 mg), and **high** (above 49 mg).

<!-- Warfarin Project on multi-arm bandits for warfarin drug dosage estimation. Implemented contextual bandits using LinUCB and LinTS. Online learning on 5,528 patients data. Performed data cleaning and imputations using various methods. -->

Implemented Contextual bandits for learning online the dosages of warfarin, including LinUCB and LinTS. The project grew into a broader investigation of data preparation, exploration, and model structure. It is an experimental study, not a clinical prescribing tool.

I used **5,528 patient records** from the International Warfarin Pharmacogenetics Consortium dataset. The preprocessing work handles mixed clinical, medication, demographic, and genetic variables; preserves informative missingness; compares K-nearest-neighbor and iterative Bayesian-ridge imputation; and excludes identifiers and post-treatment outcomes that could leak the target. I then compared fixed and published IWPC dosing references with LinUCB, ridge and hybrid ridge variants, a sparse Lasso-based UCB policy, and Linear Thompson Sampling.

The strongest learned configuration so far, a hybrid ridge policy with shared ordinal dose structure, reaches approximately **68.36% mean online accuracy** over repeated patient permutations. This improves on the 61.18% fixed-dose baseline and the roughly 64% clinical formula, while remaining slightly below the pharmacogenetic reference near 69%.

<style>
  .warfarin-project-figure {
    margin: 1.75rem 0;
    width: 100%;
  }

  .warfarin-project-figure img {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }
</style>

For interpretability, I also isolated the best binary Lasso bandit. It is not the absolute top performer, but it is much easier to read: only **47**, **54**, and **72** of the 295 engineered features remain active for low, medium, and high dose arms.

The largest learned weights show the model's sparse vocabulary for each arm: a medium-dose baseline, low-dose signals around age/genotype/body-size interactions, and high-dose signals involving genotype, medication, indication, and body-size structure.

<figure class="warfarin-project-figure">
  <img src="{{ '/assets/img/warfarin_lasso_top_coefficients_by_arm.png' | relative_url }}" alt="Largest sparse Lasso coefficients by dose arm" loading="lazy">
</figure>

For individual patients, I decompose the final saved policy's selected-vs-runner-up margin. Green terms push toward the selected dose; red terms pull toward the runner-up. These are high-margin correct examples, chosen for explanation rather than as a clinical claim.

<figure class="warfarin-project-figure">
  <img src="{{ '/assets/img/warfarin_lasso_patient_decision_explanations.png' | relative_url }}" alt="Patient-level Lasso decision explanations" loading="lazy">
</figure>

The [GitHub repository and its README](https://github.com/djdhillxn/warfarin) contain the full preprocessing rationale, model implementations, experiment notebooks, diagnostics, and generated reports.
