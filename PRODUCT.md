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
A working shared local demonstration. The profile, CV, favorites, admissions records, questions/replies, replacement needs, candidate availabilities, confirmations and hours persist in SQLite. No preloaded personal records or invented statistics. Empty states and explicit starred placeholders remain the default.

CV: expandable section outline, repeatable and reorderable education/experience/engagement entries, skills and languages, live document preview, browser print/Save as PDF. Name, school, city and optional contact come from the saved profile. Unsaved CV changes remain across in-app routes and trigger a browser-leave warning.

Professional admissions: create a fictional dossier, record a criterion, evidence and explanation, save, then publish the response into the student view. Published reviews are immutable. Students can ask for clarification and staff can answer in the shared local workspace.

Replacements: create a need and an availability, manually mark the profile checked for demonstration purposes, match subject/commune/date/time, prevent overlapping assignments to the same availability profile, confirm or cancel, then record completed hours within the scheduled duration. Real qualifications, recruitment, institutional permission and payroll require institution-managed systems and are not provided by this prototype.

ENT prefill remains explicitly simulated and imports selectable editable placeholders. Formation search and details are unconnected placeholders. Real authentication, account separation, document upload, official admissions, automated notifications, background checks and payments are out of the current implementation.
## Brand commitments
Déclic is the chosen name. Preserve the existing sidebar's width, appearance, navigation labels and order, including its existing professional links. Use the user-supplied media kit as the layout and asset reference for the main content. Cream paper, cocoa/charcoal ink, orange annotations, Fraunces headings, outlined buttons, and supplied stickers. Original generated notebook on the welcome page; transparent media-kit notebook on the dashboard. Do not add image-prompt files or unnecessary design-tool artifacts; local `.impeccable/` files are ignored.
## Open decisions
Software license, public data catalog integration, accounts/roles, institutional integrations and deployment remain undecided. French is the interface language.
