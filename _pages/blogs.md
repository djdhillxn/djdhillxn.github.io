---
layout: page
title: Blogs
permalink: /blogs
nav: true
nav_order: 2
---

<div style="color: #9a9a9a; margin-bottom: 1rem;">Hi, my name is, what? My name is, who? My name is, chka-chka, Slim Shady (fan).</div>

<!-- #### Research Statement

I am looking for opportunities in the domains of RL, NLP, and their intersection. -->

<!-- #### <span style="color:#4169E1">My endearment for Machine Learning ever since I was an adult</span>  -->
<!-- royal blue -->
The spring of 2020, right before the cusp of 18 months of not being able to stay at what had become, in 7 months, a magical place, to which not even hogwarts could come close to, the R-Land. The LBS stadium at R-Land, I longed for it, for very long. While I was longing for the track and field, and the athletics team at Roorkee, friend of the students, Prof. Ng, was there to take people's curiosities' to teach us about big, with imminent, consequential turn of events in human history, through a journey from linear regression on house prices to teaching a machine to detect digits from photos. Obviously, I was imprinted, to the very core, by it, and since then, my career paths have taken a trajectory I could never have wished to take in my childhood as adulthood was on the horizon, for I didn't know any better, although I did perfectly know, and loved, the mathematics. 
<!-- as grew up in childhood,  I wanted to take in my childhood.  -->

In Spring 2026 at UW-Madison, I took a course on the Mathematical Principles of RL. With a core focus on theoretical derivations, I completed an extensive study of the policy gradient algorithms literature reading the papers on CPI(2002), NPG(2001), TRPO(2015), and PPO(2017). In the Summer of 2026, I did nothing but read more papers ranging from RLHF(2017) to infinity and beyond. 
<!-- I also did a [project](/projects/trpo) implementing TRPO, NPG, and PPO algorithms and evaluating locomotion and Atari game tasks. -->
With these foundations I gained from doing my first full fledged RL project, say on the fun application of Atari games, it became easier to follow the research built on top of these methods and motivated me to pursue this RL field further. Further is the large language models domain which makes full use of policy optimization, where the next token prediction is the action in RL literature sense. This InstructGPT (2022) paper seems to be a good read that I found an interesting read.
Reinforcement learning from human feedback premise is given in this paper. There have so many numerous methods advancing research in this domain ever since including Group Relative Policy Optimization (GRPO), Direct policy optimization (DPO), DAPO, and many more to come. 

I first got to read in detail about RL while working on a self-motivated project for learning about Multi-Armed Bandits working at HiLabs in September 2023. Although I did enroll in an RL course through NPTEL in August 2022 at Roorkee, to which I forgot to pay the fees for, which had some deadline in around September 2022  and had to drop out hah, but during that time of a months or so, I had read at a surface level about it, which was enough to take me back to it. My faint memory of 2021 tells me that I learnt about the term reinforcment learning through Coursera.

#### <span style="color:#DC143C">Favorite book readings</span> <!--Repetitive Book Reads-->
*The Elements of Statistical Learning* Hastie, Tibshirani, Friedman \\
*Speech and Language Processing* Dan Jurafsky, James Martin \\
*A Probabilistic Theory of Pattern Recognition* Luc Devroye, László Györfi, and Gábor Lugosi.
<!--*Machine Learning Engineering* Andriy Burkov \\-->
<!-- *CS224W: Machine Learning with Graphs* Jure Leskovec \\ -->
<!-- *Statistics 110: Probability* Joe Blitzstein -->

#### <span style="color:#1DB954">My endearment for Music ever since I was a kid</span> <!-- crimson red -->
<!-- #1ED760  logo green bright>  -->
<!-- #1DB954  brand green classic> -->

<!--### <span style="color:orange">Academics</span>-->

I am very happy when I am listening to music, and this has led me to create a lot of playlists
over at [spotify](https://open.spotify.com/user/316evrj3akm6ieuhefckw6kpj6eq?si=bc183398ab8946d0).
I am also working on a project to make the playlists better, more inclusive of songs, that you may not have already added to your spotify playlists. 
My spotify insights dashboard can be found [here](/projects/spotify).

#### Until It Sleeps
When not typing: 007, Sopranos \\
Dearest Author: Malcolm Gladwell \\
Favorite Restaurant: Mom's Spaghetti

<div class="projects projects-home" style="margin-bottom: 1.5rem;">
  {%- assign blog_projects = site.projects | where_exp: "project", "project.show_in_blog == true" | sort: "portfolio_order" -%}
  {%- for project in blog_projects -%}
    {%- include project_feature.html project=project -%}
  {%- endfor -%}
</div>
<!-- #### I am a cinephile
I am always going to the top user of these apps here, but you can be the second!
I have also created an app named as Cinefile. It takes in your preferences, remembers them, and gives you personalized recommendations of movies! Find the GitHub to it [here](https://github.com/djdhillxn/cinephile) which gives way to a flask application that can be run locally! -->

Man, I see in Fight Club the strongest and smartest men who’ve ever lived. I see all this potential, and I see it squandered. Goddamn it, an entire generation pumping gas, waiting tables; slaves with white collars. Advertising has us chasing cars and clothes, working jobs we hate so we can buy shit we don’t need. We’re the middle children of history, man. No purpose or place. We have no Great War. No Great Depression. Our great war is a spiritual war. Our great depression is our lives. We’ve all been raised on television to believe that one day we’d all be millionaires, and movie gods, and rock stars, but we won’t. And we’re slowly learning that fact. And we’re very, very pissed off.

#### Annual New Year's Eve Spot: Hilltop Goa

<figure style="text-align: left; margin: 1.5rem 0;">
  <img src="{{ '/assets/img/hilltop.jpeg' | relative_url }}" alt="December 2022" loading="lazy" style="max-width: 25%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <figcaption style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">Somewhere near Ozran beach; Dil Chahta Hai; Dec 2022</figcaption>
</figure>

#### Bangalore, and working at a startup in Bangalore

As I was leaving Bangalore, I knew I would get the change to go there after at least 6-7 years, and I would not hide the fact that I couldn't hold myself but shed a few bittersweet teers for it. A big silver lining was there though, as the next stop, was, my home, Haryana. I was fortunate to start my career in the industry by working at a startup straight out of graduation, at [HiLabs](https://www.linkedin.com/company/hilabsinc/). I was lucky to learn under the supervision of a manager who gave me the confidence in my abilities to work on a myriad of problem statements. I became an expert in Git version control. The core product I worked on aimed to automate the ingestion of Medicaid/Medicare roster documents into databases in a standardized format, enabling data interoperability. I also had the opportunity to take research tasks to extract information for these rosters and store them in structured formats, which I worked through using named entity recognition methods and information extraction methods.
