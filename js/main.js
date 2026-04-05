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
const THEME_STORAGE_KEY = 'site-theme';
const LANGUAGE_STORAGE_KEY = 'site-language';
const SUPPORTED_LANGUAGES = ['en', 'ja'];
const UI_TEXT = {
  en: {
    nav: { index: 'Home', about: 'About', projects: 'Projects', publications: 'Publications', awards: 'Awards', education: 'Education', certifications: 'Certifications', contact: 'Contact' },
    themeToggleAria: 'Toggle dark mode',
    languageToggleAria: 'Switch language',
    languageToggleText: '日本語',
    themeDark: 'Dark',
    themeLight: 'Light',
    'home.overview': 'Overview',
    'home.selectedPublications': 'Selected Publications',
    'home.featuredProject': 'Featured Project',
    'home.journalPapers': 'Journal Papers',
    'home.intlConf': "Int'l Conf.",
    'home.domesticConf': 'Domestic Conf.',
    'home.awards': 'Awards',
    'home.affiliation': 'Affiliation',
    'home.visitorCounter': 'Visitor Counter',
    'home.thanks': 'Thank you for visiting this page.',
    'home.totalVisits': 'Total visits',
    'home.quickLinks': 'Quick Links',
    'home.position': 'Position',
    'home.company': 'Company',
    'home.noSelectedPublications': 'No selected publications are configured yet.',
    'home.noFeaturedProjects': 'No featured projects are configured yet.',
    'home.viewOnGithub': 'View on GitHub →',
    'about.profileSummary': 'Profile Summary',
    'about.downloadCv': 'Download CV',
    'about.affiliation': 'Affiliation',
    'about.memberships': 'Professional Memberships',
    'about.background': 'Background',
    'about.researchAreas': 'Research Areas',
    'about.current': 'Current',
    'about.since': 'Since',
    'projects.noResearch': 'No research projects match the current filters.',
    'projects.noOpenSource': 'No open-source projects match the current filters.',
    'projects.showingAll': 'Showing all {total} projects.',
    'projects.showingFiltered': 'Showing {filtered} of {total} projects.',
    'projects.viewOnGithub': 'View on GitHub →',
    'education.lab': 'Lab',
    'education.supervisor': 'Supervisor',
    'education.dissertation': 'Dissertation',
  },
  ja: {
    nav: { index: 'ホーム', about: 'プロフィール', projects: 'プロジェクト', publications: '論文', awards: '受賞', education: '学歴', certifications: '資格', contact: '連絡先' },
    themeToggleAria: 'ダークモードを切り替え',
    languageToggleAria: '言語を切り替え',
    languageToggleText: 'English',
    themeDark: 'ダーク',
    themeLight: 'ライト',
    'home.overview': '概要',
    'home.selectedPublications': '主要論文',
    'home.featuredProject': '注目プロジェクト',
    'home.journalPapers': '学術論文',
    'home.intlConf': '国際会議',
    'home.domesticConf': '国内会議',
    'home.awards': '受賞',
    'home.affiliation': '所属',
    'home.visitorCounter': '訪問カウンター',
    'home.thanks': 'ご訪問ありがとうございます。',
    'home.totalVisits': '累計訪問数',
    'home.quickLinks': 'クイックリンク',
    'home.position': '職位',
    'home.company': '所属先',
    'home.noSelectedPublications': '主要論文はまだ設定されていません。',
    'home.noFeaturedProjects': '注目プロジェクトはまだ設定されていません。',
    'home.viewOnGithub': 'GitHubで見る →',
    'about.profileSummary': 'プロフィール概要',
    'about.downloadCv': 'CVをダウンロード',
    'about.affiliation': '所属',
    'about.memberships': '所属学会',
    'about.background': '経歴',
    'about.researchAreas': '研究分野',
    'about.current': '現在',
    'about.since': '着任',
    'projects.noResearch': '現在のフィルターに一致する研究プロジェクトはありません。',
    'projects.noOpenSource': '現在のフィルターに一致するオープンソースプロジェクトはありません。',
    'projects.showingAll': '全 {total} 件のプロジェクトを表示中。',
    'projects.showingFiltered': '{total} 件中 {filtered} 件を表示中。',
    'projects.viewOnGithub': 'GitHubで見る →',
    'education.lab': '研究室',
    'education.supervisor': '指導教員',
    'education.dissertation': '学位論文',
  },
};

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

function getCurrentLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(savedLanguage)) return savedLanguage;
  const browserLanguage = (navigator.language || '').toLowerCase();
  return browserLanguage.startsWith('ja') ? 'ja' : 'en';
}

function t(key, lang = getCurrentLanguage()) {
  const locale = UI_TEXT[lang] ? lang : 'en';
  const fallbackLocale = locale === 'en' ? 'ja' : 'en';
  const resolveKey = (dictionary, dottedKey) => dottedKey
    .split('.')
    .reduce((value, segment) => (value && typeof value === 'object' ? value[segment] : undefined), dictionary);
  return resolveKey(UI_TEXT[locale], key)
    || resolveKey(UI_TEXT[fallbackLocale], key)
    || key;
}

