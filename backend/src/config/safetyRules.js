/**
 * Inspectra Pro — AI Safety Severity Engine & Detection Taxonomy
 * ===============================================================
 * UNIFIED YOLO26 TAXONOMY (20 Classes):
 *   PRIORITY 1 (PRIMARY):   CONSTRUCTION DEFECTS (IDs 0-5: Crack, Spalling, Honeycombing, Rebar, Surface Damage, Pothole)
 *   PRIORITY 2 (SECONDARY): PERSON / PPE SAFETY  (IDs 6-19: Fall, Gloves, Goggles, Hardhat, Vest, Person, etc.)
 * 
 * Strict Category Contract:
 *   - 'DEFECT' (Primary Construction Defect)
 *   - 'SAFETY' (Secondary Person / PPE Safety Item)
 * 
 * Severity Levels (Risk-Based, Decoupled from Confidence):
 *   - 'LOW'
 *   - 'MEDIUM'
 *   - 'HIGH'
 *   - 'CRITICAL'
 */

const path = require('path');
const fs = require('fs');

// 1. Canonical 20-Class Specification
const YOLO26_CLASSES = [
  "Crack",                   // 0: DEFECT
  "Spalling",                // 1: DEFECT
  "Honeycombing",            // 2: DEFECT
  "Exposed-Rebar",           // 3: DEFECT
  "Concrete-Surface-Damage", // 4: DEFECT
  "Pothole",                 // 5: DEFECT
  "Fall-Detected",           // 6: SAFETY
  "Gloves",                  // 7: SAFETY
  "Goggles",                 // 8: SAFETY
  "Hardhat",                 // 9: SAFETY
  "Ladder",                  // 10: SAFETY
  "Mask",                    // 11: SAFETY
  "NO-Gloves",               // 12: SAFETY
  "NO-Goggles",              // 13: SAFETY
  "NO-Hardhat",              // 14: SAFETY
  "NO-Mask",                 // 15: SAFETY
  "NO-Safety-Vest",          // 16: SAFETY
  "Person",                  // 17: SAFETY
  "Safety-Cone",             // 18: SAFETY
  "Safety-Vest"              // 19: SAFETY
];

