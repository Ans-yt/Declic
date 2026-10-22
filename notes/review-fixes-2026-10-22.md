# Déclic — review fixes

22 October 2026 · Branch: `rewiev-fixing`

The [review notebook](declic-review-2026-10-21.md) is retained as the original assessment. This record maps its recommendations to the delivered implementation.

| Review item | Implemented change |
|---|---|
| D1 · Mobile entry | Discover action appears before the welcome choices and notebook illustration. |
| D2 · Catalogue hierarchy | List-first results, explicit map view, compact source disclosure and collapsed foreign-campus shortcuts. |
| D3 · Comparison identity | Programme and institution names replace raw ID chips; removal labels identify the programme. |
| D4 · CV controls | Clear saved/unsaved feedback, sticky saving, mobile edit/preview and direct section links. The phone toolbar stays below the fixed header. |
| D5 · Empty states | Decisions explain the publication prerequisite and link to applications/help. The documents panel explains its integration limits. |
| D6 · Targets | Larger language, favourite, sidebar, map and secondary control hit areas; readable phone form text. |
| D7 · Glass | Softer rim, dispersion and distortion while retaining the requested effect, controls and fallback. |
| D8 · Navigation/copy | Prepare/follow groups, one help destination, professional access guidance and clean placeholder display. User-entered text is preserved. |
| F1 · Profile drafts | Parent-held drafts persist across routes; versioned tab recovery is scoped to the visitor workspace and saved snapshot. |
| F2 · Search return | URLs preserve composed filters, page, institution and list/map mode; detail links retain the return search and scroll position. |
| F3 · Comparison refresh | Validated comparison IDs persist in tab storage per workspace, with a clear-all action. |
| F4 · Waiting lists | French/English guidance distinguishes fixed ranking, changing waiting-list position and historical context; links the official FAQ. |
| F5 · CV next step | Recommends missing essentials and offers review/export when complete; optional experience, engagement and awards do not block completion. |
| Guided demo | Protected, opt-in fictional scenario; progress comes from actual review, publication and clarification records. No automatic decision. |
| Programme filters | Diploma/type, sector and apprenticeship compose with existing filters and map queries. Missing apprenticeship data remains unknown. |
| Shortlist notes | Visitor-scoped SQLite notes and questions on saved programmes. |
| Draft recovery/backup | Profile/CV tab recovery plus validated, atomic personal JSON export/import with explicit replacement confirmation. Images and protected professional records are excluded. |
| Personal checklist | Saved task titles, optional personal dates and completed state; calendar export labels dates as personal reminders. |
| Professional overview | Real workspace counts for reviews, unanswered questions and unfilled teaching-cover needs, linked to their views. |

## Validation

- `npm test`: 55 passing tests, including draft recovery, malformed storage, URL/filter composition, calendar escaping/folding, backup round trips/atomic rejection, visitor isolation and protected/idempotent scenario creation.
- `npm run build`: successful TypeScript checks and production client/server build. Existing large-chunk advisory remains; the glass engine is loaded separately.
- Browser checks used the production build with an isolated in-memory database and fictional credentials on localhost. Saved user records were not changed.
- Browser-confirmed: unsaved profile text survives route navigation; catalogue search survives detail/return; comparison selection survives refresh and shows names; notes/tasks save; professional sign-in, scenario creation, explained review, publication locking and student/staff clarification round trip work; backup download and explicit restore confirmation work.
- Phone viewport 390 × 844: entry action is visible, CV section links/edit/preview work, toolbar clears the fixed header, inspected pages have no horizontal document overflow. This is viewport emulation, not a physical-device accessibility certification.

## Boundaries retained

- ENT is simulated; actual institutional identity providers still require authorisation.
- Institutional decisions and teaching cover use fictional demonstration records. No real application submission, recruitment approval, payroll or notification delivery was added.
- Backups include saved personal text, favourites and planning, not unsaved drafts, proof images or professional records. The maximum import size is 1 MB.
- Tab draft recovery is best effort and depends on browser storage; manual saving remains explicit. Anonymous visitor storage is not a recoverable cross-device account.
- Public records currently publish a positive apprenticeship marker or missing information. Explicit negative filtering can legitimately return no results; missing values are never treated as negative.
