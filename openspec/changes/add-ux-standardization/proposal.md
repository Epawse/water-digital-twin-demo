# Change: Standardize dark sci-fi UX across cockpit and data pages

## Why
UI elements across the Digital Twin cockpit and data pages (dashboard, flood, rainfall, 3D visualization focused on 3D Tiles, data management, tileset) have inconsistent styling, spacing, and control placement. Cesium controls are off-theme, and base-map tools risk overlap with custom panels. We need a unified dark sci-fi experience to improve clarity, prevent overlap, and make navigation consistent (including renaming the BIM route to “3D Visualization”).

## What Changes
- Define shared dark-only theme tokens (colors, typography, spacing, elevations) that preserve the current sci-fi/tech vibe.
- Standardize layout patterns for the Digital Twin cockpit, dashboard, rainfall, 3D visualization (former BIM) that centers on 3D Tiles content, data management lists/tables, tileset, and warning panels so elements align, avoid overlap, and stay aesthetically balanced.
- Unify Cesium controls (compass, navigation-controls) to match the main theme and place them predictably; keep core base-map features (filter control, preset theme, basemap theme) with consistent styling and spacing.
- Harmonize shared components (panels, charts, tables, forms, buttons, badges) and interaction states (hover/focus/loading/empty/error).
- Ensure base-map overlays and UI elements do not obscure each other, with spacing rules and z-index conventions; standardize naming/labels (e.g., rename BIM route to “3D Visualization”).

## Impact
- Affected specs: ux-foundations
- Affected code: shared layout/style system (SCSS tokens), Element Plus theme overrides, DigitalTwin view layout (timeline, base-map controls, panels), Cesium control theming, shared components (panels, chart wrappers, table/toolbars), warning/data pages alignment.
