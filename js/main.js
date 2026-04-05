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
const SITE_BASE_URL = 'https://koba-jon.github.io/';
const DEFAULT_SOCIAL_IMAGE = 'images/profile.jpg';

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
          ${links.map(([label, href]) => `
            <a href="${href}" class="hero-link" target="_blank" rel="noopener noreferrer">${label}</a>
          `).join('')}
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

function upsertMetaTag(key, value, isProperty = false) {
  const attrName = isProperty ? 'property' : 'name';
  const selector = `meta[${attrName}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

function upsertLinkTag(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function setSeoMeta(profile, currentPage, pageTitle, pageDescription) {
  const pagePath = `${currentPage || 'index'}.html`;
  const canonicalUrl = absolutePageUrl(pagePath);
  const siteName = `${profile.name}`;
  const socialImage = absolutePageUrl(DEFAULT_SOCIAL_IMAGE);
  const seoTitle = `${pageTitle} | ${profile.name}`;

  upsertMetaTag('description', pageDescription);
  upsertMetaTag('robots', 'index,follow');
  upsertLinkTag('canonical', canonicalUrl);

  upsertMetaTag('og:type', 'website', true);
  upsertMetaTag('og:site_name', siteName, true);
  upsertMetaTag('og:title', seoTitle, true);
  upsertMetaTag('og:description', pageDescription, true);
  upsertMetaTag('og:url', canonicalUrl, true);
  upsertMetaTag('og:image', socialImage, true);

  upsertMetaTag('twitter:card', 'summary_large_image');
  upsertMetaTag('twitter:title', seoTitle);
  upsertMetaTag('twitter:description', pageDescription);
  upsertMetaTag('twitter:image', socialImage);
}

async function initSiteChrome() {
  const body = document.body;
  const pageTitle = body.dataset.pageTitle || '';
  const pageTagline = body.dataset.pageTagline || '';
  const pageDescription = body.dataset.pageDescription || '';
  const currentPage = body.dataset.page || 'index';
  const profile = await loadJson('data/profile.json');

  const header = document.getElementById('site-header');
  const nav = document.getElementById('site-nav');
  const footer = document.getElementById('site-footer');

  if (header) header.innerHTML = renderHero(profile, pageTitle || profile.name, pageTagline || profile.name);
  if (nav) nav.innerHTML = renderNav(currentPage);
  if (footer) footer.innerHTML = renderFooter(profile);

  document.documentElement.lang = 'en';
  document.title = `${pageTitle || profile.name} | ${profile.name}`;
  const resolvedDescription = pageDescription
    || profile.profile_summary?.[0]
    || `${profile.name} - ${profile.title}`;
  setSeoMeta(profile, currentPage, pageTitle || profile.name, resolvedDescription);
  setStructuredData('site-identity-jsonld', [
    buildPersonSchema(profile),
    buildWebsiteSchema(profile, pageTitle || profile.name, currentPage),
  ]);
  return { profile, currentPage };
}

function absolutePageUrl(path = '') {
  return new URL(path, SITE_BASE_URL).toString();
}

function buildPersonSchema(profile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: profile.name_ja || undefined,
    jobTitle: profile.title,
    worksFor: profile.company
      ? {
        '@type': 'Organization',
        name: profile.company,
        url: profile.company_url || undefined,
      }
      : undefined,
    sameAs: Object.values(profile.links || {}),
    url: absolutePageUrl('index.html'),
  };
}

function buildWebsiteSchema(profile, pageTitle, currentPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${profile.name} - ${pageTitle}`,
    url: absolutePageUrl(`${currentPage || 'index'}.html`),
    about: profile.research_areas || [],
    inLanguage: 'en',
  };
}

function setStructuredData(scriptId, payload) {
  const existing = document.getElementById(scriptId);
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.text = JSON.stringify(payload, null, 2);
  document.head.appendChild(script);
}

window.siteUtils = {
  escapeHtml,
  loadJson,
  initSiteChrome,
  setStructuredData,
  absolutePageUrl,
};
