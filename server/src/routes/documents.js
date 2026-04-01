const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/documents - list owned + shared docs
router.get('/', (req, res) => {
  const owned = db.prepare(`
    SELECT id, title, owner_id, created_at, updated_at, 'owner' as role
    FROM documents WHERE owner_id = ?
    ORDER BY updated_at DESC
  `).all(req.user.id);

  const shared = db.prepare(`
    SELECT d.id, d.title, d.owner_id, d.created_at, d.updated_at,
           ds.permission as role, u.name as owner_name
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON u.id = d.owner_id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  // Attach owner name to owned docs
  const ownedWithName = owned.map(d => ({ ...d, owner_name: req.user.name }));

  res.json({ owned: ownedWithName, shared });
});

// POST /api/documents - create new document
router.post('/', (req, res) => {
  const { title = 'Untitled Document', content = '' } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO documents (id, title, content, owner_id)
    VALUES (?, ?, ?, ?)
  `).run(id, title.trim() || 'Untitled Document', content, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json(doc);
});

// GET /api/documents/:id - get single document
router.get('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === req.user.id;
  const share = db.prepare(
    'SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, req.user.id);

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const owner = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(doc.owner_id);
  const shares = isOwner
    ? db.prepare(`
        SELECT ds.*, u.name, u.email
        FROM document_shares ds
        JOIN users u ON u.id = ds.shared_with_id
        WHERE ds.document_id = ?
      `).all(req.params.id)
    : [];

  res.json({
    ...doc,
    role: isOwner ? 'owner' : share.permission,
    owner,
    shares,
  });
});

// PATCH /api/documents/:id - update title or content
router.patch('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === req.user.id;
  const share = db.prepare(
    'SELECT * FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, req.user.id);

  if (!isOwner && (!share || share.permission !== 'edit')) {
    return res.status(403).json({ error: 'Edit access required' });
  }

  const { title, content } = req.body;
  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title.trim() || 'Untitled Document'); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/documents/:id - owner only
router.delete('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete' });

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/documents/:id/share - share with another user
router.post('/:id/share', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can share' });

  const { user_id, permission = 'view' } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (!['view', 'edit'].includes(permission)) return res.status(400).json({ error: 'permission must be view or edit' });
  if (user_id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  const target = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user_id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare(`
    INSERT INTO document_shares (id, document_id, shared_with_id, permission)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(document_id, shared_with_id) DO UPDATE SET permission = excluded.permission
  `).run(uuidv4(), req.params.id, user_id, permission);

  res.json({ success: true, shared_with: target, permission });
});

// DELETE /api/documents/:id/share/:userId - revoke access
router.delete('/:id/share/:userId', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can revoke access' });

  db.prepare(
    'DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).run(req.params.id, req.params.userId);

  res.json({ success: true });
});

module.exports = router;
