const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const ALLOWED_TYPES = ['text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.docx'];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  },
});

// POST /api/upload - upload a file and create a new document
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = '.' + req.file.originalname.split('.').pop().toLowerCase();
  const title = req.file.originalname.replace(/\.[^.]+$/, '') || 'Imported Document';

  let htmlContent = '';

  try {
    if (ext === '.docx') {
      const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
      htmlContent = result.value;
    } else {
      // .txt or .md - wrap plain text in paragraphs
      const text = req.file.buffer.toString('utf-8');
      htmlContent = text
        .split('\n')
        .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p></p>')
        .join('');
    }

    // Store as HTML string (TipTap can import HTML)
    const id = uuidv4();
    db.prepare(`
      INSERT INTO documents (id, title, content, owner_id)
      VALUES (?, ?, ?, ?)
    `).run(id, title, JSON.stringify({ __html: htmlContent }), req.user.id);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.status(201).json(doc);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
