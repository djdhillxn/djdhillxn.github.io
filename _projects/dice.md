---
layout: page
title: "DICE Dial: Continuous Dexterous In-Hand Die Reorientation"
description: "Continuous sequential die reorientation with a 20-DoF Shadow Hand in Isaac Lab, with held-out physics robustness analysis"
github: "https://github.com/djdhillxn/dice"
category: Robotics & RL
portfolio_order: 1
portfolio_exclude: false
portfolio_tags:
  - dexterous manipulation
  - reinforcement learning
  - Isaac Lab
  - PPO
  - asymmetric actor-critic
  - simulation robustness
portfolio_image: assets/img/dice/dice_nominal_success_poster.webp
portfolio_image_alt: "DICE Dial dexterous in-hand manipulation with a Shadow Hand in Isaac Lab"
portfolio_summary: |
  DICE Dial trains a 20-DoF Shadow Hand in NVIDIA Isaac Lab to continuously rotate a numbered die to requested faces without resetting between commands. A 126-D actor / 247-D privileged critic PPO policy trained over 327.68M transitions achieved 97.09% issued-command completion and 0.617 s median latency nominally, with essentially unchanged performance under held-out ±20% mass/friction variation. A 1.5×-mass, 0.7×-friction stress test raised episode drops to 45.30%, exposing a long-horizon grasp-retention boundary.
---

Dexterous in-hand manipulation is difficult because a high-dimensional hand must coordinate intermittent multi-point contacts while continuously preventing object loss. DICE Dial turns this into a **continuous semantic-control problem**: the policy receives a requested die face, reorients the object until that face is stably upward, and immediately receives another non-identical command **without resetting the hand or die**.

The final task was used from the first training transition. Training used nominal object physics with **no mass/friction domain randomization**, which makes the later ±20% physics evaluation a genuinely held-out robustness test rather than a replay of the training distribution.

---

### Video Demonstrations

All footage is shown at **0.5× playback** for inspection; the policy itself runs at the original 60 Hz control rate. Seed 9 is used consistently as a representative presentation rollout, while all quantitative claims come from the separate 1,000-episode evaluations.

##### 1. Nominal Semantic Success
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/dice/dice_nominal_success.mp4" poster="/assets/img/dice/dice_nominal_success_poster.webp" class="dice-demo-video" width="760" height="428" controls=true autoplay=true loop=true muted=true title="DICE Dial nominal in-hand reorientation" caption="Nominal rollout (Seed 9): 12 consecutive commands completed in 7.68 simulation seconds with zero drops. Synchronized oblique manipulation view (left) and top-down verification view (right)." %}
</div>

The HUD reports the requested face, the current upward face, angular face error, and progress through the 20-step confirmation hold. The top-down camera makes the semantic result independently visible while the oblique view shows the finger gaiting and contact transitions.

##### 2. Held-Out Physics Variation ($$\pm 20\%$$ Mass & Friction)
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/dice/dice_physics_variation.mp4" poster="/assets/img/dice/dice_physics_variation_poster.webp" class="dice-demo-video" width="760" height="428" controls=true autoplay=true loop=true muted=true title="DICE Dial held-out physics comparison" caption="Representative comparison: nominal condition (left, Seed 9, 7.68s) beside a held-out ±20% mass/friction rollout (right, Seed 9, 8.08s). The policy and 12-face command sequence are unchanged." %}
</div>

The important visual result is the similarity. The controller was trained only under nominal object physics, yet the same learned policy preserves qualitatively similar coordination under an unseen material-parameter shift. The aggregate evaluation below, rather than this single pair of rollouts, establishes the robustness result.

##### 3. Adverse Retention Boundary ($$1.5\times$$ Mass, $$0.7\times$$ Friction)
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/dice/dice_adverse_boundary.mp4" poster="/assets/img/dice/dice_adverse_boundary_poster.webp" class="dice-demo-video" width="760" height="428" controls=true autoplay=false loop=false muted=true title="DICE Dial adverse grasp-retention boundary" caption="Adverse stress rollout (Seed 9): 10 consecutive commands completed before a grasp-retention failure at 8.07 simulation seconds. Oblique view (left) and side contact view (right)." %}
</div>

