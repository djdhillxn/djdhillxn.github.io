---
layout: page
title: Cinephile
description: N-of-1 contextual bandit-based movie recommendation engine
github: "https://github.com/djdhillxn/cinephile"
importance: -1
category: Recommendation Systems
portfolio_order: 90
show_in_blog: true
portfolio_tags: [contextual bandits, recommendation systems, N-of-1 system, exploratory ML, Flask]
portfolio_summary: |
  Along with being a stan for music, and also, a stan in the literal sense, as per what people say in the pop culture, I am also somewhat of a stan for movies myself, which I attribute to the good taste of movies my friends introduced me to. Also, on the main note, the project 'Cinephile' is a contextual bandit-based movie recommendation engine designed as an N-of-1 system where recommendations are driven exclusively by your individual choices rather than collaborative filtering.

  By focusing solely on the movie attributes you are drawn toward while integrating a highly tunable exploratory component, Cinephile ensures recommendations adapt to your evolving taste without trapping you in a repetitive feedback loop.
---

### Overview

**Cinephile** is an exploratory movie recommendation system built around contextual bandit algorithms. Unlike traditional collaborative filtering models that rely on user-community patterns, Cinephile operates as an **N-of-1 system**: your recommendations are influenced solely by your historical interactions and attribute preferences.

### Key Features

- **N-of-1 Personalization**: Only your interactions shape future recommendations—no noise from aggregate user behavior.
- **Contextual Bandit Core**: Learns multi-attribute feature representations of movies to estimate reward probabilities for your preferences.
- **Tunable Exploration**: Uses exploration strategies (such as Upper Confidence Bound / Thompson Sampling balancing) to continuously surface new genres and hidden gems rather than converging into a narrow recommendation echo chamber.
- **Local Application**: Built with a lightweight backend framework ([Flask](https://github.com/djdhillxn/cinephile)) that can easily be executed locally.

## What's even new with this project?

I take this rec engine as something that will take you out of your comfort zone. It is not your run-of-the-mill recommendation engine, firstly, it won't be that good to predicting what you would have liked also, movies that are almost so close adn similiar in plots and efverything, that you never challenge yourself to watch something new, but maybe you might atleast get some baroque and serendipitous suggestions from the probabilisitic saampling of movies that this recommendation engine does. 

and also, this engine, unlike netflix, which doesn't even have a number of good shows, whcih have all been taken over by hbo, you never get any good suggestions, speaking from my own expericne. all you get is new, cute, and okay stuff whyich doesn't get an iota close to what the actual good stuff is, which maybe scattered over in the gazillion streaming platforms that are out there. i personally, am in my dog days, the graduate studnet days, where i can't be that prodigal, so i obvious look for sources to watch from platforms of questionable legality (if you're the po-po, i'm kidding). 