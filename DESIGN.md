---
name: Déclic — Superr notebook world
description: Cream paper, cocoa ink and orange annotations, with a scoped liquid-glass subject carousel.
typography:
  main-heading:
    fontFamily: "Young Serif, Georgia, serif"
    fontWeight: 400
    letterSpacing: "normal"
  subject-title:
    fontFamily: "Young Serif, Georgia, serif"
    fontWeight: 400
    lineHeight: 1.2
  sidebar-display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 600
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
---

# Déclic — Superr notebook world

## Review refinements — October 2026

The notebook identity is preserved. Mobile welcome places a useful discovery action before illustration. Catalogue results default to a list, with explicit list/map choice, compact expandable provenance and foreign-campus disclosure. Comparison chips use programme/institution names. CV saving is grouped in a sticky command area (below the fixed 65px phone header) with a phone edit/preview switch. Navigation separates preparation and follow-up with one help destination. Secondary control targets grow to 44px; phone form inputs use 16px. Placeholder presentation omits literal asterisks without changing user text. The glass rim and chromatic distortion are quieter. `src/student-review.css` and `src/review-polish.css` load after earlier component styles. Personal planning and backup controls use existing outlined paper controls; professional overview is a restrained linked workload strip, not a new dashboard theme.

The user-supplied Superr reference governs the visual system. Product name remains Déclic. Mode: Operate.

Canvas and controls #fdfbf9; surfaces #f7efe9; text and structural ink #171717; headings #2b1a07; orange #ff6f1e; secondary text #6b5a4e; separators #d2c4b8. Small annotations use #a94008 for readable contrast. Orange belongs to annotations, decorative marks and the footer, with outlined cream CTAs.

Self-hosted Young Serif adds the approved main-title and subject-card treatment at weight 400 with normal tracking. Fraunces, the reference's suggested open-license substitute for Gelica, remains the sidebar identity and inherited display face at weight 600. Segoe UI/Arial supports functional labels. Welcome display 48–76px; workspace headings 34–50px; hero 43–68px; body 14–16px. Font licenses are bundled in assets/fonts.

Panels 12px, inputs 8px, outlined buttons 20px, app footer top corners 25–32px. Borders define panels. Minimal button shadow; glass is limited to the homepage subject-discovery carousel, and image-caption gradients provide readable subject labels. No decorative colors in functional controls.

Workspace uses the user-supplied dashboard sidebar, adapted to Déclic's paper/cocoa identity and actual routes. Welcome uses an asymmetric paper composition with a framed login area, stacking below 650px. The user subsequently requested a nonrealistic main image: assets/notebook-illustration.png is a generated flat gouache-style notebook scene, shared by the welcome and dashboard. This illustration overrides the earlier photography preference for the main asset. Optional additional stickers await user attachment.

Existing profile, mock ENT, CV, comparison and staff flows remain clickable. Programme content uses official public data; private institutional workflows remain explicitly simulated. Current theme overrides are in superr.css.

The chosen name is Déclic, rendered as lowercase déclic in wordmarks. User-provided star and lightning stickers flank the notebook artwork; the smiley sits on the welcome panel corner; the heart decorates guidance notes. Stickers retain their original colors as decoration, have empty alt/hidden accessibility semantics, ignore pointer input and shrink on mobile. System navigation icons remain separate.

## Media-kit integration — October 2026

The supplied `assets/Media kit/declic-media-kit/declic-media-kit` is the reference for the updated main-content compositions. The palette remains established. This integration originally preserved the sidebar and did not adopt the kit's proposed professional sidebar; the later explicit dashboard-sidebar request supersedes that preservation rule, as documented under Navigation below.

The main implementation is now React/TypeScript in `src/`. Tailwind theme/utilities load without Preflight before inherited `styles.css`, `superr.css`, `src/workspace.css`, then `src/media-kit.css`. The latter adapts the reference's fixed 1600px canvases to fluid desktop and phone layouts. It does not import the kit's fixed width, fixed height or overflow-hidden rules. Shared UI components use `src/components/ui` and the `@/` alias; shadcn configuration maps semantic colours to existing Déclic tokens.

