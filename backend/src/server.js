require('dotenv').config();
const app = require('./app');
const db = require('./config/db');
const { seedDatabase } = require('./seed/seedData');
const { TABLES } = require('./models/schema');

const PORT = process.env.PORT || 5000;

// Auto-seed database if empty
const existingUsers = db.getAll(TABLES.USERS);
if (existingUsers.length === 0) {
  console.log('[Server] Database is empty. Bootstrapping realistic SIH demo dataset...');
  seedDatabase();
} else {
  console.log(`[Server] Database loaded. Found ${existingUsers.length} existing users.`);
}

const server = app.listen(PORT, () => {
  console.log(`
=============================================================
  INSPECTRA PRO: ASSET INSPECTION & COMPLIANCE SYSTEM
=============================================================
  * API Server:        http://localhost:${PORT}
  * Health Endpoint:   http://localhost:${PORT}/api/health
  * Environment:       ${process.env.NODE_ENV || 'development'}
  * Database:          Persistent Store (Auto-seeded)
  * Demo Credentials:
    - Admin:       admin@inspection.gov.in / Password123!
    - Director:    director@inspection.gov.in / Password123!
    - Supervisor:  supervisor@inspection.gov.in / Password123!
    - Inspector:   rajesh.sharma@inspection.gov.in / Password123!
=============================================================
  `);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('[Server] Process terminated safely.');
    process.exit(0);
  });
});
