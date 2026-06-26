---
layout: about
title: About
permalink: /
#subtitle: Machine Learning Enthusiast | Track Athlete

profile:
  align: right
  image: cold_diet_coke_in_sun.jpg
  image_circular: false # crops the image to make it circular
  more_info: >

news: true  # includes a list of news items
latest_posts: false  # includes a list of the newest posts
selected_papers: false # includes a list of papers marked as "selected={true}"
social: false  # includes social icons at the bottom of the page
---

<!--Areas of Interest: **Natural Language Processing**, **Graph Neural Networks**-->
Hi there, from one Machine Learning enthusiast to another!

**TL;DR**
I am Dheeraj, currently pursuing an MS in Computer Science at UW-Madison, where I will be graduating in May 2027. I have 2 years of industry experience as a data scientist at Gartner and HiLabs, a healthcare data interoperability startup. I completed my undergrad in ECE at IIT Roorkee. Here is my **[resume](/assets/pdf/Curriculum%20Vitae%20Dheeraj%20Dhillon.pdf)**.

I am looking for opportunities that will challenge me to solve meaningful problems by leveraging methodologies in my domain of study, spanning Machine Learning, Natural Language Processing, and Reinforcement Learning. Some of the applications/use cases that fascinate me the most are locomotion, robotics, language models, and recommendation systems. I am always excited to be part of teams that will require me to punch above my weight. Consequently, I am even more excited to be part of and contribute to a startup.

I am actively seeking internship opportunities for Summer and Fall 2026 to work as an ML researcher, applied scientist, or data scientist. Ping me on email or LinkedIn, I would be happy to connect!

