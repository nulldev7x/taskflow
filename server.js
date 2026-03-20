const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.static('public'));
app.use(cookieSession({
  name: 'session',
  keys: ['taskflow-secret-key'],
  maxAge: 24 * 60 * 60 * 1000 
}));


app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

const checkAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

app.get('/api/tasks', checkAuth, (req, res) => {
  const { filter } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  if (filter === 'pending') query += ' AND completed = 0';
  if (filter === 'completed') query += ' AND completed = 1';
  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(req.session.userId);
  res.json(rows);
});

app.post('/api/tasks', checkAuth, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const stmt = db.prepare('INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)');
  const info = stmt.run(req.session.userId, title, description);
  res.json({ id: info.lastInsertRowid, title, description, completed: 0 });
});

app.put('/api/tasks/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;
  
  const stmt = db.prepare('UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), completed = COALESCE(?, completed) WHERE id = ? AND user_id = ?');
  stmt.run(title, description, completed, id, req.session.userId);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, req.session.userId);
  res.json({ success: true });
});

app.get('/api/stats', checkAuth, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as total, SUM(completed) as completed FROM tasks WHERE user_id = ?').get(req.session.userId);
  res.json({
    total: count.total || 0,
    completed: count.completed || 0,
    pending: (count.total || 0) - (count.completed || 0)
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
