# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs — built for the Ajaia AI-Native Full Stack Developer assignment.

**Live demo:** https://codexa-1v3q.onrender.com
**Demo credentials:** See [Demo Accounts](#demo-accounts) below

---

## Features

- Rich-text editing: bold, italic, underline, strikethrough, H1/H2/H3, bullet lists, numbered lists, text alignment, undo/redo
- Autosave (1.5s debounce) with visual save indicator
- Document creation, renaming, and deletion
- File import: `.txt`, `.md`, `.docx` → new editable document
- Sharing: grant view-only or edit access per user, revoke anytime
- Dashboard with clear owned vs shared document distinction
- View-only enforcement (API-level 403 + UI disabled state)
- JWT authentication with 3 seeded demo users
- SQLite persistence — survives server restarts

---

## Quick Start (Local)

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone and install

```bash
git clone <repo-url>
cd ajaia-docs

# Install root dev deps
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` — at minimum set a strong `JWT_SECRET`:

```env
PORT=3001
JWT_SECRET=your-strong-random-secret-here
DB_PATH=../../data/ajaia.db
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run in development

Open two terminals:

```bash
# Terminal 1 — API server (port 3001)
cd server
npm run dev

# Terminal 2 — Vite dev server (port 5173)
cd client
npm run dev
```

Open http://localhost:5173

### 4. Run tests

```bash
cd server
npm test
```

All 15 tests should pass (auth, documents, sharing).

---

## Demo Accounts

All accounts use password: `password123`

| Name          | Email           | Notes                    |
|---------------|-----------------|--------------------------|
| Alice Johnson | alice@demo.com  | Owner of sample document |
| Bob Smith     | bob@demo.com    | —                        |
| Carol White   | carol@demo.com  | —                        |

### Sharing demo flow

1. Log in as **Alice** → open "Welcome to Ajaia Docs" → click **Share**
2. Share with **Bob** (choose view or edit permission)
3. Log out → log in as **Bob** → see the doc under "Shared with Me"
4. If Bob has edit access, he can modify the document
5. Log back in as Alice → revoke Bob's access from the Share modal

---

## File Upload

Supported formats: `.txt`, `.md`, `.docx` (max 5MB)

Click **Import File** on the dashboard. The file becomes a new editable document:

- `.txt` / `.md` → plain text converted to paragraphs
- `.docx` → converted to HTML via [mammoth](https://github.com/mwilliamson/mammoth.js), rendered in the editor

Unsupported file types are rejected with a clear error message.

---

## Production Build

```bash
# Build the client
cd client && npm run build && cd ..

# Start the server (serves built client + API)
NODE_ENV=production node server/src/index.js
```

The Express server serves the built React app from `client/dist` and handles all `/api/*` routes.

---

## Environment Variables

| Variable      | Default                 | Description                        |
|---------------|-------------------------|------------------------------------|
| `PORT`        | `3001`                  | Server port                        |
| `JWT_SECRET`  | `ajaia-dev-secret-...`  | JWT signing secret — change in prod |
| `DB_PATH`     | `../../data/ajaia.db`   | SQLite DB path (relative to `server/src/`) |
| `CLIENT_URL`  | `http://localhost:5173` | CORS allowed origin (dev only)     |
| `NODE_ENV`    | `development`           | Set to `production` for prod build |

---

## Project Structure

```
ajaia-docs/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # Editor, Toolbar, ShareModal
│       ├── pages/           # LoginPage, DashboardPage, EditorPage
│       ├── context/         # AuthContext (JWT state)
│       └── api.js           # Axios instance with auth interceptor
├── server/                  # Express API
│   └── src/
│       ├── routes/          # auth.js, documents.js, upload.js
│       ├── middleware/      # auth.js (JWT verification)
│       ├── tests/           # api.test.js (15 tests, node:test)
│       ├── db.js            # SQLite setup + seed data
│       └── index.js         # Express app entry point
├── data/                    # SQLite database (auto-created)
├── README.md
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
└── SUBMISSION.md
```

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite, TipTap, CSS Modules |
| Backend    | Node.js, Express                    |
| Database   | SQLite via better-sqlite3           |
| Auth       | JWT (jsonwebtoken + bcryptjs)       |
| File parse | mammoth (.docx), built-in (.txt/.md)|
| Testing    | Node.js built-in `node:test`        |
| Deploy     | Render (single web service)         |
