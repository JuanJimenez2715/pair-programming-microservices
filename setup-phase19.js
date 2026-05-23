const fs = require('fs');
const path = require('path');

// 1. ms-auth seeder
const msAuthAppPath = path.join(__dirname, 'ms-auth/src/app.js');
let msAuthApp = fs.readFileSync(msAuthAppPath, 'utf8');

if (!msAuthApp.includes('seedUsers')) {
  const seederCode = `
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedUsers() {
  try {
    const count = await User.count();
    if (count === 0) {
      console.log('Seeding default users...');
      const pw = await bcrypt.hash('password123', 10);
      await User.bulkCreate([
        { id: '11111111-1111-1111-1111-111111111111', username: 'admin', email: 'admin@pair.com', passwordHash: pw, role: 'admin' },
        { id: '22222222-2222-2222-2222-222222222222', username: 'student1', email: 'student1@pair.com', passwordHash: pw, role: 'student' },
        { id: '33333333-3333-3333-3333-333333333333', username: 'student2', email: 'student2@pair.com', passwordHash: pw, role: 'student' },
      ]);
      console.log('Default users seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding users', err);
  }
}
`;
  
  msAuthApp = msAuthApp.replace(
    "logger.info('Database synced');",
    "logger.info('Database synced');\n    await seedUsers();"
  );
  msAuthApp = seederCode + '\n' + msAuthApp;
  fs.writeFileSync(msAuthAppPath, msAuthApp);
}

// 2. ms-pairing seeder
const msPairingAppPath = path.join(__dirname, 'ms-pairing/src/app.js');
let msPairingApp = fs.readFileSync(msPairingAppPath, 'utf8');

if (!msPairingApp.includes('seedSessions')) {
  const pairingSeederCode = `
const { Session, SessionUser } = require('./models');

async function seedSessions() {
  try {
    const count = await Session.count();
    if (count === 0) {
      console.log('Seeding default session...');
      await Session.create({
        id: 'test-session-001',
        title: 'Sesión de Prueba Global',
        status: 'active',
        settings: { language: 'javascript' }
      });
      // Añadir student1 como driver y student2 como navigator
      await SessionUser.bulkCreate([
        { SessionId: 'test-session-001', userId: '22222222-2222-2222-2222-222222222222', role: 'driver' },
        { SessionId: 'test-session-001', userId: '33333333-3333-3333-3333-333333333333', role: 'navigator' }
      ]);
      console.log('Default session seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding sessions', err);
  }
}
`;
  
  msPairingApp = msPairingApp.replace(
    "logger.info('ms-pairing DB synced');",
    "logger.info('ms-pairing DB synced');\n    await seedSessions();"
  );
  msPairingApp = pairingSeederCode + '\n' + msPairingApp;
  fs.writeFileSync(msPairingAppPath, msPairingApp);
}

// 3. UI Polish - index.css
const indexCssPath = path.join(__dirname, 'frontend/src/index.css');
const polishedCss = `:root {
  --bg-color: #0f172a;
  --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  --panel-bg: rgba(30, 41, 59, 0.7);
  --panel-border: rgba(255, 255, 255, 0.1);
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --secondary: #ec4899;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --danger: #ef4444;
  --success: #10b981;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-gradient);
  background-attachment: fixed;
  color: var(--text-main);
  min-height: 100vh;
  line-height: 1.5;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Typography */
h1, h2, h3 {
  font-weight: 600;
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
}

/* Layout */
.app-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Glassmorphism Panels */
.glass-panel {
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Buttons */
button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.23);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--panel-border);
  color: white;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: var(--primary);
}

/* Login/Register Specific */
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
}

.auth-box {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.auth-box h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(to right, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Session Workspace */
.session-workspace {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  gap: 1rem;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.workspace-main {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

/* Badges */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge.active { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.badge.waiting { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.badge.driver { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
.badge.navigator { background: rgba(236, 72, 153, 0.2); color: #f472b6; }

/* Dashboard Cards */
.session-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.session-card {
  padding: 1.5rem;
  cursor: pointer;
}

.session-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--panel-border);
}

.navbar h1 {
  font-size: 1.25rem;
  margin: 0;
  background: linear-gradient(to right, #a855f7, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
fs.writeFileSync(indexCssPath, polishedCss);

// 4. Polish Navbar
const navbarPath = path.join(__dirname, 'frontend/src/components/Navbar.jsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');
navbarContent = navbarContent.replace('<h1>Pair Programming</h1>', '<h1>✨ IntelliPair</h1>');
fs.writeFileSync(navbarPath, navbarContent);

// 5. Polish Login
const loginPath = path.join(__dirname, 'frontend/src/pages/Login.jsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');
if (!loginContent.includes('auth-container')) {
  loginContent = loginContent.replace('<div className="login-container">', '<div className="auth-container fade-in">');
  loginContent = loginContent.replace('<form onSubmit={handleSubmit}>', '<div className="glass-panel auth-box">\n        <h2>Welcome Back</h2>\n        <form onSubmit={handleSubmit}>');
  loginContent = loginContent.replace('</form>', '</form>\n        <p style={{marginTop:"1rem", color:"var(--text-muted)", fontSize:"0.8rem"}}>Try: student1@pair.com / password123</p>\n      </div>');
  fs.writeFileSync(loginPath, loginContent);
}

// 6. Polish Dashboard
const dashPath = path.join(__dirname, 'frontend/src/pages/Dashboard.jsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
if (!dashContent.includes('session-grid')) {
  dashContent = dashContent.replace('<ul>', '<div className="session-grid">');
  dashContent = dashContent.replace('</ul>', '</div>');
  dashContent = dashContent.replace(
    '<li key={session.id} style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "1rem" }}>',
    '<div key={session.id} className="glass-panel session-card" onClick={() => window.location.href=`/session/${session.id}`}>'
  );
  dashContent = dashContent.replace('</li>', '</div>');
  dashContent = dashContent.replace('<Link to={`/session/${session.id}`}>Join Session</Link>', '');
  fs.writeFileSync(dashPath, dashContent);
}

console.log('Phase 19 Seeder & UI Polish complete');
