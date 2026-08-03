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

  What makes SafeDrive unique is its end-to-end integration: while standard benchmarks rely on unconstrained reward penalties or fragile multi-stage curriculum switching that causes catastrophic forgetting, SafeDrive combines a 275-dimensional spatial observation space (240 360° LiDAR rays + 4 nearby-vehicle tracking slots) with a multi-domain 12-worker environment mixture over 3-block maps (`map: 3`, densities 0.00, 0.05, 0.30) and an unconstrained Vanilla SAC ablation baseline. A non-overlapping seed evaluation protocol across Screening, Reranking, and Sealed Holdout panels ensures completely auditable safety guarantees.
---

SafeDrive is a bounded simulation project in MetaDrive investigating **Constrained Safe Reinforcement Learning** for autonomous vehicle navigation. 

Rather than relying on unconstrained reward shaping or manual multi-stage curriculum switching, the project formulates closed-loop autonomous driving as a **Constrained Markov Decision Process (CMDP)**. The objective is to learn a single policy that maximizes progress and speed rewards while strictly bounding cumulative collision and off-road safety costs below a declared threshold ($d \le 1.0$).

---

### What Makes SafeDrive Unique

If asked what sets SafeDrive apart from standard RL baselines or benchmark implementations:

1. **PID-Controlled Cost Multiplier Adaptation**: Standard Lagrangian methods suffer from severe multiplier oscillations and hyperparameter instability. SafeDrive implements a proportional-integral-derivative (PID) feedback controller on the dual multiplier $\lambda$, dynamically adjusting penalty intensity to prevent constraint overshooting and ensure smooth convergence.
2. **Multi-Domain 12-Worker Mixture over 3-Block Maps**: Instead of multi-stage curricula that suffer from catastrophic forgetting when transitioning from geometry to traffic, SafeDrive trains end-to-end on 1,000 procedural 3-block MetaDrive maps (`map: 3`) under a frozen 12-worker mixture (3 geometry workers @ $0.00$ density, 4 introductory traffic workers @ $0.05$ density, and 5 stress traffic workers @ $0.30$ density) to cover diverse road geometries and background traffic conditions.
3. **High-Resolution Perceptual Integration (275-D)**: Couples dense 240-ray $360^\circ$ LiDAR spatial sensing with 4-vehicle relative motion state vectors and ego kinematics into a 512-wide dual-critic MLP, natively integrated into Stable-Baselines3.
4. **Elimination of Center-Lane Lock-in Reward Traps**: Explicitly disables lateral reward shaping (`use_lateral_reward: false`) and introduces quadratic steering smoothness regularization ($0.10$) and speed-adaptive range penalties to prevent center-lane lock-in reward traps while preserving dynamic lane-changing and overtaking capabilities.
5. **Scientifically Isolated Ablation Framework**: Establishes an unconstrained **Vanilla SAC Baseline** (`configs/sac_vanilla_direct_general.yaml`) sharing the exact same 275-D perception, seeds (`40000-40999`), network (`[512, 512]`), batch size (256), 12 gradient steps, and evaluation panels as **SafeDrive SAC-Lagrangian**, isolating the algorithm optimization as the sole experimental variable.
6. **Leak-Free Auditable Evaluation Protocol**: Enforces strict non-overlapping seed assignments across Screening, Model Reranking, and Sealed Holdout panels, guaranteeing that validation scenarios never overlap with training or final test evaluation.

---

### System Architecture & Perception

<figure style="text-align: center; margin: 1.5rem auto;">
  <img src="{{ '/assets/img/safedrive/safedrive_architecture_overview.png' | relative_url }}" alt="SafeDrive SAC-Lagrangian System Architecture" loading="lazy" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <figcaption style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Overview of SafeDrive perception pipeline (275-D LiDAR + vehicle tracking), PID cost control, 12-worker multi-domain mixture, and dual-critic network architecture.</figcaption>
</figure>

#### 1. Perception & Observation Space (275-D)
The policy receives a 275-dimensional feature vector combining spatial range sensing with ego dynamics and nearby vehicle tracking:
- **240 360° LiDAR Rays**: Radial distance measurements ($[0, 50]$ meters) scanning surrounding obstacles and road boundaries.
- **4 Nearby Vehicle Slots (16-D)**: Relative coordinates $(x, y)$, heading angle, and velocity vectors for the four closest dynamic traffic obstacles.
- **Ego Kinematics & Navigation (19-D)**: Speed, steering angle, angular velocity, lane offset, route checkpoints, and navigation target vectors.

