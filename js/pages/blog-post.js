(async function () {
  const {
    initSiteChrome,
    escapeHtml,
    getCurrentLanguage,
    t,
  } = window.siteUtils;

  await initSiteChrome();

  const container = document.getElementById('blog-post-single');
  if (!container) return;

  const renderMessage = (message) => {
    container.innerHTML = `<p class="blog-empty">${escapeHtml(message)}</p>`;
  };

  const formatUpdatedDate = (isoDate) => {
    if (!isoDate) return getCurrentLanguage() === 'ja' ? '不明' : 'Unknown';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return getCurrentLanguage() === 'ja' ? '不明' : 'Unknown';

    const locale = getCurrentLanguage() === 'ja' ? 'ja-JP' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  const markdownToHtml = (markdown) => {
    const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    const listStack = [];
    let inCode = false;
    let inMath = false;

    const closeListsToDepth = (targetDepth = 0) => {
      while (listStack.length > targetDepth) {
        html.push('</li></ul>');
        listStack.pop();
      }
    };

    const closeAllLists = () => closeListsToDepth(0);

    const openListToDepth = (targetDepth) => {
      while (listStack.length < targetDepth) {
        html.push('<ul><li>');
        listStack.push(true);
      }
    };

    const preserveFontTags = (text) => {
      const placeholders = [];
      let safeText = text.replace(/<font\b[^>]*>/gi, (match) => {
        const key = `__FONT_OPEN_${placeholders.length}__`;
        placeholders.push({ key, value: match });
        return key;
      });
      safeText = safeText.replace(/<\/font>/gi, (match) => {
        const key = `__FONT_CLOSE_${placeholders.length}__`;
        placeholders.push({ key, value: match });
        return key;
      });
      return { safeText, placeholders };
    };

    const restorePlaceholders = (text, placeholders) => {
      let restored = text;
      placeholders.forEach(({ key, value }) => {
        restored = restored.replaceAll(key, value);
      });
      return restored;
    };

    const formatInline = (text) => {
      const { safeText, placeholders } = preserveFontTags(text);
      let formatted = escapeHtml(safeText);
      formatted = formatted.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
      formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      formatted = formatted.replace(/(^|[^\\])\$\$([^$]+)\$\$/g, '$1\\[$2\\]');
      formatted = formatted.replace(/(^|[^\\])\$([^$\n]+)\$/g, '$1\\($2\\)');
      return restorePlaceholders(formatted, placeholders);
    };

    const isRawHtmlLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) return false;
      return /<\/?[A-Za-z][^>]*>/.test(trimmed);
    };

    let paragraphBuffer = [];
    let blankLineStreak = 0;
    let pendingSingleBlankLine = false;

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;
      const withLineBreaks = formatInline(paragraphBuffer.join('\n')).replace(/\n/g, '<br>');
      html.push(`<p>${withLineBreaks}</p>`);
      paragraphBuffer = [];
    };

    lines.forEach((line) => {
      const fenceMatch = line.trim().match(/^```(?:([A-Za-z0-9_+-]+)?(?::(.+))?)?\s*$/);
      if (fenceMatch) {
        flushParagraph();
        closeAllLists();
        const language = (fenceMatch[1] || '').toLowerCase();
        const filename = (fenceMatch[2] || '').trim();

        if (inMath) {
          inMath = false;
          html.push('\\]</div>');
          return;
        }

        if (!inCode && language === 'math') {
          inMath = true;
          html.push('<div class="math-block">\\[');
          return;
        }

        if (!inCode) {
          inCode = true;
          const languageClass = language ? ` class="language-${escapeHtml(language)}"` : '';
          const languageAttribute = language ? ` data-language="${escapeHtml(language)}"` : '';
          html.push(`<div class="code-block"${languageAttribute}>`);
          if (filename) {
            html.push(`<div class="code-block-filename">${escapeHtml(filename)}</div>`);
          }
          html.push(`<pre><code${languageClass}>`);
        } else {
          inCode = false;
          html.push('</code></pre></div>');
        }
        return;
      }

      if (inCode) {
        flushParagraph();
        html.push(`${escapeHtml(line)}\n`);
        return;
      }

      if (inMath) {
        flushParagraph();
        html.push(`${line}\n`);
        return;
      }

      if (!line.trim()) {
        blankLineStreak += 1;
        if (blankLineStreak === 1) {
          pendingSingleBlankLine = true;
          return;
        }
        if (blankLineStreak >= 2) {
          pendingSingleBlankLine = false;
          flushParagraph();
          closeAllLists();
          blankLineStreak = 0;
        }
        return;
      }
      blankLineStreak = 0;

      if (isRawHtmlLine(line)) {
        pendingSingleBlankLine = false;
        flushParagraph();
        closeAllLists();
        html.push(line.trim());
        return;
      }

      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        pendingSingleBlankLine = false;
        flushParagraph();
        closeAllLists();
        const level = Math.min(4, headingMatch[1].length);
        html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
        return;
      }

      const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
      if (listMatch) {
        pendingSingleBlankLine = false;
        flushParagraph();
        const indentLevel = Math.floor((listMatch[1] || '').replace(/\t/g, '  ').length / 2);
        const targetDepth = indentLevel + 1;

        if (!listStack.length) {
          openListToDepth(targetDepth);
          html.push(formatInline(listMatch[2]));
          return;
        }

        if (targetDepth > listStack.length) {
          openListToDepth(targetDepth);
          html.push(formatInline(listMatch[2]));
          return;
        }

        if (targetDepth < listStack.length) {
          closeListsToDepth(targetDepth);
          html.push('</li><li>');
          html.push(formatInline(listMatch[2]));
          return;
        }

        html.push('</li><li>');
        html.push(formatInline(listMatch[2]));
        return;
      }

      closeAllLists();
      if (pendingSingleBlankLine) {
        paragraphBuffer.push('');
        pendingSingleBlankLine = false;
      }
      paragraphBuffer.push(line);
    });

    flushParagraph();
    closeAllLists();
    if (inCode) html.push('</code></pre></div>');
    if (inMath) html.push('\\]</div>');
    return html.join('');
  };

  const parseTitleAndBody = (markdown, fallbackTitle) => {
    const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    let title = fallbackTitle;
    let titleIndex = -1;

    for (let i = 0; i < lines.length; i += 1) {
      const match = lines[i].match(/^#\s+(.+)$/);
      if (match) {
        title = match[1].trim();
        titleIndex = i;
        break;
      }
    }

    const bodyLines = titleIndex >= 0
      ? lines.filter((_, index) => index !== titleIndex)
      : lines;

    return {
      title,
      bodyMarkdown: bodyLines.join('\n').trim(),
    };
  };

  const slug = new URLSearchParams(window.location.search).get('slug');

  const isShellLanguage = (language) => ['bash', 'sh', 'shell', 'zsh'].includes(String(language || '').toLowerCase());

  const buildShellCodeHtml = (rawCode) => String(rawCode || '')
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\s*)\$(\s?.*)$/);
      if (!match) return escapeHtml(line);
      const indent = escapeHtml(match[1] || '');
      const command = escapeHtml(match[2] || '');
      return `${indent}<span class="code-shell-prompt" aria-hidden="true">$</span><span class="code-shell-command">${command}</span>`;
    })
    .join('\n');

  const getCopyText = (language, rawCode) => {
    if (!isShellLanguage(language)) return rawCode;
    return String(rawCode || '')
      .split('\n')
      .map((line) => line.replace(/^(\s*)\$\s?/, '$1'))
      .join('\n');
  };

  const setupCodeBlockCopyButtons = (root) => {
    if (!root) return;

    const isJa = getCurrentLanguage() === 'ja';
    const copyLabel = isJa ? 'コピー' : 'Copy';
    const copiedLabel = isJa ? 'コピーしました' : 'Copied!';
    const failedLabel = isJa ? '失敗' : 'Failed';

    root.querySelectorAll('.code-block').forEach((block) => {
      const code = block.querySelector('pre > code');
      if (!code) return;

      const language = (block.dataset.language || '').toLowerCase();
      const rawCode = code.textContent || '';

      if (isShellLanguage(language)) {
        code.innerHTML = buildShellCodeHtml(rawCode);
      }

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'code-block-copy-button';
      copyButton.textContent = copyLabel;

      copyButton.addEventListener('click', async () => {
        const copyText = getCopyText(language, rawCode);
        try {
          await navigator.clipboard.writeText(copyText);
          copyButton.textContent = copiedLabel;
        } catch (error) {
          console.error('Failed to copy code block', error);
          copyButton.textContent = failedLabel;
        }
        window.setTimeout(() => {
          copyButton.textContent = copyLabel;
        }, 1200);
      });

      block.appendChild(copyButton);
    });
  };

  const wrapTablesWithScroller = (root) => {
    if (!root) return;
    const tables = root.querySelectorAll('table');
    tables.forEach((table) => {
      if (table.parentElement?.classList.contains('table-scroll')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  };

  if (!slug || /\.\./.test(slug)) {
    renderMessage(getCurrentLanguage() === 'ja' ? '記事URLが不正です。' : 'Invalid blog post URL.');
    return;
  }

  try {
    const manifestResponse = await fetch('data/posts.json', { cache: 'no-store' });
    if (!manifestResponse.ok) throw new Error('Failed to load posts manifest');

    const manifest = await manifestResponse.json();
    const postEntry = manifest.find((entry) => {
      const normalized = String(entry?.path || '').replace(/^blog\//i, '').replace(/\.md$/i, '');
      return normalized === slug;
    });

    if (!postEntry?.path) {
      renderMessage(getCurrentLanguage() === 'ja' ? '指定された記事は見つかりませんでした。' : 'The requested blog post was not found.');
      return;
    }

    const markdownResponse = await fetch(`${postEntry.path}`);
    if (!markdownResponse.ok) throw new Error(`Failed to load markdown: ${postEntry.path}`);
    const markdown = await markdownResponse.text();

    const fallbackTitle = slug
      .split(/[-_]/g)
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ') || slug;

    const parsed = parseTitleAndBody(markdown, fallbackTitle);
    container.innerHTML = `
      <h1 class="blog-post-single-title">${escapeHtml(parsed.title)}</h1>
      <p class="blog-post-meta blog-post-single-meta">Updated: ${escapeHtml(formatUpdatedDate(postEntry.updatedAt))}</p>
      <div class="blog-post-content">${markdownToHtml(parsed.bodyMarkdown)}</div>
      <p class="blog-post-permalink-wrap"><a class="blog-post-permalink" href="blog.html">← Back to Blog</a></p>
    `;
    wrapTablesWithScroller(container);
    setupCodeBlockCopyButtons(container);

    if (window.MathJax?.typesetPromise) {
      await window.MathJax.typesetPromise([container]);
    }

    document.title = `${parsed.title} | Blog | Hiroki Kobayashi`;
  } catch (error) {
    console.error('Failed to render blog post page', error);
    renderMessage(t('blog.loadFailed', getCurrentLanguage()));
  }
})();
