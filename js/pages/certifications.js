(async function () {
  const { loadJson, initSiteChrome, escapeHtml, getCurrentLanguage } = window.siteUtils;
  await initSiteChrome();

  const icons = {
    computer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    neural: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="7" x2="12" y2="7"/><line x1="5" y1="7" x2="12" y2="17"/><line x1="5" y1="17" x2="12" y2="7"/><line x1="5" y1="17" x2="12" y2="17"/><line x1="12" y1="7" x2="19" y2="12"/><line x1="12" y1="17" x2="19" y2="12"/><circle cx="5" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="5" cy="17" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="2" fill="currentColor" stroke="none"/></svg>`,
  };

  try {
    const items = await loadJson('data/certifications.json');
    const renderCertifications = () => {
      const language = getCurrentLanguage();
      document.getElementById('cert-grid').innerHTML = items.map((item) => {
        const name = language === 'ja' ? (item.name_ja || item.name) : item.name;
        const issuer = language === 'ja' ? (item.issuer_ja || item.issuer) : item.issuer;
        return `
      <article class="cert-card">
        <div class="cert-icon">${icons[item.icon] || icons.computer}</div>
        <div class="cert-body">
          <div class="cert-name">${escapeHtml(name)}</div>
          <div class="cert-issuer">${escapeHtml(issuer)}</div>
        </div>
        <div class="cert-date-badge">${escapeHtml(item.date)}</div>
      </article>
    `;
      }).join('');
    };
    renderCertifications();
    window.addEventListener('site:languagechange', renderCertifications);
  } catch (error) {
    console.warn(error);
  }
})();
