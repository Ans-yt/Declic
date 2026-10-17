# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
React and TypeScript, built with Vite; Node.js and Express JSON API; SQLite through Node's built-in module. Zod validates writes. Local server, no hosted-service dependency.
## Users
French high school students exploring higher education, alongside education professionals reviewing admissions and coordinating teaching cover. The professional workspace is part of the core product.
## Purpose
Make admissions understandable and decisions explainable, and help coordinate continuity of teaching. Seven-day hackathon prototype. Institutional adoption is a future requirement, not an existing partnership.
## Current scope
A working demonstration with isolated visitor workspaces. Profiles, CVs, diploma images, favorites, fictional admissions records, questions/replies, replacement needs, availabilities, confirmations and hours persist in SQLite. No preloaded personal records or invented statistics. Personal records start empty. The formation catalogue and clustered establishment map show real public records.

CV: seven expandable sections, repeatable and reorderable education/experience/engagement entries, skills and languages, and diplomas/awards with private images, editable names, dates and organisations. Optional on-device French/English OCR suggests titles only after a click. Live document preview and browser print/Save as PDF include achievements. Name, school, city and optional contact come from the saved profile. Unsaved changes remain across in-app routes and trigger a browser-leave warning.

Professional admissions: create a fictional dossier, record a criterion, evidence and explanation, save, then publish the response into the student view. Published reviews are immutable. Students can ask for clarification and staff can answer in the shared local workspace.

Replacements: create a need and an availability, manually mark the profile checked for demonstration purposes, match subject/commune/date/time, prevent overlapping assignments to the same availability profile, confirm or cancel, then record completed hours within the scheduled duration. Real qualifications, recruitment, institutional permission and payroll require institution-managed systems and are not provided by this prototype.

ENT prefill remains explicitly simulated. Formation search/details use official public data. Server-checked establishment password sign-in, logout, visitor isolation and private image uploads are implemented. OIDC/PKCE and authenticated external-identity provisioning routes are available in the backend for a future authorised provider; no real ENT is connected. Student account recovery, institution-wide records/tenancy, official admissions, notifications, background checks and payments remain outside the implementation. Staff actions operate inside the signed-in visitor's fictional demonstration workspace.
## Brand commitments
Déclic is the chosen name. Preserve the existing sidebar's width, appearance, navigation labels and order, including its existing professional links. Use the user-supplied media kit as the layout and asset reference for the main content. Cream paper, cocoa/charcoal ink, orange annotations, Fraunces headings, outlined buttons, and supplied stickers. Original generated notebook on the welcome page; transparent media-kit notebook on the dashboard. Do not add image-prompt files or unnecessary design-tool artifacts; local `.impeccable/` files are ignored.
## Open decisions
Software license and real institutional partnerships remain undecided. DeployXA is the intended host; Docker, environment settings and persistent SQLite deployment instructions are provided. Staff access is protected; anonymous student workspaces are not recoverable cross-device accounts. The interface supports French and English.

## Bilingual interface and live public catalogue

FR/EN translation covers navigation, welcome, student and staff workflows, fields, placeholder guidance, feedback and errors. The first visit follows the primary browser language: French for fr/fr-*; English otherwise. Manual choices persist in localStorage and preserve CV edits. Official names, institutional descriptions and user-authored records retain their original text.

Formation search, saved courses, comparisons and detail pages now use real official public data. The server discovers the latest catalogue and history years, fetches through validated Ministry API queries and caches public replies in SQLite. Source attribution, retrieval/processing dates, historical-session labels and stale-cache warnings are shown. An exact code plus institution match is required before historical figures appear. Missing values are not converted to zero. No individual acceptance prediction or live vacancy claim is made. Institutional/private workflows remain a separately labelled local demonstration.

The map uses bundled IGN/Etalab 2025 administrative boundaries, with regions at overview and departments at zoom 7+. Clusters aggregate institution UAI/locality sites from a compact full matching export. Region selection filters both the map and programmes; selecting a site filters the list by institution. Overseas regions use actual locations. Optional geolocation stays in browser memory and is never sent or stored as coordinates. No external tile service or map API key is needed.
