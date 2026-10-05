# esthera-tiago.github.io

Cozy, cute, lo-fi dev portfolio for Esthera Tiago. Vanilla HTML/CSS/JS, no build step. Deployed to GitHub Pages at [esthera-tiago.me](https://esthera-tiago.me/) via CNAME.

## Files
- css/tokens.css — colour tokens (light/dark), spacing, radii
- css/base.css — resets, typography, layout
- css/components.css — UI components, animations
- js/theme.js — theme toggle (localStorage + prefers-color-scheme, no flash)
- js/i18n.js — EN/FR via data-i18n, persists choice
- js/loader.js — cat loader, once-per-session, skippable, reduced-motion aware
- js/projects.js — renders from data/projects.json with tag filter
- data/projects.json — project list
- lang/en.json, lang/fr.json — translations
- assets/ — profile/main/secondary.jpeg + cats/*.svg
- index.html — single page

## Edit content
- Text: update lang/en.json and lang/fr.json keys (used by data-i18n).
- Projects: edit data/projects.json (id, name, status active|archived|concept, tags[], live, repo, problem, role, stack[]).
- Skills: edit HTML in #skills .skill-pill spans.
- Certificates: edit .cert-card blocks in #certifications.
- Experience: edit timeline cards in #experience.

## Add a project
1. Add entry to data/projects.json. Keep schema consistent (problem/role/stack/links).
2. If new tag appears, filter updates automatically.
3. Commit and push; Pages will rebuild.

## Local preview
Open index.html in a browser, or use `python3 -m http.server 8000` and visit http://localhost:8000.

## Notes
- Do NOT edit CNAME.
- Never invent personal facts. Use TODO placeholders if missing.
- Accessible: semantic HTML, focus visible, prefers-reduced-motion respected.
