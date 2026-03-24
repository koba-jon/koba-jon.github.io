(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

  try {
    const profile = await loadJson('data/profile.json');

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

    document.getElementById('current-role').innerHTML = `
      <div class="info-row"><span class="info-key">Current</span><span class="info-val">${escapeHtml(profile.position)}, ${escapeHtml(profile.company)}</span></div>
      <div class="info-row"><span class="info-key">Since</span><span class="info-val">April 2026</span></div>
    `;
  } catch (error) {
    console.warn(error);
  }
})();
