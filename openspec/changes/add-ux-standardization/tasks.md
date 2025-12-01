## 1. Implementation
- [ ] 1.1 Define dark sci-fi theme tokens (colors, typography, spacing, radii, shadows) and Element Plus overrides; document in SCSS variables.
- [ ] 1.2 Create shared layout rules for header/nav, side panels, overlays, and spacing to prevent overlap; apply to dashboard, flood, rainfall, 3D visualization (former BIM, 3D Tiles-centric), data management, tileset, and warning views.
- [ ] 1.3 Theme Cesium built-in controls (`.compass`, `.navigation-controls`) to match tokens and position them in a non-overlapping corner with consistent padding/z-index.
- [ ] 1.4 Standardize base-map controls (filter, preset theme, basemap theme) styling and placement; ensure spacing from Cesium controls and panels.
- [ ] 1.5 Align shared components (panels/cards, charts, tables, forms, buttons, badges/status chips) with the theme and interaction states (hover/focus/loading/empty/error).
- [ ] 1.6 Validate on key pages (dashboard, flood, rainfall, 3D visualization with 3D Tiles, data management lists/tables, tileset, warnings) for visual consistency, non-overlap, and readability.
- [ ] 1.7 Update navigation/labels to reflect “3D Visualization” (rename from BIM where surfaced) without breaking routing.
