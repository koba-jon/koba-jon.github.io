(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

  try {
    const data = await loadJson('data/projects.json');
    const githubStatsCache = new Map();

    const parseGitHubRepoPath = (url) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'github.com') return null;
        const [owner, repo] = parsed.pathname.replace(/^\/+/, '').split('/');
        if (!owner || !repo) return null;
        return `${owner}/${repo}`;
      } catch (error) {
        return null;
      }
    };

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
        console.warn(`Failed to load GitHub stats for ${repoPath}`, error);
        githubStatsCache.set(repoPath, null);
        return null;
      }
    };

    const formatCount = (value) => new Intl.NumberFormat('en-US').format(value);

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

    const researchCards = await Promise.all(data.research.map(buildCard));
    const opensourceCards = await Promise.all(data.opensource.map(buildCard));

    const githubTotals = Array.from(githubStatsCache.values()).reduce(
      (accumulator, stats) => {
        if (!stats) return accumulator;
        accumulator.stars += stats.stars;
        accumulator.forks += stats.forks;
        return accumulator;
      },
      { stars: 0, forks: 0 },
    );

    document.querySelector('#research-projects .projects-grid').innerHTML = researchCards.join('');
    document.querySelector('#opensource-projects .projects-grid').innerHTML = opensourceCards.join('');
    document.getElementById('research-count').textContent = data.research.length;
    document.getElementById('opensource-count').textContent = data.opensource.length;
    document.getElementById('github-stars-total').textContent = formatCount(githubTotals.stars);
    document.getElementById('github-forks-total').textContent = formatCount(githubTotals.forks);
  } catch (error) {
    console.warn(error);
  }
})();
