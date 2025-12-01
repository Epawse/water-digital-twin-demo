## ADDED Requirements
### Requirement: Digital Twin Warning Ticker
The system SHALL display a warning ticker/panel on the Digital Twin view that surfaces the most recent warnings with severity, station, timestamp, and status, supports severity filtering, and navigates the map to the selected warning.

#### Scenario: Load latest warnings on entry
- **WHEN** a user opens the Digital Twin view
- **THEN** the client requests the warnings API for the newest warnings (newest first) and renders at least the latest 10 with severity, station name/id, timestamp, and short message.

#### Scenario: Severity filter applied
- **WHEN** the user selects one or more severity levels (e.g., Critical/Major/Minor)
- **THEN** the ticker updates immediately to show only matching warnings while preserving sort order.

#### Scenario: Click locates warning
- **WHEN** the user clicks a warning that has location metadata
- **THEN** the Cesium camera flies to the warning’s station position and highlights the marker/entity for that station.

#### Scenario: Auto refresh
- **WHEN** the refresh interval elapses (e.g., every 30–60 seconds)
- **THEN** the ticker refreshes from the API without a full page reload and merges any new warnings at the top.

### Requirement: Warning data resilience
The system SHALL provide a graceful fallback for warning data when the backend warnings endpoint is unavailable.

#### Scenario: API failure fallback
- **WHEN** the warnings API call fails or times out
- **THEN** the UI surfaces a simulated warning list with a visible “simulated data” notice and marks items as simulated.

#### Scenario: Retry after failure
- **WHEN** the next refresh interval occurs after a fallback
- **THEN** the client retries the warnings API and replaces simulated data with live data once the API responds successfully.
