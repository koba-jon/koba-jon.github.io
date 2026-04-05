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
const ANALYTICS_CONFIG_PATH = 'data/analytics.json';

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
          <a href="${page.slug === 'index' ? '/' : page.file}" class="nav-link${page.slug === currentSlug ? ' current' : ''}">${page.label}</a>
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
  initLightAnalytics(currentPage);
  return { profile, currentPage };
}

async function loadAnalyticsConfig() {
  try {
    return await loadJson(ANALYTICS_CONFIG_PATH);
  } catch (error) {
    return null;
  }
}

function hasDoNotTrackEnabled() {
  return ['1', 'yes'].includes(String(navigator.doNotTrack || window.doNotTrack || '').toLowerCase());
}

function safeMetricKey(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function sendCountApiHit(namespace, key) {
  if (!namespace || !key) return;

  const encodedNamespace = encodeURIComponent(namespace);
  const encodedKey = encodeURIComponent(key);
  const compositeKey = encodeURIComponent(`${namespace}.${key}`);
  const endpoints = [
    `https://api.countapi.xyz/hit/${encodedNamespace}/${encodedKey}`,
    `https://countapi.xyz/hit/${encodedNamespace}/${encodedKey}`,
    `https://countapi.mileshilliard.com/api/v1/hit/${compositeKey}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        keepalive: true,
      });
      if (response.ok) return;
    } catch (error) {
      // Fallback to the next endpoint.
    }
  }
}

function shouldTrackNavigation(url, trackedPages) {
  if (url.origin !== window.location.origin) return null;
  const pathname = url.pathname.replace(/^\/+/, '');
  const match = trackedPages.find((page) => pathname === `${page}.html`);
  return match ? `nav.to-${safeMetricKey(match)}` : null;
}

function shouldTrackOutbound(url, currentPage, outboundPages) {
  if (!outboundPages.includes(currentPage)) return null;
  if (url.origin === window.location.origin) return null;
  return `${safeMetricKey(currentPage)}.outbound`;
}

async function initLightAnalytics(currentPage) {
  if (window.location.protocol === 'file:') return;
  if (hasDoNotTrackEnabled()) return;

  const config = await loadAnalyticsConfig();
  if (!config || config.enabled !== true || config.provider !== 'countapi') return;

  const namespace = config.namespace || window.location.hostname;
  sendCountApiHit(namespace, `page.${safeMetricKey(currentPage || 'index')}`);

  const trackNavigationTo = Array.isArray(config.trackNavigationTo) ? config.trackNavigationTo : [];
  const trackOutboundFrom = Array.isArray(config.trackOutboundFrom) ? config.trackOutboundFrom : [];

  document.addEventListener('click', (event) => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;

    try {
      const url = new URL(anchor.getAttribute('href'), window.location.href);
      const navMetric = shouldTrackNavigation(url, trackNavigationTo);
      if (navMetric) sendCountApiHit(namespace, navMetric);

      const outboundMetric = shouldTrackOutbound(url, currentPage, trackOutboundFrom);
      if (outboundMetric) sendCountApiHit(namespace, outboundMetric);
    } catch (error) {
      // no-op
    }
  });
}

function absolutePageUrl(path = '') {
  return new URL(path, SITE_BASE_URL).toString();
}

function parseGitHubRepoPath(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const [owner, repo] = parsed.pathname.replace(/^\/+/, '').split('/');
    if (!owner || !repo) return null;
    return `${owner}/${repo}`;
  } catch (error) {
    return null;
  }
}

function parseCompactCount(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/,/g, '').trim().toLowerCase();
  const match = normalized.match(/^([0-9]*\.?[0-9]+)\s*([kmb])?$/);
  if (!match) return null;

  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) return null;
  const multipliers = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
  const suffix = match[2];
  return Math.round(base * (suffix ? multipliers[suffix] : 1));
}

async function fetchShieldsRepoCount(repoPath, metric) {
  try {
    const response = await fetch(`https://img.shields.io/github/${metric}/${repoPath}.json`);
    if (!response.ok) throw new Error(`Shields API error: ${response.status}`);
    const payload = await response.json();
    const raw = typeof payload.value === 'string' ? payload.value : '';
    const cleaned = raw.replace(new RegExp(`^${metric}:\\s*`, 'i'), '');
    return parseCompactCount(cleaned);
  } catch (error) {
    console.warn(`Failed to load GitHub ${metric} for ${repoPath} via Shields`, error);
    return null;
  }
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
  parseGitHubRepoPath,
  fetchShieldsRepoCount,
};
