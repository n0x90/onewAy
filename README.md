<img src="onewAy_logo.png" width="400">
# onewAy

onewAy is a red-team framework inspired by Armitage. It is split into a web server (frontend + API) and a Rust client that can execute modular functionality.

Project status: early development. Expect breaking changes and incomplete features.

## Repository Layout

- `server/frontend` - React + TypeScript UI (Vite + Tailwind).
- `server/backend` - FastAPI API, auth, websocket handling, database models, and Alembic migrations.
- `client` - Rust client implementation and websocket/API integration.

## Installation

For complete environment setup (dependencies, configuration, TLS, and first run), use [INSTALL.md](https://github.com/n0x90/onewAy/blob/main/INSTALL.md).

## Run Locally

After completing installation:

- Backend API: `cd server/backend && python run.py`
- Frontend dev server: `cd server/frontend && npm run dev`
- Rust client: `cd client && cargo run`

Default frontend URL: `https://localhost:5173`

## Development Commands

- Frontend lint: `cd server/frontend && npm run lint`
- Frontend build: `cd server/frontend && npm run build`
- Backend tests: `cd server/backend && pytest`
- Rust checks: `cd client && cargo check`
- Rust tests: `cd client && cargo test`

## Notes

- For local HTTPS, use a trusted development certificate matching your hostnames (for example: `localhost`, `127.0.0.1`, `::1`).
- If Metasploit integration is enabled (`[metasploit].active = true`), you must set `msfrpc_password` in `config.toml`.
- Use this software only in authorized testing environments.
