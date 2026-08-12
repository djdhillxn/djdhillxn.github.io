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
      </div>
      <div class="hotpot-navigation-row" aria-label="Question navigation">
        <button type="button" class="hotpot-button-secondary" data-hotpot-previous disabled>
          Previous question
        </button>
        <button type="button" class="hotpot-button-secondary" data-hotpot-next disabled>
          New question
        </button>
        <button
          type="button"
          class="hotpot-randomize-toggle"
          data-hotpot-randomize
          aria-pressed="true"
          disabled
        >
          Randomize: <span data-hotpot-randomize-state>On</span>
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

I set out to answer a core architectural question: does an adaptive multi-step ReAct agent outperform a single-pass RAG pipeline when both share the same model, retrieval index, and reranker? Across all 7,405 questions in the HotpotQA FullWiki development set, the adaptive agent improved Joint F1 by 10.25 percentage points over a strong reranked RAG baseline.

Both systems use the frozen `Qwen/Qwen2.5-7B-Instruct` model served through vLLM, a 5.23-million-document Wikipedia introduction index, and the `BAAI/bge-reranker-base` cross-encoder:

- **Shared retrieval foundation:** Each query retrieves 50 Lucene BM25 candidates and 50 dense candidates from `BAAI/bge-base-en-v1.5` embeddings stored in a FAISS `IVF4096,PQ96x8` index. Reciprocal Rank Fusion combines the two rankings with `k = 60`, after which the top 15 pages are reranked.
- **Reranked RAG baseline:** The reader receives every non-empty sentence from the top seven page introductions in a single generation step. It has no lookup action, sentence reranking, or persistent memory.
- **Adaptive ReAct agent:** A LangGraph controller allows up to seven actions. The model can issue `search[query]`, `lookup[keyword]`, or `finish[answer]`; cross-encoded sentence evidence persists in a memory capped at 12 snippets and 6,000 characters.

Because ReAct performs iterative evidence acquisition, the experiment compares the deployed systems as a whole rather than treating the control loop as an isolated single-variable ablation.

#### The ReAct loop

<div class="hotpot-react-flow" role="img" aria-label="A HotpotQA question enters the ReAct controller. Search and lookup actions return observations and update bounded evidence memory before looping to the controller. Finish exits with an answer and sentence-level supporting facts.">
  <div class="hotpot-flow-node">
    <span>Question and trajectory state</span>
    <p>The original question, prior turns, and retained sentence evidence enter the controller.</p>
  </div>
  <div class="hotpot-flow-arrow" aria-hidden="true">↓</div>
  <div class="hotpot-flow-node">
    <span>ReAct controller · Qwen2.5-7B</span>
    <p>Produce one Thought and choose the next permitted action.</p>
  </div>
  <div class="hotpot-flow-arrow" aria-hidden="true">↓</div>
  <div class="hotpot-flow-branches">
    <div>
      <code>search[query]</code>
      <p>Hybrid FullWiki retrieval → page reranking → sentence reranking</p>
    </div>
    <div>
      <code>lookup[keyword]</code>
      <p>Advance through matching sentences on the current page</p>
    </div>
    <div>
      <code>finish[answer]</code>
      <p>Return the concise answer and observed supporting facts</p>
    </div>
  </div>
  <div class="hotpot-flow-return">
    <span aria-hidden="true">↺</span>
    Search and lookup produce a tool-written Observation, update bounded evidence memory, and return control to the model. The loop ends at <code>finish</code> or after the seventh action, when evidence-only synthesis produces the final answer.
  </div>
</div>

#### A two-hop toy trajectory

The following miniature example illustrates the control flow; it is not one of the scored validation records.

<div class="hotpot-toy-trace">
  <p class="hotpot-toy-question"><span>Question</span> Where was the director of <em>Inception</em> born?</p>
  <div>
    <span>Turn 1</span>
    <p><code>Thought</code> First identify the film's director.<br>
    <code>Action</code> <code>search[Inception]</code><br>
    <code>Observation</code> The retrieved page identifies Christopher Nolan as the director.</p>
  </div>
  <div>
    <span>Turn 2</span>
    <p><code>Thought</code> Follow the bridge entity to the director's page.<br>
    <code>Action</code> <code>search[Christopher Nolan]</code><br>
    <code>Observation</code> The retrieved page states that Nolan was born in Westminster, London.</p>
  </div>
  <div>
    <span>Finish</span>
    <p><code>Action</code> <code>finish[Westminster, London]</code></p>
  </div>