This representative trajectory succeeds repeatedly before the grasp is finally lost. That behavior is consistent with the aggregate adverse evaluation: semantic targeting remains strong, while the probability of eventual object loss rises sharply over long command sequences. Because mass and friction are changed together, the experiment identifies a **combined stress boundary**, not the independent causal effect of either parameter.

---

### Task Formulation

Let $$\mathbf{n}_k$$ denote the object-frame outward normal of requested face $$k\in\{1,\dots,6\}$$ and let $$R_{\text{die}}\in SO(3)$$ be the current die rotation. The requested normal in world coordinates is

$$
\mathbf{n}_{\text{world}} = R_{\text{die}}\mathbf{n}_k,
$$

with vertical alignment

$$
\text{Alignment}=\mathbf{n}_{\text{world}}\cdot\hat{\mathbf z}=\cos\theta.
$$

A command is completed only after **20 consecutive control steps** (about $$0.333\text{ s}$$) satisfying all three gates:

- **Orientation:** $$\theta\le 16^\circ$$, equivalently $$\text{Alignment}\ge \cos 16^\circ\approx0.961$$.
- **In-hand position:** $$\|\mathbf p_{\text{die}}-\mathbf p_{\text{target}}\|\le0.12\text{ m}$$.
- **Settling speed:** $$\|\boldsymbol\omega_{\text{die}}\|\le1.25\text{ rad/s}$$.

As soon as the hold reaches 20 steps, the environment issues a different target face and continues from the current physical state.

---

### Reward Design: Avoiding the Loitering Trap

A static posture reward can encourage a policy to stop at a partially aligned orientation: staying still keeps collecting positive reward, while attempting the final contact-breaking rotation introduces drop risk.

DICE Dial instead rewards the **reduction in angular error**:

$$
\theta_t=\arccos\left(\operatorname{clamp}(\text{Alignment}_t,-1,1)\right),
\qquad
r_{\text{progress}}=40(\theta_{t-1}-\theta_t).
$$

A stationary policy therefore receives exactly zero angular-progress reward. The final objective also includes:

- **signed hold-progress shaping**, which rewards each valid confirmation step and claws the accumulated shaping back if a partial hold breaks;
- a raw **+250 command-completion bonus** and **−100 drop penalty**;
- position and near-target angular-speed penalties;
- an applied-target rate penalty; and
- a raw-action boundary penalty for Gaussian policy outputs beyond $$|a|>0.9$$ before the applied command is clamped to $$[-1,1]$$.

This differential formulation was the key change that eliminated the observed static-reward-farming behavior without changing the task into a staged problem.

---

### Asymmetric Actor-Critic

The policy uses an **asymmetric actor-critic** so the value function can exploit extra simulator state without giving those same privileged features to the actor.

| Component | Input | Network |
|---|---|---|
| **Actor** | 126-D task-facing observation | MLP `[512, 512, 256, 128]`, ELU + input normalization |
| **Critic** | 247-D privileged state | MLP `[512, 512, 256, 128]`, ELU + input normalization |
| **Action** | 20 continuous joint-target commands | Applied to the Shadow Hand controller |

The 126-D actor observation contains hand proprioception, smoothed controller state, cube-frame fingertip kinematics, die translation/velocity, a continuous 6D rotation representation, command geometry, hold progress, and five bounded fingertip load proxies. The critic adds full fingertip reaction wrenches and spatial velocities, ground-truth object state, and raw joint state.

This is a **deployment-oriented information split**, not a claim of completed real-robot deployment: hardware transfer would still require reliable object-state estimation, compatible tactile/load sensing, actuator modeling, and system identification.

---

### Training

