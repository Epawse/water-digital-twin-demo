## Context
- Pages in scope: dashboard, flood (Digital Twin cockpit), rainfall, 3D visualization (formerly BIM, focused on 3D Tiles), data management, tileset, warning views.
- Pain points: inconsistent styling, sci-fi theme drift, Cesium controls off-theme, base-map controls risk overlapping panels/timeline, unclear naming for 3D visualization.
- Target: dark-only sci-fi/tech vibe retained, with predictable spacing/z-index to prevent overlap.

## Goals / Non-Goals
- Goals: unify theme tokens; align layout grid and spacing; theme Cesium controls; standardize base-map controls (filter, preset theme, basemap theme); ensure non-overlap; clarify 3D visualization naming.
- Non-Goals: altering backend APIs; adding new data sources; introducing light theme.

## Decisions
- Theme tokens: dark palette (bg0 #050a12, bg1 #0c1624, surface #122034, border #1f2e44), accents (#00e1ff primary, #4ef3c5 secondary), text-high #e8f3ff, text-mid #9ab7d6. Status colors: Critical #ff4d6b, Major #ff9f43, Minor #ffd166, Info #4ecbff.
- Typography: keep current sci-fi lean; stack `Poppins, 'DIN Alternate', 'Segoe UI', sans-serif` where custom font not required; weights 400/500/600; base size 13–14px.
- Spacing: 8px base scale (4/8/12/16/24/32); panels use 16–20px padding; gutters 16px; timeline margin-bottom 20px.
- Radii/shadows: radius 6px panels, 4px controls; shadow rgba(0,0,0,0.35) 0 8px 24px.
- Z-index policy: Cesium canvas 0; Cesium controls 10; base-map controls 20; panels/cards 30; timeline 40; dialogs/dropdowns 1000. Always pad controls 16px from viewport edges and 12px from adjacent UI.
- Cesium controls: theme `.compass` and `.navigation-controls` with tokens; place top-right with 16px inset; size 40px buttons, semi-transparent surfaces.
- Base-map controls: keep filter toggle, preset theme, basemap theme; place right side below Cesium controls with 12–16px gap; vertical stack with consistent width; respect z-index 20.
- Timeline (flood): stays bottom-center with 20px bottom margin; width responsive but capped to avoid overlap with left/right panels.
- Panels: left/right panels use 16px margin from edges; vertical stacking with 12–16px gap; scrollable with thin tech scrollbar.
- 3D Tiles page: tileset controls anchored left or right (choose right to align with cockpit) but offset to avoid Cesium/base-map controls; ensure tileset list/toolbox uses same panel style.
- Component states: loading uses spinner + subdued text; empty uses tech icon + hint; error uses red status color + retry action; hover/focus use accent glows; tables/forms/buttons adopt tokens via Element Plus overrides.
- Naming: show “3D Visualization” in nav/headers; keep route functional.

## Layout / Placement Rules
- Top-right cluster: Cesium controls (z=10) then base-map controls (z=20) stacked with 12–16px vertical gap.
- Left column (cockpit): panels start 110px from left, 120px from top; gap 12–16px; max height `calc(100vh - 140px)` with scroll.
- Right column: panels start 20px from right, 120px from top; avoid overlapping top-right control cluster (add margin if needed).
- Bottom: timeline centered; ensure side panels’ widths leave enough room; add `max-width: 80vw` on smaller screens.
- Tileset page: reserve right stack for Cesium/base-map controls; tileset tools either below them or left stack; no overlap with navigation.
- Gutters in content pages (dashboard/data/rainfall/warnings): 16px outer padding, 16px grid gutters; consistent header/filter/table spacing.

## Migration Plan
- Add SCSS tokens and Element Plus override file.
- Apply tokens to shared components (panels/cards, buttons, badges, table headers, forms, charts wrappers).
- Theme Cesium controls and reposition cluster; restyle base-map controls to match tokens.
- Update layouts for cockpit, rainfall, 3D visualization (3D Tiles), data, tileset, warnings to obey spacing/z-index rules.
- Update navigation label to “3D Visualization”.

## Open Questions
- Confirm acceptable font stack if Poppins/DIN unavailable by default; fallback to `Inter` or keep current?
- Preferred position for tileset-specific tools (right below base-map controls vs left column) if screen real estate conflicts?***
