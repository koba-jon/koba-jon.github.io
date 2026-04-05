(async function () {
  const {
    loadJson,
    initSiteChrome,
    escapeHtml,
    parseGitHubRepoPath,
    fetchShieldsRepoCount,
    getCurrentLanguage,
    t,
  } = window.siteUtils;
  await initSiteChrome();

  const formatCounterDisplay = (value) => {
    const counterDigits = 9;
    const normalized = Number.parseInt(value, 10);
    const safeValue = Number.isFinite(normalized) ? Math.max(0, normalized) : 0;
    const padded = String(safeValue).padStart(counterDigits, '0').slice(-counterDigits);
    return padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const loadVisitorCounter = async () => {
    const counterEl = document.getElementById('visitor-counter-digits');
    if (!counterEl) return;

    const cacheKey = 'homeVisitorCounterLastKnownGlobal';
    const getCachedCount = () => {
      const cached = Number.parseInt(localStorage.getItem(cacheKey) || '', 10);
      return Number.isFinite(cached) ? cached : null;
    };
    const cacheCount = (count) => {
      localStorage.setItem(cacheKey, String(count));
    };

    const parseCounterResponse = (payload) => {
      const raw = payload && typeof payload === 'object' ? payload.value ?? payload.count : null;
      const count = Number.parseInt(raw, 10);
      return Number.isFinite(count) ? count : null;
    };

    const buildLegacyUrl = (endpoint, action, namespace, key) => (
      `${endpoint}/${action}/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
    );
    const buildMirrorUrl = (action, namespace, key) => {
      const compositeKey = encodeURIComponent(`${namespace}.${key}`);
      return `https://countapi.mileshilliard.com/api/v1/${action}/${compositeKey}`;
    };

    const fetchCounter = async (targetUrl) => {
      const response = await fetch(targetUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Counter API error: ${response.status}`);
      }
      const payload = await response.json();
      const count = parseCounterResponse(payload);
      if (!Number.isFinite(count)) {
        throw new Error('Counter API returned a non-numeric count');
      }
      return count;
    };

    let namespace = 'koba-jon.github.io';
    try {
      const analytics = await loadJson('data/analytics.json');
      if (analytics?.provider === 'countapi' && typeof analytics.namespace === 'string' && analytics.namespace.trim()) {
        namespace = analytics.namespace.trim();
      }
    } catch (error) {
      // Ignore and use default namespace.
    }

    const strategies = [
      // NOTE:
      // Pageview increments are already handled in js/main.js via initLightAnalytics().
      // Use "get" only here to display the current value and avoid double-counting
      // a single page visit on the Home page.
      { action: 'get', key: 'page.index' },
      // Backward-compatible fallback for older key names.
      { action: 'get', key: 'home' },
    ];
    const targets = [
      ...strategies.flatMap((strategy) => ([
        buildLegacyUrl('https://api.countapi.xyz', strategy.action, namespace, strategy.key),
        buildLegacyUrl('https://countapi.xyz', strategy.action, namespace, strategy.key),
        buildMirrorUrl(strategy.action, namespace, strategy.key),
      ])),
    ];

    for (const targetUrl of targets) {
      try {
        const count = await fetchCounter(targetUrl);
        cacheCount(count);
        counterEl.textContent = formatCounterDisplay(count);
        return;
      } catch (error) {
        // Try the next endpoint/strategy.
      }
    }

    const proxyBases = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
    ];
    for (const proxyBase of proxyBases) {
      for (const targetUrl of targets) {
        try {
          const response = await fetch(`${proxyBase}${encodeURIComponent(targetUrl)}`, {
            method: 'GET',
            cache: 'no-store',
          });
          if (!response.ok) throw new Error(`Counter proxy error: ${response.status}`);
          const payload = await response.json();
          const count = parseCounterResponse(payload);
          if (!Number.isFinite(count)) throw new Error('Counter proxy returned a non-numeric count');
          cacheCount(count);
          counterEl.textContent = formatCounterDisplay(count);
          return;
        } catch (error) {
          // Try the next proxy/target.
        }
      }
    }

    console.warn('Failed to load visitor counter from CountAPI, using cached global counter');
    const cachedCount = getCachedCount();
    counterEl.textContent = cachedCount === null ? '—' : formatCounterDisplay(cachedCount);
  };

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
        console.warn(`Failed to load GitHub info for ${repoPath} via GitHub API`, error);
      }

      const [stars, forks] = await Promise.all([
        fetchShieldsRepoCount(repoPath, 'stars'),
        fetchShieldsRepoCount(repoPath, 'forks'),
      ]);
      if (Number.isFinite(stars) || Number.isFinite(forks)) {
        const repoInfo = {
          description: '',
          stars: Number.isFinite(stars) ? stars : 0,
          forks: Number.isFinite(forks) ? forks : 0,
        };
        githubRepoCache.set(repoPath, repoInfo);
        return repoInfo;
      }

      githubRepoCache.set(repoPath, null);
      return null;
    };

    const formatCount = (value) => new Intl.NumberFormat('en-US').format(value);

    document.getElementById('stat-journal').textContent = journal.length;
    document.getElementById('stat-intl').textContent = intl.length;
    document.getElementById('stat-domestic').textContent = domestic.length;
    document.getElementById('stat-awards').textContent =
      Object.values(awards).reduce((s, arr) => s + arr.length, 0);

    const overview = document.getElementById('overview-text');
    const renderOverview = () => {
      const language = getCurrentLanguage();
      const overviewParagraphs = language === 'ja' && Array.isArray(home.overview_ja)
        ? home.overview_ja
        : (Array.isArray(home.overview) ? home.overview : []);
      overview.innerHTML = overviewParagraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');
    };
    renderOverview();

    document.getElementById('tag-cloud').innerHTML = profile.research_areas
      .slice(0, 6)
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join('');

    const formatVenue = (publication) => {
      if (publication.venue) return publication.venue;
      const title = publication.journal || publication.conference || publication.booktitle || '';
      const details = [
        publication.volume ? `Vol.${publication.volume}` : '',
        publication.number ? `No.${publication.number}` : '',
        publication.pages ? `pp.${publication.pages}` : '',
      ].filter(Boolean).join(', ');
      if (title && details) return `${title}, ${details}`;
      return title || details;
    };

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
            <div class="pub-venue">${escapeHtml(formatVenue(publication))}</div>
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
        : `<p>${escapeHtml(t('home.noSelectedPublications', getCurrentLanguage()))}</p>`;
    }

    const renderAffiliation = () => {
      const affiliation = document.getElementById('affiliation-body');
      if (!affiliation) return;

      const language = getCurrentLanguage();
      const position = escapeHtml(profile.position || '');
      const company = escapeHtml(profile.company || '');
      const companyUrl = profile.company_url || '#';

      affiliation.innerHTML = `
        <div class="info-row">
          <span class="info-key">${escapeHtml(t('home.position', language))}</span>
          <span class="info-val">${position}</span>
        </div>
        <div class="info-row">
          <span class="info-key">${escapeHtml(t('home.company', language))}</span>
          <span class="info-val">
            <a href="${companyUrl}" class="link-accent" target="_blank" rel="noopener noreferrer">${company}</a>
          </span>
        </div>
      `;
    };

    const allProjects = [...(projects.research ?? []), ...(projects.opensource ?? [])];
    const featuredProjects = allProjects.filter((project) => project.feature === true);
    const featuredProjectList = document.getElementById('featured-project-list');
    if (featuredProjectList) {
      if (!featuredProjects.length) {
        featuredProjectList.innerHTML = `<p>${escapeHtml(t('home.noFeaturedProjects', getCurrentLanguage()))}</p>`;
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
                <a href="${project.link}" class="project-link" target="_blank" rel="noopener noreferrer">${escapeHtml(t('home.viewOnGithub', getCurrentLanguage()))}</a>
              </div>
            </article>
          `;
        }));
        featuredProjectList.innerHTML = featuredCards.join('');
      }
    }

    renderAffiliation();
    window.addEventListener('site:languagechange', () => {
      renderOverview();
      renderAffiliation();
    });
  } catch (error) {
    console.warn(error);
  } finally {
    await loadVisitorCounter();
  }
})();
