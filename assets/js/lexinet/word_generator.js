/* LexiNet browser demos.
 * Expects a compact model JSON exported by src/export_lexinet_web_model.py.
 */
(function () {
  "use strict";

  const DEFAULT_MODEL_URL = "/assets/json/lexinet/lexinet_web_model_3_5.json";
  const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
  const MAX_LIVES = 6;

  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededRandom(seedText) {
    if (seedText === null || seedText === undefined || String(seedText).trim() === "") {
      return Math.random;
    }
    return mulberry32(xmur3(String(seedText))());
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function availableOrders(model) {
    return Object.keys(model.orders || {})
      .map((order) => Number(order))
      .filter((order) => Number.isFinite(order))
      .sort((a, b) => a - b);
  }

  function chooseNForWordLength(wordLength, model) {
    const orders = availableOrders(model);
    if (!orders.length) throw new Error("No model orders were loaded.");
    const hasOrder = (n) => orders.includes(n);
    if (wordLength <= 2 && hasOrder(3)) return 3;
    if (wordLength === 3 && hasOrder(4)) return 4;
    return Math.max(...orders);
  }

  function probabilityConfigForWordLength(wordLength) {
    if (wordLength > 9) {
      return {
        useInterpolation: false,
        smoothingFactor: 0.05,
        giveRandomProbToSparsity: true,
      };
    }
    return {
      useInterpolation: true,
      smoothingFactor: 0.05,
      giveRandomProbToSparsity: false,
    };
  }

  function getCounterTotal(counter) {
    if (!counter) return 0;
    let total = 0;
    for (const value of Object.values(counter)) total += Number(value || 0);
    return total;
  }

  function calculateForwardProbability(model, prefix, letter, n, config) {
    const order = model.orders[String(n)];
    let forwardProb = 0;

    if (order && order.ngrams) {
      const counter = order.ngrams[prefix.join("")];
      if (counter) {
        const forwardCount = Number(counter[letter] || 0) + config.smoothingFactor;
        const totalCount = getCounterTotal(counter) + config.smoothingFactor * DEFAULT_ALPHABET.length;
        forwardProb = totalCount > 0 ? forwardCount / totalCount : 0;
      } else if (config.giveRandomProbToSparsity) {
        forwardProb = 1 / DEFAULT_ALPHABET.length;
      }
    }

    const mu = 0.80;
    if (config.useInterpolation && prefix.length > 2 && model.orders[String(n - 1)]) {
      const backoffProb = calculateForwardProbability(model, prefix.slice(1), letter, n - 1, config);
      forwardProb = mu * forwardProb + (1 - mu) * backoffProb;
    }
    return forwardProb;
  }

  function calculateBackwardProbability(model, suffix, letter, n, config) {
    const order = model.orders[String(n)];
    let reverseProb = 0;

    if (order && order.ngramsRev) {
      const counter = order.ngramsRev[suffix.join("")];
      if (counter) {
        const reverseCount = Number(counter[letter] || 0) + config.smoothingFactor;
        const totalCount = getCounterTotal(counter) + config.smoothingFactor * DEFAULT_ALPHABET.length;
        reverseProb = totalCount > 0 ? reverseCount / totalCount : 0;
      } else if (config.giveRandomProbToSparsity) {
        reverseProb = 1 / DEFAULT_ALPHABET.length;
      }
    }

    const mu = 0.80;
    if (config.useInterpolation && suffix.length > 2 && model.orders[String(n - 1)]) {
      const backoffProb = calculateBackwardProbability(model, suffix.slice(0, -1), letter, n - 1, config);
      reverseProb = mu * reverseProb + (1 - mu) * backoffProb;
    }
    return reverseProb;
  }

  function fallbackGenerationScores(model, currentWord) {
    const orders = availableOrders(model);
    const lowestOrder = model.orders[String(Math.min(...orders))];
    const unigrams = lowestOrder.unigrams || {};
    const candidates = [];

    for (let position = 0; position < currentWord.length; position += 1) {
      if (currentWord[position] !== "_") continue;
      for (const letter of DEFAULT_ALPHABET) {
        candidates.push({ position, letter, score: Number(unigrams[letter] || 1), fallback: true });
      }
    }
    return candidates;
  }

  function generationCandidateScores(model, currentWord, n) {
    const config = probabilityConfigForWordLength(currentWord.length);
    const padded = [...Array(n - 1).fill("^"), ...currentWord, ...Array(n - 1).fill("$")];
    const candidates = [];

    for (let wordIndex = 0; wordIndex < currentWord.length; wordIndex += 1) {
      if (currentWord[wordIndex] !== "_") continue;
      const paddedIndex = wordIndex + n - 1;
      const prefix = padded.slice(paddedIndex - (n - 1), paddedIndex);
      const suffix = padded.slice(paddedIndex + 1, paddedIndex + n);

      for (const letter of DEFAULT_ALPHABET) {
        const forwardProb = calculateForwardProbability(model, prefix, letter, n, config);
        const reverseProb = calculateBackwardProbability(model, suffix, letter, n, config);
        const score = forwardProb * reverseProb;
        if (score > 0) candidates.push({ position: wordIndex, letter, score, fallback: false });
      }
    }
    return candidates;
  }

  function weightedChoice(items, temperature, rng) {
    if (!items.length) return null;
    if (temperature <= 0) {
      return items.reduce((best, item) => (item.score > best.score ? item : best), items[0]);
    }

    const maxScore = Math.max(...items.map((item) => item.score));
    if (maxScore <= 0) return items[Math.floor(rng() * items.length)];

    const scale = 1.0 / Math.max(temperature, 1e-9);
    let total = 0;
    const cumulative = items.map((item) => {
      const safeScore = Math.max(item.score, 0);
      const weight = safeScore > 0 ? Math.pow(safeScore / maxScore, scale) : 0;
      total += weight;
      return { total, item };
    });

    if (total <= 0) return items[Math.floor(rng() * items.length)];
    const threshold = rng() * total;
    for (const entry of cumulative) {
      if (entry.total >= threshold) return entry.item;
    }
    return cumulative[cumulative.length - 1].item;
  }

  function generateModelWord(model, options) {
    const wordLength = Number(options.wordLength || 8);
    const temperature = Number(options.temperature ?? 0.85);
    const rng = options.rng || Math.random;
    const nUsed = chooseNForWordLength(wordLength, model);

    const currentWord = Array(wordLength).fill("_");
    const trace = [];

    for (let step = 0; step < wordLength; step += 1) {
      let candidates = generationCandidateScores(model, currentWord, nUsed);
      let usedFallback = false;
      if (!candidates.length) {
        candidates = fallbackGenerationScores(model, currentWord);
        usedFallback = true;
      }
      const chosen = weightedChoice(candidates, temperature, rng);
      if (!chosen) break;
      currentWord[chosen.position] = chosen.letter;
      trace.push({
        step: step + 1,
        position: chosen.position + 1,
        letter: chosen.letter,
        score: chosen.score,
        pattern: currentWord.join(""),
        usedFallback: usedFallback || chosen.fallback,
      });
    }

    return {
      word: currentWord.join(""),
      wordLength,
      nUsed,
      temperature,
      trace,
    };
  }

  function generateModelWords(model, options) {
    const count = Math.max(1, Math.min(24, Number(options.count || 8)));
    const rng = seededRandom(options.seed);
    const words = [];
    for (let i = 0; i < count; i += 1) {
      words.push(generateModelWord(model, { ...options, rng }));
    }
    return words;
  }

  function cleanSecretWord(value) {
    return String(value || "").trim().toLowerCase();
  }

  function validateSecretWord(value) {
    const word = cleanSecretWord(value);
    if (!word) throw new Error("Please enter one word.");
    if (!/^[a-z]+$/.test(word)) throw new Error("Please use only English letters A-Z, no spaces or punctuation.");
    if (word.length < 2 || word.length > 45) throw new Error("Please enter a word between 2 and 45 letters.");
    return word;
  }

  function fallbackGuessScores(model, alreadyGuessedLetters) {
    const orders = availableOrders(model);
    const lowestOrder = model.orders[String(Math.min(...orders))];
    const unigrams = lowestOrder.unigrams || {};
    const guessed = new Set(alreadyGuessedLetters);
    return DEFAULT_ALPHABET
      .split("")
      .filter((letter) => !guessed.has(letter))
      .map((letter) => ({ letter, score: Number(unigrams[letter] || 1), fallback: true }));
  }

  function guessCandidateScores(model, knownWord, alreadyGuessedLetters, n) {
    const wordLength = knownWord.length;
    const config = probabilityConfigForWordLength(wordLength);
    const knownLetters = new Set(knownWord.filter((letter) => letter !== "_"));
    const blockedLetters = new Set([...alreadyGuessedLetters, ...knownLetters]);
    const scores = new Map();
    const padded = [...Array(n - 1).fill("^"), ...knownWord, ...Array(n - 1).fill("$")];

    for (let wordIndex = 0; wordIndex < knownWord.length; wordIndex += 1) {
      if (knownWord[wordIndex] !== "_") continue;
      const paddedIndex = wordIndex + n - 1;
      const prefix = padded.slice(paddedIndex - (n - 1), paddedIndex);
      const suffix = padded.slice(paddedIndex + 1, paddedIndex + n);

      for (const letter of DEFAULT_ALPHABET) {
        if (blockedLetters.has(letter)) continue;
        const forwardProb = calculateForwardProbability(model, prefix, letter, n, config);
        const reverseProb = calculateBackwardProbability(model, suffix, letter, n, config);
        const combinedProb = forwardProb * reverseProb;
        if (combinedProb > 0) scores.set(letter, (scores.get(letter) || 0) + combinedProb);
      }
    }

    return [...scores.entries()]
      .map(([letter, score]) => ({ letter, score, fallback: false }))
      .sort((a, b) => b.score - a.score || a.letter.localeCompare(b.letter));
  }

  function guessNextLetter(model, knownWord, alreadyGuessedLetters) {
    const nUsed = chooseNForWordLength(knownWord.length, model);
    let candidates = guessCandidateScores(model, knownWord, alreadyGuessedLetters, nUsed);
    let usedFallback = false;

    if (!candidates.length) {
      candidates = fallbackGuessScores(model, alreadyGuessedLetters);
      usedFallback = true;
    }
    if (!candidates.length) return null;

    candidates.sort((a, b) => b.score - a.score || a.letter.localeCompare(b.letter));
    return {
      letter: candidates[0].letter,
      nUsed,
      usedFallback: usedFallback || candidates[0].fallback,
      topCandidates: candidates.slice(0, 5),
    };
  }

  function revealMatches(actualWord, knownWord, guessedLetter) {
    let hit = false;
    const next = knownWord.slice();
    for (let i = 0; i < actualWord.length; i += 1) {
      if (actualWord[i] === guessedLetter) {
        next[i] = guessedLetter;
        hit = true;
      }
    }
    return { nextKnownWord: next, hit };
  }

  function playGuessingGame(model, actualWord, maxLives = MAX_LIVES) {
    const target = validateSecretWord(actualWord);
    let lives = maxLives;
    const knownWord = Array(target.length).fill("_");
    const alreadyGuessed = new Set();
    const trace = [];

    while (lives > 0 && knownWord.join("") !== target) {
      const guess = guessNextLetter(model, knownWord, alreadyGuessed);
      if (!guess) break;

      alreadyGuessed.add(guess.letter);
      const { nextKnownWord, hit } = revealMatches(target, knownWord, guess.letter);
      if (!hit) lives -= 1;
      for (let i = 0; i < knownWord.length; i += 1) knownWord[i] = nextKnownWord[i];

      trace.push({
        turn: trace.length + 1,
        letter: guess.letter,
        hit,
        pattern: knownWord.join(""),
        lives,
        nUsed: guess.nUsed,
        usedFallback: guess.usedFallback,
        topCandidates: guess.topCandidates,
      });
    }

    return {
      actualWord: target,
      finalPattern: knownWord.join(""),
      won: knownWord.join("") === target,
      livesRemaining: lives,
      wrongGuesses: maxLives - lives,
      guessesUsed: trace.length,
      trace,
    };
  }

  function renderSlots(word) {
    return Array.from(word)
      .map((letter) => {
        const known = letter !== "_";
        const label = known ? letter.toUpperCase() : "";
        return `<span class="lexi-slot${known ? " known" : ""}">${escapeHtml(label)}</span>`;
      })
      .join("");
  }

  function renderGeneratedTrace(trace) {
    if (!trace || !trace.length) return "";
    const rows = trace
      .map(
        (turn) => `<tr>
          <td>${turn.step}</td>
          <td>${turn.position}</td>
          <td><strong>${escapeHtml(turn.letter.toUpperCase())}</strong></td>
          <td>${escapeHtml(turn.pattern.toUpperCase())}</td>
          <td>${turn.usedFallback ? "unigram fallback" : "context"}</td>
        </tr>`
      )
      .join("");
    return `<details class="lexi-trace"><summary>Show generation trace for the first word</summary>
      <table class="lexi-history"><thead><tr><th>Step</th><th>Position</th><th>Letter</th><th>Pattern</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table>
    </details>`;
  }

  function renderGeneratedWords(words) {
    if (!words.length) return `<div class="lexi-muted">No generated words yet.</div>`;
    const first = words[0];
    const cards = words
      .map(
        (item) => `<div class="lexi-word-card">
          <div class="lexi-word">${renderSlots(item.word)}</div>
          <div class="lexi-generated-text">${escapeHtml(item.word)}</div>
        </div>`
      )
      .join("");

    return `<div class="lexi-results-panel">
      <div class="lexi-status">Generated ${words.length} model word${words.length === 1 ? "" : "s"}</div>
      <div class="lexi-grid">
        <div class="lexi-stat"><div class="lexi-label">Word length</div><div class="lexi-value">${first.wordLength}</div></div>
        <div class="lexi-stat"><div class="lexi-label">Samples</div><div class="lexi-value">${words.length}</div></div>
        <div class="lexi-stat"><div class="lexi-label">Temperature</div><div class="lexi-value">${first.temperature}</div></div>
      </div>
      <div class="lexi-word-list">${cards}</div>
      ${renderGeneratedTrace(first.trace)}
    </div>`;
  }

  function renderGuessTrace(trace) {
    if (!trace || !trace.length) return "";
    const rows = trace
      .map((turn) => {
        const top = (turn.topCandidates || [])
          .map((item) => item.letter.toUpperCase())
          .join(", ");
        return `<tr>
          <td>${turn.turn}</td>
          <td><strong>${escapeHtml(turn.letter.toUpperCase())}</strong></td>
          <td>${turn.hit ? "hit" : "miss"}</td>
          <td>${escapeHtml(turn.pattern.toUpperCase().replaceAll("_", "·"))}</td>
          <td>${turn.lives}</td>
          <td>${escapeHtml(top)}</td>
        </tr>`;
      })
      .join("");
    return `<details class="lexi-trace" open><summary>Show guessing trace</summary>
      <table class="lexi-history"><thead><tr><th>Turn</th><th>Guess</th><th>Result</th><th>Pattern</th><th>Lives</th><th>Top letters</th></tr></thead><tbody>${rows}</tbody></table>
    </details>`;
  }

  function renderGuessResult(result) {
    const status = result.won ? "The model got it." : "The word survived.";
    const statusClass = result.won ? "lexi-win" : "lexi-loss";

    return `<div class="lexi-results-panel">
      <div class="lexi-status ${statusClass}">${status}</div>
      <div class="lexi-word lexi-guess-word">${renderSlots(result.finalPattern)}</div>
      <div class="lexi-generated-text">target: ${escapeHtml(result.actualWord)}</div>
      <div class="lexi-grid">
        <div class="lexi-stat"><div class="lexi-label">Lives left</div><div class="lexi-value">${result.livesRemaining}</div></div>
        <div class="lexi-stat"><div class="lexi-label">Wrong guesses</div><div class="lexi-value">${result.wrongGuesses}</div></div>
        <div class="lexi-stat"><div class="lexi-label">Total guesses</div><div class="lexi-value">${result.guessesUsed}</div></div>
      </div>
      ${renderGuessTrace(result.trace)}
    </div>`;
  }

  async function loadModel(modelUrl) {
    const response = await fetch(modelUrl, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Could not load model JSON from ${modelUrl}: HTTP ${response.status}`);
    }
    return response.json();
  }

  async function initLexiNetDemo(root) {
    const modelUrl = root.dataset.modelUrl || DEFAULT_MODEL_URL;
    const status = root.querySelector("[data-lexinet-status]");
    const generateForm = root.querySelector("[data-lexinet-generate-form]");
    const guessForm = root.querySelector("[data-lexinet-guess-form]");
    const generateOutput = root.querySelector("[data-lexinet-generate-output]");
    const guessOutput = root.querySelector("[data-lexinet-guess-output]");
    const buttons = root.querySelectorAll("button[type='submit']");

    try {
      status.textContent = "Loading compact n-gram tables...";
      const model = await loadModel(modelUrl);
      root.lexinetModel = model;
      status.textContent = "Model loaded. Ready to play.";
      buttons.forEach((button) => { button.disabled = false; });
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("lexi-error");
      return;
    }

    generateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(generateForm);
      const options = {
        wordLength: Number(data.get("wordLength")),
        count: Number(data.get("count")),
        temperature: Number(data.get("temperature")),
        seed: String(data.get("seed") || ""),
      };
      try {
        const words = generateModelWords(root.lexinetModel, options);
        generateOutput.innerHTML = renderGeneratedWords(words);
      } catch (error) {
        generateOutput.innerHTML = `<div class="lexi-error">${escapeHtml(error.message)}</div>`;
      }
    });

    guessForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(guessForm);
      try {
        const result = playGuessingGame(root.lexinetModel, data.get("secretWord"), MAX_LIVES);
        guessOutput.innerHTML = renderGuessResult(result);
      } catch (error) {
        guessOutput.innerHTML = `<div class="lexi-error">${escapeHtml(error.message)}</div>`;
      }
    });

    generateForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  }

  function initAll() {
    document.querySelectorAll("[data-lexinet-demo]").forEach((root) => {
      initLexiNetDemo(root);
    });
  }

  const api = {
    availableOrders,
    calculateBackwardProbability,
    calculateForwardProbability,
    chooseNForWordLength,
    generateModelWord,
    generateModelWords,
    guessCandidateScores,
    guessNextLetter,
    playGuessingGame,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.LexiNet = api;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAll);
    } else {
      initAll();
    }
  }
})();
