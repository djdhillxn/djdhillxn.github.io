---
layout: page
title: "DICE: Continuous Dexterous In-Hand Die Reorientation via Asymmetric Actor-Critic PPO"
description: "Autonomous sequential reorientation of a 6-faced die using a 20-DoF Shadow Hand in Isaac Lab across nominal, symmetric, and adverse physical regimes"
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
  - sim-to-real robustness
portfolio_image: assets/img/dice/dice_nominal_success_poster.webp
portfolio_image_alt: "DICE dexterous in-hand manipulation with Shadow Hand in Isaac Lab"
portfolio_summary: |
  DICE investigates continuous in-hand dexterous manipulation using a 20-DoF Shadow Hand in NVIDIA Isaac Lab. Rather than resetting the hand after each single goal, the policy is conditioned on an endless stream of target face commands, learning to continuously reposition and orient a 6-faced die without dropping it.

  To solve the classic "loitering" failure mode—where policies freeze at partial angles to farm static posture rewards—we introduce an angular-error progress formulation combined with signed hold-progress shaping. Using an asymmetric actor-critic architecture (126-D deployable actor vs. 247-D privileged critic) trained over 327M transitions with PPO, the policy achieves a 97.09% command completion rate with a 0.617s median latency under nominal conditions, retains performance under symmetric material variation (±20% mass and friction), and exposes an auditable long-horizon retention boundary under adverse stress.
---

Dexterous in-hand manipulation—reorienting complex geometries within an articulated robotic hand without external fixtures or gravity drops—remains one of the core frontiers in robotics. The challenge stems from high-dimensional continuous action spaces (20 actuated degrees of freedom), discontinuous multi-point contact dynamics, and the constant risk of object loss under slippery or shifting physical properties.

Most conventional in-hand manipulation benchmarks treat reorientation as a **single-shot task**: an object begins in the palm, the controller turns it toward a fixed target orientation, and the episode terminates upon reaching the target. While useful for isolated motion analysis, single-shot training produces policies that cannot chain multiple reorientations together, as the terminal hand configuration for one command is rarely a stable starting posture for the next.

**DICE** formulates in-hand manipulation as a **continuous, multi-command Markov Decision Process (MDP)**. A 20-DoF anthropomorphic Shadow Hand receives a continuous stream of semantic face-up commands (faces 1 through 6 on a standard die). Upon successfully stabilizing a requested face upward, the environment instantly issues a new non-identical command without resetting the hand or object, forcing the policy to discover robust, reusable gaits for continuous finger gaiting and dynamic in-hand rolling.

---

### Task Formulation & Target Sequencing

The object is a standard 6-faced die with opposite faces summing to seven:

$$\mathbf{n}_1 = [0, 0, 1]^\top, \quad \mathbf{n}_2 = [1, 0, 0]^\top, \quad \mathbf{n}_3 = [0, 1, 0]^\top$$

$$\mathbf{n}_4 = [0, -1, 0]^\top, \quad \mathbf{n}_5 = [-1, 0, 0]^\top, \quad \mathbf{n}_6 = [0, 0, -1]^\top$$

Given the current cube orientation represented by rotation matrix $R_{\text{cube}} \in \mathrm{SO}(3)$, the commanded face normal $k \in \{1,\dots,6\}$ is projected into world coordinates:

$$\mathbf{n}_{\text{world}} = R_{\text{cube}} \mathbf{n}_k$$

<figure style="text-align: center; margin: 1.5rem auto 2rem auto;">
  <img src="{{ '/assets/img/dice/dice_nominal_success_poster.webp' | relative_url }}" alt="DICE Shadow Hand manipulation setup" loading="lazy" style="max-width: 100%; height: auto; border-radius: 6px;">
  <figcaption style="margin-top: 0.5rem; font-size: 0.88rem; color: #666;">The 20-DoF Shadow Hand holding a 60 mm numbered die in NVIDIA Isaac Lab (Isaac Sim 5.1 / PhysX 5), showing the synchronized oblique manipulation view (left) and top-down verification view (right).</figcaption>
</figure>

