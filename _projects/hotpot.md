---
layout: page
title: "HotpotQA: ReAct Multi-Hop Question Answering Agent"
description: "Play a multi-hop QA quiz, then inspect the agent's Wikipedia search trajectory and official HotpotQA scores"
# -description: "ReAct reasoning + acting agent with LangGraph, vLLM, and comparative single-pass RAG evaluation"
github: "https://github.com/djdhillxn/hotpot"
category: AI Agents
portfolio_order: 15
portfolio_tags: [ReAct, Multi-Hop QA, HotpotQA, LangGraph, vLLM, Hybrid Retrieval]
portfolio_summary: |
  I built a ReAct-style question-answering agent that searches the full HotpotQA Wikipedia corpus, follows entity bridges, and returns both a concise answer and sentence-level evidence. The evaluation writes official-format predictions for answer, supporting-fact, and joint EM/F1, while retaining every Thought, Action, and Observation for inspection.

  The project page turns those trajectories into a quiz: answer a validation question yourself, compare your response with the agent and the gold answer, and then open the exact evidence trail behind the prediction.
---



<link rel="stylesheet" href="{{ '/assets/css/hotpot/project.css' | relative_url }}">

<div
  class="hotpot-quiz"
  data-hotpot-quiz
  data-source-url="{{ '/assets/json/hotpot/quiz.json' | relative_url }}"
  markdown="1"
>
  <section class="hotpot-hero hotpot-quiz-card" aria-labelledby="hotpot-question-heading">
    <div class="hotpot-hero-copy">
      <p class="hotpot-kicker">Human vs. multi-hop agent</p>
      <h2>Can you connect the clues before the AI does?</h2>
      <p>
        Answer a HotpotQA question, then compare your response with the gold
        answer and the agent's prediction. Once you commit, the complete
        search to lookup to finish trajectory opens for inspection. <a class="hotpot-text-link" href="#technical-notes">See to the technical notes</a>
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
        <button type="button" class="hotpot-button-secondary" data-hotpot-next disabled>
          Different question
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

### What is benchmark-comparable here?

The short answer is: **the HotpotQA score contract is official; the agent is a modern ReAct-style system, not a byte-for-byte reproduction of the original ReAct paper.** That distinction matters.

HotpotQA's FullWiki task requires a system to retrieve from the full Wikipedia corpus, answer each question, and identify the supporting sentences. The evaluator expects one JSON object with an `answer` map and an `sp` map keyed by question ID. This project writes that exact structure to `official_predictions.json` and uses the same normalization, categorical-answer rule, supporting-fact set comparison, and joint-score equations as the [official HotpotQA evaluator](https://github.com/hotpotqa/hotpot/blob/master/hotpot_evaluate_v1.py). The [official leaderboard](https://hotpotqa.github.io/) reports six columns: answer EM/F1, supporting-fact EM/F1, and joint EM/F1.

The current run evaluates the 7,405-question FullWiki **validation** split against the October 1, 2017 HotpotQA Wikipedia corpus. These are therefore official-formula development results. They become an official test-leaderboard result only after a test-set submission through the benchmark's submission process; I do not conflate the two on this page.

### How close is the agent to original ReAct?

