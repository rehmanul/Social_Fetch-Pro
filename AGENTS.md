# Repository Guidelines

## Project Structure & Module Organization
- `client/` Vite + React UI; `src/components` for reusable UI, `pages` for routed views, `hooks` + `lib` for data helpers; static assets in `client/public`.
- `server/` Express API; `app.ts` wires middleware, `routes.ts` and `scrapers.ts` coordinate job orchestration, `storage.ts`/`storage-db.ts` persist state, and `index-*.ts` start dev/prod servers.
- `shared/` cross-layer types and Drizzle schema (`schema.ts`); keep contracts in sync with both client and server.
- `.data/` runtime store for jobs/accounts; never commit it. Deployment settings live in `render.yaml`.

## Build, Test, and Development Commands
- `npm install` syncs dependencies.
- `npm run dev` starts the TSX-powered API and Vite client on port 5000; use this for end-to-end development.
- `npm run build` bundles the client (Vite) and API (esbuild) into `dist/` for production.
- `npm start` serves the built assets from `dist/` and respects `PORT` in production environments.
- `npm run check` executes `tsc --noEmit` across `client/`, `server/`, and `shared/`.
- `npm run db:push` applies Drizzle migrations based on `drizzle.config.ts`; run before deploying schema changes.

## Coding Style & Naming Conventions
- TypeScript + ESM with strict mode and 2-space indentation; keep imports ordered and explicit.
- React components stay functional and typed; PascalCase for components/files, camelCase for hooks/utilities.
- Use Tailwind utility classes consistently; prefer `clsx`/`class-variance-authority` for conditional styling and align with `design_guidelines.md` for visual decisions.
- Keep side effects at API boundaries; favor `async/await` with explicit return types instead of implicit promises.

## Testing Guidelines
- No test runner is configured; add targeted tests when altering core flows. Place client specs in `client/src/__tests__` and server specs in `server/__tests__`, naming files `*.test.ts(x)` (ignored by `tsconfig` builds).
- Manually exercise scraper endpoints and dashboards: create a job, verify `scrapers.ts` logging, confirm persistence under `.data/`.
- Avoid mock or sample data in commits; use sanitized real responses where fixtures are required to validate production behavior.
- Aim for smoke coverage of job creation, account pool changes, and dashboard rendering before merging.

## Commit & Pull Request Guidelines
- Adopt Conventional Commits (`feat:`, `fix:`, `chore:`); short, imperative subjects (e.g., `fix: stabilize tiktok cookie rotation`). Use branches like `feature/<summary>` or `fix/<issue-id>`.
- PRs must include scope, risk/rollback notes, affected endpoints/pages, and screenshots or short recordings for UI changes. Reference related issues and environment changes (.env keys, migrations) explicitly.
- Verify `npm run check`, build, and relevant manual checks before requesting review; note any gaps honestly.

## Security & Configuration Tips
- Store platform cookies/session IDs only in `.env`; never commit credentials or `.data/` contents.
- Provision persistent storage for `.data/` in all deployments (see `render.yaml`) to preserve job history and credentials across restarts.
- Disable or remove unused credentials promptly; rotate compromised cookies immediately and document rotations in PR notes.
