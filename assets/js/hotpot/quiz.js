(function () {
  'use strict';

  const CATEGORICAL_ANSWERS = new Set(['yes', 'no', 'noanswer']);
  const METRIC_DEFINITIONS = [
    ['Answer EM', 'answer_em'],
    ['Answer F1', 'answer_f1'],
    ['Support EM', 'supporting_fact_em'],
    ['Support F1', 'supporting_fact_f1'],
    ['Joint EM', 'joint_em'],
    ['Joint F1', 'joint_f1'],
  ];

  function officialNormalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, '')
      .replace(/\b(a|an|the)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function relaxedNormalize(value) {
    return officialNormalize(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function tokenOverlap(left, right) {
    const leftTokens = left.split(' ').filter(Boolean);
    const rightTokens = right.split(' ').filter(Boolean);
    const counts = new Map();
    rightTokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));

    let common = 0;
    leftTokens.forEach((token) => {
      const available = counts.get(token) || 0;
      if (available > 0) {
        common += 1;
        counts.set(token, available - 1);
      }
    });

    const precision = leftTokens.length ? common / leftTokens.length : 0;
    const recall = rightTokens.length ? common / rightTokens.length : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    const containment = Math.min(leftTokens.length, rightTokens.length)
      ? common / Math.min(leftTokens.length, rightTokens.length)
      : 0;
    return { f1, containment };
  }

  function editSimilarity(left, right) {
    if (left === right) return 1;
    if (!left.length || !right.length) return 0;

    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= right.length; column += 1) {
        const substitution = previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
        current[column] = Math.min(
          previous[column] + 1,
          current[column - 1] + 1,
          substitution
        );
      }
      previous = current;
    }
    return 1 - previous[right.length] / Math.max(left.length, right.length);
  }

  function gradeHumanAnswer(answer, gold) {
    const officialAnswer = officialNormalize(answer);
    const officialGold = officialNormalize(gold);
    if (!officialAnswer) {
      return { kind: 'incorrect', label: 'No answer entered', detail: '' };
    }
    if (officialAnswer === officialGold) {
      return { kind: 'exact', label: 'Exact after official normalization', detail: '' };
    }

    if (CATEGORICAL_ANSWERS.has(officialAnswer) || CATEGORICAL_ANSWERS.has(officialGold)) {
      return { kind: 'incorrect', label: 'Different categorical answer', detail: '' };
    }

    const relaxedAnswer = relaxedNormalize(answer);
    const relaxedGold = relaxedNormalize(gold);
    const overlap = tokenOverlap(relaxedAnswer, relaxedGold);
    const similarity = editSimilarity(relaxedAnswer, relaxedGold);
    const close =
      relaxedAnswer === relaxedGold ||
      overlap.f1 >= 0.78 ||
      (overlap.containment === 1 && Math.abs(relaxedAnswer.split(' ').length - relaxedGold.split(' ').length) <= 1) ||
      (Math.max(relaxedAnswer.length, relaxedGold.length) >= 5 && similarity >= 0.82);

    if (close) {
      const bestScore = Math.max(overlap.f1, similarity);
      return {
        kind: 'close',
        label: 'Close enough — point awarded',
        detail: `${Math.round(bestScore * 100)}% relaxed similarity`,
      };
    }
    return { kind: 'incorrect', label: 'Different answer', detail: '' };
  }

  function fisherYates(values) {
    const copy = values.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function asNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function formatRunPercent(value) {
    const number = asNumber(value);
    if (number === null) return 'Pending';
    const percent = number >= 0 && number <= 1 ? number * 100 : number;
    return `${percent.toFixed(1)}%`;
  }

  function formatExamplePercent(value) {
    const number = asNumber(value);
    return number === null ? 'n/a' : `${(number * 100).toFixed(1)}%`;
  }

  function titleCase(value) {
    const text = String(value || 'unknown').replace(/_/g, ' ');
    return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function readScore(record, compactKey, rawKey) {
    if (record.scores && record.scores[compactKey] !== undefined) {
      return record.scores[compactKey];
    }
    return record[rawKey];
  }

  function normalizeExample(record, index) {
    const steps = Array.isArray(record.steps)
      ? record.steps.map((step, stepIndex) => ({
          n: step.n ?? step.step ?? stepIndex + 1,
          thought: step.thought || '',
          action: step.action || '',
          type: step.type || step.action_type || '',
          observation: step.observation || '',
          observation_shortened: Boolean(step.observation_shortened),
        }))
      : [];

    return {
      id: String(record.id || record.idx || index),
      question: String(record.question || '').trim(),
      type: String(record.type || record.question_type || 'unknown').toLowerCase(),
      level: String(record.level || record.difficulty_level || 'unknown').toLowerCase(),
      gold_answer: String(record.gold_answer ?? record.ground_truth ?? ''),
      agent_answer: String(record.agent_answer ?? record.predicted_answer ?? record.pred_answer ?? 'No Answer'),
      scores: {
        answer_em: readScore(record, 'answer_em', 'exact_match'),
        answer_f1: record.scores?.answer_f1 ?? record.answer_f1 ?? record.f1,
        supporting_fact_em: readScore(record, 'supporting_fact_em', 'supporting_fact_em'),
        supporting_fact_f1: readScore(record, 'supporting_fact_f1', 'supporting_fact_f1'),
        joint_em: readScore(record, 'joint_em', 'joint_em'),
        joint_f1: readScore(record, 'joint_f1', 'joint_f1'),
      },
      tool_steps: Number(record.tool_steps ?? record.step_count ?? 0),
      visited_pages: Array.isArray(record.visited_pages) ? record.visited_pages : [],
      agent_supporting_facts:
        record.agent_supporting_facts || record.predicted_supporting_facts || [],
      steps,
    };
  }

  function normalizePayload(payload) {
    const rawExamples = Array.isArray(payload)
      ? payload
      : payload.examples || payload.trajectories || payload.records || [];
    const examples = rawExamples
      .map(normalizeExample)
      .filter((example) => example.question && example.gold_answer);
    const metadata = Array.isArray(payload) ? {} : payload.metadata || {};
    const rawMetrics = Array.isArray(payload)
      ? {}
      : payload.metrics || metadata.metrics_summary?.overall || metadata.metrics || {};
    return {
      demo: Boolean(!Array.isArray(payload) && payload.demo),
      metrics: rawMetrics,
      source: Array.isArray(payload) ? {} : payload.source || {},
      examples,
    };
  }

  function summarizeExamples(examples) {
    const keys = [
      'answer_em',
      'answer_f1',
      'supporting_fact_em',
      'supporting_fact_f1',
      'joint_em',
      'joint_f1',
    ];
    const metrics = { count: examples.length };
    keys.forEach((key) => {
      const values = examples
        .map((example) => asNumber(example.scores[key]))
        .filter((value) => value !== null);
      metrics[key] = values.length
        ? values.reduce((total, value) => total + value, 0) / values.length
        : null;
    });
    return metrics;
  }

  async function loadQuizPayload(response, onProgress) {
    if (!response.body || typeof response.body.getReader !== 'function') {
      return normalizePayload(await response.json());
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const examples = [];
    const objectParts = [];
    const recordParts = [];
    let mode = null;
    let collecting = false;
    let depth = 0;
    let inString = false;
    let escaped = false;

    function appendRecord(rawRecord) {
      const example = normalizeExample(rawRecord, examples.length);
      if (example.question && example.gold_answer) examples.push(example);
      if (examples.length && examples.length % 250 === 0 && onProgress) {
        onProgress(examples.length);
      }
    }

    function consume(text) {
      let offset = 0;
      if (mode === null) {
        const firstContent = text.search(/\S/);
        if (firstContent === -1) return;
        if (text[firstContent] === '[') {
          mode = 'array';
          offset = firstContent + 1;
        } else if (text[firstContent] === '{') {
          mode = 'object';
          objectParts.push(text.slice(firstContent));
          return;
        } else {
          throw new Error('Trajectory artifact must contain a JSON array or object.');
        }
      } else if (mode === 'object') {
        objectParts.push(text);
        return;
      }

      let segmentStart = collecting ? offset : -1;
      for (let index = offset; index < text.length; index += 1) {
        const character = text[index];
        if (!collecting) {
          if (character === '{') {
            collecting = true;
            depth = 1;
            inString = false;
            escaped = false;
            segmentStart = index;
          }
          continue;
        }

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (character === '\\') {
            escaped = true;
          } else if (character === '"') {
            inString = false;
          }
          continue;
        }

        if (character === '"') {
          inString = true;
        } else if (character === '{') {
          depth += 1;
        } else if (character === '}') {
          depth -= 1;
          if (depth === 0) {
            recordParts.push(text.slice(segmentStart, index + 1));
            appendRecord(JSON.parse(recordParts.join('')));
            recordParts.length = 0;
            collecting = false;
            segmentStart = -1;
          }
        }
      }

      if (collecting && segmentStart >= 0) {
        recordParts.push(text.slice(segmentStart));
      }
    }

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      consume(decoder.decode(value, { stream: true }));
    }
    consume(decoder.decode());

    if (mode === 'object') {
      return normalizePayload(JSON.parse(objectParts.join('')));
    }
    if (collecting || depth !== 0) {
      throw new Error('Trajectory artifact ended inside a JSON record.');
    }
    return {
      demo: false,
      metrics: summarizeExamples(examples),
      source: {},
      examples,
    };
  }

  function formatFacts(facts) {
    if (!Array.isArray(facts) || facts.length === 0) return 'None predicted';
    return facts
      .filter((fact) => Array.isArray(fact) && fact.length === 2)
      .map((fact) => `${fact[0]} · sentence ${fact[1]}`)
      .join('  •  ') || 'None predicted';
  }

  class HotpotQuiz {
    constructor(root) {
      this.root = root;
      this.sourceUrl = root.dataset.sourceUrl;
      this.examples = [];
      this.filtered = [];
      this.order = [];
      this.position = 0;
      this.current = null;
      this.demo = false;
      this.metrics = {};

      this.metricsContainer = root.querySelector('[data-hotpot-metrics]');
      this.dataStatus = root.querySelector('[data-hotpot-data-status]');
      this.filter = root.querySelector('[data-hotpot-filter]');
      this.positionLabel = root.querySelector('[data-hotpot-position]');
      this.questionTags = root.querySelector('[data-hotpot-question-tags]');
      this.question = root.querySelector('[data-hotpot-question]');
      this.form = root.querySelector('[data-hotpot-form]');
      this.input = root.querySelector('[data-hotpot-answer]');
      this.submitButton = root.querySelector('[data-hotpot-submit]');
      this.nextButton = root.querySelector('[data-hotpot-next]');
      this.result = root.querySelector('[data-hotpot-result]');
      this.verdict = root.querySelector('[data-hotpot-verdict]');
      this.verdictNote = root.querySelector('[data-hotpot-verdict-note]');
      this.userAnswer = root.querySelector('[data-hotpot-user-answer]');
      this.userGrade = root.querySelector('[data-hotpot-user-grade]');
      this.agentAnswer = root.querySelector('[data-hotpot-agent-answer]');
      this.agentGrade = root.querySelector('[data-hotpot-agent-grade]');
      this.goldAnswer = root.querySelector('[data-hotpot-gold-answer]');
      this.exampleMetrics = root.querySelector('[data-hotpot-example-metrics]');
      this.trace = root.querySelector('[data-hotpot-trace]');
      this.traceDetails = this.trace.querySelector('details');
      this.traceSummary = root.querySelector('[data-hotpot-trace-summary]');
      this.visitedPages = root.querySelector('[data-hotpot-visited-pages]');
      this.supportingFacts = root.querySelector('[data-hotpot-supporting-facts]');
      this.steps = root.querySelector('[data-hotpot-steps]');
    }

    async init() {
      try {
        const response = await fetch(this.sourceUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const normalized = await loadQuizPayload(response, (count) => {
          if (this.dataStatus) {
            this.dataStatus.textContent = `${count.toLocaleString()} ReAct trajectories prepared…`;
          }
        });
        if (!normalized.examples.length) throw new Error('No quiz examples were found.');

        this.examples = normalized.examples;
        this.demo = normalized.demo;
        this.metrics = normalized.metrics;
        this.renderRunMetrics();
        this.bindEvents();
        this.applyFilter('all');

        this.filter.disabled = false;
        this.input.disabled = false;
        this.submitButton.disabled = false;
        this.nextButton.disabled = false;
        if (this.dataStatus) {
          this.dataStatus.classList.toggle('is-demo', this.demo);
          this.dataStatus.textContent = this.demo
            ? `Demo mode · ${this.examples.length} interface fixtures loaded · final 7,405-question evaluation is still in progress`
            : `${this.metrics.count || this.examples.length} FullWiki validation trajectories loaded`;
        }
      } catch (error) {
        if (this.dataStatus) {
          this.dataStatus.classList.add('is-error');
          this.dataStatus.textContent = `Could not load the quiz data: ${error.message}`;
        }
        this.question.textContent = 'The evaluation artifact is unavailable.';
      }
    }

    bindEvents() {
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.checkAnswer();
      });
      this.nextButton.addEventListener('click', () => this.nextQuestion());
      this.filter.addEventListener('change', () => this.applyFilter(this.filter.value));
    }

    renderRunMetrics() {
      document.querySelectorAll('[data-hotpot-score]').forEach((element) => {
        const key = element.dataset.hotpotScore;
        if (key && this.metrics && this.metrics[key] !== undefined) {
          element.textContent = this.demo ? 'Pending' : formatRunPercent(this.metrics[key]);
        }
      });
      if (this.metricsContainer) {
        this.metricsContainer.replaceChildren();
        METRIC_DEFINITIONS.forEach(([label, key]) => {
          const card = createElement('div', 'hotpot-metric');
          card.append(
            createElement('span', '', label),
            createElement('strong', '', this.demo ? 'Pending' : formatRunPercent(this.metrics[key]))
          );
          this.metricsContainer.appendChild(card);
        });
      }
    }

    applyFilter(filterValue) {
      this.filtered = this.examples.filter(
        (example) => filterValue === 'all' || example.type === filterValue
      );
      if (!this.filtered.length) {
        if (this.dataStatus) {
          this.dataStatus.classList.add('is-error');
          this.dataStatus.textContent = `No ${filterValue} questions are available in this artifact.`;
        }
        this.filter.value = 'all';
        this.filtered = this.examples.slice();
      }
      this.order = fisherYates(this.filtered.map((_, index) => index));
      this.position = 0;
      this.renderQuestion();
    }

    nextQuestion() {
      if (!this.order.length) return;
      this.position += 1;
      if (this.position >= this.order.length) {
        this.order = fisherYates(this.order);
        this.position = 0;
      }
      this.renderQuestion();
    }

    renderQuestion() {
      this.current = this.filtered[this.order[this.position]];
      if (!this.current) return;

      this.positionLabel.textContent = `${this.position + 1} of ${this.filtered.length}`;
      this.question.textContent = this.current.question;
      this.questionTags.replaceChildren(
        createElement('span', '', titleCase(this.current.type)),
        createElement('span', '', titleCase(this.current.level))
      );
      this.input.value = '';
      this.input.disabled = false;
      this.submitButton.disabled = false;
      this.submitButton.textContent = 'Check answer';
      this.nextButton.textContent = 'Different question';
      this.result.hidden = true;
      this.trace.hidden = true;
      this.traceDetails.open = false;
      this.root.classList.remove('is-both-correct', 'is-human-correct', 'is-agent-correct', 'is-neither-correct');
    }

    agentIsCorrect(example) {
      if (typeof example.scores.answer_em === 'boolean') return example.scores.answer_em;
      return officialNormalize(example.agent_answer) === officialNormalize(example.gold_answer);
    }

    checkAnswer() {
      if (!this.current) return;

      const rawInput = this.input.value.trim();
      const isEmpty = !rawInput;
      const human = gradeHumanAnswer(rawInput, this.current.gold_answer);
      const humanCorrect = human.kind !== 'incorrect';
      const agentCorrect = this.agentIsCorrect(this.current);
      const outcome = humanCorrect && agentCorrect
        ? 'both'
        : humanCorrect
          ? 'human'
          : agentCorrect
            ? 'agent'
            : 'neither';

      const messages = {
        both: ['You got it right — so did the AI.', 'A perfectly synchronized evidence hop.'],
        human: ['We still have hope for humanity.', 'You found the answer that the agent missed.'],
        agent: [
          isEmpty ? 'Round skipped — checking full answers.' : 'The machine takes this round.',
          isEmpty ? 'You didn\'t type anything! Open the trajectory to see where the AI found the bridge.' : 'Open the trajectory to see where it found the bridge.'
        ],
        neither: [
          isEmpty ? 'Round skipped — checking full answers.' : 'A humbling draw. Wikipedia wins this round.',
          isEmpty ? 'You didn\'t type anything, and the agent missed it as well.' : 'The gold answer eluded both contestants.'
        ],
      };
      const [headline, note] = messages[outcome];
      this.verdict.textContent = human.kind === 'close'
        ? 'Close enough — we’re giving you the point.'
        : headline;
      this.verdictNote.textContent = human.kind === 'close' ? `${headline} ${note}` : note;
      this.userAnswer.textContent = rawInput || '(No answer entered)';
      this.userGrade.textContent = isEmpty
        ? 'You didn\'t type anything'
        : (human.detail ? `${human.label} · ${human.detail}` : human.label);
      this.agentAnswer.textContent = this.current.agent_answer;
      this.agentGrade.textContent = agentCorrect ? 'Official answer EM ✓' : 'Official answer EM ✕';
      this.goldAnswer.textContent = this.current.gold_answer;

      this.root.classList.add(`is-${outcome}-correct`);
      this.input.disabled = true;
      this.submitButton.disabled = true;
      this.submitButton.textContent = 'Answer checked';
      this.nextButton.textContent = 'Another question';
      this.renderExampleMetrics();
      this.renderTrace();
      this.result.hidden = false;
      this.trace.hidden = false;
      this.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderExampleMetrics() {
      const scores = this.current.scores;
      const chips = [
        ['Answer F1', formatExamplePercent(scores.answer_f1)],
        ['Support F1', formatExamplePercent(scores.supporting_fact_f1)],
        ['Joint F1', formatExamplePercent(scores.joint_f1)],
        ['Recorded turns', String(this.current.steps.length)],
      ];

      this.exampleMetrics.replaceChildren();
      chips.forEach(([label, value]) => {
        const chip = createElement('span', 'hotpot-score-chip');
        chip.append(createElement('strong', '', `${label}:`), document.createTextNode(` ${value}`));
        this.exampleMetrics.appendChild(chip);
      });
    }

    renderTrace() {
      const example = this.current;
      const shortened = example.steps.some((step) => step.observation_shortened);
      this.traceSummary.textContent = `${example.steps.length} recorded turns${shortened ? ' · observations excerpted' : ''}`;
      this.visitedPages.textContent = example.visited_pages.length
        ? example.visited_pages.join(' → ')
        : 'No pages recorded';
      this.supportingFacts.textContent = formatFacts(example.agent_supporting_facts);
      this.steps.replaceChildren();

      example.steps.forEach((step, index) => {
        const card = createElement('article', 'hotpot-step');
        const header = createElement('header', 'hotpot-step-header');
        const number = createElement('span', 'hotpot-step-number', String(step.n || index + 1).padStart(2, '0'));
        const heading = createElement('div');
        heading.append(
          createElement('small', '', titleCase(step.type || 'model turn')),
          createElement('strong', '', step.action || 'Unparsed action')
        );
        header.append(number, heading);
        card.appendChild(header);

        if (step.thought) {
          const block = createElement('div', 'hotpot-step-block hotpot-step-thought');
          block.append(createElement('span', '', 'Thought'), createElement('p', '', step.thought));
          card.appendChild(block);
        }
        if (step.action) {
          const block = createElement('div', 'hotpot-step-block hotpot-step-action');
          block.append(createElement('span', '', 'Action'), createElement('code', '', step.action));
          card.appendChild(block);
        }
        if (step.observation) {
          const block = createElement('div', 'hotpot-step-block hotpot-step-observation');
          const label = step.observation_shortened ? 'Observation · shortened for web' : 'Observation';
          block.append(createElement('span', '', label), createElement('pre', '', step.observation));
          card.appendChild(block);
        }
        this.steps.appendChild(card);
      });

      if (!example.steps.length) {
        this.steps.appendChild(
          createElement('p', 'hotpot-empty-trace', 'No trajectory steps were stored for this example.')
        );
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-hotpot-quiz]').forEach((root) => {
      new HotpotQuiz(root).init();
    });
  });
})();
