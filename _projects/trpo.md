---
layout: page
title: TRPO and PPO
description: Policy gradients methods in reinforcement learning
importance: -3
category: RL
github: "https://github.com/djdhillxn/trpo"
---

More recently, as part of my RL course project, I performed a theoretical study on policy optimization that included reading the papers on Conservative Policy Iteration, Trust Region Policy Optimization, Natural Policy Gradient, and Proximal Policy Optimization. A major component of the project was studying the monotonic improvement proofs behind the theoretically justified policy improvement algorithms of CPI and TRPO. I analyzed how the surrogate objective and mixture-update constraints in CPI inspired the KL-divergence constraint in TRPO and the clipped objective in PPO. I implemented TRPO, PPO, and NPG in PyTorch to reproduce and benchmark a subset of the paper results, comparing their performance on several MuJoCo robotic locomotion and Atari game environments. I also designed ablation studies on the Hopper locomotion task by varying step-size magnitudes for NPG. This helped me underscore the role of adaptive step sizing and line search in TRPO in stabilizing policy updates and preventing catastrophic performance degradation. In the empirical experiments, the PPO implementation with the clipped objective achieved stronger results using only one-tenth of the sampled environment steps for the Hopper and Walker tasks.

[Github repo](\https://github.com/djdhillxn/trpo)

In terms of code implementation, we have also implemented parallel rollouts for faster simulation trajectory collection.