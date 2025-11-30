# Repository Guidelines

Quick reference for contributors.

## Project Structure & Module Organization
- `src/`: Vue 3 + TypeScript app (`views`, `components`, `modules`, `api`, `utils`, `styles`, `assets`).
- `public/`: Static assets copied by Vite (logos, Cesium assets); avoid code here.
- `backend/app`: FastAPI services, SQLAlchemy models, and routes; `backend/scripts` holds import/seed helpers.
- `backend/alembic`: Database migrations; change via Alembic commands, not manual edits.
- `dist/`: Build output; do not commit manual edits.

## Build, Test, and Development Commands
- Frontend dev: `npm install` then `npm run dev` (Vite with `/api` proxy to `VITE_API_URL`).
- Frontend build/type-check: `npm run build` (runs `vue-tsc`) then `npm run preview` to smoke-test the bundle.
- Backend setup: `cd backend && pip install -r requirements.txt`; copy `.env.example` to `.env`.
- Backend lifecycle: `alembic upgrade head` to sync schema; `uvicorn app.main:app --reload --port 8000` to serve; optional demo data `python -m scripts.seed_data` or Excel import `python -m scripts.import_excel --root <dir>`.

## Coding Style & Naming Conventions
- Use TypeScript with explicit types for APIs and stores; prefer 2-space indent and Prettier/Vue defaults.
- Components/views in `src/views` and `src/components` use `PascalCase.vue`; composables/utilities use `camelCase.ts`.
- Centralize HTTP calls in `src/api`; avoid inline axios usage in views.
- SCSS lives in `src/styles`; reuse variables/mixins and scope Cesium/Element Plus overrides to avoid bleed.

## Testing Guidelines
- No automated suite is checked in; at minimum run `npm run build` and smoke the UI via `npm run preview`.
- Backend changes should include lightweight API checks (`curl http://localhost:8000/api/health` and relevant endpoints) and add `pytest` cases under `backend/tests` when introducing logic.
- Document manual verification steps in PRs until a formal test harness is added.

## Commit & Pull Request Guidelines
- Follow conventional prefixes seen in history (`feat:`, `fix:`, `docs:`); keep subjects imperative and under ~72 chars.
- Each PR should describe scope, testing done, and required env vars; link issues/tickets.
- Include UI screenshots/gifs for visible changes and note backend migrations or seed steps.
- Run schema migrations and `npm run build` before requesting review to keep CI green.

## Configuration & Security Tips
- Never commit `.env` files; frontend expects `VITE_API_URL`/`VITE_API_ASSETS`, backend requires `DATABASE_URL` variants.
- Local dev proxy points `/api` to the FastAPI server; adjust Vite config only if backend host/port changes.
- Keep imported datasets and generated exports out of version control or listed in `.gitignore` to avoid leaking sensitive data.
