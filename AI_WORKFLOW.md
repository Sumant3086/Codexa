# AI Workflow Note

## Tools Used

- **Kiro** (Claude-based AI IDE) — primary assistant for the entire build

---

## Where AI Materially Sped Up Work

**Boilerplate scaffolding**
Express route structure, JWT middleware, SQLite schema, and seed data took ~5 minutes instead of ~30. These are standard patterns but tedious to type correctly from scratch.

**TipTap toolbar**
Mapping 15+ formatting commands to icon buttons with correct active-state detection would have required careful doc reading. AI produced a clean, working implementation on the first pass.

**CSS Modules**
Generating consistent, well-structured CSS for 6 components in parallel rather than writing each incrementally saved significant time.

**Test suite structure**
The Node.js `node:test` API (before/after lifecycle hooks, describe/test nesting, HTTP request helpers) was generated correctly without needing to look up the API reference.

**ShareModal logic**
The modal needed to filter already-shared users from the picker, show current access with correct badges, and handle revoke. AI got the data flow right immediately.

---

## What I Changed or Rejected

**DB compilation failure**
AI suggested `better-sqlite3@^9.4.3` which failed to compile on Node 22 (requires Python/node-gyp for native bindings). I diagnosed the error, identified that newer versions ship prebuilt binaries, and directed the fix to upgrade to latest.

**Content storage format**
AI initially suggested storing editor content as a plain HTML string. I changed it to TipTap JSON (ProseMirror document model) — more structured, easier to diff/version later, and the canonical TipTap format. Added a `{ __html }` wrapper specifically for uploaded file content so the editor can distinguish import vs native format.

**Port conflict in tests**
The test file required `index.js` which called `app.listen()` at module load time, causing `EADDRINUSE` when the dev server was already running. I identified the issue and directed the fix: guard `app.listen()` with `require.main === module` so tests can require the app without starting a server.

**CORS origin**
AI hardcoded `http://localhost:5173`. I changed it to read from `CLIENT_URL` env var so the same code works in production without modification.

**Axios base URL**
AI set `baseURL: 'http://localhost:3001'`. I changed it to `''` (empty string) so the Vite dev proxy handles routing in development and the same code works in production where Express serves both API and client.

**dotenv path**
AI's initial dotenv config used a relative path that broke depending on working directory. I fixed it to use `__dirname`-based absolute resolution.

---

## How I Verified Correctness

- Ran all 15 API tests after each significant change — 100% pass rate throughout
- Manually tested the full user flow: login → create doc → edit with formatting → autosave → share → switch user → verify access levels → revoke
- Tested file upload with a real `.docx` and a `.txt` file, verified content appeared correctly in the editor
- Confirmed view-only enforcement: API returns 403 on PATCH, UI shows disabled editor and "View Only" badge
- Reviewed all SQL queries for parameterization (no string interpolation in queries)
- Verified the DB path resolution works correctly from different working directories

---

## Judgment Calls

AI accelerates the mechanical parts of engineering — boilerplate, pattern matching, API lookups. The judgment layer — what to build, what to skip, how to structure data, where bugs actually are — still requires a developer who understands the full context. I used AI as a fast first draft and applied engineering judgment at every decision point.
