(async function () {
  const { loadJson, initSiteChrome, escapeHtml } = window.siteUtils;
  await initSiteChrome();

  try {
    const data = await loadJson('assets/data/projects.json');

    const buildCard = (project) => {
      const imageHtml = project.image
        ? `<div class="project-image-center"><img src="${project.image}" alt="${escapeHtml(project.title)}" class="project-img2"></div>`
        : '';
      const tagClass = project.tag_type === 'research' ? 'project-tag-research' : 'project-tag';
      const descriptions = project.description
        .map((line) => `<p class="project-desc">${escapeHtml(line)}</p>`)
        .join('');

      return `
        <article class="project-card">
          ${imageHtml}
          <div class="project-body">
            <span class="${tagClass}">${escapeHtml(project.tag)}</span>
            <h2 class="project-title">${escapeHtml(project.title)}</h2>
            ${descriptions}
            <a href="${project.link}" class="project-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
          </div>
        </article>
      `;
    };

    document.querySelector('#research-projects .projects-grid').innerHTML = data.research.map(buildCard).join('');
    document.querySelector('#opensource-projects .projects-grid').innerHTML = data.opensource.map(buildCard).join('');
    document.getElementById('research-count').textContent = data.research.length;
    document.getElementById('opensource-count').textContent = data.opensource.length;
    document.getElementById('total-count').textContent = data.research.length + data.opensource.length;
  } catch (error) {
    console.warn(error);
  }
})();