- Dashboard: large title and transparent kit notebook, three sequential journey panels, next action and guidance.
- Welcome: supplied wordmark, outlined entry panel and original generated notebook; both notebook illustrations are intentionally used on different routes.
- CV: seven expandable sections beside a white bordered document preview; skills/languages rendered as text chips. Diplomas/awards add a restrained dashed upload area, proof thumbnail, editable metadata and optional OCR suggestion. Browser A4 print rules hide the editor and empty sections, and include named awards and their images.
- Formations: bordered cards, supplied-brand heart motif, selection tray and shared-row comparison table. Programme cards now use real official public data, while personal demo records remain separate.
- Decisions: criteria/evidence/explanation table and a separate clarification panel. The live records come only from local demo entry.
- Professionals: bordered inbox and review desk; replacement request list and assignment area, availability and hours views. Clipboard and calendar stickers come from the kit. The replacement progress line reflects actual local mission state.

Use the compact self-hosted `assets/fonts/Fraunces-600.woff2` (weight 600) and preserve its OFL license. Curated live assets are in `assets/brand/`, `assets/illustrations/`, `assets/stickers/`, and `assets/marks/`. Do not reference original kit export paths from application code. Decorative images have empty alt text and ignore pointer events; notebook illustrations have descriptive alt text. Keep annotations legible, avoid placing stickers over controls, and respect reduced-motion settings.

Large desktops retain two-column CV/review layouts; workbenches stack below 1000px. Sidebar uses the 600px mobile breakpoint, a 260px desktop width, a 76px collapsed rail and a 272px phone drawer. Main content uses fluid padding with a 20px phone gutter. The comparison table alone can scroll horizontally on narrow screens; the document itself must not overflow.

## Language control and catalogue surfaces

A compact FR/EN segmented control sits at the top right, including on the welcome page, and exposes pressed states and language labels. Its dark 33px indicator translates 35px in .25s using `cubic-bezier(.16,1,.3,1)`; reduced motion changes the state immediately. It is hidden for printing. Header breadcrumbs can truncate at narrow widths and the secondary prototype label hides below 1100px to reserve room. Navigation labels translate to their equivalents.

`src/i18n.ts` owns preference detection, persistence and formatting; `src/locales/en.json` contains translations of authored French interface copy. `src/catalogue.css` follows `src/media-kit.css` in the stylesheet order. Live programme cards preserve the notebook palette and borders while accommodating longer official names. Source information separates real public data from fictional personal-demo workflows. Catalogue loading, empty results, error/retry and explicitly stale snapshots are visible states. The comparison table remains independently scrollable; new labels must not make the page overflow.

## Map, achievements and professional access

`src/map.css` and `src/awards-access.css` follow catalogue styles. The formation search shares a row with a labelled region selector and Search action, stacking on phones. Map/list controls sit below. The map extends the notebook palette with local cream-filled administrative outlines and cocoa cluster circles; individual sites use small orange markers. Regions remain visible at overview, departments join at zoom 7+, and zoom controls remain available. The mouse wheel zooms around the pointer inside the map while keeping the page stationary. Map height is 470px desktop / 380px phone. Source vintage, legend, geolocated-site counts, error/retry and missing-coordinate notices stay visible. The list remains usable if the map fails. No outside map tiles or invented basemap imagery.

The awards accordion keeps the incumbent CV composition, with one document image and editing fields per award. Images are contained without cropping. A successful OCR read offers an explicit “use this title” choice; it never silently overwrites entered text. The professional login is a single outlined panel within the existing shell, followed by a compact signed-in identity/logout strip. Choosing Établissement in the workspace switcher reaches this server-backed gate. Institutional OIDC/provisioning setup has no navigation item, as requested.

The refined map uses local Natural Earth country context: sea `#eef2f1`, neighbouring land `#e3e5df` and country lines `#b9bdb8`. Known campuses abroad use blue `#345e70` globe pins / rounded-square clusters, a separate legend, country shortcuts and a country-context label. Unmatched coordinates use neutral hollow/dashed markers, without asserting they are abroad. French overseas locations remain domestic. At zoom 7+, departments have white separating borders and a muted adjacency-aware palette: `#e8c7ab`, `#c4d4c5`, `#c9d5e2`, `#e5dba9`, `#d9cadf`, `#c4dddc`. Codes and name tooltips supplement colour. Department fill is stronger inside the selected region; country shortcuts frame the country rather than an isolated coordinate. Map height is now 470px desktop / 380px phone.