#### 2. Network Architecture & Policy Optimization
SafeDrive parameterizes the policy $\pi_\theta(a|s)$, reward critic $Q_{\phi_R}(s, a)$, and safety cost critic $Q_{\psi_C}(s, a)$ using 512-wide Multi-Layer Perceptrons (`[512, 512]`) with ReLU activations:
- **Policy Network ($\pi_\theta$)**: Outputs continuous control actions $a = (a_{\text{steer}}, a_{\text{accel}}) \in [-1, 1]^2$ via a squashed Gaussian distribution:
  $$\pi_\theta(a|s) = \tanh(\mu_\theta(s) + \sigma_\theta(s) \odot \epsilon), \quad \epsilon \sim \mathcal{N}(0, I)$$
- **Dual-Critic Architecture ($Q_{\phi_R}, Q_{\psi_C}$)**: Twin double-critic networks estimate expected cumulative task reward $J_R$ and expected cumulative safety cost $J_C$. Soft Bellman targets are computed via:
  $$y_R = r + \gamma \left( \min_{j=1,2} Q_{\phi_{R,j}'}(s', a') - \alpha \log \pi_\theta(a'|s') \right), \quad a' \sim \pi_\theta(\cdot|s')$$
  $$y_C = c + \gamma_c \min_{j=1,2} Q_{\psi_{C,j}'}(s', a'), \quad a' \sim \pi_\theta(\cdot|s')$$
- **Policy Loss Formulation**: Policy parameters $\theta$ are updated by joint optimization over expected task reward, entropy regularization, and safety constraint penalty:
  $$J_\pi(\theta) = \mathbb{E}_{s \sim \mathcal{D}, a \sim \pi_\theta} \left[ \alpha \log \pi_\theta(a|s) - \min_{j=1,2} Q_{\phi_{R,j}}(s, a) + \lambda \max_{j=1,2} Q_{\psi_{C,j}}(s, a) \right]$$
- **Optimization & Hyperparameters**: Actor and critic parameters are optimized using Adam with learning rate $1 \times 10^{-4}$, batch size 256, 12 gradient updates per step (1.0 update-to-data ratio), replay buffer capacity $10^6$, and discount factors $\gamma = 0.99, \gamma_c = 0.99$.

#### 3. SAC-Lagrangian Optimization & PID Cost Adaptation
The Lagrangian objective incorporates a PID feedback mechanism to regulate constraint violations:

$$\lambda_{t+1} = \left[ \lambda_t + K_p e_t + K_i \int_0^t e_\tau d\tau + K_d \frac{de_t}{dt} \right]^+$$

- **Episode Cost Limit ($d$)**: $1.0$ cumulative cost limit.
- **PID Controller Parameters**: $K_p = 0.05$, $K_i = 0.0005$, $K_d = 0.1$, $\alpha_{\text{EMA}} = 0.2$, $\lambda_{\max} = 100.0$.

#### 4. Multi-Domain Traffic Mixture & MetaDrive Modes
The training environment allocates 12 parallel subprocess workers to cover distinct driving conditions:
- **3 Geometry Workers** (`map: 3`, `traffic_density: 0.00`): Traffic-free procedural road geometry to maintain precise curve handling and lane centering.
- **4 Introductory Traffic Workers** (`map: 3`, `traffic_density: 0.05`): Light background traffic flow (~2–6 vehicles per map).
- **5 Stress Traffic Workers** (`map: 3`, `traffic_density: 0.30`): Dense background traffic flow (~13–27 vehicles per map) for high-pressure gap selection and collision avoidance.

---

### Controlled Ablation Framework

To evaluate the exact contribution of Lagrangian safety cost constraints, SafeDrive compares **SafeDrive SAC-Lagrangian** against an unconstrained **Vanilla SAC Baseline**. Both runs operate under 100% identical environment parameters, 275-D perception specifications, `[512, 512]` MLP network topology, hyperparameters ($1 \times 10^{-4}$ learning rate, batch size 256, 12 gradient updates per step), procedural maps, worker mixtures, and evaluation protocols:

- **Procedural Maps & Seeds**: 1,000 procedural 3-block MetaDrive maps (`map: 3`), training seeds `40000–40999`.
- **12-Worker Multi-Domain Mixture**: Vectorized 12-worker distribution consisting of 3 geometry workers ($0.00$ density), 4 introductory traffic workers ($0.05$ density), and 5 stress traffic workers ($0.30$ density).
- **Evaluation Panels**: Non-overlapping Screening (seeds 55000+), Reranking (seeds 60000+), and Sealed Holdout (seeds 70000+) evaluation panels.

By keeping all environmental, perceptual, structural, and evaluation parameters fixed, the experimental variable is strictly isolated to the algorithm optimization formulation:

| Primary Experimental Variables | SafeDrive SAC-Lagrangian | Unconstrained Vanilla SAC Baseline |
| :--- | :--- | :--- |
| **Config File** | `configs/sac_lagrangian_direct_general.yaml` | `configs/sac_vanilla_direct_general.yaml` |
| **Optimization Target** | CMDP ($d \le 1.0$, PID dual multiplier $\lambda$) | Standard unconstrained SAC (task reward optimization only) |

---

### Evaluation Protocol & Panel Structure

To prevent evaluation leakage and maintain auditability over training runs, SafeDrive uses a strict three-panel evaluation protocol with non-overlapping seed assignments:

| Evaluation Panel | Checkpoint Frequency | Episodes per Condition | Seed Range | Traffic Conditions |
| :--- | :--- | :--- | :--- | :--- |
| **Screening** | Every 50,000 steps | 50 episodes | `55000 - 55049` | `geometry` (0.00), `traffic` (0.30) |
| **Model Reranking** | Top 5 screening + Terminal checkpoint | 100 fresh episodes | `60000 - 60099` | `geometry` (0.00), `traffic` (0.30) |
| **Sealed Holdout** | Frozen Reranking Winner (1 evaluation) | 200 untouched episodes | `70000 - 70199` | `geometry` (0.00), `traffic` (0.30) |

---

### Simulation Rollout & Policy Visualizations

Below are curated video simulations across key autonomous driving scenarios:

#### 1. Interactive Multi-Vehicle Traffic Navigation
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/safedrive/map_SCSCS_d0.30_chase_seed_60009.mp4" class="safedrive-demo-iframe" width="800" height="450" controls=true autoplay=true loop=true muted=true title="SAC-Lagrangian agent navigating 0.30 density interactive MetaDrive traffic on 5-block S-curves" caption="Closed-loop policy simulation negotiating dense background traffic at 0.30 density on 5-block S-curves map." %}
</div>

#### 2. Precision Curve & Lane-Centering Navigation
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/safedrive/map_C_d0.00_chase_seed_60000.mp4" class="safedrive-demo-iframe" width="800" height="450" controls=true autoplay=true loop=true muted=true title="SAC-Lagrangian agent executing precision curve navigation on geometry maps" caption="Policy executing continuous smooth steering and lateral lane-centering through procedural curves." %}
</div>

#### 3. Roundabout & Complex Junction Merging
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/safedrive/map_OC_d0.30_chase_seed_60007.mp4" class="safedrive-demo-iframe" width="800" height="450" controls=true autoplay=true loop=true muted=true title="SAC-Lagrangian agent navigating MetaDrive roundabout and junction merge" caption="Policy simulation navigating multi-lane roundabout entry, yielding, and junction exit under 0.30 traffic." %}
</div>

#### 4. Emergency Obstacle Evasion & Hazard Avoidance
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/safedrive/map_SC_d0.05_chase_seed_60012.mp4" class="safedrive-demo-iframe" width="800" height="450" controls=true autoplay=true loop=true muted=true title="SAC-Lagrangian agent executing static obstacle hazard avoidance" caption="Obstacle hazard avoidance navigating traffic cones, warning triangles, and blocked lanes while bounding safety cost." %}
</div>

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

**Codebase & Formal Documentation**: The complete PyTorch and MetaDrive codebase is maintained in the [SafeDrive Repository](https://github.com/djdhillxn/safedrive). For full theoretical derivations, preflight verification scripts, and complete BibTeX citations, visit the GitHub repository.
