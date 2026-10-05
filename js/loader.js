(function () {
  const loader = document.querySelector('[data-loader]');
  const skipBtn = document.querySelector('[data-loader-skip]');
  const STORAGE_KEY = 'esthera-loader-seen-v1';

  function hideLoader() {
    if (!loader) return;
    loader.classList.add('cat-loader--hidden');
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 260);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function shouldShow() {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return false;
    } catch (e) {}
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return false;
    return true;
  }

  function init() {
    if (!loader || !shouldShow()) {
      if (loader) {
        loader.classList.add('cat-loader--hidden');
        setTimeout(() => loader.remove(), 10);
      }
      return;
    }
    const min = 1200;
    const max = 2000;
    const t = Math.floor(Math.random() * (max - min + 1)) + min;
    window.__loaderTimer = setTimeout(hideLoader, t);
    if (skipBtn) skipBtn.addEventListener('click', () => { clearTimeout(window.__loaderTimer); hideLoader(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { clearTimeout(window.__loaderTimer); hideLoader(); } }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