Boundaries use native SVG hit testing; the inherited global icon sizing explicitly excludes Leaflet renderer SVGs. Country land and map labels are noninteractive, labels sit below markers, and tooltips do not follow every pointer movement. Full local vector paths are not clipped to the previous viewport; the map frame contains them. Cluster indexes are memoized, existing marker objects are reused, and cluster queries cover bounds padded by 30%. One animation-frame-coalesced handler updates markers on move, move-end and zoom-end, keeping newly entering sites visible during dragging. Inertia maximum speed is 1200. These are implementation decisions for lower interaction work, not a claimed latency guarantee.

## Components

### Subject discovery

Eight equally proportioned portrait images (3:4) serve the homepage carousel and the expandable Formations grid. White Young Serif labels sit over a dark lower-image gradient. The grid uses four columns, three below 1000px and two below 600px. Subject links apply their configured search term to the existing official-data catalogue.

The homepage uses the Componentry liquid-glass WebGL implementation, adapted locally in `src/components/GlassEngine.ts` with its MIT license retained. Keep the full-width rounded pill inside the discovery viewport (14px): its lens uses rounded-box geometry with no rotation, inset 24px on every side (adapted to 6% on small widths) and recalculated on resize. Do not spread glass to the sidebar, forms or workbenches. The engine loads near the viewport, caps rendering density at 1.5, pauses rendering offscreen or in a hidden document, and falls back to scrollable linked cards for reduced motion, unavailable WebGL or context loss. The carousel advances about every three seconds, pausing for hover, visible keyboard focus, dragging, close-up viewing, manual pause, hidden/offscreen states and reduced motion. A labelled pause/resume button accompanies visible arrows, an active-subject link and position text; automatic changes do not continuously announce. Left/right keys change the active area, Enter opens its catalogue search, and Escape exits the close-up view.

Formation image cards keep a stable link and title while a cocoa detail face wipes rightward on fine-pointer hover or keyboard focus (0.72s). Reduced motion removes the transition. Titles use a decorative letter cascade on fine-pointer hover, with a single stable accessible name.

### Shared controls

`src/interactions.css` follows the map and awards styles. Dropdowns use Radix keyboard/focus handling and preserve labelled, named, required and disabled form behavior. Paper triggers have a generous minimum height (44px); selection is marked by a check and annotation-colour text. Portalled menus and calendars use a contained warm shadow (`0 12px 32px rgb(43 26 7 / .17)`) and viewport collision spacing.

The lazy-loaded French/English calendar retains a native date field for form validation, respects date bounds, and restores focus without moving the page. Its popup height is constrained to available space and can scroll internally. Capsule loading indicators expose status text; reduced motion stops their travel animation. Main outlined buttons retain the paper default, turn cocoa on hover, and have visible annotation-colour keyboard focus.

Shared shadcn-style checkboxes use Radix state and keyboard handling in `src/components/ui/checkbox.tsx`. Their 18px square has a 4px radius, paper background and muted cocoa border. Checked and indeterminate states use cocoa fill with a paper tick or minus; focus has a 2px annotation-colour outline offset 3px. Disabled controls reduce opacity and show a disabled cursor. Programme comparison and the demonstration profile-check control share this component.

### Navigation

`src/components/ui/dashboard-sidebar.tsx` and its stylesheet adapt the user's supplied dashboard-sidebar structure to real Déclic destinations. Paper background, warm separators, Fraunces wordmark, muted functional labels and icons, warm-surface hover and a pale cocoa active row retain the notebook identity. The sidebar contains the Élève/Établissement workspace switcher, Ctrl/Cmd+K route-search dialog, grouped student or professional routes, help and the saved profile. Selecting the current workspace does nothing; changing it reaches the student home or existing professional gate. Do not add fictional reference-company content, upgrade plans, inboxes or unsupported destinations.

Desktop navigation collapses from 260px to a 76px labelled-icon rail, with descriptive accessible labels and tooltips. At 600px and below, it becomes a 272px drawer with a backdrop, close button and Escape dismissal. Opening focuses the close button, makes background content inert, locks page scrolling and loops keyboard focus inside; dismissal restores focus, and route navigation closes it and focuses main content. The search uses a labelled Radix dialog with real links and an explicit empty state. Sidebar and shell transitions use .25s `cubic-bezier(.16,1,.3,1)` and stop under reduced motion. Navigation is hidden for printing.
