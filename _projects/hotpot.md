---
layout: page
title: "HotpotQA: ReAct Multi-Hop Question Answering Agent"
description: "Play a multi-hop QA quiz, then inspect the agent's Wikipedia search trajectory and official HotpotQA scores"
# -description: "ReAct reasoning + acting agent with LangGraph, vLLM, and comparative single-pass RAG evaluation"
github: "https://github.com/djdhillxn/hotpot"
category: AI Agents
portfolio_order: 15
portfolio_exclude: False
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
      <h2>Can you connect the clues before the AI agent does?</h2>
      <p>
        Test your reasoning on a HotpotQA multi-hop question, compare your answer
        with the gold reference and the ReAct agent, then open the exact search
        trajectory to see how the agent bridged intermediate entities.
        <a class="hotpot-text-link" href="#technical-notes">Skip to technical breakdown ↓</a>
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

### 1. Overview & System Architecture

I set out to answer a core architectural question: **Does an adaptive multi-step ReAct agent outperform a single-pass RAG pipeline when both share the exact same model, retrieval index, and reranker?** Across all 7,405 questions in the HotpotQA FullWiki development set, the adaptive ReAct agent achieved a **+10.25 percentage point gain in Joint F1** over a strong reranked RAG baseline.

Both systems run on the exact same frozen model (`Qwen/Qwen2.5-7B-Instruct` via vLLM), 5.23M introductory-paragraph Wikipedia index, and cross-encoder reranker (`BAAI/bge-reranker-base`):

- **Shared Retrieval Foundation**: Each query retrieves top-50 sparse candidates (Lucene BM25) and top-50 dense candidates (`BAAI/bge-base-en-v1.5` in FAISS `IVF4096,PQ96x8`), merged via Reciprocal Rank Fusion ($k = 60$). The top 15 pages are cross-encoded using `BAAI/bge-reranker-base`.
- **Reranked RAG Baseline**: Exposes all non-empty sentences from the top 7 reranked page introductions to a single Qwen generation step. It has no lookup, sentence-level reranking, or persistent memory.
- **Adaptive ReAct Agent**: Executes up to 7 reasoning hops in **LangGraph**, issuing `search[query]`, `lookup[keyword]`, or `finish[answer]` actions at temperature 0 with a 150-token cap. Relevant sentence evidence is cross-encoded and retained in a persistent memory buffer capped at 12 snippets (6,000 characters).

Because ReAct receives iterative retrieval compute, this experiment evaluates the **deployed adaptive system as a whole** rather than isolating the control loop as a single-variable ablation.

### 2. Benchmark Results & Comparative Study

The evaluation was executed concurrently across all **7,405 public FullWiki validation questions** with zero failed records or unparsed trajectories.

| Official HotpotQA metric | Reranked RAG | Adaptive ReAct | Change |
| :--- | ---: | ---: | ---: |
| Answer EM | 40.45% | **46.67%** | **+6.23 pp** |
| Answer F1 | 51.80% | **60.48%** | **+8.68 pp** |
| Supporting Fact EM | 9.66% | **14.91%** | **+5.25 pp** |
| Supporting Fact F1 | 43.97% | **52.25%** | **+8.28 pp** |
| Joint EM | 6.08% | **9.44%** | **+3.36 pp** |
| **Joint F1** | 26.86% | **37.11%** | **+10.25 pp** |

#### Key Performance Takeaways:
- **Consistent Across Question Types**: ReAct delivered identical Joint-F1 gains on both major reasoning types: **+10.23 pp on 5,918 bridge questions** and **+10.33 pp on 1,487 comparison questions**.
- **Net Answer Gains**: The aggregate score improvement was not driven by outliers: ReAct rescued 1,295 questions that the RAG baseline missed, while regressing on 834 questions, resulting in a net addition of 461 exactly correct answers.
- **Official Scoring Rules**: Metrics follow the official HotpotQA evaluator: `Answer EM/F1` use standard lowercasing, punctuation/article stripping, and token overlap. `Supporting Fact EM/F1` require exact `(title, sentence_id)` set matches. `Joint F1` combines answer and evidence precisions and recalls via their harmonic mean.

### 3. Diagnostic Insights & Trajectory Dynamics

#### Evidence Exposure Mechanism
<figure class="hotpot-result-figure">
  <img src="{{ '/assets/img/hotpot/evidence_coverage_comparison.svg' | relative_url }}" alt="Comparison of four evidence-coverage diagnostics for reranked single-pass RAG and ReAct. ReAct is higher on all four.">
  <figcaption>Iterative retrieval significantly increases gold document and supporting-fact exposure across the dataset.</figcaption>
</figure>

ReAct increased observed gold-document recall from **77.02% to 80.40%** and gold supporting-fact recall from **77.41% to 80.01%**. Crucially, the proportion of questions where the model observed *every* gold supporting sentence rose from **57.79% to 63.67%**, confirming that multi-step search effectively discovers missing entity bridges.

#### Trajectory Length & Failure Analysis
<figure class="hotpot-result-figure">
  <img src="{{ '/assets/img/hotpot/react_quality_by_hops.svg' | relative_url }}" alt="ReAct and matched-baseline Joint F1 grouped by ReAct trajectory length, with question counts. ReAct is strongest at two hops and falls below the baseline on the seven-hop tail.">
  <figcaption>ReAct peaks at 2–3 hops and degrades on the 7-hop tail, highlighting stalled search loops.</figcaption>
</figure>

- **The Productive Sweet Spot**: 2- and 3-action trajectories represented the most effective execution paths, achieving **50.26** and **41.14 Joint F1** (compared to **31.21** and **25.79** for RAG on the same questions).
- **The 7-Hop Tail**: The 7-action bucket contains 1,055 unresolved questions where ReAct dropped to **11.62 Joint F1** (versus **19.20** for RAG). These long trajectories mark hard, stalled search loops—identifying early stall detection, query reformulation, and early fallback as key future engineering priorities.

### 4. Engineering Scope & Reproduction

1. **Development Set Validation**: All metrics reflect the 7,405-question public FullWiki validation split using official evaluator formulas, not a hidden test leaderboard submission.
2. **Deployed System Comparison**: The experiment compares the complete deployed RAG vs. ReAct pipelines; ReAct utilizes additional retrieval calls and an active evidence memory module.
3. **Model Specificity**: Findings are grounded on `Qwen/Qwen2.5-7B-Instruct`; scaling dynamics on larger model families (32B/70B) remain an open exploration area.
4. **Inspectable vs. Causal Reasoning**: Intermediate `Thought` traces provide auditable execution logs and high evidence precision, but generated thoughts are not guaranteed explanations of internal model attention.

Complete source code, reproduction scripts, and evaluation logs are available in the [HotpotQA ReAct repository](https://github.com/djdhillxn/hotpot). Published analysis reports can be inspected in the [comparison report](https://github.com/djdhillxn/hotpot/blob/main/docs/results/comparison_report.md) and [machine-readable summary](https://github.com/djdhillxn/hotpot/blob/main/docs/results/comparison_summary.json). Evaluation logic adheres to the [official HotpotQA evaluator](https://github.com/hotpotqa/hotpot/blob/master/hotpot_evaluate_v1.py) and the [ReAct framework](https://arxiv.org/abs/2210.03629).

</div>
