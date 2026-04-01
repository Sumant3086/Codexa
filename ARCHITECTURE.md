# Architecture Note

## Overview

Ajaia Docs is a full-stack collaborative document editor. The architecture is intentionally simple — a single Express API, a React SPA, and a SQLite database — chosen to maximize delivery speed within the 4-6 hour timebox while keeping every layer production-replaceable.

---

## What I Prioritized

**Core product (built fully):**
- Rich-text editing via TipTap (ProseMirror-based) with bold, italic, underline, headings, lists, alignment, undo/redo
- Autosave with 1.5s debounce + manual save button with visual state (saved / saving / unsaved)
- Document CRUD: create, rename (inline), delete, reopen
- File import: `.txt`, `.md`, `.docx` → editable document (mammoth for .docx)
- Sharing model: owner grants view or edit access per user, can revoke anytime
- Access control enforced at both API level (403) and UI level (disabled editor + "View Only" badge)
- JWT authentication with seeded demo users (no registration flow needed for demo)
- SQLite persistence with WAL mode and foreign key enforcement
- 15 automated API tests covering auth, document CRUD, and sharing logic end-to-end

**Intentionally skipped:**
- Real-time collaboration (WebSockets/Y.js CRDTs) — correct call for a timebox; would be the first stretch feature
- Email-based sharing invites — replaced with a user picker (simpler, same intent)
- Document version history — append-only `document_versions` table would be straightforward to add
- Export to PDF/Markdown — TipTap has a markdown serializer; PDF would need puppeteer or similar
- User registration — seeded accounts keep scope tight; auth flow is real (JWT, bcrypt)

---

## Stack Decisions

**TipTap** over Quill or Slate
ProseMirror-based, best React integration, excellent extension ecosystem. StarterKit covers all required formatting in one import. The JSON document model is clean to store and restore.

**SQLite (better-sqlite3)** over Postgres
Zero infrastructure setup, synchronous API simplifies route handlers, WAL mode handles concurrent reads fine at this scale. The schema is straightforward to migrate to Postgres via Knex or Drizzle if needed.

**JWT in localStorage** over sessions
Simpler for a demo with no server-side session store. Production would use httpOnly cookies with CSRF protection.

**CSS Modules** over Tailwind
Faster to write precise, scoped styles without utility class noise. No PostCSS config needed.

**Node.js `node:test`** over Jest/Vitest
Zero additional dependencies, ships with Node 18+. Sufficient for integration-level API tests.

---

## Data Model

```
users
  id            TEXT PRIMARY KEY
  email         TEXT UNIQUE NOT NULL
  name          TEXT NOT NULL
  password_hash TEXT NOT NULL
  created_at    TEXT

documents
  id         TEXT PRIMARY KEY
  title      TEXT NOT NULL
  content    TEXT NOT NULL          -- TipTap JSON string
  owner_id   TEXT → users.id
  created_at TEXT
  updated_at TEXT

document_shares
  id              TEXT PRIMARY KEY
  document_id     TEXT → documents.id  (CASCADE DELETE)
  shared_with_id  TEXT → users.id
  permission      TEXT  ('view' | 'edit')
  created_at      TEXT
  UNIQUE(document_id, shared_with_id)
```

Content is stored as a TipTap JSON string (ProseMirror document model), which preserves all formatting structure. Files uploaded as `.docx` are converted to HTML by mammoth and stored as `{ "__html": "..." }` — the editor detects this on load and imports it via `setContent(html)`.

---

## Request Flow

```
Browser → Vite proxy (dev) / Express static (prod)
       → POST /api/auth/login        → JWT issued
       → GET  /api/documents         → owned + shared list
       → GET  /api/documents/:id     → doc + shares (auth + access check)
       → PATCH /api/documents/:id    → save (owner or edit-permission only)
       → POST /api/documents/:id/share → grant access (owner only)
       → POST /api/upload            → file → new document
```

---

## What I'd Build Next (2-4 more hours)

1. **Real-time presence** — Socket.io room per document, broadcast cursor positions and content deltas using Y.js CRDT
2. **Version history** — append-only `document_versions` table, UI to browse and restore snapshots
3. **Export** — Markdown via TipTap's markdown serializer; PDF via puppeteer or a print stylesheet
4. **Commenting** — inline comment anchors stored as ProseMirror marks, threaded replies in a sidebar
5. **Proper auth hardening** — httpOnly cookies, refresh tokens, CSRF protection
