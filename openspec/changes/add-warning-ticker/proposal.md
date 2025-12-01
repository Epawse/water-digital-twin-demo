# Change: Add warning ticker to Digital Twin view

## Why
Operators need immediate visibility into active hydrology warnings (e.g., sensor anomalies, threshold breaches) without leaving the 3D cockpit. Current UI panels show water levels and rain but lack a consolidated, clickable warning feed tied to map locations.

## What Changes
- Add a warning ticker/panel on the Digital Twin view that surfaces latest warnings with severity, timestamp, and status.
- Integrate the backend warnings API with polling, plus a simulated fallback when backend data is unavailable.
- Enable click-to-locate behavior that flies the Cesium camera to the warning’s station and highlights it.

## Impact
- Affected specs: warnings
- Affected code: src/api (new warnings client), Pinia store for warnings, DigitalTwin view/panels, Cesium station marker manager for highlight/fly-to behavior.
