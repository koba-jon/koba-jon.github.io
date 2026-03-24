(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

  const icons = { research: '🏆', review: '📝', scholarship: '🎓' };
  const buildCard = (award, category) => {
    const title = award.link
      ? `<a href="${award.link}" target="_blank" rel="noopener noreferrer">${escapeHtml(award.name)}</a>`
      : escapeHtml(award.name);
    return `
      <article class="award-card">
        <div class="award-icon">${icons[category] || '✦'}</div>
        <div class="award-body">
          <div class="award-name">${title}</div>
          <div class="award-org">${escapeHtml(award.org)}</div>
        </div>
        <div class="award-date">${escapeHtml(award.date)}</div>
      </article>
    `;
  };

  try {
    const data = await loadJson('data/awards.json');
    document.getElementById('count-research').textContent = data.research.length;
    document.getElementById('count-review').textContent = data.review.length;
    document.getElementById('count-scholarship').textContent = data.scholarship.length;
    document.getElementById('list-research').innerHTML = data.research.map((item) => buildCard(item, 'research')).join('');
    document.getElementById('list-review').innerHTML = data.review.map((item) => buildCard(item, 'review')).join('');
    document.getElementById('list-scholarship').innerHTML = data.scholarship.map((item) => buildCard(item, 'scholarship')).join('');
  } catch (error) {
    console.warn(error);
  }
})();
