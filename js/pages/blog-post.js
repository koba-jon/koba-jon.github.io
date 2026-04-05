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
    let inList = false;
    let inCode = false;

    const closeList = () => {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
    };

    const formatInline = (text) => {
      let formatted = escapeHtml(text);
      formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      return formatted;
    };

    lines.forEach((line) => {
      if (line.trim().startsWith('```')) {
        closeList();
        if (!inCode) {
          inCode = true;
          html.push('<pre><code>');
        } else {
          inCode = false;
          html.push('</code></pre>');
        }
        return;
      }

      if (inCode) {
        html.push(`${escapeHtml(line)}\n`);
        return;
      }

      if (!line.trim()) {
        closeList();
        return;
      }

      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        closeList();
        const level = Math.min(4, headingMatch[1].length);
        html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
        return;
      }

      const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
      if (listMatch) {
        if (!inList) {
          inList = true;
          html.push('<ul>');
        }
        html.push(`<li>${formatInline(listMatch[1])}</li>`);
        return;
      }

      closeList();
      html.push(`<p>${formatInline(line)}</p>`);
    });

    closeList();
    if (inCode) html.push('</code></pre>');
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

    document.title = `${parsed.title} | Blog | Hiroki Kobayashi`;
  } catch (error) {
    console.error('Failed to render blog post page', error);
    renderMessage(t('blog.loadFailed', getCurrentLanguage()));
  }
})();
