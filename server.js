const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── In-Memory Data ───────────────────────────────────────────────────────────

const USERS = [
  { id: 1, username: 'Abel', password: '1234' }
];

const CONTACTS = [
  { id: 1, name: 'John Smith',    email: 'john.smith@techcorp.io',   company: 'TechCorp Inc.',      status: 'Active',   created_at: '2024-11-03' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@brightmedia.co',      company: 'Bright Media Co.',   status: 'Active',   created_at: '2024-11-15' },
  { id: 3, name: 'Marcus Lee',    email: 'marcus.lee@nexusgroup.com', company: 'Nexus Group',        status: 'Prospect', created_at: '2024-12-01' },
  { id: 4, name: 'Priya Patel',   email: 'priya@startupx.io',         company: 'StartupX',           status: 'Active',   created_at: '2024-12-10' },
  { id: 5, name: 'David Kim',     email: 'david.kim@growlab.com',     company: 'GrowLab Agency',     status: 'Inactive', created_at: '2025-01-04' },
  { id: 6, name: 'Olivia Turner', email: 'olivia@turnerbrands.net',   company: 'Turner Brands',      status: 'Active',   created_at: '2025-01-18' },
  { id: 7, name: 'Ethan Brooks',  email: 'e.brooks@cloudventures.io', company: 'Cloud Ventures',     status: 'Prospect', created_at: '2025-02-02' },
  { id: 8, name: 'Aisha Morales', email: 'aisha@moredesign.com',      company: 'More Design Studio', status: 'Active',   created_at: '2025-02-20' },
];

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
  const user = USERS.find(u => u.username === username && u.password === password);
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
  res.render('dashboard', { user: req.session.user, contacts: CONTACTS });
});

// Contacts
app.get('/contacts', requireAuth, (req, res) => {
  res.render('contacts', { user: req.session.user, contacts: CONTACTS });
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
