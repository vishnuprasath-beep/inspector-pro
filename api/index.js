const app = require('../backend/src/app');

// Seed database on cold start if empty
try {
  const seedDatabase = require('../backend/src/seed/seedData');
  seedDatabase();
} catch (e) {
  console.log('[Serverless Init] Seed check:', e.message);
}

module.exports = (req, res) => {
  return app(req, res);
};