</div>

### 2. Benchmark Results & Comparative Study

The evaluation covers all 7,405 public FullWiki validation questions, with zero failed records or unparsed trajectories.

| Official HotpotQA metric | Reranked RAG | Adaptive ReAct | Change |
| :--- | ---: | ---: | ---: |
| Answer EM | 40.45% | 46.67% | +6.23 pp |
| Answer F1 | 51.80% | 60.48% | +8.68 pp |
| Supporting Fact EM | 9.66% | 14.91% | +5.25 pp |
| Supporting Fact F1 | 43.97% | 52.25% | +8.28 pp |
| Joint EM | 6.08% | 9.44% | +3.36 pp |
| Joint F1 | 26.86% | 37.11% | +10.25 pp |

#### Key Performance Takeaways

- **Consistent across question types:** ReAct improved Joint F1 by 10.23 points on 5,918 bridge questions and 10.33 points on 1,487 comparison questions.
- **Net answer gains:** ReAct rescued 1,295 questions missed by the baseline and regressed on 834 baseline successes, yielding 461 additional exactly correct answers.
- **Official scoring rules:** Answer EM/F1 use the official normalization and token-overlap rules. Supporting Fact EM/F1 compare exact `(title, sentence_id)` sets. Joint F1 combines answer and evidence precision and recall rather than averaging the two F1 scores.

### 3. Diagnostic Insights & Trajectory Dynamics

#### Evidence Exposure Mechanism

<figure class="hotpot-result-figure">
  <img src="{{ '/assets/img/hotpot/evidence_coverage_comparison.svg' | relative_url }}" alt="Comparison of four evidence-coverage diagnostics for reranked single-pass RAG and ReAct. ReAct is higher on all four.">
  <figcaption>Iterative retrieval increases gold document and supporting-fact exposure across the dataset.</figcaption>
</figure>

Observed gold-document recall rose from 77.02% to 80.40%, and gold supporting-fact recall rose from 77.41% to 80.01%. The proportion of questions for which the model observed every gold supporting sentence increased from 57.79% to 63.67%. These diagnostics are consistent with multi-step search recovering missing entity bridges, though they are not official leaderboard metrics or a causal attribution to any single component.

#### Trajectory Length & Failure Analysis

<figure class="hotpot-result-figure">
  <img src="{{ '/assets/img/hotpot/react_quality_by_hops.svg' | relative_url }}" alt="ReAct and matched-baseline Joint F1 grouped by ReAct trajectory length, with question counts. ReAct is strongest at two hops and falls below the baseline on the seven-hop tail.">
  <figcaption>ReAct peaks at two to three hops and degrades on the seven-hop tail, highlighting stalled search loops.</figcaption>
</figure>

- **The productive range:** Two- and three-action trajectories achieved 50.26 and 41.14 Joint F1, compared with 31.21 and 25.79 for the baseline on those same question subsets.
- **The seven-hop tail:** This bucket contains 1,055 unresolved questions, where ReAct reached 11.62 Joint F1 versus 19.20 for the matched baseline. Because trajectory length is an outcome rather than a randomized treatment, this is a failure diagnostic—not evidence that additional hops themselves cause the decline. It points toward stall detection, query reformulation, and fallback as the most useful next improvements.

### 4. Engineering Scope & Reproduction

These results come from the public 7,405-question FullWiki validation split and use the official evaluator formulas; they are not a hidden-test leaderboard submission. The comparison covers the complete deployed pipelines, so the ReAct result reflects both adaptive control and its sentence-level evidence memory rather than a controller-only ablation.

The findings are specific to `Qwen/Qwen2.5-7B-Instruct`; behavior at other model scales remains untested. Thought traces make execution auditable, but they should not be interpreted as guaranteed causal explanations of the model's internal computation.

Complete source code, reproduction scripts, and evaluation logs are available in the [HotpotQA ReAct repository](https://github.com/djdhillxn/hotpot). Published analysis reports can be inspected in the [comparison report](https://github.com/djdhillxn/hotpot/blob/main/docs/results/comparison_report.md) and [machine-readable summary](https://github.com/djdhillxn/hotpot/blob/main/docs/results/comparison_summary.json). Evaluation logic follows the [official HotpotQA evaluator](https://github.com/hotpotqa/hotpot/blob/master/hotpot_evaluate_v1.py) and the [ReAct framework](https://arxiv.org/abs/2210.03629).

</div>
