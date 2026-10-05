// =========================================================================
// Theme handling — no-flash, respects prefers-color-scheme, persists choice
// =========================================================================

(function () {
  try {
    const storageKey = 'esthera-theme';
    const root = document.documentElement;
    const saved = localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = saved || (prefersDark ? 'dark' : 'light');
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    window.__setTheme = function (t) {
      const next = t === 'dark' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      root.style.colorScheme = next;
      localStorage.setItem(storageKey, next);
      return next;
    };
    window.__getTheme = function () {
      return root.getAttribute('data-theme') || 'light';
    };
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
