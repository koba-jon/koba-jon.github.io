(async function () {
  const {
    initSiteChrome,
    escapeHtml,
    getCurrentLanguage,
    t,
  } = window.siteUtils;

  await initSiteChrome();

  const postsContainer = document.getElementById('blog-posts');
  if (!postsContainer) return;

  const inferRepoInfo = () => {
    const githubPagesHost = /^(?<owner>[a-z0-9-]+)\.github\.io$/i.exec(window.location.hostname || '');
    if (githubPagesHost?.groups?.owner) {
      const owner = githubPagesHost.groups.owner;
      return { owner, repo: `${owner}.github.io` };
    }

    const siteBase = 'https://koba-jon.github.io/';
    const baseHostMatch = /https:\/\/(?<owner>[a-z0-9-]+)\.github\.io\//i.exec(siteBase);
    if (baseHostMatch?.groups?.owner) {
      const owner = baseHostMatch.groups.owner;
      return { owner, repo: `${owner}.github.io` };
    }

    return { owner: 'koba-jon', repo: 'koba-jon.github.io' };
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

  const filenameToTitle = (filename) => {
    const withoutExt = filename.replace(/\.md$/i, '');
    return withoutExt
      .split(/[-_]/g)
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ') || filename;
  };

  const pathToSlug = (path) => String(path || '')
    .replace(/^blog\//i, '')
    .replace(/\.md$/i, '');

  const fetchLatestCommitDate = async (owner, repo, path) => {
    const commitsApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`;
    const commitResponse = await fetch(commitsApiUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!commitResponse.ok) {
      throw new Error(`GitHub commits API returned ${commitResponse.status} for ${path}`);
    }

    const commits = await commitResponse.json();
    return commits?.[0]?.commit?.committer?.date || null;
  };

  const fetchMarkdownFilesFromManifest = async () => {
    const manifestResponse = await fetch('blog/posts.json', { cache: 'no-store' });
    if (!manifestResponse.ok) {
      throw new Error(`Blog manifest returned ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json();
    if (!Array.isArray(manifest)) {
      throw new Error('Blog manifest must be an array');
    }

    return manifest
      .filter((entry) => typeof entry?.path === 'string' && /\.md$/i.test(entry.path))
      .map((entry) => {
        const name = entry.path.split('/').pop() || '';
        return {
          name,
          path: entry.path,
          updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null,
        };
      })
      .sort((left, right) => {
        const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
        const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
        if (leftTime !== rightTime) return rightTime - leftTime;
        return right.name.localeCompare(left.name);
      });
  };

  const fetchMarkdownFilesFromGitHubApi = async () => {
    const { owner, repo } = inferRepoInfo();
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    const apiResponse = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!apiResponse.ok) {
      throw new Error(`GitHub API returned ${apiResponse.status}`);
    }

    const responseJson = await apiResponse.json();
    const treeEntries = Array.isArray(responseJson?.tree) ? responseJson.tree : [];
    const markdownEntries = treeEntries
      .filter((entry) => entry?.type === 'blob' && typeof entry.path === 'string' && /^blog\/.+\.md$/i.test(entry.path));

    const markdownFiles = await Promise.all(markdownEntries.map(async (entry) => {
      const path = entry.path;
      const updatedAt = await fetchLatestCommitDate(owner, repo, path);
      return {
        name: path.split('/').pop() || path,
        path,
        updatedAt,
      };
    }));

    return markdownFiles.sort((left, right) => {
      const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
      const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      if (leftTime !== rightTime) return rightTime - leftTime;
      return right.name.localeCompare(left.name);
    });
  };

  const fetchMarkdownFiles = async () => {
    try {
      return await fetchMarkdownFilesFromGitHubApi();
    } catch (githubApiError) {
      console.warn('Falling back to blog/posts.json after GitHub API failure', githubApiError);
      return fetchMarkdownFilesFromManifest();
    }
  };

  const extractTitleAndBody = (markdown, fallbackTitle) => {
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

  const renderPosts = (posts) => {
    if (!posts.length) {
      postsContainer.innerHTML = `<p class="blog-empty">${escapeHtml(t('blog.noPosts', getCurrentLanguage()))}</p>`;
      return;
    }

    postsContainer.innerHTML = posts.map((post, index) => {
      const contentId = `blog-post-content-${index}`;
      return `
        <article class="blog-post" data-expanded="false">
          <button class="blog-post-header" type="button" aria-expanded="false" aria-controls="${contentId}">
            <span class="blog-post-title-wrap">
              <span class="blog-post-title">${escapeHtml(post.title)}</span>
              <span class="blog-post-meta">Updated: ${escapeHtml(formatUpdatedDate(post.updatedAt))}</span>
            </span>
            <span class="blog-post-toggle" aria-hidden="true">+</span>
          </button>
          <div id="${contentId}" class="blog-post-content" hidden>
            ${post.contentHtml}
            <p class="blog-post-permalink-wrap">
              <a class="blog-post-permalink" href="blog/post.html?slug=${encodeURIComponent(post.slug)}">Permalink</a>
            </p>
          </div>
        </article>
      `;
    }).join('');

    postsContainer.querySelectorAll('.blog-post-header').forEach((button) => {
      button.addEventListener('click', () => {
        const article = button.closest('.blog-post');
        const content = article?.querySelector('.blog-post-content');
        const expanded = button.getAttribute('aria-expanded') === 'true';

        button.setAttribute('aria-expanded', String(!expanded));
        if (article) article.dataset.expanded = String(!expanded);
        if (content) content.hidden = expanded;
      });
    });
  };

  try {
    const markdownFiles = await fetchMarkdownFiles();
    const posts = await Promise.all(markdownFiles.map(async (file) => {
      const response = await fetch(file.path);
      if (!response.ok) throw new Error(`Failed to load ${file.path}`);
      const markdown = await response.text();
      const parsed = extractTitleAndBody(markdown, filenameToTitle(file.name));
      return {
        title: parsed.title,
        slug: pathToSlug(file.path),
        updatedAt: file.updatedAt,
        contentHtml: markdownToHtml(parsed.bodyMarkdown),
      };
    }));

    renderPosts(posts);
  } catch (error) {
    console.error('Failed to load blog posts', error);
    postsContainer.innerHTML = `<p class="blog-empty">${escapeHtml(t('blog.loadFailed', getCurrentLanguage()))}</p>`;
  }
})();
