# Frontend interaction sources

- `GlassEngine.ts`: adapted from Componentry's `liquid-glass-carousel` registry source, https://componentry.dev/r/liquid-glass-carousel.json. Original MIT notice is in `LICENSE-componentry.txt`. Uses Three.js and GSAP (their licences remain in installed packages).
- `Controls.tsx`: the letter cascade, wipe-card, capsule spinner, arrow-button motion and dropdown appearance adapt the interaction ideas supplied by the user (Componentry, 000h/Cojeev and emerald-ui). Implemented with native CSS rather than the supplied global morph engine. Select behaviour uses Radix Select; the calendar popover uses Radix Popover and React DayPicker.
- `DateInput.tsx`: lazy-loaded single-date calendar. Form values remain `YYYY-MM-DD`; labels follow the interface language. Native form validation remains in place.
- Young Serif: self-hosted under `assets/fonts/`, with its OFL notice. Sidebar typography remains unchanged.

The carousel engine is imported only when the discovery section approaches the viewport and motion is permitted; the image-card fallback remains usable without WebGL. GPU rendering pauses offscreen/in hidden tabs and resources are disposed on route changes. Automatic advancement runs about every three seconds while visible, and pauses for hover, keyboard focus, dragging, an enlarged card, reduced motion or the explicit pause control.

## UI component setup

`components.json` maps shadcn's `@/components/ui` path to `src/components/ui`, alongside the existing TypeScript sources. Both TypeScript and Vite resolve `@/` to `src/`. `src/lib/utils.ts` provides the standard class-merging helper. No Next.js runtime is used.

Tailwind runs through its [Vite integration](https://tailwindcss.com/docs/installation/using-vite). `src/tailwind.css` imports theme and utilities separately, [omitting Preflight](https://tailwindcss.com/docs/preflight) to preserve the existing notebook styles. Its colour aliases use Déclic's existing CSS variables.

`ui/dashboard-sidebar.tsx` adapts the user-supplied component to the real student/professional routes, workspace switcher, quick navigation search and collapsible desktop rail. The mobile drawer isolates background interaction, contains keyboard focus and restores it on close. `ui/checkbox.tsx` uses [Radix Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox) and Lucide icons; all comparison and ENT import checkboxes share it.
