---
layout: page
title: "HotpotQA: ReAct Multi-Hop Question Answering Agent"
description: "Play a multi-hop QA quiz, then inspect the agent's Wikipedia search trajectory and official HotpotQA scores"
# -description: "ReAct reasoning + acting agent with LangGraph, vLLM, and comparative single-pass RAG evaluation"
github: "https://github.com/djdhillxn/hotpot"
category: AI Agents
portfolio_order: 15
portfolio_exclude: True
portfolio_tags: [ReAct, Multi-Hop QA, HotpotQA, LangGraph, vLLM, Hybrid Retrieval]
portfolio_summary: |
  I built a ReAct-style question-answering agent that searches the full HotpotQA Wikipedia corpus, follows entity bridges, and returns both a concise answer and sentence-level evidence. The evaluation writes official-format predictions for answer, supporting-fact, and joint EM/F1, while retaining every Thought, Action, and Observation for inspection.

  The project page turns those trajectories into a quiz: answer a validation question yourself, compare your response with the agent and the gold answer, and then open the exact evidence trail behind the prediction.
---



<link rel="stylesheet" href="{{ '/assets/css/hotpot/project.css' | relative_url }}">

<div
  class="hotpot-quiz"
  data-hotpot-quiz
  data-source-url="{{ '/assets/json/hotpot/react_trajectories.json' | relative_url }}"
  markdown="1"
>
  <section class="hotpot-hero hotpot-quiz-card" aria-labelledby="hotpot-question-heading">
    <div class="hotpot-hero-copy">
      <p class="hotpot-kicker">Human vs. multi-hop agent</p>
      <h2>Who Wants to Be a Millionaire, You or AI?</h2>
      <p>
        Answer a HotpotQA question, compare your response with the gold answer
        and the agent's prediction, then inspect every search, lookup, and
        observation behind its conclusion. <a class="hotpot-text-link" href="#technical-notes">Read the technical notes</a>
      </p>
      <p class="hotpot-data-status" data-hotpot-data-status aria-live="polite">
        Loading the complete ReAct trajectory archive…
      </p>
    </div>

    <div class="hotpot-hero-divider"></div>

    <header class="hotpot-question-header">
      <div>
        <p class="hotpot-kicker">Question <span data-hotpot-position>—</span></p>
        <div class="hotpot-question-tags" data-hotpot-question-tags></div>
      </div>
      <label class="hotpot-filter-label">
        Question type
        <select data-hotpot-filter disabled>
          <option value="all">All questions</option>
          <option value="bridge">Bridge</option>
          <option value="comparison">Comparison</option>
        </select>
      </label>
    </header>

    <h3 id="hotpot-question-heading" data-hotpot-question>Preparing a question…</h3>

    <form class="hotpot-answer-form" data-hotpot-form>
      <label for="hotpot-user-answer">Your answer</label>
      <div class="hotpot-answer-row">
        <input
          id="hotpot-user-answer"
          data-hotpot-answer
          type="text"
          autocomplete="off"
          placeholder="Type a short answer"
          disabled
        >
        <button type="submit" data-hotpot-submit disabled>Check answer</button>
        <div class="hotpot-next-stack">
          <button type="button" class="hotpot-button-secondary" data-hotpot-next disabled>
            Different question
          </button>
          <button type="button" class="hotpot-previous-link" data-hotpot-previous disabled>
            ← Previous question
          </button>
        </div>
        <button type="button" class="hotpot-button-secondary" data-hotpot-random disabled>
          Random question
        </button>
      </div>
      <p class="hotpot-answer-hint">
        Capitalization, punctuation, articles, small typos, and reordered date
        tokens will not cost you the round.
      </p>
    </form>
  </section>

  <section class="hotpot-result" data-hotpot-result hidden aria-live="polite">
    <div class="hotpot-result-message">
      <p class="hotpot-kicker">Verdict</p>
      <h3 data-hotpot-verdict></h3>
      <p data-hotpot-verdict-note></p>
    </div>

    <div class="hotpot-answer-comparison">
      <article>
        <span>You</span>
        <strong data-hotpot-user-answer></strong>
        <small data-hotpot-user-grade></small>
      </article>
      <article>
        <span>ReAct agent</span>
        <strong data-hotpot-agent-answer></strong>
        <small data-hotpot-agent-grade></small>
      </article>
      <article class="hotpot-gold-answer">
        <span>Gold answer</span>
        <strong data-hotpot-gold-answer></strong>
        <small>HotpotQA reference</small>
      </article>
    </div>

    <div class="hotpot-example-metrics" data-hotpot-example-metrics></div>
  </section>

  <section class="hotpot-trace" data-hotpot-trace hidden>
    <details>
      <summary>
        <span>
          <small>Agent execution trajectory</small>
          <strong>Open the agent's trajectory</strong>
        </span>
        <span class="hotpot-summary-meta" data-hotpot-trace-summary></span>
      </summary>
      <div class="hotpot-trace-context">
        <div>
          <span>Visited pages</span>
          <p data-hotpot-visited-pages></p>
        </div>
        <div>
          <span>Predicted supporting facts</span>
          <p data-hotpot-supporting-facts></p>
        </div>
      </div>
      <div class="hotpot-steps" data-hotpot-steps></div>
    </details>
  </section>

  <noscript>
    The quiz requires JavaScript to load the static trajectory artifact.
  </noscript>

