(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

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

  try {
    const [journal, intl, domestic, metrics] = await Promise.all([
      loadJson('assets/data/publications-journal.json'),
      loadJson('assets/data/publications-international.json'),
      loadJson('assets/data/publications-domestic.json'),
      loadJson('assets/data/metrics.json'),
    ]);

    const allFirstAuthors = [...journal, ...intl, ...domestic].filter((item) => item.first_author).length;

    document.getElementById('stat-journal').textContent = journal.length;
    document.getElementById('stat-intl').textContent = intl.length;
    document.getElementById('stat-domestic').textContent = domestic.length;
    document.getElementById('stat-first').textContent = allFirstAuthors;
    document.getElementById('stat-citations').textContent = metrics.citations ?? '—';

    document.getElementById('tab-count-journal').textContent = journal.length;
    document.getElementById('tab-count-intl').textContent = intl.length;
    document.getElementById('tab-count-domestic').textContent = domestic.length;

    document.getElementById('tab-journal').innerHTML = journal.map(buildPubItem).join('') || '<p>No journal papers listed yet.</p>';
    document.getElementById('tab-intl').innerHTML = intl.map(buildPubItem).join('');
    document.getElementById('tab-domestic').innerHTML = domestic.map(buildPubItem).join('') || '<p>No domestic conference papers listed yet.</p>';

    window.siteComponents.initTabs();
  } catch (error) {
    console.warn(error);
    document.getElementById('tab-intl').innerHTML = '<p>Failed to load publication data.</p>';
  }
})();
