const CERT_ICONS = {
  computer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>`,
  neural: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="7"  x2="12" y2="7"/>
    <line x1="5" y1="7"  x2="12" y2="17"/>
    <line x1="5" y1="17" x2="12" y2="7"/>
    <line x1="5" y1="17" x2="12" y2="17"/>
    <line x1="12" y1="7"  x2="19" y2="12"/>
    <line x1="12" y1="17" x2="19" y2="12"/>
    <circle cx="5"  cy="7"  r="2" fill="var(--accent)" stroke="none"/>
    <circle cx="5"  cy="17" r="2" fill="var(--accent)" stroke="none"/>
    <circle cx="12" cy="7"  r="2" fill="var(--accent)" stroke="none"/>
    <circle cx="12" cy="17" r="2" fill="var(--accent)" stroke="none"/>
    <circle cx="19" cy="12" r="2" fill="var(--accent)" stroke="none"/>
  </svg>`,
};

function buildCertCard(c) {
  const iconSvg = CERT_ICONS[c.icon] || CERT_ICONS.computer;
  return '<div class="cert-card">'
       + '<div class="cert-icon">' + iconSvg + '</div>'
       + '<div class="cert-body">'
       + '<div class="cert-name">' + c.name + '</div>'
       + '<div class="cert-issuer">' + c.issuer + '</div>'
       + '</div>'
       + '<div class="cert-date-badge">' + c.date + '</div>'
       + '</div>';
}

(async function () {
  try {
    const certs = await fetch('data/certifications.json').then(r => r.json());
    document.getElementById('cert-grid').innerHTML = certs.map(buildCertCard).join('');
  } catch (e) {
    console.warn('Failed to load certifications:', e);
  }
})();
