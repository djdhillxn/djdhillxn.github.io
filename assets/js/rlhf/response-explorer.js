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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeLinkTarget(value) {
    const target = String(value || '').trim();
    if (/^(https?:|mailto:|#|\/|\.{1,2}\/|\?)/i.test(target)) {
      return target;
    }
    return '#';
  }

  function renderInlineMarkdown(value) {
    const tokens = [];
    const protect = (html) => {
      const token = `\uE000${tokens.length}\uE001`;
      tokens.push(html);
      return token;
    };

    let text = String(value || '');
    text = text.replace(/`([^`\n]+)`/g, (_, code) => {
      return protect(`<code>${escapeHtml(code)}</code>`);
    });
    text = text.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_, label, target) => {
      const href = safeLinkTarget(target);
      const external = /^https?:/i.test(href);
      const attributes = external ? ' rel="noopener noreferrer"' : '';
      return protect(
        `<a href="${escapeHtml(href)}"${attributes}>${renderInlineMarkdown(label)}</a>`
      );
    });

    text = escapeHtml(text)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
      .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
      .replace(/(^|[^\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
      .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');

    tokens.forEach((html, index) => {
      text = text.split(`\uE000${index}\uE001`).join(html);
    });
    return text;
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  }

  function isTableDivider(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function startsMarkdownBlock(lines, index) {
    const line = lines[index] || '';
    const nextLine = lines[index + 1] || '';
    return (
      !line.trim() ||
      /^ {0,3}```/.test(line) ||
      /^ {0,3}#{1,6}\s+/.test(line) ||
      /^ {0,3}(?:[-*_]\s*){3,}$/.test(line) ||
      /^ {0,3}>\s?/.test(line) ||
      /^ {0,3}[-*+]\s+/.test(line) ||
      /^ {0,3}\d+\.\s+/.test(line) ||
      (line.includes('|') && isTableDivider(nextLine))
    );
  }

  function renderMarkdown(value) {
    const lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      if (!line.trim()) {
        index += 1;
        continue;
      }

      const fence = line.match(/^ {0,3}```\s*([\w.+-]*)\s*$/);
      if (fence) {
        const code = [];
        index += 1;
        while (index < lines.length && !/^ {0,3}```\s*$/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : '';
        blocks.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`);
        continue;
      }

      const heading = line.match(/^ {0,3}(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^ {0,3}(?:[-*_]\s*){3,}$/.test(line)) {
        blocks.push('<hr>');
        index += 1;
        continue;
      }

      if (/^ {0,3}>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^ {0,3}>\s?/.test(lines[index])) {
          quote.push(lines[index].replace(/^ {0,3}>\s?/, ''));
          index += 1;
        }
        blocks.push(`<blockquote>${renderMarkdown(quote.join('\n'))}</blockquote>`);
        continue;
      }

      const unordered = line.match(/^ {0,3}[-*+]\s+(.+)$/);
      if (unordered) {
        const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^ {0,3}[-*+]\s+(.+)$/);
          if (!item) break;
          items.push(`<li>${renderInlineMarkdown(item[1])}</li>`);
          index += 1;
        }
        blocks.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      const ordered = line.match(/^ {0,3}(\d+)\.\s+(.+)$/);
      if (ordered) {
        const items = [];
        const start = Number(ordered[1]);
        while (index < lines.length) {
          const item = lines[index].match(/^ {0,3}\d+\.\s+(.+)$/);
          if (!item) break;
          items.push(`<li>${renderInlineMarkdown(item[1])}</li>`);
          index += 1;
        }
        const startAttribute = start === 1 ? '' : ` start="${start}"`;
        blocks.push(`<ol${startAttribute}>${items.join('')}</ol>`);
        continue;
      }

      if (line.includes('|') && isTableDivider(lines[index + 1] || '')) {
        const headers = splitTableRow(line);
        const alignments = splitTableRow(lines[index + 1]).map((cell) => {
          if (/^:-+:$/.test(cell)) return 'center';
          if (/^-+:$/.test(cell)) return 'right';
          return 'left';
        });
        index += 2;

        const rows = [];
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          rows.push(splitTableRow(lines[index]));
          index += 1;
        }

        const headerHtml = headers
          .map((cell, cellIndex) => {
            return `<th style="text-align:${alignments[cellIndex] || 'left'}">${renderInlineMarkdown(cell)}</th>`;
          })
          .join('');
        const bodyHtml = rows
          .map((row) => {
            const cells = headers
              .map((_, cellIndex) => {
                return `<td style="text-align:${alignments[cellIndex] || 'left'}">${renderInlineMarkdown(row[cellIndex] || '')}</td>`;
              })
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
        blocks.push(
          `<div class="rlhf-explorer-table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`
        );
        continue;
      }

      const paragraph = [line];
      index += 1;
      while (index < lines.length && !startsMarkdownBlock(lines, index)) {
        paragraph.push(lines[index]);
        index += 1;
      }
      blocks.push(`<p>${renderInlineMarkdown(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`);
    }

    return blocks.join('');
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
    responseContainer.innerHTML = renderMarkdown(policy.response || '*(empty response)*');
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

        const queryValue = new URL(window.location.href).searchParams.get('example');
        const requestedIndex = queryValue === null ? 418 : Number(queryValue);
        const requestedPosition = this.examples.findIndex((example) => example.idx === requestedIndex);
        const defaultPosition = this.examples.findIndex((example) => example.idx === 418);
        this.currentPosition =
          requestedPosition >= 0 ? requestedPosition : Math.max(defaultPosition, 0);
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