function formatMessage(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (key in values ? String(values[key]) : `{${key}}`));
}

function renderNav(currentSlug, lang) {
  return `
    <nav>
      <div class="nav-inner">
        ${SITE_PAGES.map(page => `
          <a href="${page.slug === 'index' ? '/' : page.file}" class="nav-link${page.slug === currentSlug ? ' current' : ''}">${escapeHtml(t(`nav.${page.slug}`, lang))}</a>
        `).join('')}
        <button class="theme-toggle language-toggle" id="language-toggle" type="button" aria-label="${escapeHtml(t('languageToggleAria', lang))}">
          <span class="theme-toggle-text">${escapeHtml(t('languageToggleText', lang))}</span>
        </button>
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="${escapeHtml(t('themeToggleAria', lang))}" aria-pressed="false">
          <span class="theme-toggle-icon" aria-hidden="true">◐</span>
          <span class="theme-toggle-text">Dark</span>
        </button>
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

function setSeoMeta(profile, currentPage, pageTitle, pageDescription, pageImagePath = '') {
  const pagePath = `${currentPage || 'index'}.html`;
  const canonicalUrl = absolutePageUrl(pagePath);
  const siteName = `${profile.name}`;
  const socialImage = absolutePageUrl(pageImagePath || DEFAULT_SOCIAL_IMAGE);
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

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return getSystemTheme();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const isDark = theme === 'dark';
  toggle.setAttribute('aria-pressed', String(isDark));
  const lang = getCurrentLanguage();
  const label = isDark ? t('themeLight', lang) : t('themeDark', lang);
  const text = toggle.querySelector('.theme-toggle-text');
  if (text) text.textContent = label;
}


function translateStaticContent(lang) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key, lang);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    element.setAttribute('placeholder', t(key, lang));
  });
}

function applyLanguage(lang) {
  const body = document.body;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  document.documentElement.lang = lang;

  const pageTitle = (lang === 'ja' ? body.dataset.pageTitleJa : body.dataset.pageTitle) || body.dataset.pageTitle || '';
  const profileName = body.dataset.profileName || '';
  if (pageTitle) document.title = profileName ? `${pageTitle} | ${profileName}` : pageTitle;

  translateStaticContent(lang);
  const languageToggle = document.getElementById('language-toggle');
  if (languageToggle) {
    languageToggle.setAttribute('aria-label', t('languageToggleAria', lang));
    const text = languageToggle.querySelector('.theme-toggle-text');
    if (text) text.textContent = t('languageToggleText', lang);
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.setAttribute('aria-label', t('themeToggleAria', lang));
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  window.dispatchEvent(new CustomEvent('site:languagechange', { detail: { lang } }));
}

function initLanguageToggle() {
  const toggle = document.getElementById('language-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = getCurrentLanguage();
    const next = current === 'ja' ? 'en' : 'ja';
    applyLanguage(next);
  });
}

function initThemeToggle() {
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

async function initSiteChrome() {
  const body = document.body;
  const pageTitle = body.dataset.pageTitle || '';
  const pageTagline = body.dataset.pageTagline || '';
  const pageDescription = body.dataset.pageDescription || '';
  const currentPage = body.dataset.page || 'index';
  const pageImage = body.dataset.pageImage || '';
  const profile = await loadJson('data/profile.json');

  const header = document.getElementById('site-header');
  const nav = document.getElementById('site-nav');
  const footer = document.getElementById('site-footer');

  if (header) header.innerHTML = renderHero(profile, pageTitle || profile.name, pageTagline || profile.name);
  const language = getCurrentLanguage();
  if (nav) nav.innerHTML = renderNav(currentPage, language);
  if (footer) footer.innerHTML = renderFooter(profile);
  body.dataset.profileName = profile.name;
  initLanguageToggle();
  initThemeToggle();

  applyLanguage(language);
  const resolvedDescription = pageDescription
    || profile.profile_summary?.[0]
    || `${profile.name} - ${profile.title}`;
  const localizedTitle = (language === 'ja' ? body.dataset.pageTitleJa : pageTitle) || pageTitle || profile.name;
  const localizedDescription = (language === 'ja' ? body.dataset.pageDescriptionJa : pageDescription) || pageDescription;
  setSeoMeta(profile, currentPage, localizedTitle || profile.name, localizedDescription || resolvedDescription, pageImage);
  setStructuredData('site-identity-jsonld', [
    buildPersonSchema(profile),
    buildWebsiteSchema(profile, localizedTitle || profile.name, currentPage, language),
  ]);
  initLightAnalytics(currentPage);
  return { profile, currentPage, language, t, applyLanguage };
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

function buildWebsiteSchema(profile, pageTitle, currentPage, language = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${profile.name} - ${pageTitle}`,
    url: absolutePageUrl(`${currentPage || 'index'}.html`),
    about: profile.research_areas || [],
    inLanguage: language,
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
  getCurrentLanguage,
  t,
  formatMessage,
};
