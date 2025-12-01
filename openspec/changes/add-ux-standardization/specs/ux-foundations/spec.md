## ADDED Requirements
### Requirement: Dark sci-fi theme tokens
The system SHALL provide a dark-only, sci-fi/tech visual language with documented tokens for colors, typography, spacing, radii, shadows, and status colors (Critical/Major/Minor/Info) used across cockpit and data pages.

#### Scenario: Theme tokens available
- **WHEN** a page or component renders
- **THEN** it uses the shared token set for background/surface, text, border, accent, and status colors, along with defined font stacks and spacing scale.

### Requirement: Unified layout patterns
The system SHALL apply shared layout rules for Digital Twin cockpit, dashboard, flood, rainfall, 3D visualization (former BIM) that focuses on 3D Tiles content, data management, tileset, and warning views to ensure consistent alignment, padding, and non-overlapping placement of panels, overlays, and controls.

#### Scenario: Cockpit layout alignment
- **WHEN** the Digital Twin view renders
- **THEN** the main map, timeline, panels, and base-map controls follow the shared spacing grid, remain readable, and do not overlap each other.

#### Scenario: Data and warning page alignment
- **WHEN** dashboard, rainfall, 3D visualization, data, tileset, or warning list/table pages render
- **THEN** headers, filters, tables, and action bars follow the same spacing, gutter, and typography rules as the cockpit panels, without overlapping other UI elements.

#### Scenario: 3D Tiles visualization layout
- **WHEN** the 3D visualization page renders 3D Tiles content and related controls
- **THEN** the 3D Tiles viewer, tileset controls, Cesium controls, and any panels follow the shared spacing/z-index rules and remain non-overlapping and readable.

### Requirement: Cesium control theming and placement
The system SHALL theme Cesium built-in controls (`.compass`, `.navigation-controls`) to the dark sci-fi style and place them predictably without overlapping custom overlays.

#### Scenario: Themed Cesium controls
- **WHEN** Cesium controls render
- **THEN** compass and navigation controls use the shared color/typography tokens and sit in a defined corner with padding and z-index that keep them visible but clear of panels and base-map controls, matching the main theme rather than default styling.

### Requirement: Base-map control standardization
The system SHALL keep the core base-map features (filter control, preset theme, basemap theme) and style/place them consistently relative to Cesium controls and panels to avoid overlap.

#### Scenario: Base-map controls non-overlap
- **WHEN** base-map controls render with preset theme, filter toggle, and basemap theme options
- **THEN** they use the shared styling and spacing rules, do not overlap Cesium controls, and remain accessible on the Digital Twin view.

### Requirement: Page naming clarity
The system SHALL present the BIM demo route/page as “3D Visualization” in navigation and UI labels without breaking routing.

#### Scenario: 3D Visualization naming
- **WHEN** users navigate or view the BIM/3D page
- **THEN** the route/page name shown in navigation or headings is “3D Visualization” (or equivalent 3D visualization wording) while route functionality remains intact.

### Requirement: Shared component styling and states
The system SHALL apply consistent styling to panels/cards, charts, tables, forms, buttons, and badges/status chips with defined hover, focus, loading, empty, and error states.

#### Scenario: Component state consistency
- **WHEN** components display loading, empty, or error states
- **THEN** they use the standardized patterns (icons/text/color) aligned with the dark sci-fi tokens and spacing rules across cockpit and data pages.
