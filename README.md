# Déclic

A hackathon application for French students and education professionals. Built with **React, TypeScript, Vite, Node.js, Express and SQLite**. The interface supports French and English and uses the supplied Déclic media kit. See [DEPLOYMENT.md](DEPLOYMENT.md) for DeployXA, configuration and institutional integration.

## Run

Use Node.js 22.13 or newer (tested with Node.js 25.2.1).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. The frontend and API share one server. The default page is `#connexion`; other routes include `#accueil`, `#cv`, `#dossier`, `#formations`, `#suivi`, `#decisions`, `#admissions` and `#remplacements`.

```sh
npm run build
npm start
```

The compiled app uses `dist/`, `dist-server/`, and the curated files in `assets/`. Run the commands from the project root. Vite adds no starter logo or watermark.

## What works

- Profile and CV editing, expandable CV sections, repeatable/reorderable entries, live preview, and A4 print / browser Save as PDF.
- Official programme search, region filtering, persistent favourites and comparison using public Parcoursup data. Interactive France map with region/department boundaries, zoom-dependent establishment clusters, overseas regions, and opt-in device location.
- CV diplomas and awards: image upload/drop, editable titles, organisations, dates, descriptions, previews, and optional local OCR suggestions.
- Server-protected institution access with hashed passwords, HttpOnly sessions, login throttling and logout. Visitor workspaces and images are isolated.
- Admissions: create a fictional application, record a criterion and evidence, save an explanation, then share the decision into the student view. Shared reviews are read-only.
- Clarification requests from the student view and staff replies.
- Replacements: record a need and candidate availability, mark a qualification as checked for the demo, find compatible availability, confirm an assignment, cancel a mission, and validate completed hours.
- Matching checks normalized subject and commune, date and time coverage, verification status and overlapping assignments. Hours cannot exceed the scheduled duration or be recorded before the end of the mission.
- Data survives a browser refresh and server restart.

There are no preloaded personal application, teacher-cover, decision or ranking records. The student ENT-prefill screen still imports editable starred placeholders. Institution password sign-in and private diploma images are real local functionality. The role selector changes screens; server sessions establish staff permissions. An optional OIDC backend supports institution-registered identity providers and pre-provisioned staff identities. No institution is connected by default. Qualification/background checks, official admissions submission, notifications and payments remain unconnected.

## Try the complete journeys

1. Complete a fictional profile, open **Mon CV**, expand a section, edit and save. Reload to verify persistence. Use **Imprimer / PDF** for the browser print dialog.
2. Select **Établissement**, sign in with your configured staff account, add a fictional candidature, select it, write a criterion, evidence and explanation, then save and share. Select **Élève → Mes décisions**, ask a question, and return to the admissions desk to answer it. If an ignored `data/local-staff-access.txt` was generated during development, it contains local-only credentials; never deploy that file.
3. In **Les remplacements**, create a need. In **Vivier & disponibilités**, add an availability with the same subject, commune and date and a covering time slot, then mark it verified for the demo. Select the need, search for a relay and confirm the assignment. Completed missions can have their hours recorded in **Heures effectuées**.

## Local storage

Development listens on `127.0.0.1` and stores data in `data/declic.sqlite`. `.env` is loaded when present; copy `.env.example` for a new installation. A visitor receives an opaque HttpOnly cookie; their profile, CV, favourites, images and fictional workflows are stored separately from other visitors. Staff sign-in authorises professional actions in that visitor's demonstration workspace. These are demonstration workflows, not a multi-institution records system. Clearing the visitor cookie loses browser access to that anonymous workspace; cross-device student accounts and recovery are not implemented. Use fictional personal records for the hackathon. Node may print an experimental warning for its built-in SQLite module.

Production binds to `0.0.0.0`, requires `APP_ORIGIN` to be the actual HTTPS origin, and uses Secure cookies. Deploy the Node/Express server or Docker image, not only the Vite `dist/` directory. Keep the SQLite file on one persistent volume with one app instance. `PORT`, `HOST` and `DECLIC_DB` are configurable. A newly selected database starts empty. See the deployment guide for exact settings.

## Checks

```sh
npm run check
npm test
npm run build
```

