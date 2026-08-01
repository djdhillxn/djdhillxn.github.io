---
layout: page
title: "SafeDrive: Constrained Safe Reinforcement Learning for Autonomous Driving"
description: "Direct SAC-Lagrangian control in MetaDrive with PID cost adaptation across 1,000 procedural maps and frozen evaluation panels"
github: "https://github.com/djdhillxn/safedrive"
category: RL
portfolio_order: 10
portfolio_tags:
  - safe reinforcement learning
  - SAC-Lagrangian
  - Constrained RL
  - MetaDrive
  - autonomous driving
portfolio_summary: |
  SafeDrive investigates whether a single safety-constrained Soft Actor-Critic (SAC-Lagrangian) policy can learn closed-loop autonomous driving across 1,000 procedural MetaDrive maps under mixed traffic conditions (25% geometry / 75% traffic density 0.05). I designed a unified one-stage training setup featuring a PID-controlled Lagrange multiplier for dynamic cost bounding, a 275-dimensional spatial observation space (240 LiDAR rays), and a non-overlapping seed protocol evaluating screening, reranking, and sealed holdout panels.

  <figure class="project-summary-figure project-summary-figure--right project-summary-figure--medium">
    <img src="/assets/img/safedrive/safedrive_architecture_overview.png" alt="SafeDrive SAC-Lagrangian Architecture Overview" loading="lazy">
    <figcaption>Overview of SafeDrive SAC-Lagrangian perception, PID cost control, and multi-panel evaluation pipeline.</figcaption>
  </figure>
---

SafeDrive is a bounded simulation study in MetaDrive investigating **Constrained Safe Reinforcement Learning** for autonomous navigation. 

Rather than relying on unconstrained reward penalties or multi-stage curriculum heuristics, the project formulates closed-loop autonomous driving as a **Constrained Markov Decision Process (CMDP)**. The objective is to learn a single policy that maximizes progress and speed rewards while strictly bounding cumulative collision and off-road safety costs below a declared threshold ($d \le 1.0$).

---

### Key System Architecture

#### 1. Perception & Observation Space (275-D)
The policy receives a 275-dimensional feature representation combining dense spatial range sensing with ego dynamics and nearby vehicle tracking:
- **240 360° LiDAR Rays**: Bounded distance measurements ($[0, 50]$ meters) scanning surrounding obstacles and road boundaries.
- **4 Nearby Vehicle Slots (12-D)**: Relative coordinates $(x, y)$, heading angle, and velocity vectors for the four closest dynamic traffic obstacles.
- **Ego Kinematics & Navigation (23-D)**: Longitudinal/lateral speed, steering angle, angular velocity, lane offset, route checkpoints, and navigation target directions.

#### 2. SAC-Lagrangian Optimization & PID Cost Adaptation
Standard dual-gradient Lagrangian methods often suffer from severe multiplier oscillations and instability. SafeDrive incorporates a **PID-controlled Lagrange multiplier update**:

$$\lambda_{t+1} = \left[ \lambda_t + K_p e_t + K_i \int e_t dt + K_d \frac{de_t}{dt} \right]^+$$

- **Cost Limit ($d$)**: $1.0$ cumulative cost per episode.
- **PID Parameters**: $K_p = 0.05$, $K_i = 0.0005$, $K_d = 0.1$, $\alpha_{\text{EMA}} = 0.2$, $\lambda_{\max} = 100.0$.
- **Network Architecture**: 512-wide MLP (`[512, 512]`) for policy $\pi_\theta$, reward critic $Q_R$, and cost critic $Q_C$.
- **Worker Environment Mixture**: 8 parallel MetaDrive subprocess workers (2 geometry workers @ $0.00$ density, 6 traffic workers @ $0.05$ density).

---

### Evaluation Protocol & Panel Structure

To prevent evaluation leakage and maintain auditability over a 2,000,000 transition training run, SafeDrive uses a strict three-panel evaluation protocol with non-overlapping seed assignments:

| Evaluation Panel | Checkpoint Frequency | Episodes per Condition | Seed Range | Traffic Conditions |
| :--- | :--- | :--- | :--- | :--- |
| **Screening** | Every 50,000 steps (40 checkpoints) | 50 episodes | `55000 - 55049` | `geometry` (0.00), `traffic` (0.05) |
| **Model Reranking** | Top 5 screening + Terminal checkpoint | 100 fresh episodes | `60000 - 60099` | `geometry` (0.00), `traffic` (0.05) |
| **Sealed Holdout** | Frozen Reranking Winner (1 evaluation) | 200 untouched episodes | `70000 - 70199` | `geometry` (0.00), `traffic` (0.05) |

---

### Empirical Results & Benchmark Performance

Below is the benchmark performance summary template for the 2,000,000 step training run:

#### Screening Panel Highlights (50K Checkpoints)

| Checkpoint Step | Split / Condition | Safe Completion (%) | Task Success (%) | Route Completion (%) | Cumulative Cost | Collision Rate (%) | Feasibility Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `500,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `500,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `1,000,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `1,000,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `1,500,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `1,500,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `2,000,000` | `geometry` (0.00) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| `2,000,000` | `traffic` (0.05) | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |

#### Reranking & Final Sealed Holdout Results

| Model Stage | Evaluation Condition | Episodes | Route Completion (%) | Task Success (%) | Mean Cost | Max Cost | Constraint Satisfied |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Reranking Winner** | `geometry` (0.00) | 100 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Reranking Winner** | `traffic` (0.05) | 100 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Sealed Holdout** | `geometry` (0.00) | 200 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |
| **Sealed Holdout** | `traffic` (0.05) | 200 | *[Populate]* | *[Populate]* | *[Populate]* | *[Populate]* | *[Pending]* |

---

### Simulation Rollout & Policy Visualizations

#### Autonomous Navigation in Interactive Traffic
Below are simulation rollouts of the SAC-Lagrangian agent navigating complex procedural MetaDrive scenarios:

<div class="safedrive-demo-video">
  <!-- Place rendered MP4 or YouTube embed link below -->
  {% include video.html path="/assets/video/safedrive_traffic_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent navigating 0.05 density interactive MetaDrive traffic" caption="Closed-loop policy simulation on density-0.05 interactive MetaDrive traffic." %}
</div>

#### Geometry Curve & Intersection Navigation

<div class="safedrive-demo-video">
  <!-- Place rendered MP4 or YouTube embed link below -->
  {% include video.html path="/assets/video/safedrive_geometry_demo.mp4" class="safedrive-demo-iframe" width="800" height="450" title="SAC-Lagrangian agent executing precision curve navigation on geometry-only maps" caption="Closed-loop policy simulation executing curve and lane-centering navigation." %}
</div>

---

### Repository & Reproduction

The complete PyTorch and MetaDrive codebase is maintained in the [SafeDrive Repository](https://github.com/djdhillxn/safedrive). 

To reproduce preflight checks and training:
```bash
# 1. Run protocol & environment preflight checks
python3 -m scripts.preflight_direct_lagrangian --config configs/sac_lagrangian_direct_general.yaml

# 2. Launch 2M-step SAC-Lagrangian training
python3 -m scripts.train_direct_lagrangian --config configs/sac_lagrangian_direct_general.yaml
```
