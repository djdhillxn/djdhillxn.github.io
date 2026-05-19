/* LexiNet browser word generator.
 * Expects a compact model JSON exported by scripts/export_lexinet_web_model.py.
 */
(function () {
  "use strict";

  const DEFAULT_MODEL_URL = "/assets/json/lexinet/lexinet_web_model_3_5.json";
  const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

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
    return Object.keys(model.orders)
      .map((order) => Number(order))
      .filter((order) => Number.isFinite(order))
      .sort((a, b) => a - b);
  }

  function chooseNForWordLength(wordLength, model) {
    const orders = availableOrders(model);
    if (!orders.length) {
      throw new Error("No model orders were loaded.");
    }
    const hasOrder = (n) => orders.includes(n);
    if (wordLength <= 2 && hasOrder(3)) return 3;
    if (wordLength === 3 && hasOrder(4)) return 4;
    return Math.max(...orders);
  }

  function normalizeMode(mode) {
    const value = String(mode || "best").toLowerCase();
    if (value === "best") return "bidirectional";
    if (["bidirectional", "forward", "backward"].includes(value)) return value;
    throw new Error("mode must be one of: best, bidirectional, forward, backward");
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
      smoothingFactor: 0,
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
      const key = prefix.join("");
      const counter = order.ngrams[key];
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
      const key = suffix.join("");
      const counter = order.ngramsRev[key];
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

  function generationCandidateScores(model, currentWord, n, mode) {
    const normalizedMode = normalizeMode(mode);
    const config = probabilityConfigForWordLength(currentWord.length);
    const padded = [
      ...Array(n - 1).fill("^"),
      ...currentWord,
      ...Array(n - 1).fill("$"),
    ];
    const candidates = [];

    for (let wordIndex = 0; wordIndex < currentWord.length; wordIndex += 1) {
      if (currentWord[wordIndex] !== "_") continue;
      const paddedIndex = wordIndex + n - 1;

      for (const letter of DEFAULT_ALPHABET) {
        let forwardProb = 1.0;
        let reverseProb = 1.0;

        if (["bidirectional", "forward"].includes(normalizedMode)) {
          const prefix = padded.slice(paddedIndex - (n - 1), paddedIndex);
          forwardProb = calculateForwardProbability(model, prefix, letter, n, config);
        }
        if (["bidirectional", "backward"].includes(normalizedMode)) {
          const suffix = padded.slice(paddedIndex + 1, paddedIndex + n);
          reverseProb = calculateBackwardProbability(model, suffix, letter, n, config);
        }

        let score = forwardProb * reverseProb;
        if (normalizedMode === "forward") score = forwardProb;
        if (normalizedMode === "backward") score = reverseProb;
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
    const mode = normalizeMode(options.mode || "best");
    const temperature = Number(options.temperature ?? 0.85);
    const rng = options.rng || Math.random;
    const forcedOrder = Number(options.modelOrder || 0);
    const nUsed = forcedOrder > 0 ? forcedOrder : chooseNForWordLength(wordLength, model);

    if (!model.orders[String(nUsed)]) {
      throw new Error(`No loaded model for n=${nUsed}. Available orders: ${availableOrders(model).join(", ")}`);
    }

    const currentWord = Array(wordLength).fill("_");
    const trace = [];
    for (let step = 0; step < wordLength; step += 1) {
      let candidates = generationCandidateScores(model, currentWord, nUsed, mode);
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
      mode,
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

  function renderSlots(word) {
    return Array.from(word)
      .map((letter) => `<span class="lexi-slot known">${escapeHtml(letter.toUpperCase())}</span>`)
      .join("");
  }

  function renderTrace(trace) {
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
        <div class="lexi-stat"><div class="lexi-label">Model order</div><div class="lexi-value">n=${first.nUsed}</div></div>
        <div class="lexi-stat"><div class="lexi-label">Mode</div><div class="lexi-value small">${escapeHtml(first.mode)}</div></div>
        <div class="lexi-stat"><div class="lexi-label">Temperature</div><div class="lexi-value">${first.temperature}</div></div>
      </div>
      <div class="lexi-word-list">${cards}</div>
      ${renderTrace(first.trace)}
    </div>`;
  }

  async function loadModel(modelUrl) {
    const response = await fetch(modelUrl, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Could not load model JSON from ${modelUrl}: HTTP ${response.status}`);
    }
    return response.json();
  }

  function populateOrderSelect(select, model) {
    const orders = availableOrders(model);
    select.innerHTML = `<option value="0">Auto</option>${orders
      .map((order) => `<option value="${order}">n=${order}</option>`)
      .join("")}`;
  }

  async function initLexiNetGenerator(root) {
    const modelUrl = root.dataset.modelUrl || DEFAULT_MODEL_URL;
    const status = root.querySelector("[data-lexinet-status]");
    const output = root.querySelector("[data-lexinet-output]");
    const form = root.querySelector("[data-lexinet-form]");
    const orderSelect = root.querySelector("[name='modelOrder']");

    try {
      status.textContent = "Loading compact n-gram tables...";
      const model = await loadModel(modelUrl);
      root.lexinetModel = model;
      populateOrderSelect(orderSelect, model);
      status.textContent = `Loaded model orders: ${availableOrders(model).map((n) => `n=${n}`).join(", ")}.`;
      form.querySelector("button[type='submit']").disabled = false;
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("lexi-error");
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const options = {
        wordLength: Number(data.get("wordLength")),
        count: Number(data.get("count")),
        temperature: Number(data.get("temperature")),
        mode: String(data.get("mode")),
        modelOrder: Number(data.get("modelOrder")),
        seed: String(data.get("seed") || ""),
      };
      try {
        const words = generateModelWords(root.lexinetModel, options);
        output.innerHTML = renderGeneratedWords(words);
      } catch (error) {
        output.innerHTML = `<div class="lexi-error">${escapeHtml(error.message)}</div>`;
      }
    });

    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  }

  function initAll() {
    document.querySelectorAll("[data-lexinet-generator]").forEach((root) => {
      initLexiNetGenerator(root);
    });
  }

  const api = {
    generateModelWord,
    generateModelWords,
    calculateForwardProbability,
    calculateBackwardProbability,
    chooseNForWordLength,
    availableOrders,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.LexiNetGenerator = api;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAll);
    } else {
      initAll();
    }
  }
})();
