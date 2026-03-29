(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

  try {
    const items = await loadJson('data/education.json');

    document.getElementById('edu-timeline').innerHTML = items.map((item) => {
      const metaRows = [
        item.lab
          ? `<div class="edu-tl-row"><span class="edu-tl-key">Lab</span><span class="edu-tl-val">${escapeHtml(item.lab)}</span></div>`
          : '',
        item.supervisor
          ? `<div class="edu-tl-row"><span class="edu-tl-key">Supervisor</span><span class="edu-tl-val">${escapeHtml(item.supervisor)}</span></div>`
          : '',
        item.dissertation
          ? `<div class="edu-tl-row"><span class="edu-tl-key">Dissertation</span><span class="edu-tl-thesis">${escapeHtml(item.dissertation)}</span></div>`
          : ''
      ].filter(Boolean).join('');

      return `
        <article class="edu-tl-item">
          <div class="edu-tl-dot"></div>
          <div class="edu-tl-card">
            <div class="edu-tl-period">${escapeHtml(item.period)}</div>
            <div class="edu-tl-degree">${escapeHtml(item.degree)}</div>
            <div class="edu-tl-school">${escapeHtml(item.school)}</div>
            ${
              metaRows
                ? `<div class="edu-tl-divider"></div>
                   <div class="edu-tl-meta">${metaRows}</div>`
                : ''
            }
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    console.warn(error);
  }
})();
