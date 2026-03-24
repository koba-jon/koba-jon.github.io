function buildPubItem(p) {
  const badges = (p.first_author ? '<span class="pub-badge">First Author</span>' : '')
               + (p.award ? '<span class="pub-badge award-badge">' + p.award + '</span>' : '')
               + (p.acceptance_rate ? '<span class="pub-badge acceptance-rate-badge">Acceptance Rate: ' + p.acceptance_rate + '%</span>' : '');
  return '<div class="pub-item">'
       + '<span class="pub-year">' + p.year + '</span>'
       + '<div>'
       + '<div class="pub-title">' + p.title + badges + '</div>'
       + '<div class="pub-authors">' + p.authors + '</div>'
       + '<div class="pub-venue">' + p.venue + '</div>'
       + '</div></div>';
}

function switchTab(id, btn) {
  document.querySelectorAll('.pub-list').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.pub-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

(async function () {
  try {
    const [journal, intl, domestic, metrics] = await Promise.all([
      fetch('data/publications-journal.json').then(r => r.json()),
      fetch('data/publications-international.json').then(r => r.json()),
      fetch('data/publications-domestic.json').then(r => r.json()),
      fetch('data/metrics.json').then(r => r.json()),
    ]);

    const allFirst = [...journal, ...intl, ...domestic].filter(p => p.first_author).length;

    document.getElementById('stat-journal').textContent  = journal.length;
    document.getElementById('stat-intl').textContent     = intl.length;
    document.getElementById('stat-domestic').textContent = domestic.length;
    document.getElementById('stat-first').textContent    = allFirst;
    document.getElementById('stat-citations').textContent = metrics.citations ?? '—';

    document.getElementById('tab-count-journal').textContent  = journal.length;
    document.getElementById('tab-count-intl').textContent     = intl.length;
    document.getElementById('tab-count-domestic').textContent = domestic.length;

    document.getElementById('tab-journal').innerHTML  = journal.map(buildPubItem).join('');
    document.getElementById('tab-intl').innerHTML     = intl.map(buildPubItem).join('');
    document.getElementById('tab-domestic').innerHTML = domestic.map(buildPubItem).join('');
  } catch (e) {
    document.getElementById('tab-journal').innerHTML =
      '<p style="color:var(--ink-soft);padding:16px 0;">データを読み込めませんでした。</p>';
  }
})();
