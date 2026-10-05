(function () {
  const grid = document.querySelector('[data-projects-grid]');
  const filterWrap = document.querySelector('[data-project-filters]');
  if (!grid) return;

  const statusLabel = {
    active: { en: 'In production', fr: 'En production' },
    archived: { en: 'Archived', fr: 'Archivé' },
    concept: { en: 'Concept', fr: 'Concept' }
  };

  fetch('./data/projects.json')
    .then(r => r.json())
    .then(render)
    .catch(err => {
      console.warn('projects load failed', err);
      grid.innerHTML = '<p style="color:var(--text-muted)">Could not load projects.</p>';
    });

  function render(list) {
    grid.innerHTML = '';
    const tags = new Set(['all']);
    list.forEach(p => p.tags.forEach(t => tags.add(t)));

    if (filterWrap) {
      filterWrap.innerHTML = '';
      Array.from(tags).sort().forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.dataset.tag = tag;
        btn.setAttribute('aria-pressed', tag === 'all' ? 'true' : 'false');
        btn.textContent = tag === 'all' ? (I18N.current === 'fr' ? 'Tous' : 'All') : tag;
        btn.addEventListener('click', () => {
          filterWrap.querySelectorAll('.filter-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', 'true');
          filter();
        });
        filterWrap.appendChild(btn);
      });
    }

    function filter() {
      const active = filterWrap ? filterWrap.querySelector('.filter-chip[aria-pressed="true"]')?.dataset.tag : 'all';
      grid.innerHTML = '';
      list.filter(p => active === 'all' || p.tags.includes(active)).forEach(card => grid.appendChild(makeCard(card)));
    }

    list.forEach(card => grid.appendChild(makeCard(card)));
  }

  function makeCard(p) {
    const el = document.createElement('article');
    el.className = 'project-card reveal';
    el.setAttribute('data-tags', p.tags.join(','));
    const statusKey = p.status || 'concept';
    const statusText = (I18N.dict[I18N.current]?.projects && I18N.dict[I18N.current].projects[statusKey === 'active' ? 'statusActive' : statusKey === 'archived' ? 'statusArchived' : 'statusConcept']) || statusLabel[statusKey]?.en || statusKey;

    el.innerHTML = `
      <div class="project-card__body">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-xs)">
          <h3 class="project-card__title">${escapeHtml(p.name)}</h3>
          <span class="project-card__status">${escapeHtml(statusText)}</span>
        </div>
        <div class="project-card__block">
          <span class="project-card__label" data-i18n="projects.problem">Problem</span>
          <p class="project-card__text">${escapeHtml(p.problem)}</p>
        </div>
        <div class="project-card__block">
          <span class="project-card__label" data-i18n="projects.role">My role</span>
          <p class="project-card__text">${escapeHtml(p.role)}</p>
        </div>
        <div class="project-card__block">
          <span class="project-card__label" data-i18n="projects.stack">Stack</span>
          <div class="project-card__tags">
            ${(p.stack || []).map(s => `<span class="project-card__tag">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>
        <div class="project-card__block">
          <span class="project-card__label" data-i18n="projects.links">Links</span>
          <div class="project-card__links">
            ${p.live ? `<a href="${escapeAttr(p.live)}" target="_blank" rel="noopener" data-i18n="projects.live">Live demo</a>` : ''}
            ${p.repo ? `<a href="${escapeAttr(p.repo)}" target="_blank" rel="noopener" data-i18n="projects.repo">Git repo</a>` : ''}
          </div>
        </div>
      </div>
    `;
    return el;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }
  function escapeAttr(s) {
    return (s || '').replace(/"/g, '&quot;');
  }
})();
