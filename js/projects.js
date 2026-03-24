(async function () {
  try {
    const data = await fetch('data/projects.json').then(r => r.json());

    const researchGrid  = document.querySelector('#research-projects .projects-grid');
    const opensrcGrid   = document.querySelector('#opensource-projects .projects-grid');

    function buildCard(p) {
      const imgHtml = p.image
        ? '<div class="project-image-center"><img src="' + p.image + '" alt="' + p.title + '" class="project-img2"></div>'
        : '';
      const tagClass = p.tag_type === 'research' ? 'project-tag-research' : 'project-tag';
      const descHtml = p.description.map(d => '<p class="project-desc">' + d + '</p>').join('');
      return '<div class="project-card">'
           + imgHtml
           + '<div class="project-body">'
           + '<span class="' + tagClass + '">' + p.tag + '</span>'
           + '<h2 class="project-title">' + p.title + '</h2>'
           + descHtml
           + '<a href="' + p.link + '" class="project-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>'
           + '</div></div>';
    }

    researchGrid.innerHTML = data.research.map(buildCard).join('');
    opensrcGrid.innerHTML  = data.opensource.map(buildCard).join('');

    document.getElementById('research-count').textContent  = data.research.length;
    document.getElementById('opensource-count').textContent = data.opensource.length;
    document.getElementById('total-count').textContent     = data.research.length + data.opensource.length;
  } catch (e) {
    console.warn('Failed to load projects:', e);
  }
})();
