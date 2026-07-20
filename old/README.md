# /old — frozen archive of the previous page styling

**Archived: 2026-07-18**, as part of rebuilding the project page served at
`zntsns.com/portal-pantry` into a case-study page ("the page pretends to be
the app"). Nothing in this folder is imported, referenced, or included in any
build. It exists as a frozen visual/historical reference only.

## What is here

| File | What it was |
|---|---|
| `portal-pantry/index.html` | The old page shell: `Titan One` + `Baloo 2` Google-Fonts loading, cosmic-purple `theme-color` (`#140c22`), old meta copy. **Moved** — replaced by the new case-study shell at `portal-pantry/index.html`. |
| `portal-pantry/src/pantry.css` | The entire old stylesheet (~42 KB): cosmic purple-dark palette (`--pp-bg #140c22`, lime `--pp-green #7be04b`, pink `#ff5fa2`, yellow `#ffd54a`), starfield body background, `pp-*` class system, card/drawer/modal look. **Moved** from `portal-pantry/src/pantry.css`. |
| `portal-pantry/src/components/PortalMark.tsx` | The old logo mark (concentric lime dashed rings). Frozen snapshot. |
| `portal-pantry/src/components/Icon.tsx` | The old inline SVG icon set. Frozen snapshot. |

## Where the live demo's working copies went

The demo app itself is a **product being showcased**, not part of the page, so
it keeps working copies of its UI under `portal-pantry/src/app/` (including
`src/app/pantry.css`, `src/app/components/PortalMark.tsx`, and
`src/app/components/Icon.tsx`) and is served at `/portal-pantry/`.

The case-study page (at `/portal-pantry/case-study/`) shares **nothing** with these files:
no palette, no spacing, no class names, or fonts. Only content (copy, project
facts, screenshots, links) was carried over, per the rebuild brief.