#### Geometric Target Encoding
To provide the policy with smooth, frame-consistent steering information, the target geometry is parameterized by:
1. **World-Frame Commanded Normal**: $\mathbf{n}_{\text{world}} \in \mathbb{R}^3$.
2. **Cosine Alignment**: The projection of the commanded face onto the world-up vector $\hat{\mathbf{z}} = [0, 0, 1]^\top$:
   $$\text{Alignment} = \mathbf{n}_{\text{world}} \cdot \hat{\mathbf{z}} = \cos \theta$$
3. **Cross-Product Rotation Axis Error**: The axis around which the die must rotate to bring the requested face to the top:
   $$\mathbf{e}_{\text{axis}} = \mathbf{n}_{\text{world}} \times \hat{\mathbf{z}}$$

#### Three-Gate Confirmation & Seamless Transition
A command is completed only when the policy satisfies three simultaneous physical gates for **20 consecutive simulation steps** ($h_t \ge 20$, approximately $0.333\text{ s}$ at 60 Hz control frequency):
- **Orientation Gate**: $\text{Alignment} \ge 0.9$ ($\theta \le 25.8^\circ$).
- **Position Gate**: In-hand spatial displacement $\|\mathbf{p}_{\text{cube}} - \mathbf{p}_{\text{target}}\| \le 0.05\text{ m}$.
- **Settling Velocity Gate**: Cube angular velocity $\|\boldsymbol{\omega}_{\text{cube}}\| \le 1.0\text{ rad/s}$.

The moment $h_t$ reaches 20, the agent receives a command completion bonus, and a new target face $k_{\text{new}} \neq k_{\text{current}}$ is sampled uniformly. The policy must immediately transition to turning the die toward the new target without resetting the simulation state.

---

### Reward Design: Overcoming the "Loitering" Trap

A classic pathology in goal-conditioned continuous manipulation is **policy loitering**. When using static posture rewards proportional to alignment:

$$r_{\text{static}}(s) \propto \max(0, \cos \theta)$$

A policy that rotates the die to a partial angle (e.g., $45^\circ$, where $\cos 45^\circ \approx 0.707$) receives a constant positive reward on every control step. Over a 1,440-step episode, simply sitting motionless at $45^\circ$ yields hundreds of reward points without risking object drop. When faced with the difficult challenge of breaking contact to execute a full flip, gradient descent readily falls into this suboptimal local minimum.

```text
[ Static Posture Reward ]
Sitting still at 45° ────────► Steady +0.707 reward per step (Farms 1,000+ points with zero drop risk)
Attempting final flip ───────► High risk of dropping die (-100 penalty)
Result ──────────────────────► Policy freezes in place ("Loitering Pathology")

[ DICE Progress Shaping ]
Sitting still at 45° ────────► Δθ = 0 ──► Exactly 0.0 reward
Rotating toward target ──────► Δθ > 0 ──► Positive proportional progress reward
Rotating away from target ───► Δθ < 0 ──► Negative penalty
Dropping hold early ─────────► Accumulated hold shaping is clawed back immediately
```

To eliminate static reward farming, DICE decomposes the objective into dynamic progress terms and strict clawback shaping:

#### 1. Angular-Error Progress Reward
The absolute angular error is computed via:

$$\theta_t = \arccos\left(\operatorname{clamp}(\mathbf{n}_{\text{world}} \cdot \hat{\mathbf{z}}, -1, 1)\right)$$

The policy is rewarded strictly on the differential reduction in angular error:

$$r_{\text{progress}} = 40 \cdot (\theta_{t-1} - \theta_t)$$

- **Stationary state ($\theta_t = \theta_{t-1}$)**: Yields **identically zero** reward.
- **Active reorientation ($\theta_t < \theta_{t-1}$)**: Provides a smooth, linear positive gradient regardless of whether the die is far from or close to the target.
- **Backwards rotation ($\theta_t > \theta_{t-1}$)**: Incurs an immediate negative penalty.

#### 2. Signed Hold Progress Shaping
To incentivize the 20-step stabilization gate without creating a farmable hold reward, hold progress is shaped differentially:

$$r_{\text{hold}} = c_{\text{hold}} \cdot \frac{h_t - h_{t-1}}{\text{hold\_steps}}$$

If the policy sustains the hold ($h_t = h_{t-1} + 1$), it receives a positive increment. Crucially, if the hold breaks before reaching 20 ($h_t = 0$ while $h_{t-1} > 0$), the numerator becomes negative, **clawing back all accumulated hold shaping**.

