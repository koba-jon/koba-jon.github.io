const SITE_PAGES = [
  { slug: 'index', file: 'index.html', label: 'Home' },
  { slug: 'about', file: 'about.html', label: 'About' },
  { slug: 'projects', file: 'projects.html', label: 'Projects' },
  { slug: 'publications', file: 'publications.html', label: 'Publications' },
  { slug: 'awards', file: 'awards.html', label: 'Awards' },
  { slug: 'education', file: 'education.html', label: 'Education' },
  { slug: 'certifications', file: 'certifications.html', label: 'Certifications' },
  { slug: 'contact', file: 'contact.html', label: 'Contact' },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function renderHero(profile, pageTitle, pageTagline) {
  const links = [
    ['GitHub', profile.links.github],
    ['Qiita', profile.links.qiita],
    ['Hugging Face', profile.links.huggingface],
    ['LinkedIn', profile.links.linkedin],
    ['Google Scholar', profile.links.scholar],
  ];
  return `
    <header class="hero">
      <div class="hero-inner">
        <img src="images/profile.jpg" alt="${escapeHtml(profile.name)}" class="hero-avatar">
        <div class="hero-text">
          <div class="hero-label">${escapeHtml(profile.title)}</div>
          <h1 class="hero-name">${escapeHtml(pageTitle)}</h1>
          <p class="hero-tagline">${escapeHtml(pageTagline)}</p>
          <div class="hero-links">
            ${links.map(([label, href]) => `<a href="${href}" class="hero-link" target="_blank" rel="noopener noreferrer">${label}</a>`).join('')}
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderNav(currentSlug) {
  return `
    <nav>
      <div class="nav-inner">
        ${SITE_PAGES.map(page => `
          <a href="${page.file}" class="nav-link${page.slug === currentSlug ? ' current' : ''}">${page.label}</a>
        `).join('')}
      </div>
    </nav>
  `;
}

function renderFooter(profile) {
  return `&copy; ${escapeHtml(profile.name)} · ${escapeHtml(profile.title)} · ${escapeHtml(profile.position)} at ${escapeHtml(profile.company)}`;
}

async function initSiteChrome() {
  const body = document.body;
  const pageTitle = body.dataset.pageTitle || '';
  const pageTagline = body.dataset.pageTagline || '';
  const currentPage = body.dataset.page || 'index';
  const profile = await loadJson('assets/data/profile.json');

  const header = document.getElementById('site-header');
  const nav = document.getElementById('site-nav');
  const footer = document.getElementById('site-footer');

  if (header) header.innerHTML = renderHero(profile, pageTitle || profile.name, pageTagline || profile.name);
  if (nav) nav.innerHTML = renderNav(currentPage);
  if (footer) footer.innerHTML = renderFooter(profile);

  document.documentElement.lang = 'en';
  document.title = `${pageTitle || profile.name} | ${profile.name}`;
  return { profile, currentPage };
}

window.siteUtils = { escapeHtml, loadJson, initSiteChrome };
