const db = require('../backend/src/config/db');
const { seedDatabase } = require('../backend/src/seed/seedData');
const { TABLES, SEVERITIES } = require('../backend/src/models/schema');
const { calculateSiteSafetyScore } = require('../backend/src/controllers/siteController');

console.log('====================================================');
console.log('TESTING MATHEMATICAL TRANSPARENT SAFETY SCORING');
console.log('====================================================\n');

// Seed database first
seedDatabase();

const sites = db.getAll(TABLES.SITES);
console.log(`Loaded ${sites.length} registered facilities from db.`);

const site1 = sites[0];
const result1 = calculateSiteSafetyScore(site1.id);
console.log(`[1] Facility "${site1.name}" Safety Score:`, result1.safety_score, `(Grade: ${result1.grade})`);
console.log('    Metrics:', result1.metrics);
console.log('    Deductions:', result1.deductions);
console.log('    Bonuses:', result1.bonuses);

if (typeof result1.safety_score !== 'number' || result1.safety_score < 0 || result1.safety_score > 100) {
  throw new Error(`Invalid safety score value: ${result1.safety_score}`);
}

// Test custom scenario: Insert a test site with known defects
const testSiteId = 'site-math-test';
db.insert(TABLES.SITES, {
  id: testSiteId,
  name: 'Mathematical Verification Site',
  code: 'MATH-01'
});

// Insert 1 critical (-15), 1 high (-8), 1 medium (-3), 1 recurring (-10)
db.insert(TABLES.DEFECTS, {
  id: 'def-t1',
  site_id: testSiteId,
  severity: SEVERITIES.CRITICAL,
  status: 'OPEN',
  is_recurring: false
});
db.insert(TABLES.DEFECTS, {
  id: 'def-t2',
  site_id: testSiteId,
  severity: SEVERITIES.HIGH,
  status: 'OPEN',
  is_recurring: false
});
db.insert(TABLES.DEFECTS, {
  id: 'def-t3',
  site_id: testSiteId,
  severity: SEVERITIES.MEDIUM,
  status: 'OPEN',
  is_recurring: false
});
db.insert(TABLES.DEFECTS, {
  id: 'def-t4',
  site_id: testSiteId,
  severity: SEVERITIES.MEDIUM,
  status: 'OPEN',
  is_recurring: true
});

// Insert 1 compliant inspection (+5)
db.insert(TABLES.INSPECTIONS, {
  id: 'insp-t1',
  site_id: testSiteId,
  status: 'COMPLETED',
  compliance_score: 95
});

// Formula: 100 - 15 (critical) - 8 (high) - 3 (medium) - 3 (medium) - 10 (recurring) + 5 (bonus) = 66
const expectedScore = 100 - 15 - 8 - 6 - 10 + 5;
const testResult = calculateSiteSafetyScore(testSiteId);

console.log(`\n[2] Controlled Math Test Facility Safety Score:`, testResult.safety_score, `(Grade: ${testResult.grade})`);
console.log('    Expected:', expectedScore, 'Actual:', testResult.safety_score);
console.log('    Itemized Deductions:', testResult.deductions.map(d => `${d.reason}: ${d.points}`));
console.log('    Itemized Bonuses:', testResult.bonuses.map(b => `${b.reason}: ${b.points}`));

if (testResult.safety_score !== expectedScore) {
  throw new Error(`Expected score ${expectedScore}, got ${testResult.safety_score}`);
}

console.log('\n====================================================');
console.log('TRANSPARENT SAFETY SCORE TESTS PASSED (100%)');
console.log('====================================================');
