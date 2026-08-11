const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  html.setAttribute('data-theme', savedTheme);
}

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', current);
  localStorage.setItem('theme', current);
});

const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

document.querySelectorAll('.nav__link').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
  });
});

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

function highlightNav() {
  const scrollPos = window.scrollY + 120;
  let currentId = '';

  sections.forEach((section) => {
    if (scrollPos >= section.offsetTop) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
  });
}

window.addEventListener('scroll', highlightNav);
highlightNav();

const header = document.getElementById('header');
function addHeaderShadow() {
  header.classList.toggle('header--scrolled', window.scrollY > 10);
}
window.addEventListener('scroll', addHeaderShadow);

const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.skill-card__fill');
        fill.style.width = fill.dataset.width + '%';
        skillObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll('.skill-card').forEach((el) => skillObserver.observe(el));
