const ICONS = {
  research:    '🏆',
  review:      '📝',
  scholarship: '🎓',
};

function buildAwardCard(a, category) {
  const icon = ICONS[category] || '✦';
  const nameHtml = a.link
    ? '<a href="' + a.link + '" target="_blank" rel="noopener noreferrer">' + a.name + '</a>'
    : a.name;
  return '<div class="award-card">'
       + '<div class="award-icon">' + icon + '</div>'
       + '<div class="award-body">'
       + '<div class="award-name">' + nameHtml + '</div>'
       + '<div class="award-org">' + a.org + '</div>'
       + '</div>'
       + '<div class="award-date">' + a.date + '</div>'
       + '</div>';
}

(async function () {
  try {
    const aw = await fetch('data/awards.json').then(r => r.json());

    document.getElementById('count-research').textContent    = aw.research.length;
    document.getElementById('count-review').textContent      = aw.review.length;
    document.getElementById('count-scholarship').textContent = aw.scholarship.length;

    document.getElementById('list-research').innerHTML    = aw.research.map(a => buildAwardCard(a, 'research')).join('');
    document.getElementById('list-review').innerHTML      = aw.review.map(a => buildAwardCard(a, 'review')).join('');
    document.getElementById('list-scholarship').innerHTML = aw.scholarship.map(a => buildAwardCard(a, 'scholarship')).join('');
  } catch (e) {
    document.getElementById('list-research').innerHTML =
      '<p style="color:var(--ink-soft);padding:16px 0;">データを読み込めませんでした。</p>';
  }
})();
