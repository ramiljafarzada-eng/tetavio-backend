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
