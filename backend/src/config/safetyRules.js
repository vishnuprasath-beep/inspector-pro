/**
 * Inspectra Pro — AI Safety Severity Engine & Mitigation Taxonomy
 * Decouples raw computer vision classifications from institutional safety severity rules.
 */

const SAFETY_RULES = {
  // Construction PPE & Safety Violations
  'NO-Hardhat': {
    severity: 'CRITICAL',
    recommended_action: 'Halt overhead and high-risk work immediately. Ensure all personnel equip certified industrial safety helmets conforming to IS 2925 / EN 397.',
    statutory_ref: 'OSHA 1926.100 / BOCW Act Sec. 38',
    category: 'PPE_VIOLATION'
  },
  'NO-Safety Vest': {
    severity: 'HIGH',
    recommended_action: 'Equip high-visibility reflective retroreflective vest (Class 2 / Class 3) before entering transit zones or heavy machinery corridors.',
    statutory_ref: 'EN ISO 20471 / IRC:SP:84',
    category: 'PPE_VIOLATION'
  },
  'Fall-Detected': {
    severity: 'CRITICAL',
    recommended_action: 'Dispatch emergency on-site medical and safety marshals immediately. Verify perimeter safety harness and lifeline anchor integrity.',
    statutory_ref: 'OSHA 1926.502 / IS 3521',
    category: 'CRITICAL_HAZARD'
  },
  'NO-Gloves': {
    severity: 'MEDIUM',
    recommended_action: 'Issue heavy-duty cut-resistant / nitrile industrial gloves for reinforcement handling and chemical mixing.',
    statutory_ref: 'IS 6994 / EN 388',
    category: 'PPE_VIOLATION'
  },
  'NO-Goggles': {
    severity: 'HIGH',
    recommended_action: 'Wear impact-resistant safety goggles during grinding, cutting, chipping, or chemical spraying.',
    statutory_ref: 'IS 5983 / ANSI Z87.1',
    category: 'PPE_VIOLATION'
  },
  'NO-Mask': {
    severity: 'MEDIUM',
    recommended_action: 'Equip N95 / FFP2 particulate respirator in high-dust and silica-generating zones.',
    statutory_ref: 'OSHA 1926.1153',
    category: 'OCCUPATIONAL_HEALTH'
  },
  'Ladder': {
    severity: 'LOW',
    recommended_action: 'Ensure 4:1 slope angle, three-point contact, and secure tie-off at upper support level.',
    statutory_ref: 'OSHA 1926.1053',
    category: 'ACCESS_EQUIPMENT'
  },
  'Safety Cone': {
    severity: 'LOW',
    recommended_action: 'Verify demarcation perimeter and ensure traffic routing cones remain visible and undisturbed.',
    statutory_ref: 'IRC:67-2012',
    category: 'ZONE_DEMARCATION'
  },
  'Hardhat': {
    severity: 'COMPLIANT',
    recommended_action: 'Compliant PPE detected. Continue regular adherence monitoring.',
    statutory_ref: 'IS 2925',
    category: 'PPE_COMPLIANT'
  },
  'Safety Vest': {
    severity: 'COMPLIANT',
    recommended_action: 'Compliant high-visibility vest detected.',
    statutory_ref: 'EN ISO 20471',
    category: 'PPE_COMPLIANT'
  },
  'Gloves': {
    severity: 'COMPLIANT',
    recommended_action: 'Compliant hand protection detected.',
    statutory_ref: 'EN 388',
    category: 'PPE_COMPLIANT'
  },
  'Person': {
    severity: 'INFORMATIONAL',
    recommended_action: 'Personnel movement registered on site geofence.',
    statutory_ref: 'Site Telemetry',
    category: 'PERSONNEL_TRACKING'
  },

  // Structural & Civil Infrastructure Defects
  'structural_crack': {
    severity: 'HIGH',
    recommended_action: 'Measure crack aperture with optical crack width gauge. Perform non-destructive ultrasonic testing if width exceeds 0.3mm.',
    statutory_ref: 'IS 456:2000 Cl. 35.3.2 / ACI 224R',
    category: 'STRUCTURAL_DEFECT'
  },
  'concrete_spalling': {
    severity: 'CRITICAL',
    recommended_action: 'Delaminate loose concrete cover immediately. Remove corrosion products from exposed reinforcement and apply polymer-modified structural mortar patch.',
    statutory_ref: 'BS EN 1504 / IRC:SP:40',
    category: 'STRUCTURAL_DEFECT'
  },
  'corrosion': {
    severity: 'HIGH',
    recommended_action: 'Abrasive blast clean to Sa 2.5 standard. Apply zinc-rich anti-corrosive primer and epoxy protective coating.',
    statutory_ref: 'ISO 12944 C5-M',
    category: 'MATERIAL_DEGRADATION'
  },
  'water_seepage': {
    severity: 'MEDIUM',
    recommended_action: 'Inspect expansion joints and drainage outlets. Inject polyurethane pressure grouting to seal active hydrostatic water ingress.',
    statutory_ref: 'IS 2645 / ACI 506.2',
    category: 'WATERPROOFING_DEFECT'
  }
};

/**
 * Determine severity and action for a raw detected class
 */
function evaluateDetection(rawClassName) {
  const normalized = rawClassName.trim();
  const rule = SAFETY_RULES[normalized] || {
    severity: 'MEDIUM',
    recommended_action: `Investigate detected ${normalized} and apply corrective action per site operating procedure.`,
    statutory_ref: 'National Building Code / General Safety Guidelines',
    category: 'GENERAL_HAZARD'
  };

  return {
    severity: rule.severity,
    recommended_action: rule.recommended_action,
    statutory_ref: rule.statutory_ref,
    category: rule.category
  };
}

module.exports = {
  SAFETY_RULES,
  evaluateDetection
};
