(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();
  const exportButton = document.getElementById('create-paper-list-btn');

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

  const toPaperListEntry = (publication, index) => {
    const isJapanese = publication.lang === 'ja';
    const comma = isJapanese ? '，' : ', ';
    const period = isJapanese ? '．' : '.';
    return `	[${index + 1}] ${publication.authors}${comma}${publication.title}${comma}${publication.venue}${comma}${publication.year}${period}`;
  };

  const buildPaperListText = (journal, intl, domestic) => {
    const sections = [
      { label: 'Journal Papers', items: journal },
      { label: 'International Conferences', items: intl },
      { label: 'Domestic Conferences', items: domestic },
    ];

    return sections
      .map((section, sectionIndex) => {
        const header = `(${sectionIndex + 1}) ${section.label}: ${section.items.length}`;
        const lines = section.items.map(toPaperListEntry).join('\n');
        return `${header}\n${lines}`;
      })
      .join('\n\n');
  };

  const escapeHtmlForExport = (text) => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const createPaperListDoc = (journal, intl, domestic) => {
    const bodyText = escapeHtmlForExport(buildPaperListText(journal, intl, domestic));
    const htmlDoc = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Paper List</title></head>
      <body style="font-family:'Yu Mincho','Hiragino Mincho ProN','MS Mincho',serif;line-height:1.8;white-space:pre-wrap;">
        ${bodyText}
      </body>
      </html>
    `;
    const blob = new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `paper-list-${today}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  try {
    const [journal, intl, domestic, metrics] = await Promise.all([
      loadJson('data/publications-journal.json'),
      loadJson('data/publications-international.json'),
      loadJson('data/publications-domestic.json'),
      loadJson('data/metrics.json'),
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

    exportButton?.addEventListener('click', () => createPaperListDoc(journal, intl, domestic));

    window.siteComponents.initTabs();
  } catch (error) {
    console.warn(error);
    document.getElementById('tab-intl').innerHTML = '<p>Failed to load publication data.</p>';
  }
})();
