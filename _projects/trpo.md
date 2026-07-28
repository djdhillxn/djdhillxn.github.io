---
layout: page
title: TRPO, PPO, and NPG Experiments
description: Policy gradients methods in reinforcement learning
importance: -3
category: RL
github: "https://github.com/djdhillxn/trpo"
img: assets/img/qbert-cartoon-project-thumb.webp
img_size: small
portfolio_order: 30
portfolio_tags: [TRPO, PPO, policy optimization, MuJoCo, Atari]
portfolio_image: assets/img/qbert-cartoon-project-thumb.webp
portfolio_image_alt: Q*bert project thumbnail
portfolio_summary: |
  I studied the policy-optimization thread in reinforcement learning: Conservative Policy Iteration, Natural Policy Gradient, Trust Region Policy Optimization, and Proximal Policy Optimization. The project follows how constrained or clipped policy updates try to keep improvement stable while still letting the policy move.

  I implemented TRPO, PPO, and NPG from scratch in PyTorch, benchmarked them on MuJoCo locomotion and Atari environments, and ran a Hopper step-size ablation to study where NPG becomes brittle. In the empirical runs, PPO reached stronger Hopper and Walker results with roughly one-tenth of the sampled environment interactions used by the TRPO setup. See the [code](https://github.com/djdhillxn/trpo), **[project report](/assets/pdf/A%20Study%20of%20Policy%20Optimization%20in%20RL%20-%20Project%20Report.pdf)**, and my broader RL reflection [here](/blogs).
---

<!-- TRPO/PPO I worked on a reinforcement learning project implementing Trust Region Policy Optimization (TRPO) and Proximal Policy Optimization (PPO) algorithms, see github, the project report, and overview writeup. -->

<!-- -- [TRPO/PPO](/projects/trpo). I studied the broad domain of policy optimization in RL where the recurring idea of constrained policy changes gave way to powerful methods starting from mixture updates methods to TRPO and PPO. I implemented TRPO, PPO, and NPG in PyTorch and benchmarked them on several MuJoCo locomotion and Atari environments. See the [code](https://github.com/djdhillxn/trpo) and **[project report](/assets/pdf/A%20Study%20of%20Policy%20Optimization%20in%20RL%20-%20Project%20Report.pdf)**. I have also expressed my fervor for RL [here](/blogs). -->

I performed a theoretical study on policy optimization that included reading the papers on Conservative Policy Iteration (CPI), Trust Region Policy Optimization (TRPO), Natural Policy Gradient (NPG), and Proximal Policy Optimization (PPO). A major component of the project was studying the monotonic improvement proofs behind the theoretically justified policy improvement algorithms of CPI and TRPO. I analyzed how the surrogate objective and mixture-update constraints in CPI inspired the KL-divergence constraint in TRPO and the clipped objective in PPO. 

I implemented TRPO, PPO, and NPG in PyTorch to reproduce and benchmark a subset of the paper results, comparing their performance on several MuJoCo robotic locomotion and Atari game environments. I also designed ablation studies on the Hopper locomotion task by varying step-size magnitudes for NPG. This helped me underscore the role of adaptive step sizing and line search in TRPO in stabilizing policy updates and preventing catastrophic performance degradation. In the empirical experiments, the PPO implementation with the clipped objective achieved stronger results using only one-tenth of the sampled environment steps for the Hopper and Walker tasks.

My presentation for this project on April 24, 2026 followed these [slides](/assets/pdf/A%20Study%20of%20Policy%20Optimization_April_20_final.pdf).

Find project report [here](/assets/pdf/A%20Study%20of%20Policy%20Optimization%20in%20RL%20-%20Project%20Report.pdf). The code implementation is at the [GitHub repo](https://github.com/djdhillxn/trpo). In the repository, we have also implemented parallel rollouts for faster simulation trajectory collection. This work was my main projectwork for the course, Mathematical Principles of RL, I took at UW-Madison in Spring 2026. I have written more about this RL course and my broader experiences with RL in my [blogs](/blogs).


<div class="trpo-demo-video">
{% include video.html path="https://www.youtube.com/embed/5aAyjBLfW0o" class="trpo-demo-iframe" width="800" height="480" title="PPO trained Q*bert agent with 2000 epochs and 256 size 2-hidden layer CNN policy simulation" caption="A simulation rollout of the Q*bert agent trained with PPO for 2000 epochs with 2x256 hidden dim policy." %}
</div>

<div class="trpo-demo-video">
{% include video.html path="https://www.youtube.com/embed/_vJEdQ3Plu0" class="trpo-demo-iframe" width="800" height="480" title="TRPO trained Q*bert agent with 300 epochs and 20 size 2-hidden layer CNN simulation" caption="A simulation rollout of the Q*bert agent trained with TRPO." %}
</div>
