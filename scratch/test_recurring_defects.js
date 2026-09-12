const { analyzeRecurrence } = require('../backend/src/controllers/defectController');

console.log('====================================================');
console.log('TESTING RECURRING ISSUE DETECTION ENGINE');
console.log('====================================================\n');

const inspections = [
  { id: 'insp-101', site_id: 'site-metro', zone_id: 'zone-pier-14' },
  { id: 'insp-102', site_id: 'site-metro', zone_id: 'zone-pier-14' },
  { id: 'insp-103', site_id: 'site-metro', zone_id: 'zone-pier-14' },
  { id: 'insp-104', site_id: 'site-coastal', zone_id: 'zone-tunnel' }
];

const existingDefects = [
  {
    id: 'def-prior-01',
    inspection_id: 'insp-101',
    site_id: 'site-metro',
    zone_id: 'zone-pier-14',
    title: 'Pier 14 concrete crack and spalling',
    description: 'Structural spalling observed on south face with visible rebar rust',
    location_details: 'Pier 14 South Face'
  },
  {
    id: 'def-prior-02',
    inspection_id: 'insp-102',
    site_id: 'site-metro',
    zone_id: 'zone-pier-14',
    title: 'Severe rebar corrosion and spalling',
    description: 'Spalling expanding on pier 14 south face rebar ties',
    location_details: 'Pier 14 South Face elevation 2.5m'
  }
];

// Test 1: New defect logged at same site & zone with similar keywords
const newRecurringDefect = {
  id: 'def-new-03',
  inspection_id: 'insp-103',
  site_id: 'site-metro',
  zone_id: 'zone-pier-14',
  title: 'Concrete spalling and crack reoccurrence',
  description: 'Ongoing spalling on pier 14 with rust bleeding on rebar',
  location_details: 'Pier 14 South Face'
};

const recurrence1 = analyzeRecurrence(newRecurringDefect, existingDefects, inspections);
console.log('[1] Recurrence Analysis Result:');
console.log('    is_recurring:    ', recurrence1.is_recurring);
console.log('    recurrence_count:', recurrence1.recurrence_count);
console.log('    prior_defect_ids:', recurrence1.prior_defect_ids);

if (!recurrence1.is_recurring) {
  throw new Error('Expected is_recurring to be true');
}
if (recurrence1.recurrence_count !== 3) {
  throw new Error(`Expected recurrence_count 3, got ${recurrence1.recurrence_count}`);
}
if (!recurrence1.prior_defect_ids.includes('def-prior-01') || !recurrence1.prior_defect_ids.includes('def-prior-02')) {
  throw new Error('Failed to link all prior defect IDs');
}
console.log('    ✓ Correctly linked prior occurrences def-prior-01 and def-prior-02');

// Test 2: Distinct defect at different site or no matching keywords
const nonRecurringDefect = {
  id: 'def-new-04',
  inspection_id: 'insp-104',
  site_id: 'site-coastal',
  zone_id: 'zone-tunnel',
  title: 'Lighting fixture loose wiring',
  description: 'Overhead conduit loose bracket near vent shaft 2',
  location_details: 'Vent Shaft 2'
};

const recurrence2 = analyzeRecurrence(nonRecurringDefect, existingDefects, inspections);
console.log('\n[2] Distinct Non-recurring Defect:');
console.log('    is_recurring:    ', recurrence2.is_recurring);
console.log('    recurrence_count:', recurrence2.recurrence_count);

if (recurrence2.is_recurring !== false || recurrence2.recurrence_count !== 1) {
  throw new Error('Expected non-recurring defect to have is_recurring=false, recurrence_count=1');
}
console.log('    ✓ Correctly classified as isolated, non-recurring defect');

console.log('\n====================================================');
console.log('RECURRING DEFECT ENGINE TESTS PASSED (100%)');
console.log('====================================================');