#### 3. Command Completion & Drop Bonuses
- **Command Success**: $+250$ raw bonus ($+25$ scaled).
- **Episode Drop Penalty**: $-100$ raw penalty (triggered if object height falls below palm threshold).

#### 4. Raw-Action Boundary Regularization
To prevent policy saturation and action-clipping aliasing while preserving bounded joint actuator targets, the policy is penalized for raw Gaussian outputs exceeding $|a| > 0.9$:

$$r_{\text{bound}} = -\sum_{i=1}^{20} \left( \max(0, |a_i| - 0.9) \right)^2$$

---

### Asymmetric Actor-Critic Architecture

In complex robotic systems, there is a stark gap between what is observable on a deployed physical robot versus what is accessible inside a physics simulator. DICE addresses this using an **Asymmetric Actor-Critic** architecture:

```text
               ┌──────────────────────────────────────────────────────────┐
               │              PHYSX SIMULATOR TENSOR STATE                │
               └────────────────────────────┬─────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
   ┌─────────────────────────────────┐             ┌─────────────────────────────────┐
   │    DEPLOYABLE ACTOR (126-D)     │             │    PRIVILEGED CRITIC (247-D)    │
   ├─────────────────────────────────┤             ├─────────────────────────────────┤
   │ Hand Joint Pos & Vel (48)       │             │ Full Actor Observation (126)    │
   │ Previous Applied Actions (20)   │             │ Fingertip 6D Wrenches (30)      │
   │ Cube-Frame Fingertip Pos (15)   │             │ Fingertip Spatial Vels (30)     │
   │ Cube-Frame Fingertip Vel (15)   │             │ Env-Local Object Pos (3)        │
   │ Relative Cube Pos & Vels (9)    │             │ World Object Quaternion (4)     │
   │ Continuous 6D Cube Rot (6)      │             │ World Object Lin & Ang Vel (6)  │
   │ Commanded Normal & Align (4)    │             │ Raw Hand Joint Pos & Vel (48)   │
   │ Rotation Axis Error (3)         │             └────────────────┬────────────────┘
   │ Hold Progress (1)               │                              │
   │ Bounded Load Proxies (5)        │                              │
   └────────────────┬────────────────┘                              │
                    │                                               │
                    ▼                                               ▼
     ┌─────────────────────────────┐                  ┌───────────────────────────┐
     │      POLICY HEAD π(a|s)     │                  │     VALUE HEAD V(s)       │
     │  [512, 512, 256, 128] MLP   │                  │  [512, 512, 256, 128] MLP │
     └──────────────┬──────────────┘                  └─────────────┬─────────────┘
                    │                                               │
                    │                                               │
                    ▼                                               ▼
         20-DoF Shadow Hand Actions                     Low-Variance Value Baselines
         (Deployable Controller)                        (Centralized PPO Updates)
```

1. **Deployable Actor Observation (126 Dimensions)**:
   - **Hand Proprioception (48-D)**: 24 normalized joint angles ($[-1, 1]$) and 24 scaled joint velocities ($0.2 \times \dot{q}$).
   - **Controller State (20-D)**: Previous smoothed joint targets applied to the low-level actuator.
   - **Cube-Frame Fingertip Kinematics (30-D)**: Relative 3D positions and linear velocities of all 5 fingertips expressed directly in the **cube's local coordinate frame** ($R_{\text{cube}}^\top (\mathbf{p}_{\text{tip}} - \mathbf{p}_{\text{cube}})$).
   - **Cube Kinematics (9-D)**: Translation relative to nominal in-hand rest position, linear velocity, and angular velocity.
   - **Cube Orientation (6-D)**: Continuous 6D rotation representation (first two column vectors of $R_{\text{cube}}$), eliminating quaternion sign ambiguities.
   - **Command Geometry (7-D)**: Commanded normal in world coordinates (3-D), cosine alignment (1-D), and rotation axis error (3-D).
   - **Hold Progress (1-D)**: Normalized step count $h_t / 20 \in [0, 1]$.
   - **Fingertip Load Proxies (5-D)**: Vector-norm magnitudes of incoming joint reaction wrenches scaled and clamped into $[0, 1]$ to serve as tactile contact proxies.

