(async function () {
  const { loadJson, initSiteChrome } = window.siteUtils;
  await initSiteChrome();

  try {
    const [profile, journal, intl, domestic, awards] = await Promise.all([
      loadJson('data/profile.json'),
      loadJson('data/publications-journal.json'),
      loadJson('data/publications-international.json'),
      loadJson('data/publications-domestic.json'),
      loadJson('data/awards.json'),
    ]);

    document.getElementById('stat-journal').textContent = journal.length;
    document.getElementById('stat-intl').textContent = intl.length;
    document.getElementById('stat-domestic').textContent = domestic.length;
    document.getElementById('stat-awards').textContent = Object.values(awards).reduce((s, arr) => s + arr.length, 0);

    const overview = document.getElementById('overview-text');
    overview.innerHTML = `
      <p>I am a computer vision researcher and AI engineer specializing in industrial anomaly detection, representation learning, and generative modeling. My work focuses on building practical and robust machine learning methods for visual inspection, especially in manufacturing environments where real defective data are limited.</p>
      <p>My research explores pseudo-defect generation, domain-specific pre-training, and feature modeling for anomaly detection, with the goal of improving both accuracy and generalization in real-world applications. I am particularly interested in bridging the gap between academic research and deployable AI systems.</p>
      <p>In addition to research, I actively develop deep learning implementations in both Python and C++, including large-scale open-source projects based on PyTorch and LibTorch.</p>
    `;

    document.getElementById('tag-cloud').innerHTML = profile.research_areas
      .slice(0, 6)
      .map((tag) => `<span class="tag">${window.siteUtils.escapeHtml(tag)}</span>`)
      .join('');
  } catch (error) {
    console.warn(error);
  }
})();
