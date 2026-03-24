(async function () {
  try {
    const [journal, intl, domestic, awards, metrics] = await Promise.all([
      fetch('data/publications-journal.json').then(r => r.json()),
      fetch('data/publications-international.json').then(r => r.json()),
      fetch('data/publications-domestic.json').then(r => r.json()),
      fetch('data/awards.json').then(r => r.json()),
      fetch('data/metrics.json').then(r => r.json()),
    ]);

    document.getElementById('stat-journal').textContent  = journal.length;
    document.getElementById('stat-intl').textContent     = intl.length;
    document.getElementById('stat-domestic').textContent = domestic.length;

    const totalAwards = Object.values(awards).reduce((s, a) => s + a.length, 0);
    document.getElementById('stat-awards').textContent = totalAwards;
  } catch (e) {
    console.warn('Failed to load stats:', e);
  }
})();
