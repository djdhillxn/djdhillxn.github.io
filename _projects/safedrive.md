---
layout: page
title: "SafeDrive: Constrained Safe Reinforcement Learning for Autonomous Driving"
description: "Closed-loop autonomous driving in MetaDrive via SAC-Lagrangian with PID cost adaptation across 1,000 procedural 5-block maps"
github: "https://github.com/djdhillxn/safedrive"
category: RL
img: assets/img/safedrive/safedrive_architecture_overview.png
img_size: small
portfolio_order: 10
portfolio_tags:
  - safe reinforcement learning
  - SAC-Lagrangian
  - Constrained RL
  - MetaDrive
  - autonomous driving
portfolio_image: assets/img/safedrive/safedrive_architecture_overview.png
portfolio_image_alt: SafeDrive SAC-Lagrangian perception and PID cost control architecture diagram
portfolio_summary: |
  SafeDrive investigates closed-loop autonomous driving under explicit safety constraints in the MetaDrive simulator. By formulating navigation as a Constrained Markov Decision Process (CMDP), the agent optimizes Soft Actor-Critic with Lagrangian adaptation (SAC-Lagrangian) and a PID-controlled cost multiplier to dynamically bound cumulative collisions and off-road violations below a target threshold ($d \le 1.0$) across 1,000 procedural road scenarios.

  What makes SafeDrive unique is its end-to-end integration: while standard benchmarks rely on unconstrained reward penalties or fragile multi-stage curriculum switching that causes catastrophic forgetting, SafeDrive combines a 275-dimensional spatial observation space (240 360° LiDAR rays + 4 nearby-vehicle tracking slots) with a multi-domain 8-worker environment mixture over 5-block maps (`map: 5`, density 0.30) and an unconstrained Vanilla SAC ablation baseline. A non-overlapping seed evaluation protocol across Screening, Reranking, and Sealed Holdout panels ensures completely auditable safety guarantees.
---

SafeDrive is a bounded simulation project in MetaDrive investigating **Constrained Safe Reinforcement Learning** for autonomous vehicle navigation. 

Rather than relying on unconstrained reward shaping or manual multi-stage curriculum switching, the project formulates closed-loop autonomous driving as a **Constrained Markov Decision Process (CMDP)**. The objective is to learn a single policy that maximizes progress and speed rewards while strictly bounding cumulative collision and off-road safety costs below a declared threshold ($d \le 1.0$).

---

### What Makes SafeDrive Unique

If asked what sets SafeDrive apart from standard RL baselines or benchmark implementations:

1. **PID-Controlled Cost Multiplier Adaptation**: Standard Lagrangian methods suffer from severe multiplier oscillations and hyperparameter instability. SafeDrive implements a proportional-integral-derivative (PID) feedback controller on the dual multiplier $\lambda$, dynamically adjusting penalty intensity to prevent constraint overshooting and ensure smooth convergence.
2. **Multi-Domain 8-Worker Mixture over 5-Block Maps**: Instead of multi-stage curricula that suffer from catastrophic forgetting when transitioning from geometry to traffic, SafeDrive trains end-to-end on 1,000 procedural 5-block MetaDrive maps (`map: 5`) under a frozen 8-worker mixture (2 geometry workers @ $0.00$ density, 3 steady respawn traffic workers @ $0.30$ density, and 3 dynamic hybrid traffic workers @ $0.30$ density) to cross MetaDrive's integer ceiling step (yielding 18–33 dynamic vehicles per map).
3. **High-Resolution Perceptual Integration (275-D)**: Couples dense 240-ray $360^\circ$ LiDAR spatial sensing with 4-vehicle relative motion state vectors and ego kinematics into a 512-wide dual-critic MLP, natively integrated into Stable-Baselines3.
4. **Elimination of Center-Lane Lock-in Reward Traps**: Explicitly disables lateral reward shaping (`use_lateral_reward: false`) and introduces quadratic steering smoothness regularization ($0.01$) to prevent center-lane lock-in reward traps while preserving dynamic lane-changing and overtaking capabilities.
5. **Scientifically Isolated Ablation Framework**: Establishes an unconstrained **Vanilla SAC Baseline** (`configs/sac_vanilla_direct_general.yaml`) sharing the exact same 275-D perception, seeds (`40000-40999`), network (`[512, 512]`), batch size (256), 8 gradient steps, and evaluation panels as **SafeDrive SAC-Lagrangian**, isolating the algorithm optimization as the sole experimental variable.
6. **Leak-Free Auditable Evaluation Protocol**: Enforces strict non-overlapping seed assignments across Screening, Model Reranking, and Sealed Holdout panels, guaranteeing that validation scenarios never overlap with training or final test evaluation.

