(async function () {
  const {
    loadJson,
    initSiteChrome,
    escapeHtml,
    setStructuredData,
    absolutePageUrl,
    parseGitHubRepoPath,
    fetchShieldsRepoCount,
  } = window.siteUtils;
  await initSiteChrome();
  const keywordInput = document.getElementById('project-search-keyword');
  const tagSelect = document.getElementById('project-filter-tag');
  const resetButton = document.getElementById('project-filter-reset');
  const summaryElement = document.getElementById('project-filter-summary');
  const FILTER_QUERY_KEYS = {
    keyword: 'q',
    tag: 'tag',
  };

  try {
    const data = await loadJson('data/projects.json');
    const githubStatsCache = new Map();
    const researchGrid = document.querySelector('#research-projects .projects-grid');
    const opensourceGrid = document.querySelector('#opensource-projects .projects-grid');
    const allProjects = [...data.research, ...data.opensource];

    const fetchGithubStats = async (projectLink) => {
      const repoPath = parseGitHubRepoPath(projectLink);
      if (!repoPath) return null;

      if (githubStatsCache.has(repoPath)) {
        return githubStatsCache.get(repoPath);
      }

      try {
        const response = await fetch(`https://api.github.com/repos/${repoPath}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repo = await response.json();
        const stats = {
          stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0,
          forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0,
        };
        githubStatsCache.set(repoPath, stats);
        return stats;
      } catch (error) {
        console.warn(`Failed to load GitHub stats for ${repoPath} via GitHub API`, error);
      }

      const [stars, forks] = await Promise.all([
        fetchShieldsRepoCount(repoPath, 'stars'),
        fetchShieldsRepoCount(repoPath, 'forks'),
      ]);

      if (Number.isFinite(stars) || Number.isFinite(forks)) {
        const stats = {
          stars: Number.isFinite(stars) ? stars : 0,
          forks: Number.isFinite(forks) ? forks : 0,
        };
        githubStatsCache.set(repoPath, stats);
        return stats;
      }

      githubStatsCache.set(repoPath, null);
      return null;
    };

    const formatCount = (value) => new Intl.NumberFormat('en-US').format(value);
    const normalizeText = (value) => String(value ?? '')
      .toLowerCase()
      .normalize('NFKC');
    const parseProjectTags = (project) => String(project.tag ?? '')
      .split(/[·,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    const getProjectSearchableText = (project) => normalizeText([
      project.title,
      project.tag,
      ...(project.description || []),
    ].join(' '));
    const normalizeTagValue = (tag) => normalizeText(tag);
    const projectMatches = (project, filters) => {
      if (filters.keyword && !getProjectSearchableText(project).includes(filters.keyword)) {
        return false;
      }

      if (!filters.tag) {
        return true;
      }

      const tags = parseProjectTags(project).map(normalizeTagValue);
      return tags.includes(filters.tag);
    };
    const buildCard = async (project) => {
      const imageHtml = project.image
        ? `<div class="project-image-center"><img src="${project.image}" alt="${escapeHtml(project.title)}" class="project-img2"></div>`
        : '';
      const tagClass = project.tag_type === 'research' ? 'project-tag-research' : 'project-tag';
      const descriptions = project.description
        .map((line) => `<p class="project-desc">${escapeHtml(line)}</p>`)
        .join('');
      const githubStats = await fetchGithubStats(project.link);
      const statsHtml = githubStats
        ? `
            <div class="repo-stats" aria-label="GitHub repository stats">
              <span class="repo-stat" title="Stars">★ ${formatCount(githubStats.stars)}</span>
              <span class="repo-stat" title="Forks">⑂ ${formatCount(githubStats.forks)}</span>
            </div>
          `
        : '';

      return `
        <article class="project-card">
          ${imageHtml}
          <div class="project-body">
            <span class="${tagClass}">${escapeHtml(project.tag)}</span>
            <h2 class="project-title">${escapeHtml(project.title)}</h2>
            ${descriptions}
            ${statsHtml}
            <a href="${project.link}" class="project-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
          </div>
        </article>
      `;
    };

    document.getElementById('research-count').textContent = data.research.length;
    document.getElementById('opensource-count').textContent = data.opensource.length;

    setStructuredData('projects-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Projects',
      url: absolutePageUrl('projects.html'),
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: allProjects.length,
        itemListElement: allProjects.map((project, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'SoftwareSourceCode',
            name: project.title,
            description: (project.description || []).join(' '),
            codeRepository: project.link,
            url: project.link,
          },
        })),
      },
    });

    const readFiltersFromQuery = () => {
      const params = new URLSearchParams(window.location.search);
      return {
        keyword: normalizeText((params.get(FILTER_QUERY_KEYS.keyword) || '').trim()),
        tag: normalizeTagValue((params.get(FILTER_QUERY_KEYS.tag) || '').trim()),
      };
    };

    const writeFiltersToQuery = (filters) => {
      const url = new URL(window.location.href);
      if (filters.keyword) {
        url.searchParams.set(FILTER_QUERY_KEYS.keyword, filters.keyword);
      } else {
        url.searchParams.delete(FILTER_QUERY_KEYS.keyword);
      }

      if (filters.tag) {
        url.searchParams.set(FILTER_QUERY_KEYS.tag, filters.tag);
      } else {
        url.searchParams.delete(FILTER_QUERY_KEYS.tag);
      }

      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const populateTagOptions = () => {
      if (!tagSelect) return;
      const uniqueTags = Array.from(new Set(
        allProjects
          .flatMap((project) => parseProjectTags(project))
          .map((tag) => tag.trim())
          .filter(Boolean),
      )).sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));

      tagSelect.innerHTML = [
        '<option value="">All tags</option>',
        ...uniqueTags.map((tag) => `<option value="${escapeHtml(normalizeTagValue(tag))}">${escapeHtml(tag)}</option>`),
      ].join('');
    };

    const renderProjects = async (filters) => {
      const filteredResearch = data.research.filter((project) => projectMatches(project, filters));
      const filteredOpenSource = data.opensource.filter((project) => projectMatches(project, filters));

      const [researchCards, opensourceCards] = await Promise.all([
        Promise.all(filteredResearch.map(buildCard)),
        Promise.all(filteredOpenSource.map(buildCard)),
      ]);

      if (researchGrid) {
        researchGrid.innerHTML = researchCards.length
          ? researchCards.join('')
          : '<p>No research projects match the current filters.</p>';
      }
      if (opensourceGrid) {
        opensourceGrid.innerHTML = opensourceCards.length
          ? opensourceCards.join('')
          : '<p>No open-source projects match the current filters.</p>';
      }

      const githubTotals = Array.from(githubStatsCache.values()).reduce(
        (accumulator, stats) => {
          if (!stats) return accumulator;
          accumulator.stars += stats.stars;
          accumulator.forks += stats.forks;
          return accumulator;
        },
        { stars: 0, forks: 0 },
      );

      const hasGithubStats = githubStatsCache.size > 0 && Array.from(githubStatsCache.values()).some(Boolean);
      document.getElementById('github-stars-total').textContent = hasGithubStats ? formatCount(githubTotals.stars) : '—';
      document.getElementById('github-forks-total').textContent = hasGithubStats ? formatCount(githubTotals.forks) : '—';

      if (summaryElement) {
        const filteredTotal = filteredResearch.length + filteredOpenSource.length;
        const total = allProjects.length;
        summaryElement.textContent = filteredTotal === total
          ? `Showing all ${total} projects.`
          : `Showing ${filteredTotal} of ${total} projects.`;
      }
    };

    const syncForm = (filters) => {
      if (keywordInput) keywordInput.value = filters.keyword;
      if (tagSelect) tagSelect.value = filters.tag;
    };

    const applyFilters = async (filters) => {
      syncForm(filters);
      writeFiltersToQuery(filters);
      await renderProjects(filters);
    };

    populateTagOptions();
    const initialFilters = readFiltersFromQuery();
    await applyFilters(initialFilters);

    const handleFilterInput = async () => {
      const filters = {
        keyword: normalizeText(keywordInput?.value.trim() || ''),
        tag: normalizeTagValue(tagSelect?.value || ''),
      };
      await applyFilters(filters);
    };

    keywordInput?.addEventListener('input', handleFilterInput);
    tagSelect?.addEventListener('change', handleFilterInput);
    resetButton?.addEventListener('click', async () => {
      await applyFilters({ keyword: '', tag: '' });
      keywordInput?.focus();
    });
  } catch (error) {
    console.warn(error);
  }
})();
