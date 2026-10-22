# Déclic — design and product notebook

**21 October 2026 · Reviewed version: `ec5d43a` · Recommendations only**

Implementation follow-up: [review fixes and validation, 22 October](review-fixes-2026-10-22.md).

**Method:** two independent reviewers (design: `declic_design_assessment`; implementation evidence: `declic_evidence_assessment`), followed by synthesis and additional browser checks. Desktop and an emulated 390 × 844 phone viewport were inspected. Target: `src/App.tsx` and its routed screens. No application code was changed.

Déclic already has a recognisable identity: cream paper, cocoa headings, notebooks, stickers and supportive language. Keep that world. The next improvement should make the useful action easier to find, preserve work when people move around, and turn unfinished screens into helpful steps.

**Read this first:** protect profile drafts; preserve formation searches; put a useful mobile entry action above the illustration; show catalogue results sooner; replace comparison codes with programme names.

**Priority key:** P1 = significant user difficulty; P2 = a recoverable problem; P3 = polish. No P0 blocker was observed in the routes tested. **Evidence labels:** Observed = reproduced in the live interface; Source = confirmed in the implementation; Proposal = a suggested improvement, not a bug.

## Part 1 — design issues and improvements

### D1 · P1 · Bring the mobile welcome action into the first screen

- **Observed:** at 390 × 844, the welcome screen initially shows the wordmark, long headline, explanation and notebook illustration. All entry choices are below that first viewport.
- **Why it matters:** a newcomer has to scroll before finding out how to try Déclic.
- **Change:** put “Découvrir l’interface” immediately after the introductory copy. Shorten the phone headline and move the illustration below the entry choices. Keep the notebook artwork and professional entry.
- **Done when:** one useful entry action is visible without scrolling at 390 × 844 in both languages, including with a long translated label.
- **Where:** `src/StudentPages.tsx:58`, welcome rules in `src/media-kit.css`.

### D2 · P1 · Put formation results before the full geography interface

- **Observed:** the map opens by default. On mobile, search controls are followed by the map, legends, foreign-country shortcuts and provenance before the first programme. The full catalogue contained 25,793 programmes during inspection.
- **Why it matters:** someone searching for a course has to pass through a geography workflow before seeing an answer.
- **Change:** provide an explicit “Liste / Carte” choice, with list first on phones. Place the result count directly under the filters. Collapse foreign campuses into a labelled disclosure. Keep a compact source/date line visible and expand the detailed attribution on demand.
- **Done when:** the first result follows the search controls; the map remains one clear action away; changing views preserves filters and selection.
- **Where:** `src/FormationsPage.tsx:34`, `src/FranceMap.tsx`, `src/catalogue.css`.

### D3 · P2 · Show programme names in the comparison tray

- **Observed + Source:** a selected programme appears as a chip such as `37368`, with a removal label such as “Remove programme 2026:37368”.
- **Why it matters:** students have to remember the institution behind each number, especially after changing searches.
- **Change:** show a short programme name and institution, with a full accessible removal label. Keep the identifier internal. Show the four-item limit and explain why comparison needs at least two choices.
- **Done when:** users can identify and remove each selected programme without returning to its card; long names fit on mobile.
- **Where:** `src/FormationsPage.tsx:60`.

### D4 · P2 · Put CV save status, saving and preview together

- **Observed:** “Votre brouillon est à jour” and the promise of finding the draft next time sit apart from the manual save action. The phone preview is below the editing sections.
- **Why it matters:** the interface does not make the difference between an unsaved edit and a saved draft sufficiently explicit. This observation does **not** establish loss of a saved CV.
- **Change:** keep one clear save/status area near the editing controls: “Modifications non enregistrées”, “Enregistrement…”, then “Enregistré à …”. On phones, offer “Modifier / Aperçu” rather than requiring a long scroll.
- **Done when:** the user can check the saved state and reach the preview from any open section; status copy matches actual storage behaviour.
- **Where:** `src/CVEditor.tsx:105`, `src/media-kit.css`.

### D5 · P2 · Give empty decisions a useful next step