2. **Privileged Critic State (247 Dimensions)**:
   - Contains the full 126-D actor observation.
   - **Ground-Truth Contact Wrenches (30-D)**: Full 6D incoming force and torque vectors for all 5 fingertips in body frame.
   - **Spatial Velocities (30-D)**: Full 6D linear and angular spatial velocities for all 5 fingertips.
   - **Ground-Truth Dynamics (13-D)**: Environment-local position, world-frame $(w, x, y, z)$ quaternion, and linear/angular velocities.
   - **Raw Joint States (48-D)**: Unnormalized joint positions and velocities.

By training an asymmetric value function $V(s)$, the critic accurately estimates state values and provides low-variance generalized advantage estimates ($\text{GAE}(\gamma=0.99, \lambda=0.95)$) without requiring the actor to rely on unmeasurable privileged states at deployment time.

---

### Training Pipeline & Hyperparameters

Training is executed using the GPU-accelerated **RSL-RL** library integrated into **NVIDIA Isaac Lab** (Isaac Sim 5.1 / PhysX 5.3):

| Hyperparameter | Value | Description |
|---|---|---|
| **Simulation Environment** | `DICE-Shadow-Train-v0` | 20-DoF Shadow Hand with stock instanceable DexCube |
| **Concurrent Environments** | 2,048 | Fully vectorized GPU environments |
| **Control Frequency** | 60 Hz | Control step $\Delta t = 1/60\text{ s}$ with PhysX sub-stepping |
| **Rollout Length** | 32 steps / env | 65,536 transitions per PPO iteration |
| **Total Iterations** | 5,000 | 327.68 million total environment transitions |
| **Hardware** | NVIDIA L4 GPU | 23.7 GB GPU VRAM (cloud headless workflow) |
| **Actor Architecture** | MLP `[512, 512, 256, 128]` | ELU activations, observation normalization |
| **Critic Architecture** | MLP `[512, 512, 256, 128]` | ELU activations, state normalization |
| **Optimizer** | Adam ($\text{lr} = 3 \times 10^{-4}$) | Fixed learning rate, no decay schedule |
| **Discount & GAE** | $\gamma = 0.99, \lambda = 0.95$ | Generalized Advantage Estimation |
| **Exploration Noise** | $\sigma_{\text{init}} = 0.6$ | Learned diagonal Gaussian std, zero entropy bonus |
| **Action Clamping** | $[-1, 1]$ | Bounded controller target space |

#### Checkpoint Screening Sweep
Checkpoints were saved periodically every 1,000 iterations. A 500-episode nominal screening sweep evaluated candidates across command throughput, latency, and drop rate:

| Checkpoint | Completed Commands / Ep | Issued Completion | Drop Rate | Median Latency |
|---|---:|---:|---:|---:|
| `model_1000.pt` | 17.62 | 94.63% | 22.40% | 0.950 s |
| `model_2000.pt` | 27.84 | 96.53% | 14.80% | 0.700 s |
| `model_3000.pt` | 31.98 | 96.97% | 11.20% | 0.633 s |
| **`model_4000.pt` (Selected)** | **33.42** | **97.10%** | **9.40%** | **0.617 s** |
| `model_final.pt` (5,000 iters) | 32.89 | 96.93% | 14.00% | 0.583 s |

`model_4000.pt` was selected as the final evaluation checkpoint: while `model_final.pt` demonstrated a slight latency advantage (0.583s vs 0.617s), `model_4000.pt` achieved the lowest overall drop rate (9.40% vs 14.00%) and the highest sustained command throughput.

---

### Empirical Evaluation & Material Stress Testing

To evaluate policy robustness, the frozen `model_4000.pt` checkpoint was tested for **1,000 full 24-second episodes (1,440 steps)** across three distinct physical regimes:

1. **Nominal Condition (`DICE-Shadow-Eval-v0`)**: Nominal 60 mm cube mass ($0.216\text{ kg}$) and default friction coefficients.
2. **Symmetric Held-Out Physics Variation (`DICE-Shadow-Robust-v0`)**: Object mass and static/dynamic friction coefficients randomly sampled within **$\pm 20\%$ of nominal** ($[0.8, 1.2]$), with dynamic friction constrained to not exceed static friction.
3. **Adverse Heavy/Slippery Stress Condition (`DICE-Shadow-Adverse-v0`)**: A deliberate worst-case physical corner with **$1.5\times$ object mass** and **$0.7\times$ static and dynamic friction**.

