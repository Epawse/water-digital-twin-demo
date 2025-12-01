# Project Context

## Purpose
Deliver a water conservancy digital twin platform that visualizes hydrology, rainfall, and engineering safety data on a 3D Cesium map, combining real-time/ingested sensor data with business dashboards and simulation-style panels (flood evolution, warnings, water level).

## Tech Stack
- Frontend: Vue 3 + TypeScript + Vite, Pinia for state, Vue Router, Element Plus UI, ECharts for charts, Cesium 1.82 for 3D globe, SCSS for styling, Axios for API calls.
- Backend: FastAPI + SQLAlchemy + Alembic, PostgreSQL/PostGIS, AsyncPG/Psycopg2 drivers, Uvicorn for serving.

## Project Conventions

### Code Style
- Vue SFCs with `<script setup lang="ts">`; Composition API preferred.
- Aliases: `@/*` → `src/*` (configured in `tsconfig.json`).
- SCSS with sci-fi/tech visual language; Element Plus components for forms/layout where possible.
- TypeScript compiler not strict (`strict: false`); avoid unused locals/params when practical.
- Cesium usage centralized via controllers/utilities (current core in `src/utils/ctrlCesium/Controller.ts`, planned `src/core/cesium`).

### Architecture Patterns
- Layered front-end intent (from README_TWIN): core Cesium engine (planned `src/core/cesium`), data layer (`src/api`, Pinia store), service modules (`src/modules/*` by domain), application layer view (`src/views/DigitalTwin` “one map” cockpit).
- API layer abstracts backend calls in `src/api`; components pull data via these helpers rather than hardcoded fetches.
- Domain modules under `src/modules/` (e.g., FloodControl panels) encapsulate visual panels and related Cesium helpers (e.g., `StationMarkerManager`).
- Backend organized as FastAPI app with Alembic migrations; PostGIS tables for spatial data; seed/import scripts under `backend/scripts`.

### Testing Strategy
- No automated test suite documented for front-end or backend; validation is currently manual via running `npm run dev` and backend health checks.
- Alembic migrations provide schema verification; scripts like `scripts.seed_data` and `scripts.import_excel` are used to validate data ingestion paths.

### Git Workflow
- Branching/commit conventions not documented; default to trunk-based or feature branches with descriptive messages.

## Domain Context
- Focus on water conservancy digital twin scenarios: flood control, water resources, and project safety dashboards rendered over Cesium globe.
- Sensor management includes rain gauges, water level sensors, IoT devices; data displayed as panels and map markers with simulated/real flags.
- “One map” cockpit (`src/views/DigitalTwin`) orchestrates panels, flood timeline simulation, base-map styling, and event overlays.
- Backend stores and serves hydrology metrics, rainfall, products (raster/vector/model), and ingests Excel sensor data for real sites.

## Important Constraints
- Cesium pinned to 1.82; globe styling relies on custom filters and TianDiTu/AMap tiles.
- Backend requires PostgreSQL with PostGIS enabled; `.env` must provide both async and sync DB URLs.
- Front-end environment requires `VITE_API_URL`, `VITE_API_ASSETS`, and TianDiTu key for base maps (`tdtKey` currently hardcoded).
- Network access constrained in some environments; offline-friendly mock data kept under `src/mock` but primary path is backend APIs.

## External Dependencies
- External tile services: TianDiTu (vec/ter/img/cva/cta/cia) and AMap tiles.
- Backend FastAPI service at `/api` (proxied via Vite dev server) for sensors, rainfall, water levels, warnings, and product catalogs.
- Database: PostgreSQL + PostGIS with Alembic migrations.
- Optional Excel data roots for ingestion (`安全监测数据-MMK发电引水洞` sample directory).