---

### System Architecture & Perception

<figure style="text-align: center; margin: 1.5rem 0;">
  <img src="{{ '/assets/img/safedrive/safedrive_architecture_overview.png' | relative_url }}" alt="SafeDrive SAC-Lagrangian System Architecture" loading="lazy" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <figcaption style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Overview of SafeDrive perception pipeline (275-D LiDAR + vehicle tracking), PID cost control, 8-worker multi-domain mixture, and dual-critic network architecture.</figcaption>
</figure>

#### 1. Perception & Observation Space (275-D)
The policy receives a 275-dimensional feature vector combining spatial range sensing with ego dynamics and nearby vehicle tracking:
- **240 360° LiDAR Rays**: Radial distance measurements ($[0, 50]$ meters) scanning surrounding obstacles and road boundaries.
- **4 Nearby Vehicle Slots (16-D)**: Relative coordinates $(x, y)$, heading angle, and velocity vectors for the four closest dynamic traffic obstacles.
- **Ego Kinematics & Navigation (19-D)**: Speed, steering angle, angular velocity, lane offset, route checkpoints, and navigation target vectors.

#### 2. SAC-Lagrangian Optimization & PID Cost Adaptation
The Lagrangian objective incorporates a PID feedback mechanism to regulate constraint violations:

$$\lambda_{t+1} = \left[ \lambda_t + K_p e_t + K_i \int e_t dt + K_d \frac{de_t}{dt} \right]^+$$

- **Episode Cost Limit ($d$)**: $1.0$ cumulative cost.
- **PID Parameters**: $K_p = 0.05$, $K_i = 0.0005$, $K_d = 0.1$, $\alpha_{\text{EMA}} = 0.2$, $\lambda_{\max} = 100.0$.
- **Network Architecture**: 512-wide MLP (`[512, 512]`) for policy $\pi_\theta$, reward critic $Q_R$, and cost critic $Q_C$.

#### 3. Multi-Domain Traffic Mixture & MetaDrive Modes
The training environment allocates 8 parallel subprocess workers to cover distinct driving conditions:
- **2 Geometry Workers** (`map: 5`, `traffic_density: 0.00`): Traffic-free procedural road geometry to maintain precise curve handling and lane centering.
- **3 Respawn Traffic Workers** (`map: 5`, `traffic_density: 0.30`, `respawn`): Continuous background traffic flow (~15–18 vehicles per map) for steady-state gap selection.
- **3 Hybrid Traffic Workers** (`map: 5`, `traffic_density: 0.30`, `hybrid`): Dynamic block-triggered vehicle waves (~20–33 vehicles per map) spawning directly on upcoming road blocks as the ego vehicle advances.

---

### Controlled Ablation Framework

To evaluate the exact contribution of Lagrangian safety cost constraints, SafeDrive implements a twin **Vanilla SAC Baseline**:

| Parameter / Dimension | SafeDrive SAC-Lagrangian | Unconstrained Vanilla SAC Baseline |
| :--- | :--- | :--- |
| **Config File** | `configs/sac_lagrangian_direct_general.yaml` | `configs/sac_vanilla_direct_general.yaml` |
| **Optimization** | CMDP ($d \le 1.0$, PID dual multiplier $\lambda$) | Standard unconstrained SAC (reward only) |
| **Perception** | 275-D (240 LiDAR + 4 nearby vehicles + 19 ego) | 275-D (240 LiDAR + 4 nearby vehicles + 19 ego) |
| **Network Arch** | `[512, 512]` MLP | `[512, 512]` MLP |
| **Hyperparameters** | LR $3 \times 10^{-4}$, Batch 256, 8 Grad Steps | LR $3 \times 10^{-4}$, Batch 256, 8 Grad Steps |
| **Map & Seeds** | 5-block maps (`map: 5`), seeds `40000 - 40999` | 5-block maps (`map: 5`), seeds `40000 - 40999` |
| **8-Worker Mix** | 2 geometry (0.00), 3 respawn (0.30), 3 hybrid (0.30) | 2 geometry (0.00), 3 respawn (0.30), 3 hybrid (0.30) |
| **Panels** | Screening (55k+), Reranking (60k+), Holdout (70k+) | Screening (55k+), Reranking (60k+), Holdout (70k+) |

---

### Evaluation Protocol & Panel Structure

