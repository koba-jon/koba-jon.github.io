(async function () {
  const { loadJson, initSiteChrome, escapeHtml, setStructuredData, absolutePageUrl } = window.siteUtils;
  await initSiteChrome();
  const exportDocButton = document.getElementById('create-paper-list-btn');
  const exportCsvButton = document.getElementById('export-csv-btn');
  const exportPdfButton = document.getElementById('export-pdf-btn');
  const keywordInput = document.getElementById('pub-search-keyword');
  const yearSelect = document.getElementById('pub-filter-year');
  const firstAuthorOnlyInput = document.getElementById('pub-filter-first-author');
  const resetButton = document.getElementById('pub-filter-reset');

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

  const buildPaperListHtml = (journal, intl, domestic) => {
    const sections = [
      { label: 'Journal Papers', items: journal },
      { label: 'International Conferences', items: intl },
      { label: 'Domestic Conferences', items: domestic },
    ];

    return sections
      .map((section, sectionIndex) => {
        const header = escapeHtmlForExport(`(${sectionIndex + 1}) ${section.label}: ${section.items.length}`);
        const items = section.items
          .map((publication, index) => {
            const entry = escapeHtmlForExport(toPaperListEntry(publication, index).replace(/^\t/, ''));
            return `<p style="margin:0 0 0.35em 2em;text-indent:-1em;">${entry}</p>`;
          })
          .join('');

        return `
          <section style="margin-bottom:1.4em;">
            <p style="margin:0 0 0.55em 0;font-weight:bold;">${header}</p>
            ${items}
          </section>
        `;
      })
      .join('');
  };

  const escapeHtmlForExport = (text) => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const createPaperListDoc = (journal, intl, domestic) => {
    const bodyHtml = buildPaperListHtml(journal, intl, domestic);
    const htmlDoc = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Paper List</title></head>
      <body style="font-family:'Yu Mincho','Hiragino Mincho ProN','MS Mincho',serif;line-height:1.8;">
        ${bodyHtml}
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

  const csvEscape = (value) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const createPaperListCsv = (journal, intl, domestic) => {
    const rows = [
      ['category', 'index', 'year', 'title', 'authors', 'venue', 'first_author', 'award', 'acceptance_rate', 'language'],
    ];
    const categories = [
      { label: 'Journal Papers', items: journal },
      { label: 'International Conferences', items: intl },
      { label: 'Domestic Conferences', items: domestic },
    ];

    categories.forEach((category) => {
      category.items.forEach((publication, index) => {
        rows.push([
          category.label,
          index + 1,
          publication.year,
          publication.title,
          publication.authors,
          publication.venue,
          publication.first_author ? 'true' : 'false',
          publication.award ?? '',
          publication.acceptance_rate ?? '',
          publication.lang ?? '',
        ]);
      });
    });

    const csv = rows
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');
    const csvWithBom = `\uFEFF${csv}`;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `paper-list-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createPaperListPdf = (journal, intl, domestic) => {
    const bodyHtml = buildPaperListHtml(journal, intl, domestic);
    // NOTE:
    // - `noopener`/`noreferrer` can cause `window.open` to return `null` in some browsers.
    // - We need a live window reference to inject HTML before printing.
    // - To keep the new tab detached from this page, clear `opener` explicitly.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Unable to open a new window for PDF export. Please allow pop-ups and try again.');
      return;
    }
    printWindow.opener = null;

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Paper List PDF</title>
        <style>
          body {
            margin: 24px;
            font-family: "Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif;
            line-height: 1.8;
            color: #111;
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.addEventListener('load', () => {
            window.print();
          });
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
  };

  const normalizeText = (value) => String(value ?? '')
    .toLowerCase()
    .normalize('NFKC');

  const publicationMatches = (publication, filters) => {
    const searchable = normalizeText([
      publication.title,
      publication.authors,
      publication.venue,
      publication.year,
    ].join(' '));

    if (filters.keyword && !searchable.includes(filters.keyword)) {
      return false;
    }

    if (filters.year && String(publication.year) !== filters.year) {
      return false;
    }

    if (filters.firstAuthorOnly && !publication.first_author) {
      return false;
    }

    return true;
  };

  const splitAuthors = (authors) => String(authors ?? '')
    .split(/,|，/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ '@type': 'Person', name }));

  const toScholarlyArticleSchema = (publication) => ({
    '@type': 'ScholarlyArticle',
    headline: publication.title,
    name: publication.title,
    author: splitAuthors(publication.authors),
    datePublished: String(publication.year),
    isPartOf: publication.venue ? { '@type': 'Periodical', name: publication.venue } : undefined,
    inLanguage: publication.lang === 'ja' ? 'ja' : 'en',
  });

  const renderPublicationList = (elementId, publications, emptyMessage) => {
    const target = document.getElementById(elementId);
    if (!target) return;
    target.innerHTML = publications.length
      ? publications.map(buildPubItem).join('')
      : `<p>${escapeHtml(emptyMessage)}</p>`;
  };

  const updateTabCount = (elementId, filteredCount, totalCount) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = filteredCount === totalCount
      ? `${totalCount}`
      : `${filteredCount} / ${totalCount}`;
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

    const years = Array.from(new Set([...journal, ...intl, ...domestic].map((publication) => publication.year)))
      .sort((left, right) => Number(right) - Number(left));
    yearSelect.innerHTML = [
      '<option value="">All years</option>',
      ...years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`),
    ].join('');

    const applyFilters = () => {
      const filters = {
        keyword: normalizeText(keywordInput.value.trim()),
        year: yearSelect.value,
        firstAuthorOnly: firstAuthorOnlyInput.checked,
      };

      const filteredJournal = journal.filter((publication) => publicationMatches(publication, filters));
      const filteredIntl = intl.filter((publication) => publicationMatches(publication, filters));
      const filteredDomestic = domestic.filter((publication) => publicationMatches(publication, filters));

      renderPublicationList('tab-journal', filteredJournal, 'No journal papers match the current filters.');
      renderPublicationList('tab-intl', filteredIntl, 'No international conference papers match the current filters.');
      renderPublicationList('tab-domestic', filteredDomestic, 'No domestic conference papers match the current filters.');

      updateTabCount('tab-count-journal', filteredJournal.length, journal.length);
      updateTabCount('tab-count-intl', filteredIntl.length, intl.length);
      updateTabCount('tab-count-domestic', filteredDomestic.length, domestic.length);
    };

    keywordInput?.addEventListener('input', applyFilters);
    yearSelect?.addEventListener('change', applyFilters);
    firstAuthorOnlyInput?.addEventListener('change', applyFilters);
    resetButton?.addEventListener('click', () => {
      keywordInput.value = '';
      yearSelect.value = '';
      firstAuthorOnlyInput.checked = false;
      applyFilters();
    });

    applyFilters();

    exportDocButton?.addEventListener('click', () => createPaperListDoc(journal, intl, domestic));
    exportCsvButton?.addEventListener('click', () => createPaperListCsv(journal, intl, domestic));
    exportPdfButton?.addEventListener('click', () => createPaperListPdf(journal, intl, domestic));

    const allPublications = [...journal, ...intl, ...domestic];
    setStructuredData('publications-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Publications',
      url: absolutePageUrl('publications.html'),
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: allPublications.length,
        itemListElement: allPublications.map((publication, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: toScholarlyArticleSchema(publication),
        })),
      },
      citation: metrics.citations ?? undefined,
    });

    window.siteComponents.initTabs();
  } catch (error) {
    console.warn(error);
    document.getElementById('tab-intl').innerHTML = '<p>Failed to load publication data.</p>';
  }
})();
