document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { profile } = await window.siteUtils.initSiteChrome();

    const container = document.getElementById('affiliation-content');
    if (!container) return;

    const position = window.siteUtils.escapeHtml(profile.position || '');
    const company = window.siteUtils.escapeHtml(profile.company || '');
    const companyUrl = profile.company_url || '#';

    container.innerHTML = `
      <div class="meta-item">
        <span class="meta-label">Position</span>
        <span class="meta-value">${position}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Company</span>
        <span class="meta-value">
          <a href="${companyUrl}" target="_blank" rel="noopener noreferrer">${company}</a>
        </span>
      </div>
    `;
  } catch (error) {
    console.error('Failed to render home page:', error);
  }
});