| Setting | Final value |
|---|---:|
| Parallel environments | 2,048 |
| Rollout length | 32 steps / environment |
| PPO iterations | 5,000 |
| Environment transitions | 327,680,000 |
| Training seed | 42 |
| Learning rate | $$3\times10^{-4}$$, fixed |
| PPO clip | 0.2 |
| Discount / GAE | $$\gamma=0.99,\ \lambda=0.95$$ |
| Initial policy std | 0.6 |
| Training-time mass/friction randomization | **None** |
| Hardware | NVIDIA L4 |

A five-checkpoint nominal screening sweep selected `model_4000.pt` before the final test panels. The later `model_final.pt` was slightly faster but had a materially higher drop rate, so the last checkpoint was not automatically treated as the best policy.

---

### Empirical Evaluation

The frozen `model_4000.pt` policy was evaluated for **1,000 full 24-second episodes per condition**:

- **Nominal:** stock object at nominal physics.
- **Held-out physics:** mass and static/dynamic friction sampled within $$[0.8,1.2]$$ of nominal, with dynamic friction constrained not to exceed static friction.
- **Adverse stress:** fixed $$1.5\times$$ object mass and $$0.7\times$$ object friction.

| Metric | Nominal | $$\pm20\%$$ physics | Adverse |
|---|---:|---:|---:|
| Issued-command completion | **97.09%** | **97.07%** | **95.92%** |
| Episode drop rate | **9.70%** | **9.50%** | **45.30%** |
| Mean completed commands / episode | 33.334 | 33.072 | 23.514 |
| Median completed commands / episode | 37 | 37 | 32 |
| Median command latency | 0.617 s | 0.617 s | 0.650 s |
| Minimum per-face completion | 96.88% | 96.80% | 95.11% |

The held-out distribution produces no measurable degradation in the principal reported metrics. Under the adverse condition, per-command completion remains high while long-horizon retention degrades substantially.

**Metric note.** A new command is issued immediately after every success, so one unfinished command remains active when each episode terminates. Issued-command completion is therefore

$$
\frac{\text{completed commands}}
{\text{completed commands}+\text{episodes}},
$$

and should always be read together with drop rate and sequential throughput.

#### Adverse Failure Decomposition

Of the 453 adverse episodes that dropped the die:

| Retention statistic | Value |
|---|---:|
| Drops after completing $$\ge1$$ command | 424 (93.6%) |
| Drops after completing $$\ge10$$ commands | 219 (48.3%) |
| Median commands before drop | 9 |
| Median time before drop | 7.28 s |
| Mean commands in non-drop episodes | 33.47 |

The heavier object increases the contact forces required for support and reorientation, while lower friction reduces tangential margin before slip. Their combination is a physically plausible explanation for the observed retention loss, but the joint stress test does not isolate the two effects.

---

### Limitations & Next Step

The main remaining limitations are explicit:

- only one PPO training seed was run;
- robustness testing covers object mass/friction, not observation noise, control latency, actuator mismatch, contact compliance, or geometry variation;
- the adverse experiment changes mass and friction jointly;
- deterministic actor means exceed $$[-1,1]$$ on about 20.8% of action dimensions, although applied commands are clamped and the diagnostic is nearly unchanged across evaluation conditions; and
- no real-hardware experiment was performed.

The natural continuation is therefore not "more iterations" of the same run. It is to train the same full task with physically plausible dynamics randomization, separate mass-only and friction-only stress tests, repeat training across seeds, and then perform system identification before attempting a real-object transfer.

DICE Dial should consequently be read as a **simulation dexterous-manipulation project with measured held-out material robustness**, not as a completed sim-to-real result.

---

All code, exact environment/reward definitions, evaluation provenance, rendering manifests, detailed metrics, and the curated **[references and reading list](https://github.com/djdhillxn/dice/blob/main/docs/references.md)** are available in the **[GitHub repository](https://github.com/djdhillxn/dice)**.
