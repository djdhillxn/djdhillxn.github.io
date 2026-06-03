---
layout: page
title: Blogs
permalink: /blogs
nav: true
nav_order: 2
---

#### Reinforcement Learning

In Spring 2026 at UW-Madison, I took a course on the Mathematical Principles of RL. With a core focus on theoretical derivations, I completed an extensive study of the policy gradient
algorithms literature reading the papers on CPI, NPG, TRPO, and PPO. I also did a project implementing TRPO, NPG, and PPO algorithms and evaluating locomotion and Atari game tasks.
See details [here](/projects/trpo)

With these foundations, it became easier to follow the reserach built on top of these methods and motivated me to further pursue this RL field.. 

Papers that I read InstructGPT (2022).
Reinforcement learning with human feedback.
Direct policy optimization.


more advnaced research in this domain. 

#### More work I feel good about looking back
At Gartner, where research documents are a flagship offering, a major project I led sought to quantify the impact of each document’s readership on client retention.  From standard churn modeling, we get the high-level retention impact of monthly viewership frequencies but this project’s goal was to go one step further to find the fine-grained impact for each document, called Implied Value Rating (IVR). To calculate the IVR, I fitted Bayesian logistic regression models, one for each document, utilizing an additional document flag feature, pulling normalized document viewership coefficients from trained churn models to serve as priors. I led the implementation and productionization work for this IVR project, with the ideation for the methodology being a team effort. To translate this into actionable insights, I independently designed a system to identify the driving factors behind the IVR metrics using each document's intrinsic features. I leveraged transformer embeddings of section-wise text of documents to build a topic model hierarchy, aggregating these insights to extract document-level topic features.  Regressing these features against the IVR identified statistically significant topics driving user retention, directly linking writing topics to retention and serving as a starting point of using data science insights for content planning. I am proud to have led this workstream.

#### Research at IIT Roorkee

During my undergraduate studies, I led a research project focused on real-time elephant detection using thermal imaging to mitigate human-elephant conflict. Working under supervision of my advising professor in my final year, we collected and annotated a dataset of 50,694 thermal frames which included instances of humans, elephants, and other animals. The dataset covered varied and challenging environmental conditions, allowing us to test how different modeling choices generalized across settings. Fine-tuning pretrained YOLO models on this noisy dataset initially resulted in overfitting and poor recall in specific test locations. To address this, I systematically evaluated the impact of various preprocessing techniques on the input thermal frames. I found that inversion and bilateral filtering were the most effective techniques, improving contrast and reducing noise, respectively. Combining these techniques yielded even stronger results. Ultimately, I devised an ensemble approach using four preprocessed variants with a lightweight pretrained model, increasing elephant recall on the dataset from 0.35 to 0.62, striking a balance between improved recall and fast inference latency crucial for real-time deployment.

Supervisor: Prof. Vinod Pankajakshan \\
Department of Electronics and Communication Engineering, IIT Roorkee

#### Favorite book readings <!--Repetitive Book Reads-->
*The Elements of Statistical Learning* Hastie, Tibshirani, Friedman \\
*Speech and Language Processing* Dan Jurafsky, James Martin \\
<!--*Machine Learning Engineering* Andriy Burkov \\-->
*CS224W: Machine Learning with Graphs* Jure Leskovec \\
*Statistics 110: Probability* Joe Blitzstein


#### I am a cinephile

Man, I see in Fight Club the strongest and smartest men who’ve ever lived. I see all this potential, and I see it squandered. Goddamn it, an entire generation pumping gas, waiting tables; slaves with white collars. Advertising has us chasing cars and clothes, working jobs we hate so we can buy shit we don’t need. We’re the middle children of history, man. No purpose or place. We have no Great War. No Great Depression. Our great war is a spiritual war. Our great depression is our lives. We’ve all been raised on television to believe that one day we’d all be millionaires, and movie gods, and rock stars, but we won’t. And we’re slowly learning that fact. And we’re very, very pissed off.

#### Until It Sleeps
When not typing: 007, Sopranos \\
Dearest Author: Malcolm Gladwell \\
Favorite Restaurant: Mom's Spaghetti \\
Annual New Year's Eve Spot: Hilltop Goa