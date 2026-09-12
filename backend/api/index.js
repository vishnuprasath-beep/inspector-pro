const app = require('../src/app');
const db = require('../src/config/db');
const { seedDatabase } = require('../src/seed/seedData');
const { TABLES } = require('../src/models/schema');

try {
  const users = db.getAll(TABLES.USERS);
  if (!users || users.length === 0) {
    seedDatabase();
  }
} catch (e) {
  console.log('[Serverless Init] Seed check:', e.message);
}

module.exports = app;
