# Finotam MMC

Offline accounting application scaffold prepared for desktop packaging.

## Current state

- React frontend moved into `src/`
- Tauri backend skeleton added in `src-tauri/`
- Existing accounting MVP migrated into the React app
- Frontend storage abstraction added with browser fallback
- SQLite command scaffolding added in Rust for desktop persistence

## Next required local setup

1. Install Rust toolchain.
2. Use `npm.cmd install` in this folder.
3. Run `npm.cmd run dev` for frontend development.
4. Run `npm.cmd run tauri dev` after Rust and Tauri prerequisites are installed.

## Recommended next implementation steps

1. Finish wiring CRUD flows to normalized SQLite tables instead of the current JSON state blob.
2. Add authentication, chart of accounts, taxes, and journal entries.
3. Add invoice print layouts, PDF export, and backup restore.
4. Build a Windows installer.

## PASHA payment setup

For Render environment variables and PASHA checkout/return wiring, see `backend/PASHA_RENDER_SETUP.md`.

## Render deployment

This repo now includes a `render.yaml` blueprint for deploying the backend, frontend, and Postgres.

The backend deployment runs Prisma migrations with `npm run prisma:deploy` before start, so the support chat tables are created automatically on deploy.

If you connect the blueprint in Render, you still need to review the secret environment variables that are marked `sync: false`, especially `CORS_ORIGINS` and `FRONTEND_PRODUCTION_URL`.
