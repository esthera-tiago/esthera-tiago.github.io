const I18N = {
  dict: {},
  current: null,
  default: 'en',
  key: 'esthera-lang'
};

const getBrowserLang = () => {
  try {
    const lang = navigator.language || navigator.userLanguage || '';
    const short = lang.slice(0, 2).toLowerCase();
    if (short === 'fr') return 'fr';
    if (short === 'en') return 'en';
    return 'en';
  } catch (e) {
    return 'en';
  }
};

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load ' + path);
  return res.json();
}

async function initI18n() {
  try {
    const [en, fr] = await Promise.all([
      loadJSON('./lang/en.json'),
      loadJSON('./lang/fr.json')
    ]);
    I18N.dict = { en, fr };

    const saved = localStorage.getItem(I18N.key);
    const initial = saved === 'fr' || saved === 'en' ? saved : getBrowserLang();
    I18N.current = initial;

    document.documentElement.setAttribute('lang', initial);
    applyTranslations();
    setupLangToggles();
  } catch (err) {
    console.warn('i18n init failed', err);
  }
}

function t(path) {
  if (!I18N.dict[I18N.current]) return path;
  return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : null), I18N.dict[I18N.current]) || path;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val === null) return;
    if (el.tagName === 'A' && el.hasAttribute('href') && el.getAttribute('href').startsWith('mailto')) {
      // keep href
    }
    el.textContent = val;
  });
  document.title = `${I18N.dict[I18N.current]?.hero?.name || 'Esthera Tiago'} | ${I18N.dict[I18N.current]?.brand || 'cute dev'}`;
}

function setupLangToggles() {
  const btns = document.querySelectorAll('[data-lang]');
  btns.forEach((b) => {
    const l = b.dataset.lang;
    b.setAttribute('aria-pressed', l === I18N.current ? 'true' : 'false');
    b.addEventListener('click', () => {
      if (I18N.current === l) return;
      I18N.current = l;
      localStorage.setItem(I18N.key, l);
      document.documentElement.setAttribute('lang', l);
      applyTranslations();
      setupLangToggles();
    });
  });
}

document.addEventListener('DOMContentLoaded', initI18n);