- **Observed:** `#decisions` displays an italic “Ici, la décision…” placeholder and explains that no response has been shared, but offers no direct next action.
- **Why it matters:** a reassuring journey ends at a panel that describes future functionality.
- **Change:** say “Aucune décision partagée pour le moment”, explain what must happen first, and offer “Voir mes candidatures” plus a guidance link. Apply the same treatment to the unfinished documents panel in Mon dossier.
- **Done when:** empty screens explain their state, the next step and whether the action belongs to the student or the institution. Never imply a real Parcoursup submission occurred.
- **Where:** `src/Decisions.tsx:14`, `src/StudentPages.tsx:70`.

### D6 · P2 · Enlarge small secondary controls

- **Observed:** language buttons measured about 33 × 29 px; the sidebar collapse control about 30 × 32 px. Favourite buttons use a 33 × 33 px footprint. Mobile navigation rows and comparison labels already offer more generous areas.
- **Why it matters:** small targets are less forgiving on phones and for people with motor difficulties.
- **Change:** enlarge the clickable area towards 44 × 44 px while keeping the icon visually compact. Check spacing between adjacent actions and retain visible keyboard focus.
- **Done when:** language, favourites, close/collapse and secondary actions are comfortably operable without crowding. These measurements alone are **not** a blanket WCAG failure claim.
- **Where:** `src/interactions.css`, `src/catalogue.css`, `src/components/ui/dashboard-sidebar.css`.

### D7 · P3 · Let the glass carousel support the subject images

- **Observed; aesthetic judgment:** the strong blue-white rim and refraction are louder and cooler than the rest of the notebook interface.
- **Change:** retain the requested liquid glass, but reduce rim brightness, colour dispersion and edge distortion. Give the active subject title/link greater priority. Preserve pause, arrows, keyboard operation and the existing fallback.
- **Done when:** subject names remain easy to read throughout the transition, and the effect does not obscure the images it is meant to showcase.
- **Where:** `src/SubjectDiscovery.tsx`, `src/components/GlassEngine.ts`.

### D8 · P3 · Clarify navigation groups and secondary copy

- **Observed; proposed refinement:** Mon dossier / Mon CV and Mes candidatures / Mes décisions are sibling destinations; two separate help links repeat a similar role. Literal asterisk-wrapped placeholders also appear throughout empty profiles and previews.
- **Change:** use subtle group labels such as “Préparer” and “Suivre”, keep one primary help destination, and use clean examples instead of template-style asterisks when the placeholder-only demo phase is over. Add a short “Accès professionnel manquant ?” instruction at the staff gate.
- **Done when:** a first-time visitor can distinguish preparation from follow-up, and a professional knows whom to contact for access. Keep real routes, the existing sidebar structure and FR/EN support.
- **Where:** `src/components/ui/dashboard-sidebar.tsx`, `src/StudentPages.tsx`, `src/StaffAccess.tsx`.

## Part 2 — functional fixes and useful additions

### Fix first

#### F1 · P1 · Unsaved profile edits disappear during navigation

- **Observed reproduction:** open Mon dossier → enter a fictional first name without saving → open Mon CV → return to Mon dossier. The field is empty again and no warning appeared. No record was saved during this check.
- **Cause:** the profile form is local component state and is discarded when the route unmounts. The existing leave warning concerns CV edits only.
- **Fix:** retain a profile draft above the route, or implement explicit draft saving; provide a warning/recovery path for edits that have not been saved. Avoid announcing an unsaved draft as permanently stored.
- **Acceptance:** profile → CV → profile preserves the edit; the CV uses the intended saved profile; failed saves retain the draft and offer retry.
- **Where:** `src/StudentPages.tsx:67`, `src/App.tsx:86`.

#### F2 · P2 · Formation navigation forgets the search

