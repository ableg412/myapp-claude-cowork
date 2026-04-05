const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new Database('./visionai.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Seed hardcoded user
const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get('Abel');
if (!existingUser) {
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('Abel', '1234');
}

// Seed dummy contacts
const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
if (contactCount.count === 0) {
  const insertContact = db.prepare(
    'INSERT INTO contacts (name, email, company, status, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const contacts = [
    ['John Smith',     'john.smith@techcorp.io',    'TechCorp Inc.',       'Active',   '2024-11-03'],
    ['Sarah Johnson',  'sarah@brightmedia.co',       'Bright Media Co.',    'Active',   '2024-11-15'],
    ['Marcus Lee',     'marcus.lee@nexusgroup.com',  'Nexus Group',         'Prospect', '2024-12-01'],
    ['Priya Patel',    'priya@startupx.io',          'StartupX',            'Active',   '2024-12-10'],
    ['David Kim',      'david.kim@growlab.com',      'GrowLab Agency',      'Inactive', '2025-01-04'],
    ['Olivia Turner',  'olivia@turnerbrands.net',    'Turner Brands',       'Active',   '2025-01-18'],
    ['Ethan Brooks',   'e.brooks@cloudventures.io',  'Cloud Ventures',      'Prospect', '2025-02-02'],
    ['Aisha Morales',  'aisha@moredesign.com',       'More Design Studio',  'Active',   '2025-02-20'],
  ];
  contacts.forEach(c => insertContact.run(...c));
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'visionai-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Landing Page
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user || null });
});

// Login GET
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

// Login POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (user) {
    req.session.user = { id: user.id, username: user.username };
    return res.redirect('/dashboard');
  }
  res.render('login', { error: 'Invalid username or password. Please try again.' });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  res.render('dashboard', { user: req.session.user, contacts, page: 'overview' });
});

// Contacts
app.get('/contacts', requireAuth, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts').all();
  res.render('contacts', { user: req.session.user, contacts });
});

// Analytics (static page)
app.get('/analytics', requireAuth, (req, res) => {
  res.render('analytics', { user: req.session.user });
});

// Settings (static page)
app.get('/settings', requireAuth, (req, res) => {
  res.render('settings', { user: req.session.user });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ VisionAI server running at http://localhost:${PORT}`);
});
