---
layout: page
title: Blogs
permalink: /blogs
nav: true
nav_order: 2
---

<link rel="stylesheet" href="{{ '/assets/css/blogs.css' | relative_url }}">

#### Reinforcement Learning

In Spring 2026 at UW-Madison, I took a course on the Mathematical Principles of RL. With a core focus on theoretical derivations, I completed an extensive study of the policy gradient
algorithms literature reading the papers on CPI(2002), NPG(2001), TRPO(2015), and PPO(2017). I also did a [project](/projects/trpo) implementing TRPO, NPG, and PPO algorithms and evaluating locomotion and Atari game tasks.

With these foundations I gained from doing this project, it became easier to follow the research built on top of these methods and motivated me to pursue this RL field further. Further is the large language models domain which makes full use of policy optimization, where the next token prediction is the action in RL literature sense. This InstructGPT (2022) paper seems to be a good read that I found an interesting read.
Reinforcement learning from human feedback premise is given in this paper. There have so many numerous methods advancing research in this domain ever since including Group Relative Policy Optimization (GRPO), Direct policy optimization (DPO), DAPO, and many more to come. 

#### More work I feel good about looking back
At Gartner, where research documents are a flagship offering, a major project I led sought to quantify the impact of each document’s readership on client retention.  From standard churn modeling, we get the high-level retention impact of monthly viewership frequencies but this project’s goal was to go one step further to find the fine-grained impact for each document, called Implied Value Rating (IVR). To calculate the IVR, I fitted Bayesian logistic regression models, one for each document, utilizing an additional document flag feature, pulling normalized document viewership coefficients from trained churn models to serve as priors. I led the implementation and productionization work for this IVR project, with the ideation for the methodology being a team effort. To translate this into actionable insights, I independently designed a system to identify the driving factors behind the IVR metrics using each document's intrinsic features. I leveraged transformer embeddings of section-wise text of documents to build a topic model hierarchy, aggregating these insights to extract document-level topic features.  Regressing these features against the IVR identified statistically significant topics driving user retention, directly linking writing topics to retention and serving as a starting point of using data science insights for content planning. I am proud to have led this workstream.

#### Working at a startup in Bangalore

I was fortunate to start my career in the industry by working at a startup straight out of graduation, at [HiLabs](https://www.linkedin.com/company/hilabsinc/). I was lucky to learn under the supervision of a manager who gave me the confidence in my abilities to work on a myriad of problem statements. I became an expert in Git version control. The core product I worked on aimed to automate the ingestion of Medicaid/Medicare roster documents into databases in a standardized format, enabling data interoperability. I also had the opportunity to take research tasks to extract information for these rosters and store them in structured formats, which I worked through using named entity recognition methods and information extraction methods using hyponyms.

#### Research at IIT Roorkee

<figure class="iit-research-figure">
  <img src="{{ '/assets/img/elephant_detection_results.png' | relative_url }}" alt="Elephant detection results from the IIT Roorkee thermal-imaging research project" loading="lazy">
</figure>

During my undergraduate studies, I led a research project focused on real-time elephant detection using thermal imaging to mitigate human-elephant conflict. Working under supervision of my advising professor in my final year, we collected and annotated a dataset of 50,694 thermal frames which included instances of humans, elephants, and other animals. The dataset covered varied and challenging environmental conditions, allowing us to test how different modeling choices generalized across settings. Fine-tuning pretrained YOLO models on this noisy dataset initially resulted in overfitting and poor recall in specific test locations. To address this, I systematically evaluated the impact of various preprocessing techniques on the input thermal frames. I found that inversion and bilateral filtering were the most effective techniques, improving contrast and reducing noise, respectively. Combining these techniques yielded even stronger results. Ultimately, I devised an ensemble approach using four preprocessed variants with a lightweight pretrained model, increasing elephant recall on the dataset from 0.35 to 0.62, striking a balance between improved recall and fast inference latency crucial for real-time deployment.

Supervisor: Prof. Vinod Pankajakshan \\
Department of Electronics and Communication Engineering, IIT Roorkee

Read the published **[paper pdf](/assets/pdf/InfraNet%20-%20AVSS%202025.pdf)**.
The source code is available at the [infrared](https://github.com/djdhillxn/infrared/tree/pipeline) repo on the pipeline branch.

<div class="iit-research-clear" aria-hidden="true"></div>

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
