# Déclic — Superr notebook world

The user-supplied Superr reference governs the visual system. Product name remains Déclic. Mode: Operate.

Canvas and controls #fdfbf9; surfaces #f7efe9; text and structural ink #171717; headings #2b1a07; orange #ff6f1e; secondary text #6b5a4e; separators #d2c4b8. Small annotations use #a94008 for readable contrast. Orange belongs to annotations, decorative marks and the footer, with outlined cream CTAs.

Self-hosted Fraunces variable, the reference's suggested open-license substitute for Gelica, provides soft lowercase headings at weight 600 with normal tracking. Segoe UI/Arial supports functional labels. Welcome display 48–76px; workspace headings 34–50px; hero 43–68px; body 14–16px. Font license is bundled in assets/fonts.

Panels 12px, inputs 8px, outlined buttons 20px, app footer top corners 25–32px. Borders define panels. Minimal button shadow, no gradients or glass. No decorative colors in functional controls.

Workspace retains stable sidebar navigation. Welcome uses an asymmetric paper composition with a framed login area, stacking below 650px. The user subsequently requested a nonrealistic main image: assets/notebook-illustration.png is a generated flat gouache-style notebook scene, shared by the welcome and dashboard. This illustration overrides the earlier photography preference for the main asset. Optional additional stickers await user attachment.

Existing profile, mock ENT, CV, comparison and staff flows remain clickable. Domain content remains explicitly placeholder-only. Current theme overrides are in superr.css.

The chosen name is Déclic, rendered as lowercase déclic in wordmarks. User-provided star and lightning stickers flank the notebook artwork; the smiley sits on the welcome panel corner; the heart decorates guidance notes. Stickers retain their original colors as decoration, have empty alt/hidden accessibility semantics, ignore pointer input and shrink on mobile. System navigation icons remain separate.

## Media-kit integration — October 2026

The supplied `assets/Media kit/declic-media-kit/declic-media-kit` is the reference for the updated main-content compositions. Existing palette, sidebar, navigation labels/order and width are preserved. The proposed professional sidebar in the kit is not adopted.

The main implementation is now React/TypeScript in `src/`. CSS loads in this order: inherited `styles.css`, `superr.css`, `src/workspace.css`, then `src/media-kit.css`. The latter adapts the reference's fixed 1600px canvases to fluid desktop and phone layouts. It does not import the kit's fixed width, fixed height or overflow-hidden rules.

- Dashboard: large title and transparent kit notebook, three sequential journey panels, next action and guidance.
- Welcome: supplied wordmark, outlined entry panel and original generated notebook; both notebook illustrations are intentionally used on different routes.
- CV: compact expandable section outline beside a white bordered document preview; skills/languages rendered as text chips; browser A4 print rules hide the editor and empty sections.
- Formations: bordered cards, supplied-brand heart motif, selection tray and shared-row comparison table. Domain content stays explicitly placeholder-only.
- Decisions: criteria/evidence/explanation table and a separate clarification panel. The live records come only from local demo entry.
- Professionals: bordered inbox and review desk; replacement request list and assignment area, availability and hours views. Clipboard and calendar stickers come from the kit. The replacement progress line reflects actual local mission state.

Use the compact self-hosted `assets/fonts/Fraunces-600.woff2` (weight 600) and preserve its OFL license. Curated live assets are in `assets/brand/`, `assets/illustrations/`, `assets/stickers/`, and `assets/marks/`. Do not reference original kit export paths from application code. Decorative images have empty alt text and ignore pointer events; notebook illustrations have descriptive alt text. Keep annotations legible, avoid placing stickers over controls, and respect reduced-motion settings.

Large desktops retain two-column CV/review layouts; workbenches stack below 1000px. Sidebar keeps its existing 600px mobile breakpoint. Main content uses fluid padding with a 20px phone gutter. The comparison table alone can scroll horizontally on narrow screens; the document itself must not overflow.
