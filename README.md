<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo%20assets%20nd%20others/declic-dark-wordmark.png">
  <img src="assets/logo%20assets%20nd%20others/declic-wordmark.png" alt="Déclic" width="360">
</picture>

- **Déclic** — a hackathon prototype helping French students explore higher education and education professionals explain admissions decisions and coordinate teaching cover.
- **Presentation:** watch the English launch film below.

https://github.com/user-attachments/assets/5911716e-0f48-4c56-95e4-8f1ed4c0d590

- **Project history:** [Changelog](CHANGELOG.md).
- **Stack:** React, TypeScript, Vite, Tailwind CSS, Node.js, Express and SQLite.
- **Languages:** French and English; the browser language selects the initial version, and a manual choice is remembered.
- **Welcome:** watch the presentation in the selected language, try the labelled ENT-prefill demonstration, or complete a profile manually.
- **Explore:** search the official Parcoursup catalogue, filter by region, save programmes, compare up to four and open their official listings.
- **Understand:** programme details include available historical admissions figures, labelled by session and matched to the institution; missing values remain unavailable.
- **Map:** explore French regions, coloured departments, overseas territories and French campuses abroad, with clustered sites and optional device location.
- **Profile and CV:** edit seven CV sections, reorder entries, preview changes and print or save an A4 PDF.
- **Achievements:** add diploma and award images, edit their details and optionally request French/English OCR title suggestions on the device.
- **Admissions workspace:** create fictional applications, record criteria and evidence, publish explained decisions and answer student clarification requests.
- **Teaching cover:** manage needs and availabilities, check compatibility and overlapping assignments, confirm or cancel cover and record completed hours.
- **Interface:** illustrated subject cards, a liquid-glass carousel, pauseable automatic scrolling, keyboard controls, accessible checkboxes and calendars, and searchable collapsible navigation.
- **Persistence:** profiles, CVs, favourites, uploads and demonstration workflows are saved in isolated visitor workspaces in SQLite.
- **Professional access:** server-checked passwords, HttpOnly sessions, rate limiting and logout; optional OIDC/PKCE integration requires an authorised institutional provider.
- **Prototype limits:** ENT prefill is simulated. Institutional workflows use fictional records; official application submission, real recruitment checks, notifications and payroll are not connected.
- **Public data:** [Ministry programme catalogue](https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-cartographie_formations_parcoursup/) and [admissions history](https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup/); attribution, retrieval dates and stale-cache notices appear in the app.
- **Run locally:** use Node.js 24, install with `npm ci`, then start with `npm run dev`; open [localhost:4173](http://127.0.0.1:4173/#connexion).
- **Configure:** copy `.env.example` to `.env`; use fictional personal records while testing. Generate a professional password hash with `npm run staff:password`.
- **Build and run:** run `npm run build`, set production values including `NODE_ENV=production` and the public HTTPS `APP_ORIGIN`, then run `npm start`.
- **Deploy:** run the Node/Express application with one persistent SQLite instance; configure `PORT`, `HOST` and `DECLIC_DB` for the host. See [deployment settings](DEPLOYMENT.md).
- **Check:** `npm run check`, `npm test` and `npm run build`; the regression suite covers persistence, permissions, uploads, admissions, scheduling, geography and translation.
- **Source:** `src/` contains the interface; `server/` the API; `shared/` models and validation; `tests/` regression checks; `assets/` application media and third-party notices.