- **Observed reproduction:** search “architecture” → open a matching programme → choose “Toutes les formations”. The query returns to empty and the full catalogue reappears. The independent reviewer reproduced this with “informatique”.
- **Cause:** query, region, page, institution and view state belong to the unmounted Formations component; the return link points to the bare catalogue route.
- **Fix:** preserve exploration state in the app, or encode filters/page in a navigable URL. Restore scroll position when returning to results.
- **Acceptance:** query, region, page, institution and list/map preference survive detail → results and browser Back. A copied search link should reproduce its stated filters if URL persistence is chosen.
- **Where:** `src/FormationsPage.tsx:16`, `src/FormationExplorer.tsx:35`.

#### F3 · P2 · A refresh clears the comparison selection

- **Observed reproduction:** check a programme’s comparison box → the selection tray appears → refresh → the tray and selection disappear.
- **Cause:** comparison IDs exist only in App React state. Favourites are stored separately; this is not evidence that favourites are lost.
- **Fix:** persist comparison IDs in session storage or the visitor workspace, with a clear “Tout retirer” action. Handle unavailable or changed catalogue records gracefully.
- **Acceptance:** a two-to-four-programme selection survives refresh and still resolves to the same programmes; clearing it persists too.
- **Where:** `src/App.tsx:42`. Pair with D3’s readable chip labels.

#### F4 · P2 · Waiting-list help contains no actual explanation

- **Observed + Source:** expanding “How do I read a waiting list?” shows “Waiting-list guidance goes here…”; the French source contains the equivalent placeholder.
- **Fix:** add a short, reviewed, source-linked explanation of the published concepts and their limits. Distinguish historical figures from current status. Do not invent ranks, vacancies or personal admission probabilities.
- **Acceptance:** both languages provide useful content and a direct official reference, with a review date. The existing placeholder is absent.
- **Where:** `src/StudentPages.tsx:88`.

#### F5 · P2 · The homepage next-step logic has no completed state

- **Source-confirmed, not reproduced with a filled live CV:** the recommendation checks education, experience and engagement, then always falls back to “présentation”. It does not evaluate all seven sections or whether presentation is already complete.
- **Fix:** derive the next step from actual missing essentials, treat optional awards/experience as optional, and show a useful completed state such as reviewing or exporting the CV. Open the recommended accordion directly.
- **Acceptance:** a complete CV is not repeatedly told to complete presentation; a student without awards or work experience is not labelled incomplete solely for that reason.
- **Where:** `src/Home.tsx:13`, `src/CVEditor.tsx:44`.

### Useful features after those fixes

These are proposals, not claims that existing features are broken. Implement the first two before expanding the product’s scope.

| Priority | Addition | Smallest useful version | Proof it works |
|---|---|---|---|
| Next | Guided demo for judges | An opt-in, clearly fictional scenario: application → criterion/evidence/explanation → published response → student clarification. Keep the protected professional access flow. | Someone can understand both sides without inventing records or mistaking the scenario for a live application. |
| Next | Additional programme filters | Filter by diploma/type, public/private sector and apprenticeship using the catalogue’s existing fields; show active filters and a reset action. | Filters compose predictably, result counts agree and “not published” is not silently treated as “no”. |
| Later | Personal shortlist notes | Let a student add “why this interests me” and a question to a saved programme. | Notes persist and are visibly personal notes, separate from official information. |
| Later | CV/profile draft recovery and backup | Recover interrupted drafts and provide a clearly labelled export/import of the visitor workspace. Existing print/PDF remains available. | A round trip restores the documented data; imported records are validated; image coverage and exclusions are stated. |
| Later | Personal application checklist | User-entered tasks, reminders and dates attached to saved programmes, with optional calendar export. | The source of each date is explicit; a personal reminder is never presented as an official deadline. |
| Later | Professional workflow overview | Counts for fictional pending reviews, unanswered clarifications and unfilled cover needs, with links to the corresponding views. | Each count comes from actual workspace state; no invented activity, notification delivery or staffing checks. |

### Keep these product boundaries clear

- Real ENT requires an authorised provider; the current prefill is explicitly simulated. Do not make a decorative connect button look like a working institutional integration.
- The public programme catalogue is real; admissions dossiers, decisions and teaching-cover coordination remain demonstration workflows.
- The protected professional gate is intentional. A guided scenario should not require weakening it.
- Anonymous visitor storage is not a recoverable, cross-device student account. A real account/recovery feature is a separate product decision.
- No government integration is needed to demonstrate the improvements above. Real submissions, institutional records, recruitment checks, notifications and payroll remain separate integrations.