The control language is deliberately faithful to ReAct: the model alternates `Thought`, `Action`, and tool-supplied `Observation` turns and may issue only `search[query]`, `lookup[keyword]`, or `finish[answer]`. `lookup` advances through matching sentences on the current page, and the model stops as soon as it has enough evidence. This is the core pattern introduced in [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) and implemented in its [released Wikipedia environment](https://github.com/ysymyth/ReAct/blob/master/wikienv.py).

The surrounding experiment is intentionally stronger and more benchmark-oriented than the original release. The paper's environment queried live Wikipedia, returned the first five sentences of a matched page (or five title suggestions), used six in-context HotpotQA examples, and reported answer EM on 500 random development examples in the public code. This project instead searches HotpotQA's fixed 2017 corpus, evaluates all 7,405 validation questions, predicts sentence-level supporting facts, and reports the complete official six-metric panel. I therefore describe it as a **ReAct-style FullWiki agent with official HotpotQA evaluation**, not as a reproduction of the paper's reported number.

### The evaluated pipeline

1. **Fixed benchmark input.** The runner loads the HotpotQA `fullwiki` validation split. The ten paragraphs bundled with each example are retained only for diagnostics; in the reported `fullwiki` mode, the agent searches the global corpus rather than receiving those paragraphs as its context.
2. **Hybrid global retrieval.** Each adaptive search combines a Lucene BM25 index with normalized `BAAI/bge-base-en-v1.5` dense embeddings. Reciprocal Rank Fusion merges a 100-document candidate pool with `k = 60`.
3. **Bounded evidence memory.** A search returns up to 40 candidates. `BAAI/bge-reranker-base` cross-encodes question–passage pairs and retains the strongest 20 unique documents in active memory. The standard YAML configuration caps each rendered observation at 22,000 characters.
4. **ReAct loop.** `Qwen/Qwen2.5-7B-Instruct`, served locally through vLLM, runs at temperature 0 with `top_p = 1`. On every hop it receives the same system contract, the original question, the current active evidence memory, and the accumulated Thought/Action/Observation scratchpad, ending at a fresh `Thought:` prefix. Generation is capped at 150 tokens and stops before `Observation:` so only the tool can write observations. The prompt contains three formatting demonstrations and requires concise canonical answers plus `[Wikipedia title, sentence ID]` citations. A LangGraph state machine allows up to seven search/lookup actions before routing to evidence-only forced synthesis.
5. **Grounding guard.** A predicted supporting fact is accepted only if that exact title and sentence ID appeared in an observation. Unsupported citations are retained separately for diagnosis and excluded from the official prediction.
6. **Deterministic scoring and artifacts.** Every question produces its answer, supporting facts, official per-example scores, visited pages, timing, retrieval diagnostics, and complete step records. Worker concurrency changes throughput, not the score definition.

Graph expansion exists as an ablation, but the standard configuration shown here keeps it disabled. Likewise, `offline` mode—which searches only the supplied ten paragraphs—is useful for debugging but is not presented as a FullWiki result. Live Wikipedia mode is qualitative because current sentence boundaries do not match HotpotQA's 2017 sentence IDs.

### Benchmark Metrics & Scoring Definitions

| Leaderboard measure | FullWiki Score | Computation |
| :--- | :---: | :--- |
| **Answer EM** | <strong data-hotpot-score="answer_em">Pending</strong> | Exact equality after lowercasing, removing punctuation and articles, and fixing whitespace. |
| **Answer F1** | <strong data-hotpot-score="answer_f1">Pending</strong> | Token overlap precision/recall/F1; mismatched `yes`, `no`, or `noanswer` receives zero. |
| **Supporting-fact EM** | <strong data-hotpot-score="supporting_fact_em">Pending</strong> | Exact set match over every predicted `(title, sentence_id)` pair. |
| **Supporting-fact F1** | <strong data-hotpot-score="supporting_fact_f1">Pending</strong> | Precision/recall/F1 over those sentence-level pairs. |
| **Joint EM** | <strong data-hotpot-score="joint_em">Pending</strong> | Answer EM × supporting-fact EM. Both must be exact. |
| **Joint F1** | <strong data-hotpot-score="joint_f1">Pending</strong> | Harmonic mean of joint precision and recall, where each is the product of its answer and supporting-fact counterpart. |

One useful sanity check follows directly from these definitions: mean answer F1 cannot be below mean answer EM, because every exact answer has per-example F1 = 1. The page reads metric names and values directly from the final export so an answer score cannot accidentally be labeled as a joint score.

The quiz is intentionally friendlier than the leaderboard. It first applies official answer normalization, then grants a human “close enough” result for high token overlap or a small edit distance. That relaxed verdict is only for play; it never changes the agent's official metric.

### Key System Components

1. Hybrid Fullwiki retrieval backend
- Sparse Retrieval: BM25 indexed over 5.2M Wikipedia articles using Pyserini/Lucene.
- Dense Retrieval: Vector embeddings generated using BAAI/bge-base-en-v1.5 and indexed with FAISS.
- Reciprocal Rank Fusion (RRF): Merges sparse and dense search candidate ranks to maximise passage recall across domain shifts.

2. Supporting Fact Grounding & Validation
- Parses predicted supporting sentence IDs [Title, Sent_ID] from the agent's output.
- Stricly validates predictions against actual observed facts in the tool scatchepad, penalizing ungrounded hallunicaitons.

{% comment %} 
3. High throuhtouput concurrent inference engine 
- Integrated vLLM continuous batching server running on an NVIDIA L4 GPU (24GB VRAM)
- Multi-threaded ThreadPoolExecutor worker pool processing up to 16 concurernt questions, increasing evaluations throughput from 1.6 questions/min to 30+ questions/min (a 15x to 20x speedup).
{% endcomment %}

### Comparative Study: Single-Pass RAG vs ReAct Agent

To empirically evaluate the effect of agentic loops for multi-hop QA, the codebase includes a standalone Single-Pass RAG Baseline that benchmarks direct prompting against the ReAct Agent.

| Metric | Single-Pass RAG Baseline | ReAct Multi-Hop Agent | Impact / Gain |
| :--- | :---: | :---: | :--- |
| **Answer Exact Match (EM)** | Baseline Floor (~11.3%) | **Substantial Gain** | Multi-hop entity bridging |
| **Answer F1 Score** | Partial Overlap (~19.3%) | **Substantial Gain** | Complete answer extraction |
| **Supporting Facts F1** | Single-hop Facts (~32.1%) | **Substantial Gain** | Multi-document sentence tracking |
| **Joint Exact Match (EM)** | ~0.0% | **Multi-Fold Increase** | Exact answer + complete evidence |
| **Joint F1 Score** | ~10.0% | **Multi-Fold Increase** | Primary benchmark metric |

even after lots of trials of tuning the react agent, it was hard to improve it that much over the RAG baseline. an interesting note is there though that the bridge information and supporting facts, the react agent is able to achieve substantially better results, which can go to show towards some improved intepretability.

## Trajectory Inspector & Visualizer

The project includes an interactive web interface built with **Streamlit** and **PyVis** to inspect full reasoning trajectories:

1. **Step-by-Step Scratchpad Inspector**: Displays intermediate `Thought`, `Action`, and `Observation` text blocks for any question.
2. **Interactive Evidence Bridge Graph**: Renders a dynamic network graph showing how the agent transitioned between Wikipedia articles to bridge intermediate entities.
3. **Standalone Portfolio Viewer**: Exported trajectory JSONs (`portfolio/portfolio_trajectories.json`) power an embedded web component for interactive trajectory exploration.


{% comment %} 
## Repository & Execution Commands
The compact exporter keeps only the question, gold and agent answers, the six scores, supporting facts, visited titles, and readable Thought/Action/Observation steps. Observations are shortened at the portfolio boundary, with the truncation marked in the interface; the research artifact remains lossless.
 

```bash
# 1. Launch local vLLM model server
export LD_LIBRARY_PATH=$CONDA_PREFIX/lib:$LD_LIBRARY_PATH
python -m vllm.entrypoints.openai.api_server --model Qwen/Qwen2.5-7B-Instruct --port 8000 --dtype bfloat16 --enforce-eager

# 2. Run Single-Pass RAG Baseline
python eval/run_baseline.py --mode offline --source official_json --output-dir eval_results/baseline

# 3. Run High-Throughput ReAct Agent Benchmark
python eval/run_eval.py --mode offline --source official_json --concurrency 16 --max-hops 7 --output-dir eval_results/react

# 4. Generate Comparative Analysis & Bar Charts
python eval/compare_results.py --baseline eval_results/baseline/results.json --react eval_results/react/results.json --output-dir eval_results/comparison
```
{% endcomment %}

{% comment %}
## Agent Architecture & ReAct Control Loop

The core execution engine is modeled as a stateful graph in **LangGraph**, enforcing a strict `Thought -> Action -> Observation` control cycle. If the max hop budget is reached without a explicit finish action, the state graph routes to a **Forced Synthesis Node** to generate the best possible answer from accumulated evidence rather than truncating.

`` mermaid
graph TD
    Start([User Question]) -> AgentNode[Agent Reasoning Node\nQwen2.5-7B-Instruct]
    AgentNode -> ParseAction{Parse LLM Output}
    
    ParseAction -- "Action: search[entity]" -> ToolNode[Tool Execution Node\nBM25 + BGE Dense Retrieval]
    ParseAction -- "Action: lookup[keyword]" -> ToolNode
    ParseAction -- "Action: finish[answer]" -> End([Final Answer & Supporting Facts])
    
    ToolNode -> UpdateScratchpad[Update Observation Scratchpad\n& Evidence Graph]
    UpdateScratchpad -> CheckBudget{Hop Budget Exhausted?}
    
    CheckBudget -- No (< Max Hops) -> AgentNode
    CheckBudget -- Yes (>= Max Hops) -> SynthesisNode[Forced Synthesis Node\nSynthesize from Evidence]
    SynthesisNode -> End
``` 
{% endcomment %}

### From evaluation artifact to this page

The evaluator keeps exhaustive `trajectories.json` and `results.json` files for analysis and also writes evaluator-compatible gold and prediction files. Shipping that full payload to a browser would include large rank lists, model outputs, active-memory snapshots, and retrieval telemetry that the quiz never uses.

The compact exporter keeps only the question, gold and agent answers, the six scores, supporting facts, visited titles, and readable Thought/Action/Observation steps. Observations are shortened at the portfolio boundary, with the truncation marked in the interface; the research artifact remains lossless.

```bash
python3 portfolio/export_quiz_data.py \
  portfolio/portfolio_trajectories.json \
  ../djdhillxn.github.io/assets/json/hotpot/quiz.json
```

Executing this export script processes raw trajectory logs into the web-optimized `quiz.json` artifact powering the interactive quiz and metric cards above, while maintaining lossless research outputs in the primary repository.

The complete implementation is available in the [HotpotQA ReAct repository](https://github.com/djdhillxn/hotpot). Dataset and evaluator details come from the [HotpotQA project](https://hotpotqa.github.io/); the agent pattern follows the [official ReAct code release](https://github.com/ysymyth/ReAct).


{% comment %}
 - Built an autonomous ReAct (Reasoning + Acting) agent from scratch using LangGraph, Python, and local vLLM inference (`Qwen/Qwen2.5-7B-Instruct`) to solve HotpotQA's FullWiki multi-hop benchmark via an explicit `Thought -> Action -> Observation` control loop and a hybrid BM25 + BGE vector search engine.
  - Developed an official evaluation pipeline and Single-Pass RAG baseline comparison, demonstrating how agentic multi-step entity bridging solves multi-hop reasoning failures, accompanied by an interactive trajectory visualizer and PyVis knowledge graph inspector.

Multi-hop question answering requires an AI system to connect disparate pieces of information scattered across multiple documents. Standard **Single-Pass RAG (Retrieval-Augmented Generation)** fails on these complex queries because a single retrieval step cannot anticipate intermediate entity bridges (e.g., discovering *Person A*'s birthplace to subsequently search for *Person B*).

This project implements a classic **ReAct (Reasoning + Acting)** autonomous agent built from scratch using **LangGraph** and served locally with **vLLM** (`Qwen/Qwen2.5-7B-Instruct`). The agent dynamically alternates between reasoning thoughts, issuing Wikipedia search and paragraph lookup actions, reading observations, and synthesizing final grounded answers with supporting evidence.
{% endcomment %}