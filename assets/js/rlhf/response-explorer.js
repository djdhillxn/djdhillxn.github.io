(function () {
  'use strict';

  function formatReward(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'n/a';
    return `${number >= 0 ? '+' : ''}${number.toFixed(4)}`;
  }

  function formatPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'n/a';
    return `${(number * 100).toFixed(1)}%`;
  }

  function displayWinner(value) {
    const names = {
      base: 'Base',
      sft_4096: 'SFT',
      ppo_4096_ep2_u400: 'PPO',
      tie: 'Tie',
    };
    return names[value] || String(value || 'Unknown');
  }

  function makeChip(label, value, accent) {
    const chip = document.createElement('span');
    chip.className = `rlhf-explorer-chip${accent ? ' rlhf-explorer-chip-accent' : ''}`;

    const strong = document.createElement('strong');
    strong.textContent = `${label}:`;
    chip.appendChild(strong);
    chip.appendChild(document.createTextNode(` ${value}`));
    return chip;
  }

  function replaceChildren(container, children) {
    container.replaceChildren(...children);
  }

  function renderPolicy(card, statsContainer, responseContainer, policy, isWinner) {
    card.classList.toggle('is-reward-winner', Boolean(isWinner));
    replaceChildren(statsContainer, [
      makeChip('Reward', formatReward(policy.reward), isWinner),
      makeChip('Tokens', policy.response_tokens),
      makeChip('Cap hit', policy.cap_hit ? 'yes' : 'no'),
      makeChip('Repeated 4-grams', formatPercent(policy.repeated_4gram_fraction)),
    ]);
    responseContainer.textContent = policy.response || '(empty response)';
    responseContainer.scrollTop = 0;
  }

  class ResponseExplorer {
    constructor(root) {
      this.root = root;
      this.sourceUrl = root.dataset.sourceUrl;
      this.examples = [];
      this.currentPosition = 0;

      this.select = root.querySelector('[data-rlhf-example-select]');
      this.previousButton = root.querySelector('[data-rlhf-previous]');
      this.nextButton = root.querySelector('[data-rlhf-next]');
      this.status = root.querySelector('[data-rlhf-status]');
      this.category = root.querySelector('[data-rlhf-category]');
      this.note = root.querySelector('[data-rlhf-note]');
      this.meta = root.querySelector('[data-rlhf-meta]');
      this.title = root.querySelector('[data-rlhf-example-title]');
      this.prompt = root.querySelector('[data-rlhf-prompt]');
      this.baseCard = root.querySelector('[data-rlhf-base-card]');
      this.baseStats = root.querySelector('[data-rlhf-base-stats]');
      this.baseResponse = root.querySelector('[data-rlhf-base-response]');
      this.ppoCard = root.querySelector('[data-rlhf-ppo-card]');
      this.ppoStats = root.querySelector('[data-rlhf-ppo-stats]');
      this.ppoResponse = root.querySelector('[data-rlhf-ppo-response]');
      this.caveat = root.querySelector('[data-rlhf-caveat]');
    }

    async init() {
      try {
        const response = await fetch(this.sourceUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        this.examples = Array.isArray(payload.examples) ? payload.examples : [];
        if (!this.examples.length) {
          throw new Error('The comparison artifact contains no examples.');
        }

        this.populateSelect();
        this.bindEvents();
        this.caveat.textContent = payload.metadata?.caveat || this.caveat.textContent;

        const requestedIndex = Number(new URL(window.location.href).searchParams.get('example'));
        const requestedPosition = this.examples.findIndex((example) => example.idx === requestedIndex);
        this.currentPosition = requestedPosition >= 0 ? requestedPosition : 0;
        this.render();

        this.select.disabled = false;
        this.status.textContent = `${this.examples.length} curated examples loaded from the 2,017-prompt evaluation.`;
      } catch (error) {
        this.status.classList.add('is-error');
        this.status.textContent = `Could not load the comparison data: ${error.message}`;
      }
    }

    populateSelect() {
      const options = this.examples.map((example) => {
        const option = document.createElement('option');
        option.value = String(example.idx);
        option.textContent = `#${example.idx} | ${example.category} | ${example.domain}`;
        return option;
      });
      replaceChildren(this.select, options);
    }

    bindEvents() {
      this.select.addEventListener('change', () => {
        const position = this.examples.findIndex((example) => String(example.idx) === this.select.value);
        if (position >= 0) {
          this.currentPosition = position;
          this.render();
        }
      });

      this.previousButton.addEventListener('click', () => {
        if (this.currentPosition > 0) {
          this.currentPosition -= 1;
          this.render();
        }
      });

      this.nextButton.addEventListener('click', () => {
        if (this.currentPosition < this.examples.length - 1) {
          this.currentPosition += 1;
          this.render();
        }
      });
    }

    render() {
      const example = this.examples[this.currentPosition];
      const winner = example.reward_winner;

      this.select.value = String(example.idx);
      this.previousButton.disabled = this.currentPosition === 0;
      this.nextButton.disabled = this.currentPosition === this.examples.length - 1;
      this.category.textContent = example.category;
      this.note.textContent = example.note;
      this.title.textContent = `Evaluation example #${example.idx}`;
      this.prompt.textContent = example.prompt;
      this.prompt.scrollTop = 0;

      replaceChildren(this.meta, [
        makeChip('Index', example.idx, true),
        makeChip('Domain', example.domain),
        makeChip('Language', example.language),
        makeChip('Reward winner', displayWinner(winner), true),
        makeChip('PPO minus Base', formatReward(example.deltas?.ppo_minus_base)),
      ]);

      renderPolicy(
        this.baseCard,
        this.baseStats,
        this.baseResponse,
        example.base,
        winner === 'base'
      );
      renderPolicy(
        this.ppoCard,
        this.ppoStats,
        this.ppoResponse,
        example.ppo,
        winner === 'ppo_4096_ep2_u400'
      );

      const url = new URL(window.location.href);
      url.searchParams.set('example', String(example.idx));
      window.history.replaceState({}, '', url);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-rlhf-explorer]').forEach((root) => {
      new ResponseExplorer(root).init();
    });
  });
})();