```text
[ EVALUATION BENCHMARK: 1,000 EPISODES PER CONDITION ]

Nominal Condition (Mass 1.0x, Friction 1.0x)
├─ Command Completion: 97.09%
├─ Drop Rate: 9.70% (CI: 8.02%–11.69%)
└─ Median Latency: 0.617 s (90.54 cmds/min)

Symmetric Held-Out Variation (Mass ±20%, Friction ±20%)
├─ Command Completion: 97.07% (Δ = -0.02%)
├─ Drop Rate: 9.50% (CI: 7.84%–11.48%)
└─ Median Latency: 0.617 s (89.00 cmds/min)
   ► Result: Zero statistically resolvable degradation under ±20% material shifts

Adverse Heavy/Slippery Stress (Mass 1.5x, Friction 0.7x)
├─ Command Completion: 95.92% (Δ = -1.17%)
├─ Drop Rate: 45.30% (CI: 42.24%–48.40%)
└─ Median Latency: 0.650 s (82.00 cmds/min)
   ► Result: High per-command success retained; long-horizon retention fatigue exposed
```

#### Detailed Benchmark Comparison

| Metric | Nominal | Symmetric Physics Variation ($\pm 20\%$) | Adverse Stress ($1.5\times$ mass, $0.7\times$ friction) |
|---|---:|---:|---:|
| **Evaluation Episodes** | 1,000 | 1,000 | 1,000 |
| **Successful / Issued Commands** | 33,334 / 34,334 | 33,072 / 34,072 | 23,514 / 24,514 |
| **Issued-Command Completion** | **97.09%** | **97.07%** | **95.92%** |
| **Episode Drop Rate** | **9.70%** | **9.50%** | **45.30%** |
| **Wilson 95% CI for Drop Rate** | $[8.02\%, 11.69\%]$ | $[7.84\%, 11.48\%]$ | $[42.24\%, 48.40\%]$ |
| **Mean Completed Commands / Episode** | 33.334 | 33.072 | 23.514 |
| **Median Completed Commands / Episode** | 37 | 37 | 32 |
| **Throughput (Commands / Sim Minute)** | 90.536 | 89.000 | 81.996 |
| **Median Command Latency** | 0.617 s | 0.617 s | 0.650 s |
| **Episodes Completing $\ge 1$ Command** | 97.40% | 98.10% | 96.70% |
| **Minimum Per-Face Completion** | 96.88% (Face 3) | 96.80% (Face 5) | 95.11% (Face 6) |
| **Deterministic Action OOB Rate** | 20.77% | 20.77% | 20.91% |

*Note on Command Completion Metric*: Because new commands are issued immediately after each success, exactly one command remains active when an episode reaches timeout. Issued-command completion is defined as:

$$\text{Completion Rate} = \frac{\text{Completed Commands}}{\text{Completed Commands} + \text{Episodes}}$$

Thus, in the adverse condition, $23,514 / 24,514 = 95.92\%$ indicates that when the policy is executing a command, it overwhelmingly succeeds; it is not a claim that drops never occur.

---

### Deep Failure Decomposition: Long-Horizon Retention Fatigue

The jump in drop rate under the adverse condition (from $9.70\%$ to $45.30\%$) provides a transparent look into the policy's physical boundary. Decomposing the 453 adverse drop episodes reveals that this is an **accumulated long-horizon retention breakdown**, not an inability to reorient the die:

| Adverse Drop Breakdown | Value |
|---|---:|
| Total Evaluated Episodes | 1,000 |
| Total Dropped Episodes | 453 (45.3%) |
| Episodes completing $\ge 1$ command before dropping | 424 (93.6% of drops) |
| Episodes completing $\ge 10$ commands before dropping | 219 (48.3% of drops) |
| Episodes completing $\ge 20$ commands before dropping | 109 (24.1% of drops) |
| Episodes completing $\ge 30$ commands before dropping | 40 (8.8% of drops) |
| **Mean completed commands prior to drop** | **11.49 commands** |
| **Median completed commands prior to drop** | **9 commands** |
| **Median time elapsed before drop** | **7.28 seconds** |
| **Mean commands in surviving episodes (no drop)** | **33.47 commands** |

