---
layout: page
title: Spotify Wrapped, But Everyday
description: personal Spotify library intelligence from playlists, liked songs, and artist-level curation patterns
github: "https://github.com/djdhillxn/spotify"
importance: -3
category: NLP
---

<link rel="stylesheet" href="{{ '/assets/css/spotify/dashboard.css' | relative_url }}">


[Jump to the technical report](#technical-report) for the implementation details behind the dashboard and recommendation logic.

For the past 6 years, Spotify and I have been good friends. Every december when Spotify Wrapped drops, it is such a warm thing. I always put on stories on instagram of it. And by a long shot, the amount of minutes listened to is more than 50,000, always.

A song brings back so many memories associated with the phase when I first discovered it.
This project turns that my music learning history with spotify archive to unravel the suppressed nostalgia.

I have always treated music as a personal archive: playlists for phases, liked songs for instinct, and old tracks that sometimes disappear from memory until they  

The first version analyzes my Spotify playlists and liked songs using the Spotify Web API. It asks a simple question: **how well do my playlists represent the songs I have saved?**

<div class="spotify-dashboard" data-spotify-dashboard data-dashboard-url="{{ '/assets/json/spotify/dashboard_data.json' | relative_url }}" markdown="1">

<!-- Move these slots to reorder the dashboard. Valid sections: overview, artist-landscape, playlist-explorer, diversity-and-overlap, playlist-health, saved-timeline, curation-gaps, artist-map, affinity-comparison, nostalgia-picks, top-items, missing-liked-songs. -->

<div data-spotify-section="overview">
  <div class="spotify-loading">Loading Spotify library intelligence...</div>
</div>

<div data-spotify-section="artist-landscape"></div>

<div data-spotify-section="playlist-explorer"></div>

<div data-spotify-section="diversity-and-overlap"></div>

<div data-spotify-section="playlist-health"></div>

<div data-spotify-section="saved-timeline"></div>

<div data-spotify-section="curation-gaps"></div>

<div data-spotify-section="artist-map"></div>

<div data-spotify-section="affinity-comparison"></div>

<div data-spotify-section="nostalgia-picks"></div>

<div data-spotify-section="top-items"></div>

<!--<section class="spotify-narrative" markdown="1">-->

## What is it good for?

Absolutely nothing. Good song in Rush hour.

This is placeholder text for the recommendations section. You can replace this with your own explanation of why the missing liked songs matter, how the suggested playlists are chosen, and what a reader should notice before opening the recommendation table.

<!--</section>-->

<div data-spotify-section="missing-liked-songs"></div>

</div>

<script src="{{ '/assets/js/spotify/dashboard-core.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/spotify/dashboard-overview.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/spotify/dashboard-artist-playlists.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/spotify/dashboard-analysis.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/spotify/dashboard-deep-dives.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/spotify/dashboard-recommendations.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/spotify/dashboard.js' | relative_url }}" defer></script>

<a id="technical-report"></a>

## Technical report

This project is built as a static data product over an exported Spotify library snapshot. The data artifact stores playlist tracks, liked songs, artist metadata, playlist-level summaries, overlap statistics, and Spotify's own long-term affinity rankings. The page itself does not require a live Spotify login: the browser loads a JSON file, and the JavaScript modules render each section from that artifact. That separation keeps the portfolio page simple while still showing the data engineering and analysis choices behind the dashboard.

The first layer is coverage analysis. Tracks saved in liked songs are compared against tracks that already appear in named playlists, which gives a direct estimate of how much of the saved library has been curated into playlists. The dashboard reports playlist count, liked song count, playlist coverage, missing liked songs, and the number of unique artists represented in playlists versus liked songs. Artist rankings are computed from unique track counts and playlist appearances, so the same artist can be compared across the curated playlist library and the saved-song library.

The recommendation section uses the missing liked songs as candidate additions. For each saved song that is not already present in a playlist, the exported data records suggested playlists based on artist overlap with existing playlist contents. In practice, this is a lightweight content-based recommender: a song is represented by its artist set, playlists are represented by the artists already present in them, and the best suggested playlist is surfaced with a short overlap reason. It is intentionally simple for this first version, but it creates a useful baseline before adding heavier recommendation methods such as embeddings, collaborative filtering, or sequence-aware listening behavior.

The playlist analysis section adds two compact statistical views. Playlist diversity is measured with artist-distribution entropy: playlists where songs are spread across many artists score higher, while playlists dominated by a small number of artists score lower. The normalized entropy value makes playlists easier to compare even when their sizes differ. Playlist overlap is measured with set similarity, including shared tracks and artist-level Jaccard similarity. Jaccard similarity is a good fit here because it is lightweight, interpretable, and directly answers the question: how much do two playlists share relative to their combined contents?

Finally, the Spotify affinity section is kept separate from the playlist-derived statistics. These rankings come from Spotify's calculated long-term top artists and tracks, so they act as a sanity check against the curation-based views. If the playlist rankings, liked-song rankings, and Spotify affinity rankings disagree, that disagreement is itself useful: it can show the difference between songs I repeatedly listen to, songs I save, and songs I actually organize into playlists.

## rough notes

<!-- The things that we will add, let's write them down here. i have too many ideas in my head.

- i have obviously the inclination to showcase my NLP, Information retrieval/RAG skills, recommendataion skills and so much more. so i have the direction to follow immediately and the motivation for it as well. 

- the book on recommendation systems by the prof who graduated from iit kanpur in 1996. i should read it. the content-based collaborative systems method and more. how to make use of it then? what are some useful practical things that i could do with the recommendation system methods? -->

- how about some unsupervised learning methods. to find insights from my system here. 

- oh yeah, the visualizations. i have so much opportunities to add graphs. Principal component analysis (PCA) is something we ought to do! andy konwinski.. what he said in the seminar.. and you i have also had similar thoughts to leverage machine learning in real life to make informed decisions. doing PCA here will be a starting point for me to get going to do ever better with my life... which i have so much capability to do.

- the very basic statistical tools deployed here such as jaccard similarity and things, we should write about it. this, and other things we are obviously focusing on to do things efficiently. the hype cycle is following its trajectory very nicely as predicted. now my inclination to jump onto fancy things on the get go is slowing down, for the better. it is such a nice thing. it has made me more efficient, more systematic. You know, when i start off with them small things, it gives me the momentum, the confidency, more coherant with the headful of ideas that i have for everything. i am more productive this way, and i am able to incorporate the 
