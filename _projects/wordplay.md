---
layout: page
title: WordPlay
description: bidirectional character n-gram language models for word generation and Hangman word guessing challenge
github: "https://github.com/djdhillxn/lexinet"
importance: -2
category: NLP
---

<link rel="stylesheet" href="{{ '/assets/css/lexinet/word_generator.css' | relative_url }}">

WordPlay model, built from bidirectional character n-grams, is shown with two fun use cases.
The trainings and codes are available in the [LexiNet repository](https://github.com/djdhillxn/lexinet).

<!-- 
1. **WordGuesser**:  implemented n-gram language models for guessing strategy for the word guessing challenge 
2. **WordGenerator**: produce new english words from the trained generative probabilistic n-gram models. 
-->

## Word guessing

**WordGuesser** plays a Hangman-style challenge by ranking the next most likely letter, 

In this version of Hangman, you choose the secret word and decide how many wrong guesses the model is allowed. The model begins with a row of blank positions, scores every unguessed letter using the visible forward and reverse character contexts, selects its strongest candidate, and reveals every matching position. A miss costs one life; the game ends when the word is complete or the configured lives run out.

<div class="lexi-demo" data-lexinet-demo data-model-url="{{ '/assets/json/lexinet/lexinet_web_model_3_6.json' | relative_url }}">
  <div class="lexi-demo-header">
    <div class="lexi-demo-kicker">WordGuesser</div>
    <div class="lexi-demo-title">Let the model guess your word</div>
    <div class="lexi-demo-subtitle">
      Enter one English word and choose how forgiving you want the game to be.
    </div>
  </div>

  <form data-lexinet-guess-form>
    <div class="lexi-controls lexi-controls-guess">
      <div class="lexi-control lexi-control-wide">
        <label for="lexi-secret-word">Your word</label>
        <input id="lexi-secret-word" name="secretWord" type="text" value="clandestine" minlength="2" maxlength="45" pattern="[A-Za-z]+" autocomplete="off" required>
      </div>
      <div class="lexi-control">
        <label for="lexi-max-lives">Lives</label>
        <input id="lexi-max-lives" name="maxLives" type="number" min="1" max="26" value="6" required>
      </div>
    </div>
    <div class="lexi-actions">
      <button class="lexi-button" type="submit" disabled>Start guessing</button>
      <span class="lexi-status-line" data-lexinet-status>Preparing model...</span>
    </div>
  </form>

  <div data-lexinet-guess-output></div>
</div>

## Word generation

**WordGenerator** samples entirely new English-like words from the learned character patterns. 

Ever wondered English has so many words that you hear for the first time, and you wonder how do they even exist, and why haven’t I heard about it ever before? kibosh, svengali, chicanery, bulwark, clandestine, and so on.. 

This discovery of new words does not stop even after memorizing all the vocabulary words for the toefl, it goes on and on. It seems like there is some magical power in this language with the potential to make up new words, assign them a meaning, and wait for them to get popularized. This idea to potentially make up new words is not a novel idea at all, history is witness to so many words being brought into the popular culture for more than the last half milennia… more increasingly now than ever in the information age.

The wordplay model is fueling that increasing surge, only for your curiosity. How many letters do you want in the english word that wordplay will generate for you? Let the model know. How strangely new do you want the word to be? Let the model know, with the temperature parameter. High temp (>0.8) means so strange, zero temp means no strange.

<!-- Choose a length and sampling temperature, and the model fills blank character positions using probability distributions learned from real English words. The result is not guaranteed to exist in a dictionary; that is rather the point. -->

<div class="lexi-demo" data-lexinet-demo data-model-url="{{ '/assets/json/lexinet/lexinet_web_model_3_6.json' | relative_url }}">
  <div class="lexi-demo-header">
    <div class="lexi-demo-kicker">WordGenerator: unravel some discoveries for yourself</div>
    <div class="lexi-demo-title">Generate your new English word!</div>
    <div class="lexi-demo-subtitle">
      Choose a length and let the trained n-gram tables sample plausible character sequences.
      You may also fix letters at any positions and let the model complete the remaining blanks.
    </div>
  </div>

  <form data-lexinet-generate-form>
    <div class="lexi-controls">
      <div class="lexi-control">
        <label for="lexi-word-length">Word length</label>
        <input id="lexi-word-length" name="wordLength" type="number" min="2" max="45" value="13" required>
      </div>
      <div class="lexi-control">
        <label for="lexi-temperature">Temperature</label>
        <input id="lexi-temperature" name="temperature" type="number" min="0" max="2" step="0.05" value="0.85" required>
      </div>
      <div class="lexi-control">
        <label for="lexi-seed">Seed optional</label>
        <input id="lexi-seed" name="seed" type="text" placeholder="e.g. eminem">
      </div>
    </div>
    <div class="lexi-pattern-editor">
      <div class="lexi-pattern-heading">
        <span class="lexi-pattern-label">Fixed letter positions <span>optional</span></span>
        <button class="lexi-pattern-clear" type="button" data-lexinet-clear-pattern>Clear letters</button>
      </div>
      <div class="lexi-pattern-slots" data-lexinet-pattern role="group" aria-label="Optional fixed letters by word position"></div>
    </div>
    <div class="lexi-actions">
      <button class="lexi-button" type="submit" disabled>Generate word</button>
      <span class="lexi-status-line" data-lexinet-status>Preparing model...</span>
    </div>
  </form>

  <div data-lexinet-generate-output></div>
</div>

### What might these new words be useful for
Maybe you can these new generated words as the name for the secret incorporation idea that you have had since ages.


### About this trained model: it is very simple and intuitive actually

The patterns that you observe in the words generated by the models arise having been trained on a dataset of 227,000 english words.

One might be so bold to call these words hallucinations! Hah, it is not incorrect to say that. Of all these patterns that are being learned this generation, the very premise of finding new words that were not trained on, that is, seen before in the training set, would surface in between the probability distributions, known in the pop culture as hallucinations.

LexiNet is a character-level modeling project built around bidirectional n-gram language models. The repository trains forward and reverse models with start/end padding, masked contexts, interpolation, backoff, and smoothing.

### What is happening here?: a technical note for the demos

The guessing game is deterministic and greedy. Given the visible pattern, it scores every unguessed letter across all blank positions using forward and reverse context probabilities, guesses the highest-scoring letter, reveals its matches, and loses one configured life only when the letter is absent.

The generator begins with a blank word of the requested length. At every step, it scores candidates letters at every remaining blank position using the trained forward and and reverse n-gram contexts, samples one `(position, letter)` pair, fills that slot, and repeats until the word is complete. Lower temeperatures make the generation more conservative; higher temperatures make it more exploratory.

When fixed letters are supplied, those positions become the initial context instead of blanks. The model leaves them unchanged, fills only the open positions, and preserves the same pattern when you request another candidate.

This is not dictionary lookup; it is probabilistic generation. Both demos operate from learned character-context counts, and the generator is explicitly searching for strings that can emerge between those observed patterns. 

<script src="{{ '/assets/js/lexinet/word_generator.js' | relative_url }}" defer></script>

Both boxes run entirely in the browser and share one cached JSON export of the trained n-gram count tables. The interface is separated so normal project text can sit between the demos, while the large model artifact is downloaded only once. The public model includes orders n=3 through n=6 and automatically uses the strongest suitable order for the requested word length.
