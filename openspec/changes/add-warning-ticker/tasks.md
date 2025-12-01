## 1. Implementation
- [ ] 1.1 Add warnings API client (fetch latest, optionally polling) under `src/api`.
- [ ] 1.2 Create Pinia store or composable for warnings with severity filtering and refresh interval.
- [ ] 1.3 Build warning ticker/panel component in `src/views/DigitalTwin` (or shared component) with severity badges and click handling.
- [ ] 1.4 Integrate ticker with Cesium station markers for fly-to/highlight behavior.
- [ ] 1.5 Wire fallback to simulated data when backend warnings endpoint is unreachable.
- [ ] 1.6 Add minimal smoke validation (manual QA notes) covering fetch, filter, click-to-locate, and auto-refresh.
