# Submission

**Candidate:** Sumant Yadav (sumantyadav3086@gmail.com)
**Assignment:** Ajaia AI-Native Full Stack Developer

---

## Deliverables Checklist

| Item | Status |
|------|--------|
| Source code | ✅ |
| README.md (setup + run instructions) | ✅ |
| ARCHITECTURE.md | ✅ |
| AI_WORKFLOW.md | ✅ |
| SUBMISSION.md | ✅ (this file) |
| Live deployment URL | ✅ https://ajaia-docs.onrender.com |
| Walkthrough video | [ add Loom/YouTube link ] |

---

## Live Deployment

**URL:** https://codexa-1v3q.onrender.com

**Demo credentials** (all use password `password123`):

| User          | Email           |
|---------------|-----------------|
| Alice Johnson | alice@demo.com  |
| Bob Smith     | bob@demo.com    |
| Carol White   | carol@demo.com  |

---

## Requirements Coverage

### 1. Document Creation and Editing
- [x] Create a new document (dashboard → "New Document")
- [x] Rename a document (click title in editor, edit inline)
- [x] Edit document content in browser (TipTap rich-text editor)
- [x] Save and reopen documents (autosave + SQLite persistence)
- [x] Bold, italic, underline
- [x] Headings (H1, H2, H3)
- [x] Bullet lists and numbered lists
- [x] Text alignment (left, center, right)
- [x] Strikethrough, horizontal rule, undo/redo

### 2. File Upload
- [x] Upload `.txt` → new editable document
- [x] Upload `.md` → new editable document
- [x] Upload `.docx` → converted via mammoth → new editable document
- [x] Unsupported types rejected with clear UI error
- [x] File size limit: 5MB
- [x] Supported types stated clearly in UI ("Supports .txt, .md, .docx")

### 3. Sharing
- [x] Document owner model
- [x] Grant view-only access to another user
- [x] Grant edit access to another user
- [x] Upgrade/downgrade permission (re-share with different permission)
- [x] Revoke access
- [x] Owned documents shown with "Owner" badge
- [x] Shared documents shown with "Can Edit" or "View Only" badge
- [x] View-only enforced at API level (403 on PATCH) and UI level (disabled editor)

### 4. Persistence
- [x] Documents persist after page refresh
- [x] TipTap JSON format preserves all formatting structure
- [x] Sharing relationships persist
- [x] SQLite with WAL mode (data/ajaia.db)

### 5. Engineering Quality
- [x] Clear setup and run instructions (README.md)
- [x] Working deployment (Render)
- [x] Input validation and error handling throughout
- [x] 15 automated API tests (auth, documents, sharing) — 100% passing
- [x] Architecture note (ARCHITECTURE.md)
- [x] AI workflow note (AI_WORKFLOW.md)

---

## What Works End-to-End

Everything listed above is fully functional. The complete user flow:

1. Log in with a demo account
2. Create a new document or import a file
3. Edit with rich-text formatting — autosaves every 1.5s
4. Rename the document by clicking the title
5. Share with another user (view or edit)
6. Log in as that user — see the document under "Shared with Me"
7. Edit (if edit permission) or read-only view (if view permission)
8. Original owner can revoke access at any time

---

## What's Incomplete / Would Build Next

**Not built (out of scope for timebox):**
- Real-time collaboration (Y.js CRDT + WebSockets)
- Document version history
- Export to PDF or Markdown
- Email-based sharing invites
- Commenting / suggestion mode
- User registration (seeded accounts used instead)

**With 2-4 more hours I would add:**
1. Real-time presence indicators (Socket.io, show who's viewing)
2. Document version history (snapshot on save, restore UI)
3. Markdown export (TipTap has a built-in serializer)

---

## Walkthrough Video

[ Add Loom or YouTube link here ]
