(async function () {
  const { loadJson, initSiteChrome, escapeHtml, getCurrentLanguage, t } = window.siteUtils;
  await initSiteChrome();

  try {
    const items = await loadJson('data/education.json');
    const renderEducation = () => {
      const language = getCurrentLanguage();
      document.getElementById('edu-timeline').innerHTML = items.map((item) => {
        const degree = language === 'ja' ? (item.degree_ja || item.degree) : item.degree;
        const school = language === 'ja' ? (item.school_ja || item.school) : item.school;
        const lab = language === 'ja' ? (item.lab_ja || item.lab) : item.lab;
        const supervisor = language === 'ja' ? (item.supervisor_ja || item.supervisor) : item.supervisor;
        const dissertation = language === 'ja' ? (item.dissertation_ja || item.dissertation) : item.dissertation;
        const metaRows = [
          lab
            ? `<div class="edu-tl-row"><span class="edu-tl-key">${escapeHtml(t('education.lab', language))}</span><span class="edu-tl-val">${escapeHtml(lab)}</span></div>`
            : '',
          supervisor
            ? `<div class="edu-tl-row"><span class="edu-tl-key">${escapeHtml(t('education.supervisor', language))}</span><span class="edu-tl-val">${escapeHtml(supervisor)}</span></div>`
            : '',
          dissertation
            ? `<div class="edu-tl-row"><span class="edu-tl-key">${escapeHtml(t('education.dissertation', language))}</span><span class="edu-tl-thesis">${escapeHtml(dissertation)}</span></div>`
            : ''
        ].filter(Boolean).join('');

        return `
          <article class="edu-tl-item">
            <div class="edu-tl-dot"></div>
            <div class="edu-tl-card">
              <div class="edu-tl-period">${escapeHtml(item.period)}</div>
              <div class="edu-tl-degree">${escapeHtml(degree)}</div>
              <div class="edu-tl-school">${escapeHtml(school)}</div>
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
    };

    renderEducation();
    window.addEventListener('site:languagechange', renderEducation);
  } catch (error) {
    console.warn(error);
  }
})();