## Recommended order

1. **Protect work:** F1 profile drafts and F2 search restoration, then F3 comparison persistence.
2. **Make the first minute useful:** D1 mobile entry, D2 catalogue hierarchy and D3 readable comparison chips.
3. **Close unfinished journeys:** F4 guidance, D5 empty states, D4 save/preview clarity and F5 next-step logic.
4. **Improve comfort:** D6 targets, then D7/D8 visual and navigation polish.
5. **Add value:** guided demo and meaningful catalogue filters before larger new features.

## Review scorecard and coverage

### Design heuristics — 26/40

These are directional review scores, not usability-study results. Error prevention and recovery have lower confidence because error/destructive workflows were not fully exercised.

| Heuristic | /4 | Main observation |
|---|---:|---|
| Visibility of system status | 3 | Loading, selected routes and CV progress exist; save semantics need clarity. |
| Match with the real world | 3 | Supportive language; some institutional terminology needs explanation. |
| User control and freedom | 3 | Collapsible sections, map/preview controls, drawer dismissal and carousel pause. |
| Consistency and standards | 3 | Coherent identity; unfinished placeholder conventions stand out. |
| Error prevention | 2 | Demo boundaries are visible; profile drafts are not protected. |
| Recognition rather than recall | 3 | Labelled navigation and preview help; comparison codes require recall. |
| Flexibility and efficiency | 3 | Route search, favourites and comparison exist; search restoration is missing. |
| Aesthetic and minimalist design | 2 | Brand is strong; catalogue options and imagery delay key tasks. |
| Error recognition and recovery | 2 | Retry affordances exist; interrupted-work recovery needs attention. |
| Help and documentation | 2 | FAQ is accessible, but central waiting-list content is unfinished. |

### Technical review — 14/20

Accessibility **3/4**, performance **3/4**, responsive layout **3/4**, theming **3/4**, implementation integrity **2/4**. These are provisional manual judgments. No measured Core Web Vitals or accessibility certification is implied.

### Three user perspectives

- **First-time student:** the tone is reassuring, but mobile entry is delayed and the catalogue exposes too many simultaneous choices. Make the first useful action and the first result unmistakable.
- **Keyboard/screen-reader user:** named controls, headings, expanded states and a skip link are present. A direct “Aller aux résultats” link would reduce map traversal. Full screen-reader behaviour and contrast remain untested.
- **Distracted phone user:** layouts fit the tested width, but entry, results and CV preview require substantial scrolling. Retaining drafts and search context is especially valuable after interruptions.

### What already works and should stay

- The paper/cocoa identity, Young Serif headings, notebooks and restrained stickers make Déclic recognisable.
- The CV’s seven-section structure and desktop preview explain the output without a tutorial.
- Official catalogue attribution, dates, fictional-record notices and the protected staff gate establish useful trust boundaries.
- French/English switching updated the inspected labels and document language; official programme names correctly stayed French.
- No horizontal document overflow was observed in the tested mobile catalogue, CV and professional gate. The mobile drawer dismissed on navigation and moved focus to main content.

### Limits of this review

- Professional sign-in was inspected; authenticated admissions and replacement workflows were read in source, not exercised behind the login. No credentials were changed and no protected route was bypassed.
- No personal records were saved. Profile editing used an unsaved fictional marker; comparison selection was temporary. Existing application data was not deliberately changed.
- Phone evidence comes from viewport emulation, not a physical device or synthesised touch gestures. No complete screen-reader, contrast, 200% zoom, OCR upload, print/PDF or performance trace was run.
- The bundled detector was attempted but unavailable because its engine was not installed and its cache was not writable. Automated findings are unknown, not zero. The notes rely on browser and source evidence.
- Framework snapshot/trend storage was unavailable for the same reason. This dated notebook is the review artifact; no historical score trend is claimed.
- Déclic was launched for this request and left running locally. Application source and unrelated workspace files were left alone.
