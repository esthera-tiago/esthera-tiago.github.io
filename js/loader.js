(function () {
  const loader = document.querySelector('[data-loader]');
  const skipBtn = document.querySelector('[data-loader-skip]');
  const start = Date.now();

  function hideLoader() {
    if (!loader) return;
    if (loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    try {
      document.dispatchEvent(new CustomEvent('loader:done'));
    } catch (e) {}
    const remove = () => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    };
    loader.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 500);
  }

  function init() {
    if (!loader) return;
    // Prevent scroll while loader visible
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Reduced motion: remove SMIL animations and skip entrance animation
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mqReduce.matches) {
      const svg = loader.querySelector('svg');
      if (svg) {
        svg.querySelectorAll('animate').forEach((a) => a.remove());
      }
      // Ensure no entrance animation
      const svgEl = loader.querySelector('.cat-loader__svg');
      if (svgEl) {
        svgEl.style.animation = 'none';
        svgEl.style.opacity = '1';
        svgEl.style.transform = 'none';
      }
    }

    const minDelay = 1600;
    const failSafe = 8000;

    function tryHide() {
      const elapsed = Date.now() - start;
      if (elapsed < minDelay) {
        setTimeout(tryHide, minDelay - elapsed);
        return;
      }
      hideLoader();
    }

    if (document.readyState === 'complete') {
      tryHide();
    } else {
      window.addEventListener('load', tryHide, { once: true });
    }

    setTimeout(hideLoader, failSafe);

    /*
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        hideLoader();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideLoader();
      }
    }, { once: true });
    */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
