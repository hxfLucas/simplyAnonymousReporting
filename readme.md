backend - the backend built in nodejs (express)
frontend - the frontend of the app built in reactJs

useful commands:

npx typeorm-ts-node-commonjs migration:generate -d src/shared/database/data-source.ts src/migrations/init

npx typeorm-ts-node-commonjs migration:run -d src/shared/database/data-source.ts

Dev environment setup:

Frontend:

cd frontend
npm install
npm run dev

rename .envExample to .env


Backend:



cd backend
rename .envExample to .env
Create a postgres database locally and replace the details from the  .envExample with it

## Backend Required Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | PostgreSQL hostname |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | | PostgreSQL username |
| `POSTGRES_PASSWORD` | | PostgreSQL password |
| `POSTGRES_DB` | | PostgreSQL database name |
| `JWT_ACCESS_SECRET` | | Secret for signing JWT access tokens |
| `JWT_REFRESH_SECRET` | | Secret for signing JWT refresh tokens |
| `CORS_ALLOWED_ORIGINS` | | Comma-separated list of allowed CORS origins |
| `PORT` | `3000` | HTTP server port |
| `REDIS_HOST` | `localhost` | Redis hostname for BullMQ queue |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis AUTH password (optional) |
npm install npm run dev


frontend tests:
npm test

backend tests:
npm run test