# Déclic

A local hackathon prototype for French students and education professionals. Built with **React, TypeScript, Vite, Node.js, Express and SQLite**. The interface is in French and uses the supplied Déclic media kit.

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
- Favorites and comparison of explicitly labelled formation placeholders.
- Admissions: create a fictional application, record a criterion and evidence, save an explanation, then share the decision into the student view. Shared reviews are read-only.
- Clarification requests from the student view and staff replies.
- Replacements: record a need and candidate availability, mark a qualification as checked for the demo, find compatible availability, confirm an assignment, cancel a mission, and validate completed hours.
- Matching checks normalized subject and commune, date and time coverage, verification status and overlapping assignments. Hours cannot exceed the scheduled duration or be recorded before the end of the mission.
- Data survives a browser refresh and server restart.

There are no preloaded student, teacher, school, decision or ranking records. The ENT flow imports editable starred placeholders. The formations catalog and document upload remain unconnected. Real authentication, institutional authorization, qualification/background checks, official admissions submission, notifications and payments are not implemented. The role selector switches views within one shared local demonstration, and does not establish permissions.

## Try the complete journeys

1. Complete a fictional profile, open **Mon CV**, expand a section, edit and save. Reload to verify persistence. Use **Imprimer / PDF** for the browser print dialog.
2. Select **Établissement**, add a fictional candidature, select it, write a criterion, evidence and explanation, then save and share. Select **Élève → Mes décisions**, ask a question, and return to the admissions desk to answer it.
3. In **Les remplacements**, create a need. In **Vivier & disponibilités**, add an availability with the same subject, commune and date and a covering time slot, then mark it verified for the demo. Select the need, search for a relay and confirm the assignment. Completed missions can have their hours recorded in **Heures effectuées**.

## Local storage

The server listens on `127.0.0.1` and stores the shared workspace in `data/declic.sqlite`. Use fictional records. This is a local demonstration, not a public multi-user service. `PORT` changes the port and `DECLIC_DB` selects another database file; set these as environment variables before launching. A newly selected database starts empty. Node may print an experimental warning for its built-in SQLite module.

## Checks

```sh
npm run check
npm test
npm run build
```

The integration tests use their own temporary database and cover restart persistence, invalid writes, explained admissions, clarification replies, scheduling conflicts, cancellation, hour limits and cross-origin write rejection.

## Project files

- `src/` — React screens, shared controls, and media-kit layout styles.
- `server/` — Express API and SQLite persistence.
- `shared/` — TypeScript models and validation.
- `tests/` — API and database workflow tests.
- `styles.css`, `superr.css` — inherited base theme and preserved sidebar.
- `assets/brand`, `assets/illustrations`, `assets/stickers`, `assets/marks`, `assets/fonts` — curated artwork and fonts. Original generated notebook: `assets/notebook-illustration.png`.

The original media kit is retained locally under `assets/Media kit/` as a design reference; the application does not depend on that export. `.gitignore` excludes it along with databases, dependencies, builds, local captures and `.impeccable/`. Image prompts are not generated or included in the application. Fraunces font licenses are kept with the fonts. A project software license has not yet been selected.