To prevent evaluation leakage and maintain auditability over training runs, SafeDrive uses a strict three-panel evaluation protocol with non-overlapping seed assignments:

| Evaluation Panel | Checkpoint Frequency | Episodes per Condition | Seed Range | Traffic Conditions |
| :--- | :--- | :--- | :--- | :--- |
| **Screening** | Every 50,000 steps | 50 episodes | `55000 - 55049` | `geometry` (0.00), `traffic` (0.30) |
| **Model Reranking** | Top 5 screening + Terminal checkpoint | 100 fresh episodes | `60000 - 60099` | `geometry` (0.00), `traffic` (0.30) |
| **Sealed Holdout** | Frozen Reranking Winner (1 evaluation) | 200 untouched episodes | `70000 - 70199` | `geometry` (0.00), `traffic` (0.30) |

---

### Empirical Results & Benchmark Performance

Below is the benchmark performance summary template for the training run:

#### Screening Panel Highlights (50K Checkpoints)

| Checkpoint Step | Split / Condition | Safe Completion (%) | Task Success (%) | Route Completion (%) | Cumulative Cost | Collision Rate (%) | Feasibility Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `100,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `100,000` | `traffic` (0.30) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `250,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `250,000` | `traffic` (0.30) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `500,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `500,000` | `traffic` (0.30) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |

#### Reranking & Final Sealed Holdout Results

| Model Stage | Evaluation Condition | Episodes | Route Completion (%) | Task Success (%) | Mean Cost | Max Cost | Constraint Satisfied |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Reranking Winner** | `geometry` (0.00) | 100 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Reranking Winner** | `traffic` (0.30) | 100 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Sealed Holdout** | `geometry` (0.00) | 200 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Sealed Holdout** | `traffic` (0.30) | 200 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |

---

### Simulation Rollout & Policy Visualizations

Below are curated video slots for policy simulations across key autonomous driving scenarios.

<!-- VS CODE NOTE FOR DHEERAJ: Slot 1 - Interactive Traffic (0.30 density respawn/hybrid traffic, overtaking and lane-keeping). Render a 1080p MP4 or YouTube clip and update the path attribute below. -->
#### 1. Interactive Multi-Vehicle Traffic Navigation
<div class="safedrive-demo-video" style="margin-bottom: 2rem;">
  {% include video.html path="/assets/video/safedrive_traffic_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent navigating 0.30 density interactive MetaDrive traffic" caption="Closed-loop policy simulation negotiating interactive background traffic at 0.30 density on 5-block maps." %}
</div>

<!-- VS CODE NOTE FOR DHEERAJ: Slot 2 - Precision Curves & S-Bends. Render a clip showing smooth steering and lateral lane-centering through tight procedural curves. -->
#### 2. Precision Curve & Lane-Centering Navigation
<div class="safedrive-demo-video" style="margin-bottom: 2rem;">
  {% include video.html path="/assets/video/safedrive_geometry_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent executing precision curve navigation on geometry maps" caption="Policy executing continuous smooth steering and lateral lane-centering through procedural curves." %}
</div>

<!-- VS CODE NOTE FOR DHEERAJ: Slot 3 - Roundabout & Complex Junction Merge. Render a clip of the vehicle entering and navigating a multi-lane MetaDrive roundabout or intersection. -->
#### 3. Roundabout & Complex Junction Merging
<div class="safedrive-demo-video" style="margin-bottom: 2rem;">
  {% include video.html path="/assets/video/safedrive_roundabout_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent navigating MetaDrive roundabout and junction merge" caption="Policy simulation navigating multi-lane roundabout entry, yielding, and junction exit." %}
</div>

<!-- VS CODE NOTE FOR DHEERAJ: Slot 4 - High-Density Emergency Evasion & Cost Bounding. Render a clip demonstrating emergency braking and collision avoidance under heavy traffic pressure. -->
#### 4. Emergency Evasion & Safety Cost Bounding
<div class="safedrive-demo-video" style="margin-bottom: 2rem;">
  {% include video.html path="/assets/video/safedrive_evasion_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent executing emergency braking and collision evasion" caption="Emergency braking and obstacle evasion under high traffic pressure to bound safety cost below limit." %}
</div>

---

### Codebase & Formal Documentation

The complete PyTorch and MetaDrive codebase is maintained in the [SafeDrive Repository](https://github.com/djdhillxn/safedrive). For full theoretical derivations, preflight verification scripts, and complete BibTeX citations, visit the GitHub repository.