<!--fellow enthusiast to another-->
#### Project work
See my projects page [here](/projects) which goes into extensive details on each of the projects, and implementations are available at my [GitHub](https://github.com/djdhillxn).
Brief summaries of select projects are:

<!-- TRPO/PPO I worked on a reinforcement learning project implementing Trust Region Policy Optimization (TRPO) and Proximal Policy Optimization (PPO) algorithms, see github, the project report, and overview writeup. -->

- [TRPO/PPO](/projects/trpo). I studied the broad domain of policy optimization in RL where the recurring idea of constrained policy changes gave way to powerful methods starting from mixture updates methods to TRPO and PPO. I implemented TRPO, PPO, and NPG in PyTorch and benchmarked them on several MuJoCo locomotion and Atari environments. See the [code](https://github.com/djdhillxn/trpo) and **[project report](/assets/pdf/A%20Study%20of%20Policy%20Optimization%20in%20RL%20-%20Project%20Report.pdf)**. I have also expressed my fervor for RL [here](/blogs).

<!-- RLHF Trained Qwen2.5-0.5 Instruct LLM model with SFT training on HelpSteer3 dataset. Performed Reward model training using HelpSteer3. Executed Qwen2.5-0.5 Instruct human alignment using RLHF using PPO with reference SFT model and using trained reward model. See codes. -->

- [RLHF using PPO](/projects/rlhf) Motivated by practical LLM alignment, I built an RLHF pipeline around Qwen2.5-0.5B-Instruct and HelpSteer3: supervised fine-tuning, pairwise reward modeling, and token-level PPO with LoRA, KL control, reward-model scoring, and qualitative response auditing.

 <!-- explores whether preference feedback can make a small instruction-tuned language model more helpful. I built an end-to-end pipeline around Qwen2.5-0.5B and HelpSteer3: supervised fine-tuning, pairwise reward modeling, and a custom token-level PPO loop with LoRA, GAE, and KL control.  -->

- [StanLyric](/projects/stanlyric) Implemented information retrieval (IR) system to identify songs based on input queries consisting of a few lyrical sentences from a songs lyrics corpus. Developed using the BM25-Okapi method, I deployed online the static inverted indices for 44,480 songs to have a running lyric [search engine](/projects/stanlyric). This app also exhibits the ranked result's interpratability based on quantified contributions of matched keywords which vary for each candidate song based on its underlying term frequencies (TFs). 
<!-- - [StanLyric](/projects/stanlyric) helps identify a song from the fragment of a lyric stuck in your head. It runs a BM25-Okapi retrieval engine over 44,480 songs entirely in the browser, with a compact static index and score explanations that show why each result matched. -->

- [WordPlay](/projects/wordplay/) This project uses character-level language models to play the Hangman Challenge. I trained forward and reverse n-gram models with padding at word start and end. During training, I also used smoothing techniques such as add-k smoothing and kneser key smoothing to mitigate sparsity and encourage exploration. For predicting during game simulation, I incorporating backoff and interpolation. With the trained probabilistic distributions, it can also be used to generate plausible new english words. I also designed interactive [simulator](/projects/wordplay/) for game playing and word generation.

<!-- then packaged the public models into an interactive browser demo.  -->

<!-- Some generated words are surprisingly convincing; others clearly need a dictionary and a quiet moment. -->

- [Warfarin](/projects/warfarin) Investigated contextual multi-arm bandits for personalized Warfarin dosage selection in online learning setting with sequential feedback. Evaluated LinUCB and its regularized ridge and lasso variants, and the Linear Thompson sampling bandit. Compared performances along with those obtained through clinically recommended Pharmacogenetic formula. 

<!-- Resume bullet points
Evaluated contextual and linear bandit strategies for personalized Warfarin dosage selection under sequential
feedback, comparing Epsilon-Greedy, Upper Confidence Bound (UCB), Thompson Sampling, and LinUCB.
● Benchmarked online decision accuracy at 68% on dose selection, highlighting the trade-off between exploration and
patient-specific treatment optimization. -->

<!-- Warfarin frames personalized weekly dose selection as an online contextual-bandit problem over 5,528 patient records. I built a clinical preprocessing pipeline, implemented contextual bandits and compared contextual bandits and compared fixed and published dosing baselines with LinUCB, hybrid ridge, sparse LASSO UCB, and Linear Thompson Sampling policies. -->

<!-- Warfarin Project on multi-arm bandits for warfarin drug dosage estimation. Implemented contextual bandits using LinUCB and LinTS. Online learning on 5,528 patients data. Performed data cleaning and imputations using various methods. -->


#### Coursework

Machine Learning, Reinforcement Learning, 
Game Theory, Operating Systems, Linear Optimization, Non-linear optimization

I have written about my passion for these courses in my [blogs](/blogs).

#### Research work
InfraNet: An Ensemble Approach for Real-time Wildlife Detection using Infrared Thermal Imaging, IEEE AVSS August 2025.\
Read the published **[paper pdf](/assets/pdf/InfraNet%20-%20AVSS%202025.pdf)**. Find the IEEE eXplore [link](https://ieeexplore.ieee.org/document/11149967).
The source code is available at the [infrared](https://github.com/djdhillxn/infrared/tree/pipeline) repo on the pipeline branch.
See overview in my [work blogs](/blogs).

#### Industry experiences

At Gartner, working as an associate data scientist in the client retention analytics team. 
Before that, I worked at Hilabs, in Bangalore, as a data scientist in the Roster Automation team. 
See my work details here in [my blog posts](/blogs).

<!-- **My work projects detailed**\
I specialize in the domain of reinforcement learning and natural langauge sprocessing. 
the domains i have delved into is client retention analystics using enterprise data , stistical modeling using churn modeling, finding actioanble insights for drivers of retntion, suing tabular frequency engagtement data. perform clustering to find client engagement types based on this engagement data,.  

Concurrently, I have had several opportuniites to work on projects using NLP on a myriad of applictaions. These include topic modeling, training topic model hierarchies, training word2vec language models on text documents, training named entity recognition models, with neural network architectures and statistical methodologies. -->


<!-- i intend to make use of function approximation RL to train a game of jumping off cliffs, like the way redbull does. -->

<!-- A curated collection of my self-directed projects in the form of repositories. \
The topics range from broad areas of statistical algorithms, reinforcement learning, natural language processing, neural networks, and more. -->

<!-- keywords: language models, titanic dataset, linear arm bandits, autoencoders, arima, lstm, monte carlo simulations, linear regression, logistic regression, and more. -->

<!-- All projects' implementations are open-source at [GitHub](https://github.com/djdhillxn) -->

<!--Must check out by clicking on the header above. \

!-->

#### <span style="color:gray">Education and work</span>
**University of Wisconsin-Madison** August 2025 - Present \
Masters of Science, Computer Science \
Data Scientist at **Gartner Inc.**, Mar 2024 - August 2025 \
<!--### <span style="color:orange">Academics</span>-->
Bachelor of Technology, Electronics and Communication Engineering \
**Indian Institute of Technology Roorkee**, July 2019 - May 2023
<!--### <span style="color:red">Contact</span>-->


#### Emails and Socials
[dhillondheeraj84@gmail.com](mailto:dhillondheeraj84@gmail.com) \
[ddhillon@wisc.edu](mailto:ddhillon@wisc.edu) \
[dheeraj_d@ec.iitr.ac.in](mailto:dheeraj_d@ec.iitr.ac.in) 

[LinkedIn](https://www.linkedin.com/in/djdhillxn/) \ 
[Twitter](https://x.com/djdhillxn) \
[g scholar](https://scholar.google.com/citations?user=njVX6ngAAAAJ&hl=en), [ORCID](https://orcid.org/0009-0002-0234-124X)
, [IEEE Xplore](https://ieeexplore.ieee.org/author/542676216429361)

#### <span style="color:gray">My experiences with music</span>

I am very happy when I am listening to music, and this has led me to create a lot of playlists
over at [spotify](https://open.spotify.com/user/316evrj3akm6ieuhefckw6kpj6eq?si=bc183398ab8946d0).
I am also working on a project to make the playlists better, more inclusive of songs, that you may not have already added to your spotify playlists. 
My spotify insights dashboard can be found [here](/projects/spotify).


<!--
Additional academic details can be added here:
- Honors and awards
- Relevant coursework
- Thesis or project highlights

### <span style="color:gray">Documentos</span>
[Curriculum Vitae](https://docs.google.com/document/d/1TZZjmOKlhYRZZQDhMl0TL-UP1qwSboQ94PQj-k8gr90/edit?usp=sharing) \\
[Research Statement](https://docs.google.com/document/d/1Jo1nMzHaeKXYoHVlVNM24bFuCHBMswXOrya6eSNfL6c/edit?usp=sharing)

-->