// Load canonical JSON specification if available
let CANONICAL_TAXONOMY = null;
try {
  const jsonPath = path.resolve(__dirname, '../../../yolo_pipeline/class_names.json');
  if (fs.existsSync(jsonPath)) {
    CANONICAL_TAXONOMY = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {}

const SAFETY_RULES = {
  // =========================================================================
  // PRIORITY 1 — PRIMARY CONSTRUCTION DEFECTS (Classes 0-5)
  // =========================================================================
  'crack': {
    id: 0,
    label: 'Structural Crack',
    category: 'DEFECT',
    priority: 1,
    severity: 'HIGH',
    recommended_action: 'Measure crack aperture with optical crack gauge. Conduct ultrasonic pulse velocity (UPV) test if aperture exceeds 0.25mm.',
    statutory_ref: 'IS 456:2000 Cl. 35.3.2 / ACI 224R-01 / IRC:83',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'spalling': {
    id: 1,
    label: 'Concrete Spalling',
    category: 'DEFECT',
    priority: 1,
    severity: 'CRITICAL',
    recommended_action: 'Emergency structural stabilization. Sound with hammer, chip loose delaminated cover, treat corroded steel, and apply polymer-modified structural mortar.',
    statutory_ref: 'BS EN 1504-9 / IRC:SP:40-2019 / IS 456',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'honeycombing': {
    id: 2,
    label: 'Concrete Honeycombing & Voids',
    category: 'DEFECT',
    priority: 1,
    severity: 'HIGH',
    recommended_action: 'Examine extent of unconsolidated aggregate pockets. Chip out honeycombed area until sound concrete is reached and pressure-inject high-strength non-shrink grout.',
    statutory_ref: 'ACI 309R-05 / IS 456:2000 Cl. 13.3',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'exposed_rebar': {
    id: 3,
    label: 'Exposed Steel Reinforcement',
    category: 'DEFECT',
    priority: 1,
    severity: 'CRITICAL',
    recommended_action: 'Primary reinforcement exposed to atmospheric moisture. Perform carbonation testing, apply migratory corrosion inhibitors, and recast cover to minimum statutory depth.',
    statutory_ref: 'IS 456:2000 Cl. 26.4 / BS EN 1504',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'concrete_surface_damage': {
    id: 4,
    label: 'Concrete Surface Damage',
    category: 'DEFECT',
    priority: 1,
    severity: 'MEDIUM',
    recommended_action: 'Assess abrasion, scaling, or chemical attack depth. Apply hydrophobic penetrating silane/siloxane sealer or epoxy fairing coat.',
    statutory_ref: 'ASTM C672 / EN 1504-2',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'pothole': {
    id: 5,
    label: 'Pothole & Surface Cavity',
    category: 'DEFECT',
    priority: 1,
    severity: 'HIGH',
    recommended_action: 'Cut square vertical edges around pothole cavity, clean debris, apply tack coat, and compact with hot-mix asphalt or rapid-setting concrete.',
    statutory_ref: 'IRC:82-2015 / MoRTH Section 3004',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },

  // =========================================================================
  // PRIORITY 2 — SECONDARY PERSON / PPE SAFETY (Classes 6-19)
  // =========================================================================
  'fall_detected': {
    id: 6,
    label: 'Fall from Height Anomaly',
    category: 'SAFETY',
    priority: 2,
    severity: 'CRITICAL',
    recommended_action: 'Emergency dispatch: Alert safety marshal and medical station immediately. Verify edge protection, harness lifeline anchor, and catch nets.',
    statutory_ref: 'OSHA 1926.502 / IS 3521 / BOCW Rules',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'gloves': {
    id: 7,
    label: 'Hand Protection (Gloves)',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Compliant hand protection detected.',
    statutory_ref: 'EN 388 / IS 6994',
    requiresHumanVerification: false,
    verification_advisory: 'PPE adherence verified.'
  },
  'goggles': {
    id: 8,
    label: 'Eye Protection (Goggles)',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Compliant eye protection detected.',
    statutory_ref: 'IS 5983 / ANSI Z87.1',
    requiresHumanVerification: false,
    verification_advisory: 'PPE adherence verified.'
  },
  'hardhat': {
    id: 9,
    label: 'Safety Helmet Present',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Compliant safety helmet verified. Continue routine compliance check.',
    statutory_ref: 'IS 2925 / EN 397 / OSHA 1926.100',
    requiresHumanVerification: false,
    verification_advisory: 'PPE adherence verified.'
  },
  'ladder': {
    id: 10,
    label: 'Access Ladder In-Use',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Verify 4:1 base slope angle, 3-point contact, and secure tie-off at upper support level.',
    statutory_ref: 'OSHA 1926.1053 / IS 3696',
    requiresHumanVerification: false,
    verification_advisory: 'Operational equipment check.'
  },
  'mask': {
    id: 11,
    label: 'Respirator / Mask Present',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Compliant respiratory protection detected.',
    statutory_ref: 'OSHA 1926.1153 / IS 9473',
    requiresHumanVerification: false,
    verification_advisory: 'PPE adherence verified.'
  },
  'no_gloves': {
    id: 12,
    label: 'Missing Hand Protection',
    category: 'SAFETY',
    priority: 2,
    severity: 'MEDIUM',
    recommended_action: 'Issue heavy-duty cut-resistant / nitrile industrial gloves for reinforcement handling and concrete mixing.',
    statutory_ref: 'IS 6994 / EN 388 / BOCW Act',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'no_goggles': {
    id: 13,
    label: 'Missing Eye Protection',
    category: 'SAFETY',
    priority: 2,
    severity: 'HIGH',
    recommended_action: 'Equip impact-resistant safety goggles during grinding, rebar cutting, chipping, or chemical spraying.',
    statutory_ref: 'IS 5983 / ANSI Z87.1 / OSHA 1926.102',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'no_hardhat': {
    id: 14,
    label: 'Missing Safety Helmet',
    category: 'SAFETY',
    priority: 2,
    severity: 'CRITICAL',
    recommended_action: 'Halt overhead and high-risk work immediately. Ensure all personnel equip certified industrial safety helmets conforming to IS 2925 / EN 397.',
    statutory_ref: 'OSHA 1926.100 / BOCW Act Sec. 38 / IS 2925',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'no_mask': {
    id: 15,
    label: 'Missing Particulate Respirator',
    category: 'SAFETY',
    priority: 2,
    severity: 'MEDIUM',
    recommended_action: 'Equip N95 / FFP2 particulate respirator in high-dust and crystalline silica-generating zones.',
    statutory_ref: 'OSHA 1926.1153 / IS 9473',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'no_safety_vest': {
    id: 16,
    label: 'Missing High-Visibility Vest',
    category: 'SAFETY',
    priority: 2,
    severity: 'HIGH',
    recommended_action: 'Equip high-visibility retroreflective vest (Class 2 / Class 3) before entering transit zones, crane radiuses, or mobile machinery corridors.',
    statutory_ref: 'EN ISO 20471 / IRC:SP:84 / OSHA 1926.201',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  },
  'person': {
    id: 17,
    label: 'Personnel on Site',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Personnel registered on site perimeter.',
    statutory_ref: 'General Construction Site Telemetry',
    requiresHumanVerification: false,
    verification_advisory: 'Field movement tracking.'
  },
  'safety_cone': {
    id: 18,
    label: 'Safety Demarcation Cone',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Ensure traffic cones and exclusion zones remain undisturbed and retroreflective.',
    statutory_ref: 'IRC:67-2012 / MoRTH Section 3000',
    requiresHumanVerification: false,
    verification_advisory: 'Demarcation checkpoint.'
  },
  'safety_vest': {
    id: 19,
    label: 'High-Visibility Vest Present',
    category: 'SAFETY',
    priority: 2,
    severity: 'LOW',
    recommended_action: 'Compliant high-visibility vest detected.',
    statutory_ref: 'EN ISO 20471 Class 2 / IS 15809',
    requiresHumanVerification: false,
    verification_advisory: 'PPE adherence verified.'
  }
};

/**
 * Normalizes any raw string or numeric ID into canonical key
 */
function normalizeClassKey(rawIdentifier) {
  if (typeof rawIdentifier === 'number') {
    return YOLO26_CLASSES[rawIdentifier] ? normalizeClassKey(YOLO26_CLASSES[rawIdentifier]) : 'crack';
  }
  if (!rawIdentifier) return 'crack';

  const clean = String(rawIdentifier).trim().toLowerCase().replace(/[\s-]+/g, '_');

  // Defect matches
  if (clean.includes('spall')) return 'spalling';
  if (clean.includes('crack') || clean.includes('fissure')) return 'crack';
  if (clean.includes('rebar') || clean.includes('reinforce')) return 'exposed_rebar';
  if (clean.includes('honeycomb')) return 'honeycombing';
  if (clean.includes('pothole')) return 'pothole';
  if (clean.includes('damage') || clean.includes('scaling') || clean.includes('surface')) return 'concrete_surface_damage';

  // Safety matches
  if (clean === 'no_hardhat' || clean === 'no_helmet') return 'no_hardhat';
  if (clean === 'no_safety_vest' || clean === 'no_vest') return 'no_safety_vest';
  if (clean === 'no_gloves') return 'no_gloves';
  if (clean === 'no_goggles') return 'no_goggles';
  if (clean === 'no_mask') return 'no_mask';
  if (clean.includes('fall')) return 'fall_detected';
  if (clean === 'hardhat' || clean === 'helmet') return 'hardhat';
  if (clean === 'safety_vest' || clean === 'vest') return 'safety_vest';
  if (clean === 'gloves') return 'gloves';
  if (clean === 'goggles') return 'goggles';
  if (clean === 'mask') return 'mask';
  if (clean === 'person' || clean === 'worker') return 'person';
  if (clean === 'ladder') return 'ladder';
  if (clean === 'safety_cone' || clean === 'cone') return 'safety_cone';

  return clean;
}

/**
 * Evaluate detection returning statutory metadata, decoupled severity, and category
 */
function evaluateDetection(rawIdentifier) {
  const normalizedKey = normalizeClassKey(rawIdentifier);
  const rule = SAFETY_RULES[normalizedKey] || {
    id: typeof rawIdentifier === 'number' ? rawIdentifier : -1,
    label: String(rawIdentifier),
    category: 'DEFECT',
    priority: 1,
    severity: 'HIGH',
    recommended_action: `Inspect detected defect and apply corrective action per statutory operating procedure.`,
    statutory_ref: 'National Building Code / General Safety Guidelines',
    requiresHumanVerification: true,
    verification_advisory: 'AI visual indication — requires inspector verification.'
  };

  return {
    classId: rule.id !== undefined ? rule.id : (typeof rawIdentifier === 'number' ? rawIdentifier : 0),
    className: normalizedKey,
    label: rule.label,
    category: rule.category, // 'DEFECT' or 'SAFETY'
    priority: rule.priority, // 1 (Defects) or 2 (Safety)
    severity: rule.severity, // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recommended_action: rule.recommended_action,
    statutory_ref: rule.statutory_ref,
    requiresHumanVerification: rule.requiresHumanVerification !== false,
    verification_advisory: rule.verification_advisory || 'AI visual indication — requires inspector verification.'
  };
}

const NORMALIZE_CLASS_MAP = {
  'Crack': 'crack',
  'Spalling': 'spalling',
  'Honeycombing': 'honeycombing',
  'Exposed-Rebar': 'exposed_rebar',
  'Concrete-Surface-Damage': 'concrete_surface_damage',
  'Pothole': 'pothole',
  'Fall-Detected': 'fall_detected',
  'Gloves': 'gloves',
  'Goggles': 'goggles',
  'Hardhat': 'hardhat',
  'Ladder': 'ladder',
  'Mask': 'mask',
  'NO-Gloves': 'no_gloves',
  'NO-Goggles': 'no_goggles',
  'NO-Hardhat': 'no_hardhat',
  'NO-Mask': 'no_mask',
  'NO-Safety Vest': 'no_safety_vest',
  'NO-Safety-Vest': 'no_safety_vest',
  'Person': 'person',
  'Safety Cone': 'safety_cone',
  'Safety-Cone': 'safety_cone',
  'Safety Vest': 'safety_vest',
  'Safety-Vest': 'safety_vest'
};

module.exports = {
  YOLO26_CLASSES,
  SAFETY_RULES,
  NORMALIZE_CLASS_MAP,
  normalizeClassKey,
  evaluateDetection
};
