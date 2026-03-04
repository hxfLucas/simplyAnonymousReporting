# Copilot Instructions

## Architecture Overview

Monorepo with two independent apps — no shared packages:
- **`backend/`** — Express 5 + TypeScript + TypeORM + PostgreSQL
- **`frontend/`** — React 19 + Vite + MUI + React Router 7

### Backend module structure

Each feature lives under `src/modules/<name>/` and follows this layout:
```
users.entity.ts      # TypeORM entity (decorator-based)
users.routes.ts      # Express Router — wires middleware + handler functions
users.handler.ts     # Request/response layer, reads req, calls service, writes res
users.service.ts     # Business logic + authorization; throws plain errors with .status
```

## Critical Backend Patterns

### DataSource singleton
Always use `getAppDataSource()` from `src/shared/database/data-source.ts`. **Never** import `AppDataSource` directly — `createApp()` accepts an injectable `dataSource` for tests so the singleton can be swapped. `MagicLinksService` currently imports `AppDataSource` directly, which is a known inconsistency to fix when touching that module.

### Authentication flow
- `jwtGuard` reads the JWT access token from the `access_token` **HTTP-only cookie**, verifies it, sets `req.user` (the decoded payload), and runs the next handler inside `AsyncLocalStorage` via `runWithAuthUser`.
- `ensureAdmin` = `jwtGuard` + `role === 'admin'` check.
- `ensureManager` = equivalent guard for manager role.
- Refresh tokens are stored in **localStorage** on the client; the backend `/auth/refresh-tokens` endpoint issues a new pair.

### Error handling convention
Throw plain `Error` objects with a `.status` number property from service and handler code. The global `errorHandler` middleware (`src/shared/middleware/errorHandler.ts`) reads `err.status` and forwards it as the HTTP status code.

```ts
const err: any = new Error('Forbidden');
err.status = 403;
throw err;
```

### Database migrations
`synchronize` is **false**. Always generate and run migrations explicitly from the `backend/` directory:
```sh
# Generate
npx typeorm-ts-node-commonjs migration:generate -d src/shared/database/data-source.ts src/migrations/<NAME>
# Run
npx typeorm-ts-node-commonjs migration:run -d src/shared/database/data-source.ts
```

## Frontend Patterns

### API layer
All HTTP calls go through the Axios instance in `src/api/axios.ts` (`withCredentials: true`, base URL from `VITE_API_URL`). It includes a response interceptor that automatically retries once with a refreshed token on 401. Add new endpoints as functions in `src/api/*.api.ts`, not inline in components.

### Auth state
`AuthContext` (`src/contexts/AuthContext.tsx`) holds the current `SessionUser`. Access it with `useAuthContext()`. It hydrates via `checkSession()` on mount. Call `signOut()` from context to clear state and the stored refresh token.

### View layout
- `src/views/acp/` — admin control panel views (users, reports)
- `src/views/auth/` — sign-in / sign-up

## Developer Workflows

| Task | Command (run from app dir) |
|---|---|
| Backend dev server | `npm run dev` |
| Backend build | `npm run build` |
| Backend tests | `npm test` |
| Frontend dev server | `npm run dev` |
| Frontend production build | `npm run build` |

### Required environment variables (backend)
`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ALLOWED_ORIGINS`, `PORT` (default `3000`)

### Required environment variables (frontend)
`VITE_API_URL` (default `http://localhost:3000`)

## Testing
Backend tests use **`pg-mem`** for an in-memory Postgres instance and **`supertest`** for HTTP integration. Pass a test `DataSource` to `createApp(dataSource)` to isolate tests from the real DB.
