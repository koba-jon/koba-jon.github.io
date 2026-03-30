(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

  try {
    const [profile, home, journal, intl, domestic, awards, projects] = await Promise.all([
      loadJson('data/profile.json'),
      loadJson('data/home.json'),
      loadJson('data/publications-journal.json'),
      loadJson('data/publications-international.json'),
      loadJson('data/publications-domestic.json'),
      loadJson('data/awards.json'),
      loadJson('data/projects.json'),
    ]);
    const githubRepoCache = new Map();

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

    const fetchGitHubRepoInfo = async (projectLink) => {
      const repoPath = parseGitHubRepoPath(projectLink);
      if (!repoPath) return null;
      if (githubRepoCache.has(repoPath)) {
        return githubRepoCache.get(repoPath);
      }

      try {
        const response = await fetch(`https://api.github.com/repos/${repoPath}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const repo = await response.json();
        const repoInfo = {
          description: typeof repo.description === 'string' ? repo.description : '',
          stars: Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0,
          forks: Number.isFinite(repo.forks_count) ? repo.forks_count : 0,
        };
        githubRepoCache.set(repoPath, repoInfo);
        return repoInfo;
      } catch (error) {
        console.warn(`Failed to load GitHub info for ${repoPath}`, error);
        githubRepoCache.set(repoPath, null);
        return null;
      }
    };

    const formatCount = (value) => new Intl.NumberFormat('en-US').format(value);

    document.getElementById('stat-journal').textContent = journal.length;
    document.getElementById('stat-intl').textContent = intl.length;
    document.getElementById('stat-domestic').textContent = domestic.length;
    document.getElementById('stat-awards').textContent =
      Object.values(awards).reduce((s, arr) => s + arr.length, 0);

    const overview = document.getElementById('overview-text');
    const overviewParagraphs = Array.isArray(home.overview) ? home.overview : [];
    overview.innerHTML = overviewParagraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');

    document.getElementById('tag-cloud').innerHTML = profile.research_areas
      .slice(0, 6)
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join('');

    const affiliationBody = document.getElementById('affiliation-body');
    if (affiliationBody) {
      const position = escapeHtml(profile.position || '');
      const company = escapeHtml(profile.company || '');
      const companyUrl = profile.company_url || '#';

      affiliationBody.innerHTML = `
        <div class="info-row">
          <span class="info-key">Position</span>
          <span class="info-val">${position}</span>
        </div>
        <div class="info-row">
          <span class="info-key">Company</span>
          <span class="info-val">
            <a href="${companyUrl}" class="link-accent" target="_blank" rel="noopener noreferrer">${company}</a>
          </span>
        </div>
      `;
    }

    const buildPubItem = (publication) => {
      const badges = [
        publication.first_author ? '<span class="pub-badge">First Author</span>' : '',
        publication.award ? `<span class="pub-badge award-badge">${escapeHtml(publication.award)}</span>` : '',
        publication.acceptance_rate ? `<span class="pub-badge acceptance-rate-badge">Acceptance Rate: ${escapeHtml(publication.acceptance_rate)}%</span>` : '',
      ].join('');

      return `
        <div class="pub-item">
          <span class="pub-year">${escapeHtml(publication.year)}</span>
          <div>
            <div class="pub-title">${escapeHtml(publication.title)}${badges}</div>
            <div class="pub-authors">${escapeHtml(publication.authors)}</div>
            <div class="pub-venue">${escapeHtml(publication.venue)}</div>
          </div>
        </div>
      `;
    };

    const allPublications = [...journal, ...intl, ...domestic];
    const selectedPublications = allPublications.filter((publication) => publication.select === true);
    const selectedPublicationsList = document.getElementById('selected-publications-list');
    if (selectedPublicationsList) {
      selectedPublicationsList.innerHTML = selectedPublications.length
        ? selectedPublications.map(buildPubItem).join('')
        : '<p>No selected publications configured yet.</p>';
    }

    const allProjects = [...(projects.research ?? []), ...(projects.opensource ?? [])];
    const featuredProjects = allProjects.filter((project) => project.feature === true);
    const featuredProjectList = document.getElementById('featured-project-list');
    if (featuredProjectList) {
      if (!featuredProjects.length) {
        featuredProjectList.innerHTML = '<p>No featured project configured yet.</p>';
      } else {
        const featuredCards = await Promise.all(featuredProjects.map(async (project) => {
          const repoInfo = await fetchGitHubRepoInfo(project.link);
          const imageHtml = project.image
            ? `<div class="project-image-center"><img src="${project.image}" alt="${escapeHtml(project.title)}" class="project-img2"></div>`
            : '';
          const projectDescriptions = (project.description ?? [])
            .map((line) => `<p class="project-desc">${escapeHtml(line)}</p>`)
            .join('');
          const summary = !projectDescriptions && repoInfo?.description
            ? `<p class="project-desc">${escapeHtml(repoInfo.description)}</p>`
            : '';
          const statsHtml = repoInfo
            ? `
                <div class="repo-stats" aria-label="GitHub repository stats">
                  <span class="repo-stat" title="Stars">★ ${formatCount(repoInfo.stars)}</span>
                  <span class="repo-stat" title="Forks">⑂ ${formatCount(repoInfo.forks)}</span>
                </div>
              `
            : '';
          const tagClass = project.tag_type === 'research' ? 'project-tag-research' : 'project-tag';
          return `
            <article class="project-card">
              ${imageHtml}
              <div class="project-body">
                <span class="${tagClass}">${escapeHtml(project.tag ?? '')}</span>
                <h3 class="project-title">${escapeHtml(project.title)}</h3>
                ${projectDescriptions || summary}
                ${statsHtml}
                <a href="${project.link}" class="project-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
              </div>
            </article>
          `;
        }));
        featuredProjectList.innerHTML = featuredCards.join('');
      }
    }
  } catch (error) {
    console.warn(error);
  }
})();