The tests use isolated databases and cover restart persistence, invalid writes, explained admissions, clarification replies, scheduling conflicts, cancellation, hour limits, cross-origin rejection, visitor isolation, staff sessions/revocation, upload ownership and pixel validation, institutional provisioning guards, regional location, map aggregation and OCR title suggestions.

## Project files

- `src/` — React screens, shared controls, and media-kit layout styles.
- `server/` — Express API and SQLite persistence.
- `shared/` — TypeScript models and validation.
- `tests/` — API and database workflow tests.
- `styles.css`, `superr.css` — inherited base theme and preserved sidebar.
- `assets/brand`, `assets/illustrations`, `assets/stickers`, `assets/marks`, `assets/fonts` — curated artwork and fonts. Original generated notebook: `assets/notebook-illustration.png`.

The original media kit is retained locally under `assets/Media kit/` as a design reference; the application does not depend on that export. `.gitignore` excludes it along with databases, dependencies, builds, local captures and `.impeccable/`. Image prompts are not generated or included in the application. Fraunces font licenses are kept with the fonts. A project software license has not yet been selected.

## Languages and official data

The FR / EN switch is available throughout Déclic, including the welcome page. On first visit, a French primary browser language selects French; every other or unknown primary language selects English. An explicit choice is remembered in browser storage. Changing language keeps entered CV text intact. Official programme names and source-provided descriptions stay in their original French; the surrounding interface and number/date formatting adapt to the selected language.

The explorer now reads the Ministry's public APIs through the local Express server:

- Catalogue: https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-cartographie_formations_parcoursup/
- Admissions history: https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup/

The latest published catalogue year and historical session are discovered from the APIs. At integration verification these were 2026 and 2025 respectively. Search, pagination, favourites (up to 100), comparison (up to four), real formation details and official listing links are connected. No API key is required. Favourites use `year:formation-code` identities; the former numbered placeholder favourites are ignored rather than mapped to real courses.

History is only shown for an exact formation-code AND institution-code match, with its session explicitly labelled. Missing values stay unavailable, distinct from a published zero. Historical capacity is not today's vacancies, and the published access rate is not a personal admission prediction. Apprenticeships may have no entry in the historical dataset. Detailed selection criteria, tuition and duration are linked to the official listing when absent from the available datasets; they are not generated or guessed.

The app shows the provider, dataset, retrieval date, available source processing date and Etalab Open Licence 2.0 attribution. API replies are cached in SQLite. Fresh catalogue queries are reused for 15 minutes; metadata for one hour. On an upstream outage, a previously retrieved copy up to 14 days old can be displayed with an explicit stale-data notice. Uncached failures show an error and Retry button. Official API pagination exposes the first 9,984 results in 24-record pages; refine the search for more specific results. Requests use fixed official API endpoints, validate input and escape query literals.

Public catalogue data is separate from personal demo dossiers. The public-data integration requires outbound HTTPS on the server. The map uses a compact all-results export of public institution fields, grouped by institution UAI and locality, rather than plotting each course as another institution. Clusters count geolocated establishment sites; missing coordinates stay in the list. Map requests are cached for one hour. Region and institution filters apply to the course list; favourites apply those filters locally. The map shows all matching public sites rather than a truncated 24-course page.

Administrative boundaries are bundled locally (IGN / Etalab, 2025, simplified to 1 km). Their vintage is independent of the course catalogue year. Overseas regions retain their actual geographic positions and are accessible through the region selector. There are no external map tiles. Location starts only on request, is used in the browser to centre the map and select a region, and is never stored or sent to the server as coordinates.

Images accept PNG/JPEG/WebP up to 8 MB and 20 million decoded pixels, are re-encoded to WebP at up to 1600 px with metadata stripped, and are private to the visitor cookie. Each CV allows 20 awards, with a 20 MB / 40-image workspace quota. Images removed from a saved CV are deleted when that CV is saved again. The optional Tesseract LSTM engine and compact French/English models load only on explicit request, from this app, and run locally; this is an optional multi-megabyte download, not an always-running lightweight service. Suggestions are editable and do not verify authenticity. Check model and runtime licences in `assets/ocr/` and generated `assets/vendor/ocr/`.
