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

  const fetchMarkdownFiles = async () => {
    const { owner, repo } = inferRepoInfo();
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/blog`;
    const apiResponse = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } });
    if (!apiResponse.ok) {
      throw new Error(`GitHub API returned ${apiResponse.status}`);
    }

    const entries = await apiResponse.json();
    return entries
      .filter((entry) => entry?.type === 'file' && /\.md$/i.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        path: `blog/${entry.name}`,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  };

  const extractTitleFromMarkdown = (markdown, fallbackTitle) => {
    const heading = String(markdown || '').match(/^#\s+(.+)$/m);
    return heading ? heading[1].trim() : fallbackTitle;
  };

  const renderPosts = (posts) => {
    if (!posts.length) {
      postsContainer.innerHTML = `<p class="blog-empty">${escapeHtml(t('blog.noPosts', getCurrentLanguage()))}</p>`;
      return;
    }

    postsContainer.innerHTML = posts.map((post) => `
      <article class="blog-post">
        <h3 class="blog-post-title">${escapeHtml(post.title)}</h3>
        <p class="blog-post-meta">${escapeHtml(post.name)}</p>
        <div class="blog-post-content">${post.contentHtml}</div>
      </article>
    `).join('');
  };

  try {
    const markdownFiles = await fetchMarkdownFiles();
    const posts = await Promise.all(markdownFiles.map(async (file) => {
      const response = await fetch(file.path);
      if (!response.ok) throw new Error(`Failed to load ${file.path}`);
      const markdown = await response.text();
      return {
        name: file.name,
        title: extractTitleFromMarkdown(markdown, filenameToTitle(file.name)),
        contentHtml: markdownToHtml(markdown),
      };
    }));

    renderPosts(posts);
  } catch (error) {
    console.error('Failed to load blog posts', error);
    postsContainer.innerHTML = `<p class="blog-empty">${escapeHtml(t('blog.loadFailed', getCurrentLanguage()))}</p>`;
  }
})();
