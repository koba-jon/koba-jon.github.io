(async function () {
  const { loadJson, initSiteChrome, escapeHtml, getCurrentLanguage, t } = window.siteUtils;
  await initSiteChrome();

  try {
    const profile = await loadJson('data/profile.json');


    const profileSummaryContainer = document.getElementById('profile-summary-content');
    const renderProfileSummary = () => {
      if (!profileSummaryContainer) return;
      const language = getCurrentLanguage();
      const summary = language === 'ja' && Array.isArray(profile.profile_summary_ja)
        ? profile.profile_summary_ja
        : (Array.isArray(profile.profile_summary) ? profile.profile_summary : []);
      profileSummaryContainer.querySelectorAll('p').forEach((paragraph) => paragraph.remove());
      profileSummaryContainer.insertAdjacentHTML(
        'afterbegin',
        summary
          .map((item) => `<p>${escapeHtml(item)}</p>`)
          .join('')
      );
    };
    renderProfileSummary();

    const renderMemberships = () => {
      const language = getCurrentLanguage();
      const memberships = language === 'ja' && Array.isArray(profile.memberships_ja)
        ? profile.memberships_ja
        : (Array.isArray(profile.memberships) ? profile.memberships : []);

      document.getElementById('memberships-list').innerHTML = memberships
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('');
    };
    renderMemberships();

    const renderBackground = () => {
      const language = getCurrentLanguage();
      const background = language === 'ja' && Array.isArray(profile.background_ja)
        ? profile.background_ja
        : (Array.isArray(profile.background) ? profile.background : []);

      document.getElementById('background-list').innerHTML = background
        .map((item) => `
          <div class="info-row">
            <span class="info-key">${escapeHtml(item.period)}</span>
            <span class="info-val">${escapeHtml(item.description)}</span>
          </div>
        `)
        .join('');
    };
    renderBackground();

    document.getElementById('research-areas').innerHTML = profile.research_areas
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join('');

    const renderCurrentRole = () => {
      const language = getCurrentLanguage();
      const position = language === 'ja' && profile.position_ja ? profile.position_ja : profile.position;
      const company = language === 'ja' && profile.company_ja ? profile.company_ja : profile.company;
      const since = language === 'ja' ? '2026年4月' : 'April 2026';
      const separator = language === 'ja' ? '，' : ', ';
      document.getElementById('current-role').innerHTML = `
      <div class="info-row"><span class="info-key">${escapeHtml(t('about.current', language))}</span><span class="info-val">${escapeHtml(position)}${separator}${escapeHtml(company)}</span></div>
      <div class="info-row"><span class="info-key">${escapeHtml(t('about.since', language))}</span><span class="info-val">${escapeHtml(since)}</span></div>
    `;
    };
    renderCurrentRole();

    window.addEventListener('site:languagechange', () => {
      renderProfileSummary();
      renderMemberships();
      renderBackground();
      renderCurrentRole();
    });
  } catch (error) {
    console.warn(error);
  }
})();