Under $1.5\times$ mass and $0.7\times$ friction, the tangential friction cone narrows while the inertial forces required to accelerate the die increase. The policy successfully executes 9–11 consecutive reorientations on average before a momentary slip compounds into an unrecoverable grasp failure.

---

### Video Demonstrations

The following rollouts illustrate the learned behavior across nominal, variation, and adverse conditions. All clips are presented at **0.5× playback speed** (rendered from 60 Hz control trajectories) to enable close inspection of finger contact patterns and gait transitions.

##### 1. Nominal Semantic Success (Oblique & Top-Down Views)
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/dice/dice_nominal_success.mp4" poster="/assets/img/dice/dice_nominal_success_poster.webp" class="dice-demo-video" width="760" height="428" controls=true autoplay=true loop=true muted=true title="DICE nominal in-hand reorientation" caption="Nominal rollout (Seed 10): 6 consecutive commands completed in 4.27 simulation seconds. Synchronized oblique manipulation view (left) and top-down verification view (right)." %}
</div>

The target-face indicator shifts only after the commanded face aligns within $25.8^\circ$, velocity settles under $1.0\text{ rad/s}$, and the posture is stabilized for all 20 consecutive confirmation steps. The synchronized top-down camera provides immediate visual confirmation of the upward-facing pip patterns.

##### 2. Symmetric Physics Variation ($\pm 20\%$ Mass & Friction)
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/dice/dice_physics_variation.mp4" poster="/assets/img/dice/dice_physics_variation_poster.webp" class="dice-demo-video" width="760" height="428" controls=true autoplay=true loop=true muted=true title="DICE symmetric physics variation comparison" caption="Comparative rollout: Nominal condition (left, Seed 10, 4.27s) beside held-out ±20% mass and friction variation (right, Seed 18, 4.65s). The policy exhibits equivalent finger coordination without retraining." %}
</div>

The side-by-side comparison confirms that the policy maintains smooth dynamic finger coordination and reorientation speed under $\pm 20\%$ perturbations in mass, static friction, and dynamic friction.

##### 3. Adverse Retention Boundary ($1.5\times$ Mass, $0.7\times$ Friction)
<div style="text-align: center; margin: 1.5rem auto 2rem auto;">
  {% include video.html path="/assets/video/dice/dice_adverse_boundary.mp4" poster="/assets/img/dice/dice_adverse_boundary_poster.webp" class="dice-demo-video" width="760" height="428" controls=true autoplay=true loop=true muted=true title="DICE adverse grasp retention boundary" caption="Adverse stress rollout (Seed 9): 10 consecutive commands successfully completed before a grasp retention failure at 8.07 seconds. Oblique view (left) and side contact view (right)." %}
</div>

The adverse rollout captures the exact retention fatigue mechanism: the hand completes 10 sequential reorientations rapidly, but the reduced friction margin causes gradual slip over repeated contact handoffs, eventually leading to a drop at $t = 8.07\text{ s}$.

---

### Key Takeaways & Technical Summary

1. **Continuous Multi-Command MDP**: Conditioning on dynamic goal sequences without episode resets trains agents to find reusable, steady-state manipulation gaits rather than brittle, terminal one-shot trajectories.
2. **Progress-Based Reward Shaping**: Replacing static alignment bonuses with differential angular progress ($\Delta \theta_t$) and clawback hold shaping cleanly eliminates policy loitering and enforces active manipulation.
3. **Asymmetric State Representation**: Supplying ground-truth 6D fingertip wrenches and spatial velocities exclusively to the centralized critic provides high-quality value baselines while keeping the 126-D actor fully deployable.
4. **Transparent Robustness Boundaries**: Rigorous testing across 1,000-episode panels reveals that moderate ($\pm 20\%$) material shifts are fully absorbed without performance loss, while severe heavy/slippery stress exposes a long-horizon retention boundary that provides a concrete roadmap for future domain randomization.

All code, environment definitions, training scripts, and evaluation logs are open-source in the **[GitHub Repository](https://github.com/djdhillxn/dice)**.