<script src="{{ '/assets/js/hotpot/quiz.js' | relative_url }}" defer></script>
</div>

## Technical notes
{: #technical-notes }

<div class="hotpot-tech" markdown="1">

<p class="hotpot-tech-lede">The central question was practical: <strong>does adaptive evidence acquisition beat a strong one-shot reader when the model, corpus, hybrid retriever, and page reranker are held fixed?</strong> Across every question in the public HotpotQA FullWiki development set, the final ReAct system improved both answer quality and sentence-level evidence recovery.</p>

### Experimental contract

This is a paired, system-level comparison between a **reranked single-pass RAG baseline** and an **adaptive ReAct agent**. The comparison job aligns records by HotpotQA ID and refuses to publish results if the runs disagree on any question or gold annotation, or on the shared model, corpus hash, index size, retrieval settings, and page-reranker configuration.

- **Held fixed:** frozen `Qwen/Qwen2.5-7B-Instruct` served through vLLM, the 2017 HotpotQA Wikipedia corpus, BM25 + BGE/FAISS retrieval, Reciprocal Rank Fusion, and `BAAI/bge-reranker-base` page reranking.
- **Changed deliberately:** the baseline retrieves once and generates once; ReAct can reformulate searches, inspect a current page with `lookup`, retain sentence-level evidence, and continue for up to seven tool actions.
- **Evaluation scope:** all 7,405 public FullWiki development questions, with 64 concurrent workers and no failed records in either run. No model fine-tuning or post-training was used.

Because ReAct receives more iterative retrieval compute, this experiment measures the benefit of the **deployed adaptive system as a whole**. It is not a component-level causal ablation of the controller alone.

### System design

<div class="hotpot-pipeline" aria-label="Shared retrieval stack branching into the single-pass baseline and ReAct agent">
  <div class="hotpot-pipeline-stage hotpot-pipeline-shared">
    <span>Shared retrieval</span>
    <strong>BM25 top 50 + BGE dense top 50 → RRF → load 15 pages → rerank 15 pages</strong>
    <small>5.23M fixed Wikipedia introductions with original sentence IDs</small>
  </div>
  <div class="hotpot-pipeline-branches">
    <article>
      <span>Reranked RAG</span>
      <strong>Top 7 pages → one generation</strong>
      <small>No lookup, sentence reranking, or persistent memory</small>
    </article>
    <article class="hotpot-pipeline-react">
      <span>Adaptive ReAct</span>
      <strong>Top 4 pages → sentence rerank → bounded memory</strong>
      <small>Thought → search / lookup / finish, up to 7 actions</small>
    </article>
  </div>
  <div class="hotpot-pipeline-stage hotpot-pipeline-output">
    <span>Shared output contract</span>
    <strong>Concise answer + exact `[Wikipedia title, sentence ID]` evidence</strong>
  </div>
</div>

#### Shared retrieval foundation

The benchmark uses the official October 1, 2017 introductory-paragraph corpus rather than live Wikipedia, preserving 0-based sentence IDs for supporting-fact scoring. Each query retrieves up to 50 BM25 candidates and 50 normalized `BAAI/bge-base-en-v1.5` dense candidates from a 5,233,235-document index. Reciprocal Rank Fusion (`k = 60`) combines the ranks. The system then loads the introductory text and original sentence IDs for the top 15 pages and cross-encodes those pages with `BAAI/bge-reranker-base`. The dense index is FAISS `IVF4096,PQ96x8` with `nprobe = 32`.

The baseline exposes every non-empty sentence from the top seven reranked introductions, with its original title and sentence ID, to one Qwen generation. This makes it a serious **RAG + reranking** comparator rather than an unretrieved or weak-retrieval floor.

#### Adaptive search and sentence memory

ReAct uses the same first-stage stack on every `search[query]` action. The page cross-encoder reranks the 15 candidates for that search; the best exact-title match, or otherwise the top local page, becomes the current page. All non-empty sentences from the top four pages are then cross-encoded against the original question plus the current search.

The highest-ranked evidence is retained in a persistent memory capped at **12 snippets and 6,000 characters**. A successful `lookup[keyword]` searches only the current page, advances through repeated matches in classic ReAct style, and protects the matched sentence in memory. Search-derived snippets fill the remaining budget by their best within-search sentence rank. Scores from different search queries are never compared directly, and memory never changes which page `lookup` navigates; those two invariants avoid cross-query score calibration and navigation drift.

A LangGraph controller alternates `Thought`, `Action`, and tool-written `Observation` turns. The reader may emit only `search[...]`, `lookup[...]`, or `finish[...]`, with temperature 0, `top_p = 1`, and a 150-token generation cap. A hard stop before `Observation:` prevents the model from fabricating tool output. If the seven-action budget expires, a final evidence-only synthesis step still produces an answer rather than returning an empty trajectory.

#### Grounded evidence and reproducible artifacts

The model returns a short canonical answer plus supporting sentence pairs. A citation enters the official prediction only if that exact title and sentence ID appeared in a tool observation; invalid citations are retained separately for diagnosis. Each run writes evaluator-format predictions, per-question metrics, lossless trajectories, retrieval telemetry, timing, and a manifest containing the model, corpus/index identity, and configuration used.

Graph expansion was available as an ablation but disabled in the reported configuration. The public FullWiki run never gives the model the ten paragraphs bundled with each HotpotQA example; those paragraphs are retained only for diagnostics.

### Final results

These are **official-formula scores on the public development labels**, not a hidden-test leaderboard submission.

| Official HotpotQA metric | Reranked RAG | ReAct | Change |
| :--- | ---: | ---: | ---: |
| Answer EM | 40.45 | **46.67** | **+6.23 pp** |
| Answer F1 | 51.80 | **60.48** | **+8.68 pp** |
| Supporting Fact EM | 9.66 | **14.91** | **+5.25 pp** |
| Supporting Fact F1 | 43.97 | **52.25** | **+8.28 pp** |
| Joint EM | 6.08 | **9.44** | **+3.36 pp** |
| **Joint F1** | 26.86 | **37.11** | **+10.25 pp** |

The Joint-F1 improvement was nearly identical for the benchmark's two major reasoning types: **+10.23 points on 5,918 bridge questions** and **+10.33 points on 1,487 comparison questions**. The paired records also show that the aggregate gain was not produced by a small set of outliers: ReAct rescued 1,295 baseline Answer-EM failures, regressed on 834 baseline successes, and therefore added a net 461 exactly correct answers.

### Did iterative retrieval expose better evidence?

<figure class="hotpot-result-figure">
  <img src="{{ '/assets/img/hotpot/evidence_coverage_comparison.svg' | relative_url }}" alt="Comparison of four evidence-coverage diagnostics for reranked single-pass RAG and ReAct. ReAct is higher on all four.">
  <figcaption>Evidence-exposure diagnostics explain part of the mechanism, but are not official leaderboard metrics.</figcaption>
</figure>

ReAct increased observed gold-document recall from **77.02% to 80.40%** and observed gold supporting-fact recall from **77.41% to 80.01%**. More importantly, the share of questions for which the model saw *every* gold supporting sentence rose from **57.79% to 63.67%**. This is consistent with adaptive retrieval finding missing bridge evidence; it does not, by itself, prove which controller or memory decision caused each correct answer.

### What trajectory length reveals

<figure class="hotpot-result-figure">
  <img src="{{ '/assets/img/hotpot/react_quality_by_hops.svg' | relative_url }}" alt="ReAct and matched-baseline Joint F1 grouped by ReAct trajectory length, with question counts. ReAct is strongest at two hops and falls below the baseline on the seven-hop tail.">
  <figcaption>The baseline line is recomputed on the exact questions in each ReAct hop bucket; hop count is an outcome of the agent, not a randomized treatment.</figcaption>
</figure>

Two- and three-action trajectories were the productive center of the distribution: ReAct reached **50.26** and **41.14** Joint F1 on those subsets, versus **31.21** and **25.79** for the baseline on the same questions. The seven-action bucket tells the equally important failure story. It contains 1,055 unresolved questions, where ReAct fell to **11.62** Joint F1 versus the matched baseline's **19.20**. Longer trajectories are an endogenous hard-question tail, so this does not show that extra hops *cause* failure. It does identify the clearest next engineering target: earlier detection of stalled searches, followed by query reformulation, backtracking, or an earlier fallback to the one-shot answer.

### Scoring contract

- **Answer EM/F1** use the official lowercasing, punctuation/article removal, whitespace normalization, and token-overlap rules. A categorical mismatch among `yes`, `no`, and `noanswer` receives zero.
- **Supporting Fact EM/F1** compare sets of exact `(title, sentence_id)` pairs.
- **Joint EM** requires both answer and supporting-fact exact match. **Joint F1** combines answer and evidence by multiplying their respective precisions and recalls before taking the harmonic mean; it is not the average of Answer F1 and Supporting Fact F1.

The evidence-coverage values above are explicitly labeled diagnostics and never mixed into the six official HotpotQA metrics. The quiz's typo-tolerant human verdict is also a presentation feature only; it has no effect on benchmark scores.

### Limits on the claim

1. **Development, not hidden test.** The metric implementation follows the official evaluator, but a public-label development run is not an official leaderboard submission.
2. **System comparison, not isolated ablation.** ReAct and the baseline share the reader and retrieval foundation, but ReAct also spends more retrieval and reranking compute and owns a sentence-memory module.
3. **One frozen reader.** The experiment establishes behavior for Qwen2.5-7B-Instruct; it does not establish scaling trends across other model families or sizes.
4. **Inspectable is not causal.** Thought/Action/Observation traces are useful execution records, but generated thoughts are not guaranteed explanations of the model's internal causal process.

Reproduction commands and infrastructure details remain in the [project repository](https://github.com/djdhillxn/hotpot), while the [generated comparison report](https://github.com/djdhillxn/hotpot/blob/main/docs/results/comparison_report.md) and [machine-readable summary](https://github.com/djdhillxn/hotpot/blob/main/docs/results/comparison_summary.json) preserve the exact published analysis. Metric definitions follow the [official HotpotQA evaluator](https://github.com/hotpotqa/hotpot/blob/master/hotpot_evaluate_v1.py); the control pattern follows [ReAct](https://arxiv.org/abs/2210.03629).

</div>
