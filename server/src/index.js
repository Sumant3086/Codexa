if (!process.env.DB_PATH) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // same-origin in prod (Express serves the client)
    : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/upload', require('./routes/upload'));

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Only start listening when run directly (not when required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ajaia Docs server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
