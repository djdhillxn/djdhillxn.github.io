---
layout: page
title: "SafeDrive: Constrained Safe Reinforcement Learning for Autonomous Driving"
description: "Closed-loop autonomous driving in MetaDrive via SAC-Lagrangian with PID cost adaptation across 1,000 procedural maps"
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

  What makes SafeDrive unique is its end-to-end integration: while standard benchmarks rely on unconstrained reward penalties or fragile multi-stage curriculum switching that causes catastrophic forgetting, SafeDrive combines a 275-dimensional spatial observation space (240 360° LiDAR rays + 4 nearby-vehicle tracking slots) with a custom SB3-integrated PID cost adaptation engine. A non-overlapping seed evaluation protocol across Screening, Reranking, and Sealed Holdout panels ensures completely auditable safety guarantees.
---

SafeDrive is a bounded simulation project in MetaDrive investigating **Constrained Safe Reinforcement Learning** for autonomous vehicle navigation. 

Rather than relying on unconstrained reward shaping or manual multi-stage curriculum switching, the project formulates closed-loop autonomous driving as a **Constrained Markov Decision Process (CMDP)**. The objective is to learn a single policy that maximizes progress and speed rewards while strictly bounding cumulative collision and off-road safety costs below a declared threshold ($d \le 1.0$).

---

### What Makes SafeDrive Unique

If asked what sets SafeDrive apart from standard RL baselines or benchmark implementations:

1. **PID-Controlled Cost Multiplier Adaptation**: Standard Lagrangian methods suffer from severe multiplier oscillations and hyperparameter instability. SafeDrive implements a proportional-integral-derivative (PID) feedback controller on the dual multiplier $\lambda$, dynamically adjusting penalty intensity to prevent constraint overshooting and ensure smooth convergence.
2. **Unified One-Stage Training over Procedural Scenarios**: Instead of multi-stage curricula that suffer from catastrophic forgetting when transitioning from geometry to traffic, SafeDrive trains end-to-end on 1,000 procedural MetaDrive maps under a frozen worker mixture (25% geometry / 75% traffic density 0.05).
3. **High-Resolution Perceptual Integration (275-D)**: Couples dense 240-ray $360^\circ$ LiDAR spatial sensing with 4-vehicle relative motion state vectors and ego kinematics into a 512-wide dual-critic MLP, natively integrated into Stable-Baselines3.
4. **Leak-Free Auditable Evaluation Protocol**: Enforces strict non-overlapping seed assignments across Screening, Model Reranking, and Sealed Holdout panels, guaranteeing that validation scenarios never overlap with training or final test evaluation.

---

### System Architecture & Perception

<figure style="text-align: center; margin: 1.5rem 0;">
  <img src="{{ '/assets/img/safedrive/safedrive_architecture_overview.png' | relative_url }}" alt="SafeDrive SAC-Lagrangian System Architecture" loading="lazy" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <figcaption style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Overview of SafeDrive perception pipeline (275-D LiDAR + vehicle tracking), PID cost control, and dual-critic network architecture.</figcaption>
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

---

### Evaluation Protocol & Panel Structure

To prevent evaluation leakage and maintain auditability over training runs, SafeDrive uses a strict three-panel evaluation protocol with non-overlapping seed assignments:

| Evaluation Panel | Checkpoint Frequency | Episodes per Condition | Seed Range | Traffic Conditions |
| :--- | :--- | :--- | :--- | :--- |
| **Screening** | Every 50,000 steps | 50 episodes | `55000 - 55049` | `geometry` (0.00), `traffic` (0.05) |
| **Model Reranking** | Top 5 screening + Terminal checkpoint | 100 fresh episodes | `60000 - 60099` | `geometry` (0.00), `traffic` (0.05) |
| **Sealed Holdout** | Frozen Reranking Winner (1 evaluation) | 200 untouched episodes | `70000 - 70199` | `geometry` (0.00), `traffic` (0.05) |

---

### Empirical Results & Benchmark Performance

Below is the benchmark performance summary template for the training run:

#### Screening Panel Highlights (50K Checkpoints)

| Checkpoint Step | Split / Condition | Safe Completion (%) | Task Success (%) | Route Completion (%) | Cumulative Cost | Collision Rate (%) | Feasibility Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `100,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `100,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `250,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `250,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `500,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `500,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |

#### Reranking & Final Sealed Holdout Results

| Model Stage | Evaluation Condition | Episodes | Route Completion (%) | Task Success (%) | Mean Cost | Max Cost | Constraint Satisfied |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Reranking Winner** | `geometry` (0.00) | 100 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Reranking Winner** | `traffic` (0.05) | 100 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Sealed Holdout** | `geometry` (0.00) | 200 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Sealed Holdout** | `traffic` (0.05) | 200 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |

---

### Simulation Rollout & Policy Visualizations

Below are curated video slots for policy simulations across key autonomous driving scenarios.

<!-- VS CODE NOTE FOR DHEERAJ: Slot 1 - Interactive Traffic (0.05 density respawn traffic, overtaking and lane-keeping). Render a 1080p MP4 or YouTube clip and update the path attribute below. -->
#### 1. Interactive Multi-Vehicle Traffic Navigation
<div class="safedrive-demo-video" style="margin-bottom: 2rem;">
  {% include video.html path="/assets/video/safedrive_traffic_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent navigating 0.05 density interactive MetaDrive traffic" caption="Closed-loop policy simulation negotiating interactive background traffic at 0.05 density." %}
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
