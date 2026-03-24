function buildEduItem(e) {
  return '<div class="edu-tl-item">'
       + '<div class="edu-tl-dot"></div>'
       + '<div class="edu-tl-card">'
       + '<div class="edu-tl-period">' + e.period + '</div>'
       + '<div class="edu-tl-degree">' + e.degree + '</div>'
       + '<div class="edu-tl-school">' + e.school + '</div>'
       + '<div class="edu-tl-divider"></div>'
       + '<div class="edu-tl-meta">'
       + '<div class="edu-tl-row"><span class="edu-tl-key">Lab</span><span class="edu-tl-val">' + e.lab + '</span></div>'
       + '<div class="edu-tl-row"><span class="edu-tl-key">Supervisor</span><span class="edu-tl-val">' + e.supervisor + '</span></div>'
       + '<div class="edu-tl-row"><span class="edu-tl-key">Dissertation</span><span class="edu-tl-thesis">' + e.dissertation + '</span></div>'
       + '</div>'
       + '</div></div>';
}

(async function () {
  try {
    const edu = await fetch('data/education.json').then(r => r.json());
    document.getElementById('edu-timeline').innerHTML = edu.map(buildEduItem).join('');
  } catch (e) {
    console.warn('Failed to load education:', e);
  }
})();
