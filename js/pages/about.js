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

    document.getElementById('memberships-list').innerHTML = profile.memberships
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    document.getElementById('background-list').innerHTML = profile.background
      .map((item) => `
        <div class="info-row">
          <span class="info-key">${escapeHtml(item.period)}</span>
          <span class="info-val">${escapeHtml(item.description)}</span>
        </div>
      `)
      .join('');

    document.getElementById('research-areas').innerHTML = profile.research_areas
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join('');

    const renderCurrentRole = () => {
      const language = getCurrentLanguage();
      document.getElementById('current-role').innerHTML = `
      <div class="info-row"><span class="info-key">${escapeHtml(t('about.current', language))}</span><span class="info-val">${escapeHtml(profile.position)}, ${escapeHtml(profile.company)}</span></div>
      <div class="info-row"><span class="info-key">${escapeHtml(t('about.since', language))}</span><span class="info-val">April 2026</span></div>
    `;
    };
    renderCurrentRole();

    window.addEventListener('site:languagechange', () => {
      renderProfileSummary();
      renderCurrentRole();
    });
  } catch (error) {
    console.warn(error);
  }
})();
