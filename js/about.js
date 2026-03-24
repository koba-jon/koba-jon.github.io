(async function () {
  try {
    const profile = await fetch('data/profile.json').then(r => r.json());

    // Memberships
    const list = document.getElementById('memberships-list');
    if (list) {
      list.innerHTML = profile.memberships.map(m => '<li>' + m + '</li>').join('');
    }

    // Background
    const bg = document.getElementById('background-list');
    if (bg) {
      bg.innerHTML = profile.background.map(b =>
        '<div class="info-row">'
        + '<span class="info-key">' + b.period + '</span>'
        + '<span class="info-val">' + b.description + '</span>'
        + '</div>'
      ).join('');
    }

    // Research areas
    const tags = document.getElementById('research-areas');
    if (tags) {
      tags.innerHTML = profile.research_areas.map(t =>
        '<span class="tag">' + t + '</span>'
      ).join('');
    }
  } catch (e) {
    console.warn('Failed to load profile:', e);
  }
})();
