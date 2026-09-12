/**
 * Standalone Mock Dataset for Production & Offline Deployments
 * Guarantees 100% functionality on mobile devices and static CDN hosting
 */

export const MOCK_SITES = [
  {
    id: 'site-delhi-metro',
    name: 'Delhi Metro Anand Vihar Interchange',
    code: 'DMRC-AV-01',
    category: 'TRANSIT_INFRASTRUCTURE',
    address: 'Anand Vihar ISBT, East Delhi, Delhi 110092',
    latitude: 28.6469,
    longitude: 77.3160,
    geofence_radius: 650,
    status: 'ACTIVE',
    health_score: 92.4,
    last_inspection: '2026-09-08'
  },
  {
    id: 'site-nh44-flyover',
    name: 'NH-44 Elevated Expressway Flyover',
    code: 'NHAI-EXP-44',
    category: 'BRIDGES_FLYING_OVER',
    address: 'Mile Marker 142.5, Karnal Corridor, Haryana',
    latitude: 28.7041,
    longitude: 77.1025,
    geofence_radius: 800,
    status: 'ACTIVE',
    health_score: 74.8,
    last_inspection: '2026-09-10'
  },
  {
    id: 'site-mumbai-tunnel',
    name: 'Coastal Road Subsea Tunnel Twin-Tube',
    code: 'MCGM-CR-02',
    category: 'TUNNEL_COMPLEX',
    address: 'Marine Drive to Worli Interchange, Mumbai 400018',
    latitude: 18.9750,
    longitude: 72.8120,
    geofence_radius: 1200,
    status: 'ACTIVE',
    health_score: 88.6,
    last_inspection: '2026-09-06'
  },
  {
    id: 'site-blr-substation',
    name: '400kV Ultra-High Voltage Smart Grid Substation',
    code: 'KPTCL-UHV-400',
    category: 'POWER_UTILITY',
    address: 'Nelamangala Energy Park, Bengaluru Rural 562123',
    latitude: 13.0982,
    longitude: 77.3912,
    geofence_radius: 500,
    status: 'ACTIVE',
    health_score: 81.2,
    last_inspection: '2026-09-09'
  },
  {
    id: 'site-chennai-port',
    name: 'Deepwater Container Berth 04 Marine Terminal',
    code: 'CPT-CB-04',
    category: 'MARITIME_BERTH',
    address: 'Rajaji Salai, Chennai Port Trust, Chennai 600001',
    latitude: 13.0844,
    longitude: 80.2986,
    geofence_radius: 950,
    status: 'ACTIVE',
    health_score: 86.0,
    last_inspection: '2026-09-04'
  }
];

export const MOCK_INSPECTORS = [
  {
    id: 'usr-insp-vp01',
    name: 'Vishnu Prasath',
    badge_number: 'INSP-2026-VP01',
    email: 'vishnu.prasath@inspectra.gov.in',
    phone: '+91 98401 12341',
    status: 'ACTIVE',
    battery_level: 92,
    latitude: 28.7045,
    longitude: 77.1029,
    assigned_site_id: 'site-delhi-metro',
    assigned_site_name: 'Delhi Metro Anand Vihar Interchange',
    geofence_status: 'IN_GEOFENCE',
    completed_audits: 48,
    performance_score: 98.4
  },
  {
    id: 'usr-insp-vv02',
    name: 'Vishnu Varthan',
    badge_number: 'INSP-2026-VV02',
    email: 'vishnu.varthan@inspectra.gov.in',
    phone: '+91 98401 12342',
    status: 'ACTIVE',
    battery_level: 85,
    latitude: 28.6472,
    longitude: 77.3155,
    assigned_site_id: 'site-nh44-flyover',
    assigned_site_name: 'NH-44 Elevated Expressway Flyover',
    geofence_status: 'IN_GEOFENCE',
    completed_audits: 44,
    performance_score: 96.8
  },
  {
    id: 'usr-insp-sv03',
    name: 'Sivavaiyapuri',
    badge_number: 'INSP-2026-SV03',
    email: 'sivavaiyapuri@inspectra.gov.in',
    phone: '+91 98401 12343',
    status: 'ACTIVE',
    battery_level: 79,
    latitude: 18.9754,
    longitude: 72.8126,
    assigned_site_id: 'site-mumbai-tunnel',
    assigned_site_name: 'Coastal Road Subsea Tunnel Twin-Tube',
    geofence_status: 'IN_GEOFENCE',
    completed_audits: 52,
    performance_score: 99.1
  },
  {
    id: 'usr-insp-sr04',
    name: 'Sriram',
    badge_number: 'INSP-2026-SR04',
    email: 'sriram@inspectra.gov.in',
    phone: '+91 98401 12344',
    status: 'ACTIVE',
    battery_level: 88,
    latitude: 13.0978,
    longitude: 77.3917,
    assigned_site_id: 'site-blr-substation',
    assigned_site_name: '400kV Ultra-High Voltage Smart Grid Substation',
    geofence_status: 'IN_GEOFENCE',
    completed_audits: 39,
    performance_score: 95.5
  },
  {
    id: 'usr-insp-ml05',
    name: 'Mahalakshmi',
    badge_number: 'INSP-2026-ML05',
    email: 'mahalakshmi@inspectra.gov.in',
    phone: '+91 98401 12345',
    status: 'ACTIVE',
    battery_level: 94,
    latitude: 13.0840,
    longitude: 80.2990,
    assigned_site_id: 'site-chennai-port',
    assigned_site_name: 'Deepwater Container Berth 04 Marine Terminal',
    geofence_status: 'IN_GEOFENCE',
    completed_audits: 47,
    performance_score: 98.2
  },
  {
    id: 'usr-insp-sm06',
    name: 'Sivamathi',
    badge_number: 'INSP-2026-SM06',
    email: 'sivamathi@inspectra.gov.in',
    phone: '+91 98401 12346',
    status: 'ACTIVE',
    battery_level: 81,
    latitude: 27.5020,
    longitude: 71.9180,
    assigned_site_id: 'site-bhadla-solar',
    assigned_site_name: 'Bhadla Ultra-Mega Solar Photovoltaic Grid',
    geofence_status: 'IN_GEOFENCE',
    completed_audits: 36,
    performance_score: 97.4
  }
];

export const MOCK_INSPECTIONS = [
  {
    id: 'insp-2026-091',
    site_id: 'site-nh44-flyover',
    site_name: 'NH-44 Elevated Expressway Flyover',
    inspector_id: 'usr-insp-01',
    inspector_name: 'R. Saravanan',
    date: '2026-09-10T14:30:00Z',
    status: 'SUBMITTED',
    compliance_score: 78.5,
    geofence_verified: true,
    defect_count: 2,
    critical_defects: 1,
    summary: 'Comprehensive structural peer assessment and bearing pad expansion audit.',
    digital_signature: 'Verified: SHA256:4a8f9c1b... (Inspector R. Saravanan)'
  },
  {
    id: 'insp-2026-088',
    site_id: 'site-delhi-metro',
    site_name: 'Delhi Metro Anand Vihar Interchange',
    inspector_id: 'usr-insp-02',
    inspector_name: 'M. Thangavel',
    date: '2026-09-08T11:15:00Z',
    status: 'APPROVED',
    compliance_score: 94.0,
    geofence_verified: true,
    defect_count: 0,
    critical_defects: 0,
    summary: 'Platform screen door hydraulic actuators and electrical traction review.',
    digital_signature: 'Verified: SHA256:9b2a1c8f... (Inspector M. Thangavel)'
  },
  {
    id: 'insp-2026-085',
    site_id: 'site-mumbai-tunnel',
    site_name: 'Coastal Road Subsea Tunnel Twin-Tube',
    inspector_id: 'usr-insp-03',
    inspector_name: 'P. Vimaladevi',
    date: '2026-09-06T16:00:00Z',
    status: 'APPROVED',
    compliance_score: 91.5,
    geofence_verified: true,
    defect_count: 1,
    critical_defects: 0,
    summary: 'Jet fan ventilation ducts and automated water deluge system pressure audit.',
    digital_signature: 'Verified: SHA256:7f3b8e2a... (Inspector P. Vimaladevi)'
  },
  {
    id: 'insp-2026-082',
    site_id: 'site-blr-substation',
    site_name: '400kV Ultra-High Voltage Smart Grid Substation',
    inspector_id: 'usr-insp-04',
    inspector_name: 'K. Anbalagan',
    date: '2026-09-05T10:45:00Z',
    status: 'REJECTED',
    compliance_score: 64.0,
    geofence_verified: false,
    defect_count: 3,
    critical_defects: 2,
    summary: 'Busbar thermal imaging survey and SF6 gas pressure checks.',
    digital_signature: 'Flagged: Geofence perimeter breach outside 500m boundary.'
  },
  {
    id: 'insp-2026-079',
    site_id: 'site-chennai-port',
    site_name: 'Deepwater Container Berth 04 Marine Terminal',
    inspector_id: 'usr-insp-05',
    inspector_name: 'S. Karthik Balakrishnan',
    date: '2026-09-04T09:20:00Z',
    status: 'APPROVED',
    compliance_score: 87.2,
    geofence_verified: true,
    defect_count: 1,
    critical_defects: 0,
    summary: 'Bollard tensile load test and rubber arch fender compression inspection.',
    digital_signature: 'Verified: SHA256:1a7d4c8e... (Inspector S. Karthik Balakrishnan)'
  }
];

export const MOCK_DEFECTS = [
  {
    id: 'def-01',
    site_name: 'NH-44 Elevated Expressway Flyover',
    component: 'Pier P-14 South Face',
    category: 'STRUCTURAL',
    severity: 'CRITICAL',
    title: 'Concrete Spalling & Exposed Rebar',
    description: 'Delamination of concrete cover measuring 85cm x 40cm with noticeable rust bleeding on secondary tie rebar.',
    status: 'IN_PROGRESS',
    assigned_to: 'Northern Regional Civil Repair Wing',
    created_at: '2026-09-10'
  },
  {
    id: 'def-02',
    site_name: '400kV Ultra-High Voltage Substation',
    component: 'Transformer Bay 3B High-Side Bushing',
    category: 'ELECTRICAL',
    severity: 'CRITICAL',
    title: 'Thermal Hotspot on C-Phase Terminal',
    description: 'FLIR thermography shows 118°C temperature rise under 82% rated load. Oil discoloration observed in sight glass.',
    status: 'OPEN',
    assigned_to: 'Grid High Voltage Emergency Team',
    created_at: '2026-09-09'
  },
  {
    id: 'def-03',
    site_name: 'Coastal Road Subsea Tunnel',
    component: 'Southbound Tube Jet Fan #7 Damper',
    category: 'MECHANICAL',
    severity: 'MAJOR',
    title: 'Acoustic Vibration & Bearing Runout',
    description: 'Excessive vibration amplitude (7.2 mm/s RMS) detected during emergency evacuation test run.',
    status: 'IN_PROGRESS',
    assigned_to: 'Ventilation Systems Contractors',
    created_at: '2026-09-06'
  },
  {
    id: 'def-04',
    site_name: 'Deepwater Container Berth 04',
    component: 'Bollard #12 Quay Deck Anchors',
    category: 'MARITIME',
    severity: 'MINOR',
    title: 'Surface Rust & Grout Micro-cracking',
    description: 'Marine epoxy coating weathering along anchor base flange. Structural integrity unaffected.',
    status: 'RESOLVED',
    assigned_to: 'Port Maintenance Crew Alpha',
    created_at: '2026-09-04'
  }
];

export const MOCK_CORRECTIVE_ACTIONS = [
  {
    id: 'ca-01',
    defect_id: 'def-01',
    site_name: 'NH-44 Elevated Expressway Flyover',
    action_required: 'High-pressure water jetting, rebar passivation, polymer-modified mortar repair.',
    assigned_contractor: 'L&T Infrastructure Rehabilitation Team',
    target_date: '2026-09-20',
    status: 'WORK_IN_PROGRESS',
    sla_compliance: 'ON_TRACK'
  },
  {
    id: 'ca-02',
    defect_id: 'def-02',
    site_name: '400kV Ultra-High Voltage Substation',
    action_required: 'Immediate shutdown window for terminal torque calibration and DGA oil sampling.',
    assigned_contractor: 'BHEL Grid Specialist Unit',
    target_date: '2026-09-15',
    status: 'PENDING_APPROVAL',
    sla_compliance: 'URGENT'
  }
];

export const MOCK_ANALYTICS = {
  kpis: {
    total_inspections: 124,
    geofence_compliance_rate: '97.6%',
    critical_defects: 4,
    active_fleet_readiness: '98.2%',
    average_audit_time: '38 mins',
    statutory_health_index: '91.8/100'
  },
  site_health: [
    { site: 'Delhi Metro AV', score: 92.4, status: 'EXCELLENT' },
    { site: 'NH-44 Flyover', score: 74.8, status: 'ATTENTION_NEEDED' },
    { site: 'Mumbai Coastal Tunnel', score: 88.6, status: 'GOOD' },
    { site: 'Bengaluru 400kV Grid', score: 81.2, status: 'GOOD' },
    { site: 'Chennai Berth 04', score: 86.0, status: 'GOOD' }
  ],
  defect_breakdown: {
    civil: 42,
    electrical: 26,
    mechanical: 18,
    fire_safety: 14
  }
};

export const MOCK_AUDIT_LOGS = [
  {
    id: 'log-101',
    timestamp: '2026-09-11 09:42:15',
    event: 'INSPECTION_SUBMITTED',
    user: 'R. Saravanan (INSP-001)',
    site: 'NH-44 Expressway Flyover',
    geofence_result: 'PASSED (Distance: 142m / 800m)',
    ip: '103.21.144.92'
  },
  {
    id: 'log-100',
    timestamp: '2026-09-11 09:30:10',
    event: 'GEOFENCE_TELEMETRY_SYNC',
    user: 'M. Thangavel (INSP-002)',
    site: 'Delhi Metro Anand Vihar',
    geofence_result: 'PASSED (Distance: 88m / 650m)',
    ip: '103.21.144.110'
  },
  {
    id: 'log-099',
    timestamp: '2026-09-10 17:10:04',
    event: 'OUT_OF_GEOFENCE_ALERT',
    user: 'K. Anbalagan (INSP-004)',
    site: 'Bengaluru 400kV Grid',
    geofence_result: 'FLAGGED (Distance: 1,840m / 500m)',
    ip: '103.21.144.15'
  }
];

// =========================================================================
// 18 STANDARD CONSTRUCTION INSPECTION ZONES
// =========================================================================
export const MOCK_CONSTRUCTION_ZONES = [
  {
    id: 'zone-01',
    name: 'Site Entrance / Boundary',
    code: 'ZN-01',
    floor_level: 'Ground Level (0.00m)',
    location: 'Gate 01 & Northern Perimeter Fence',
    priority: 'HIGH',
    frequency: 'Daily (Morning & Shift Change)',
    camera_id: 'CAM-04',
    camera_name: 'Smart City Gate & Sump Node',
    camera_status: 'ONLINE',
    last_camera_observation: '12 mins ago — Worker ingress monitored',
    last_inspector_visit: '2026-09-11 08:30',
    next_inspection_due: '2026-09-12 11:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Verify biometric turnstiles, mandatory PPE compliance, boundary fencing stability.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-02',
    name: 'Excavation & Earthwork',
    code: 'ZN-02',
    floor_level: 'Substructure Pit (-4.50m)',
    location: 'Western Foundation Trench Area',
    priority: 'CRITICAL',
    frequency: 'Daily (Pre-Shift & Post-Rain)',
    camera_id: 'CAM-01',
    camera_name: 'Delhi Metro Track Pier P-14 Camera',
    camera_status: 'ONLINE',
    last_camera_observation: '8 mins ago — Trench wall stability scan',
    last_inspector_visit: '2026-09-11 09:15',
    next_inspection_due: '2026-09-12 10:30',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Inspect slope batter angle, soil shoring, dewatering pumps, and edge barricading.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-03',
    name: 'Foundation (Substructure)',
    code: 'ZN-03',
    floor_level: 'Foundation Level (-6.20m)',
    location: 'Raft Footing & Pile Caps Grid A1-D4',
    priority: 'CRITICAL',
    frequency: 'Mandatory Hold-Point (Pre-Concrete Pour)',
    camera_id: 'CAM-01',
    camera_name: 'Delhi Metro Track Pier P-14 Camera',
    camera_status: 'ONLINE',
    last_camera_observation: '15 mins ago — Rebar mat tying observed',
    last_inspector_visit: '2026-09-10 14:00',
    next_inspection_due: '2026-09-12 09:00',
    status: 'CRITICAL_PENDING',
    open_defects_count: 0,
    required_actions: 'MANDATORY HOLD-POINT: Physical verification of raft reinforcement, cover blocks, sub-base compaction before pour sign-off.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-04',
    name: 'Columns & Vertical Members',
    code: 'ZN-04',
    floor_level: 'Level 1 to Level 2 (+3.60m)',
    location: 'Grid Columns C1, C2, C3 Pier P-14',
    priority: 'CRITICAL',
    frequency: 'Pre-Pour & Shuttering Lock',
    camera_id: 'CAM-02',
    camera_name: 'National Highway NH-44 Overpass Camera',
    camera_status: 'ONLINE',
    last_camera_observation: '5 mins ago — AI FLAG: Rebar cover clearance anomaly',
    last_inspector_visit: '2026-09-09 16:30',
    next_inspection_due: '2026-09-12 11:30',
    status: 'ATTENTION_REQUIRED',
    open_defects_count: 1,
    required_actions: 'AI FLAG ACTIVE: Measure 40mm minimum cover block clearance and check vertical plumbness with laser gauge.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-05',
    name: 'Beams & Spandrels',
    code: 'ZN-05',
    floor_level: 'Level 1 Suspended (+3.60m)',
    location: 'Primary Spandrel Beams PB-01 to PB-08',
    priority: 'HIGH',
    frequency: 'Pre-Pour Verification',
    camera_id: 'CAM-02',
    camera_name: 'National Highway NH-44 Overpass Camera',
    camera_status: 'ONLINE',
    last_camera_observation: '22 mins ago — Shuttering prop alignment',
    last_inspector_visit: '2026-09-10 11:00',
    next_inspection_due: '2026-09-12 14:00',
    status: 'DUE_SOON',
    open_defects_count: 0,
    required_actions: 'Verify beam bottom reinforcement, stirrup spacing at supports, and MEP pipe sleeves.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-06',
    name: 'Slabs & Decking',
    code: 'ZN-06',
    floor_level: 'Level 2 Floor Slab (+7.20m)',
    location: 'Two-Way Solid Deck Pour Bay 02',
    priority: 'CRITICAL',
    frequency: 'Mandatory Hold-Point (Pre-Pour)',
    camera_id: 'CAM-02',
    camera_name: 'National Highway NH-44 Overpass Camera',
    camera_status: 'ONLINE',
    last_camera_observation: '18 mins ago — Chair bar positioning underway',
    last_inspector_visit: '2026-09-08 17:00',
    next_inspection_due: '2026-09-12 09:30',
    status: 'CRITICAL_PENDING',
    open_defects_count: 0,
    required_actions: 'MANDATORY HOLD-POINT: Check top reinforcement mesh, chair bar spacing, electrical junction boxes before pour clearance.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-07',
    name: 'Staircases & Core Access',
    code: 'ZN-07',
    floor_level: 'Core 1 (Ground to L3)',
    location: 'Emergency Fire Staircase East Wing',
    priority: 'HIGH',
    frequency: 'Weekly',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-11 11:20',
    next_inspection_due: '2026-09-14 10:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Verify riser/tread dimensions, temporary handrail safety, and slip-resistant nosing.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-08',
    name: 'Masonry & Blockwork Walls',
    code: 'ZN-08',
    floor_level: 'Level 1 Internal Partitioning',
    location: 'AAC Blockwork Grid B2-E5',
    priority: 'MEDIUM',
    frequency: 'Weekly',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-10 15:30',
    next_inspection_due: '2026-09-13 14:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Check thin-bed mortar joint thickness (2-3mm), lintel bearing length, and control joints.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-09',
    name: 'Concealed Electrical Works',
    code: 'ZN-09',
    floor_level: 'Level 1 Slabs & Walls',
    location: 'Distribution Conduits & Box Terminations',
    priority: 'CRITICAL',
    frequency: 'Pre-Plaster & Pre-Pour Hold-Point',
    camera_id: 'CAM-03',
    camera_name: 'Bhadla Solar & Grid Node',
    camera_status: 'ONLINE',
    last_camera_observation: '35 mins ago — Conduit tie-off activity',
    last_inspector_visit: '2026-09-07 10:00',
    next_inspection_due: '2026-09-12 10:00',
    status: 'CRITICAL_PENDING',
    open_defects_count: 1,
    required_actions: 'MANDATORY HOLD-POINT: Verify PVC conduit continuity, draw-wires installed, and box clearances before plastering.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-10',
    name: 'Plumbing & Drainage Risers',
    code: 'ZN-10',
    floor_level: 'Service Shafts L1-L3',
    location: 'Plumbing Riser Stack #02',
    priority: 'CRITICAL',
    frequency: 'Pre-Cover & Hydrostatic Testing',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-09 14:00',
    next_inspection_due: '2026-09-12 15:00',
    status: 'DUE_SOON',
    open_defects_count: 0,
    required_actions: 'Conduct 10-bar static hydrostatic pressure hold test on copper/CPVC risers for 60 mins.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-11',
    name: 'Waterproofing Membranes',
    code: 'ZN-11',
    floor_level: 'Basement Retaining Walls & Wet Areas',
    location: 'South Retaining Wall & Level 1 Toilets',
    priority: 'CRITICAL',
    frequency: 'Pre-Backfill / Pre-Tiling Hold-Point',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-06 16:30',
    next_inspection_due: '2026-09-11 17:00',
    status: 'CRITICAL_PENDING',
    open_defects_count: 1,
    required_actions: 'MANDATORY HOLD-POINT: Inspect 72-hour continuous flood ponding test and membrane corner fillets before backfilling.',
    is_mandatory_hold_point: true
  },
  {
    id: 'zone-12',
    name: 'Roof Deck & Terrace',
    code: 'ZN-12',
    floor_level: 'Terrace Level (+12.00m)',
    location: 'Rooftop Parapet & Rainwater Downspouts',
    priority: 'HIGH',
    frequency: 'Bi-Weekly',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-05 11:30',
    next_inspection_due: '2026-09-15 10:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Inspect screed slope gradient toward downspouts (1:100) and expansion joint caulking.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-13',
    name: 'Fire Safety & Egress Corridor',
    code: 'ZN-13',
    floor_level: 'All Levels (L1-L3)',
    location: 'Fire Hydrant Risers & Exit Corridors',
    priority: 'HIGH',
    frequency: 'Weekly',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-08 09:30',
    next_inspection_due: '2026-09-12 12:00',
    status: 'ATTENTION_REQUIRED',
    open_defects_count: 1,
    required_actions: 'REINSPECTION REQUIRED: Verify 2.4m unencumbered corridor width and fire door emergency release latch operation.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-14',
    name: 'Lift & Elevator Shaft',
    code: 'ZN-14',
    floor_level: 'Lift Core 01 (Pit to Headroom)',
    location: 'Passenger Elevator Shaft #01',
    priority: 'HIGH',
    frequency: 'Bi-Weekly',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-07 14:30',
    next_inspection_due: '2026-09-14 11:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Inspect guide rail vertical alignment, pit buffer clearances, and dry sump drainage.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-15',
    name: 'Plant & Mechanical Equipment Rooms',
    code: 'ZN-15',
    floor_level: 'Basement Level 1 (-3.20m)',
    location: 'Chiller & DG Generator Enclosure',
    priority: 'MEDIUM',
    frequency: 'Monthly',
    camera_id: null,
    camera_name: 'No Dedicated Fixed Camera',
    camera_status: 'OFFLINE',
    last_camera_observation: 'N/A — Manual Inspection Zone',
    last_inspector_visit: '2026-09-02 10:00',
    next_inspection_due: '2026-09-18 10:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Inspect concrete inertia pads, acoustic silencer baffling, and fuel containment bunds.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-16',
    name: 'Material Storage Yard',
    code: 'ZN-16',
    floor_level: 'Ground Yard North',
    location: 'Rebar, Cement & Aggregate Stockpiles',
    priority: 'MEDIUM',
    frequency: 'Daily',
    camera_id: 'CAM-03',
    camera_name: 'Bhadla Solar & Grid Node',
    camera_status: 'ONLINE',
    last_camera_observation: '10 mins ago — AI FLAG: Rebar storage exposed to moisture',
    last_inspector_visit: '2026-09-11 08:00',
    next_inspection_due: '2026-09-12 13:00',
    status: 'ATTENTION_REQUIRED',
    open_defects_count: 1,
    required_actions: 'AI FLAG ACTIVE: Check rebar elevation on timber bearers (min 150mm) and tarpaulin cover against surface rust.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-17',
    name: 'Scaffolding & Temporary Works',
    code: 'ZN-17',
    floor_level: 'Perimeter Elevation (+0.00m to +10.50m)',
    location: 'South Façade Modular Cuplock Towers',
    priority: 'HIGH',
    frequency: 'Daily (Morning Inspection)',
    camera_id: 'CAM-02',
    camera_name: 'National Highway NH-44 Overpass Camera',
    camera_status: 'ONLINE',
    last_camera_observation: '4 mins ago — AI FLAG: Guardrail mid-rail dislodged',
    last_inspector_visit: '2026-09-11 07:30',
    next_inspection_due: '2026-09-12 08:30',
    status: 'ATTENTION_REQUIRED',
    open_defects_count: 1,
    required_actions: 'AI FLAG ACTIVE: Inspect base sole-plates, ledger couplers, top guardrails (950mm), and toe-boards.',
    is_mandatory_hold_point: false
  },
  {
    id: 'zone-18',
    name: 'General Site Safety & Housekeeping',
    code: 'ZN-18',
    floor_level: 'Entire Site Footprint',
    location: 'Pedestrian Walkways & Waste Skips',
    priority: 'MEDIUM',
    frequency: 'Daily',
    camera_id: 'CAM-04',
    camera_name: 'Smart City Gate & Sump Node',
    camera_status: 'ONLINE',
    last_camera_observation: '14 mins ago — General site housekeeping review',
    last_inspector_visit: '2026-09-11 16:00',
    next_inspection_due: '2026-09-12 16:00',
    status: 'INSPECTED',
    open_defects_count: 0,
    required_actions: 'Inspect clear designated walkways, waste segregation skips, and trip hazard removal.',
    is_mandatory_hold_point: false
  }
];

// =========================================================================
// AI-MONITORED CAMERA OBSERVATIONS & ACTION RECOMMENDATIONS
// =========================================================================
export const MOCK_ZONE_ALERTS = [
  {
    id: 'alert-01',
    zone_id: 'zone-17',
    zone_name: 'Scaffolding & Temporary Works',
    camera_id: 'CAM-02',
    camera_name: 'South Façade Tower Camera',
    observation: 'Missing mid-rail and unpinned base-jack observed on South Elevation Scaffolding Tower 3.',
    confidence: 94.2,
    priority: 'HIGH',
    detected_at: '2026-09-12 07:42:18',
    recommended_action: 'Physically visit Zone 17, inspect base jack footing, check couplers, and halt elevation access until 450mm mid-rail is installed.',
    verification_checklist: [
      'Check base-jack load plate contact with sole board',
      'Verify mid-rail height between 450mm and 600mm',
      'Check structural tie-wire connections to concrete column anchors'
    ],
    required_evidence: 'Close-up photograph of installed mid-rail and pinned base jack with inspector sign-off.',
    status: 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED',
    inspector_decision: null,
    inspector_remarks: null,
    verified_by: null,
    verified_at: null
  },
  {
    id: 'alert-02',
    zone_id: 'zone-04',
    zone_name: 'Columns & Vertical Members',
    camera_id: 'CAM-01',
    camera_name: 'Track Pier P-14 Optical Zoom Camera',
    observation: 'Possible rebar displacement and missing concrete cover blocks along Pier P-14 prior to formwork closure.',
    confidence: 91.5,
    priority: 'CRITICAL',
    detected_at: '2026-09-12 08:14:02',
    recommended_action: 'Conduct physical bar gauge measurement. Do NOT permit concrete pour until cover block depth (min 40mm) is verified.',
    verification_checklist: [
      'Measure cover block clearance (minimum 40mm to outer stirrup)',
      'Verify tie-wire tightness on secondary link bars',
      'Check vertical alignment plumbness with optical or laser level'
    ],
    required_evidence: 'Depth gauge measurement photograph and written inspection sign-off.',
    status: 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED',
    inspector_decision: null,
    inspector_remarks: null,
    verified_by: null,
    verified_at: null
  },
  {
    id: 'alert-03',
    zone_id: 'zone-16',
    zone_name: 'Material Storage Yard',
    camera_id: 'CAM-03',
    camera_name: 'Storage Yard PTZ Camera',
    observation: 'Steel reinforcement rebar bundles stacked directly on bare ground without moisture-resistant tarpaulin covers.',
    confidence: 88.0,
    priority: 'MEDIUM',
    detected_at: '2026-09-12 08:30:45',
    recommended_action: 'Verify surface rust vs pitting corrosion, ensure wooden bearer elevation (150mm), and deploy waterproof sheeting.',
    verification_checklist: [
      'Inspect rebar surface condition (ensure no pitting corrosion)',
      'Verify bundles elevated at least 150mm above ground level',
      'Ensure UV-treated waterproof tarpaulins deployed'
    ],
    required_evidence: 'Photograph of elevated storage stack with protective covers.',
    status: 'AI_FLAG_INSPECTOR_VERIFICATION_REQUIRED',
    inspector_decision: null,
    inspector_remarks: null,
    verified_by: null,
    verified_at: null
  },
  {
    id: 'alert-04',
    zone_id: 'zone-01',
    zone_name: 'Site Entrance / Boundary',
    camera_id: 'CAM-04',
    camera_name: 'Gate 01 Biometric Camera',
    observation: 'Worker personnel entering Zone 01 without mandatory high-visibility safety vest.',
    confidence: 96.8,
    priority: 'HIGH',
    detected_at: '2026-09-12 07:15:00',
    recommended_action: 'Enforce gate security check and issue mandatory high-visibility safety vest prior to site entry.',
    verification_checklist: [
      'Gate security induction check',
      'Issue high-visibility vest',
      'Log contractor safety briefing'
    ],
    required_evidence: 'Gate safety briefing log entry.',
    status: 'VERIFIED_NO_ISSUE',
    inspector_decision: 'VERIFIED_NO_ISSUE',
    inspector_remarks: 'Vest issued at security turnstile 02. Worker cleared to enter.',
    verified_by: 'Vishnu Prasath',
    verified_at: '2026-09-12 07:22:10'
  }
];

// =========================================================================
// SENSITIVE ZONE CHECKLIST TEMPLATES (PHYSICAL INSPECTOR VERIFICATION)
// =========================================================================
export const ZONE_CHECKLIST_TEMPLATES = {
  'zone-03': [ // Foundation
    { id: 'fnd-01', text: 'Sub-grade soil compaction and blinding concrete thickness verified', criteria: 'Compaction test > 95% MDD, blinding min 75mm.', status: 'PASS', notes: 'Blinding depth verified.' },
    { id: 'fnd-02', text: 'Foundation reinforcement bar diameter, spacing and laps match approved drawings', criteria: 'Bar diameter & spacing within ±5mm tolerance.', status: 'PASS', notes: 'Grid A1-D4 rebar mat checked.' },
    { id: 'fnd-03', text: 'Concrete cover block clearance verified (min 50mm for substructure)', criteria: 'Heavy-duty concrete spacer blocks placed at 1m centers.', status: 'PASS', notes: '50mm spacers confirmed.' },
    { id: 'fnd-04', text: 'Pile cap starter bars and column dowel positioning aligned with centerlines', criteria: 'Plumbness and axis offset < 3mm.', status: 'PASS', notes: 'Laser axis aligned.' },
    { id: 'fnd-05', text: 'Pre-pour shuttering cleanliness, water removal and debris clearance', criteria: 'Zero standing water, loose dirt, or binding wire cut-offs.', status: 'PASS', notes: 'Blowers used, base clean.' }
  ],
  'zone-04': [ // Columns
    { id: 'col-01', text: 'Column vertical plumbness and dimensional cross-section verified', criteria: 'Plumb deviation < 1:500 or 5mm max.', status: 'PASS', notes: 'Laser plumb verified.' },
    { id: 'col-02', text: 'Main longitudinal rebar lap lengths and staggered splices confirmed', criteria: 'Lap length min 50d with staggered joints.', status: 'PASS', notes: 'Staggered splices confirmed.' },
    { id: 'col-03', text: 'Stirrup/tie hook angles (135°) and seismic confinement zone spacing', criteria: '135° bends with 10d extension, 100mm spacing at ends.', status: 'PASS', notes: 'Seismic ties verified.' },
    { id: 'col-04', text: 'Concrete cover spacer blocks (min 40mm) secured on all four faces', criteria: 'Cover blocks tied at 800mm vertical pitch.', status: 'PASS', notes: 'Spacers tied.' },
    { id: 'col-05', text: 'Formwork tie-bolts, seal tape and kickers secured against grout leak', criteria: 'Watertight joints with release agent applied evenly.', status: 'PASS', notes: 'Kickers braced.' }
  ],
  'zone-06': [ // Slabs
    { id: 'slb-01', text: 'Formwork staging, propping and bracing stability certified', criteria: 'Props braced in both directions, timber bearers sound.', status: 'PASS', notes: 'Acro props checked.' },
    { id: 'slb-02', text: 'Bottom reinforcement mesh, chair bar support and top negative steel', criteria: 'Chair bars at 1m grid, top steel rigid.', status: 'PASS', notes: 'Chair bars solid.' },
    { id: 'slb-03', text: 'Concealed electrical conduits, fan hook boxes and plumbing sleeves', criteria: 'Conduits tied below top steel, sleeves plugged.', status: 'PASS', notes: 'Sleeves verified.' },
    { id: 'slb-04', text: 'Construction joint bulkheads and shear keys positioned at 1/3 span', criteria: 'Stop-ends positioned at approved zero-moment locations.', status: 'PASS', notes: 'Stop-end at Bay 2.' },
    { id: 'slb-05', text: 'Concrete cover blocks (min 20mm) and slab thickness screed rails fixed', criteria: 'Uniform 150mm slab depth screed pins installed.', status: 'PASS', notes: 'Screed pins set.' }
  ],
  'zone-09': [ // Electrical
    { id: 'ele-01', text: 'Concealed conduit routing aligns with approved MEP coordinating drawings', criteria: 'Rigid PVC / MS conduits without kinks or sharp bends.', status: 'PASS', notes: 'Routing confirmed.' },
    { id: 'ele-02', text: 'Metal back-boxes recessed flush with planned plaster finish line', criteria: 'Box depth checked against datum lines.', status: 'PASS', notes: 'Flush mount verified.' },
    { id: 'ele-03', text: 'Continuous GI fish-wire / draw-wire pulled through all conduit runs', criteria: 'Zero conduit blockages or joint disconnections.', status: 'PASS', notes: 'Draw-wires tested.' },
    { id: 'ele-04', text: 'Distribution board enclosure earthing studs and conduit entry bushes', criteria: 'Brass bushes used, earth copper tape connected.', status: 'PASS', notes: 'Earthing continuity ok.' }
  ],
  'zone-11': [ // Waterproofing
    { id: 'wtp-01', text: 'Surface preparation: concrete substrate sound, dry and free of honeycomb', criteria: 'Laitance removed, honeycombs repaired with non-shrink grout.', status: 'PASS', notes: 'Substrate prepared.' },
    { id: 'wtp-02', text: 'Coved angle fillets (50x50mm) formed at all floor-to-wall junctions', criteria: 'Continuous polymer mortar fillets cured.', status: 'PASS', notes: 'Fillets formed.' },
    { id: 'wtp-03', text: 'Waterproofing membrane application thickness and overlap seams', criteria: 'Min 1.5mm DFT, 100mm side laps hot-air welded.', status: 'PASS', notes: 'Welded laps checked.' },
    { id: 'wtp-04', text: 'Ponding flood test: 72 continuous hours at 50mm standing head', criteria: 'Zero leakage, moisture dampness or pressure loss on underside.', status: 'PASS', notes: '72hr flood test pass.' },
    { id: 'wtp-05', text: 'Protective screed / dimple drainage board applied before backfilling', criteria: 'Protection layer installed immediately after test approval.', status: 'PASS', notes: 'Protection board on.' }
  ],
  'zone-17': [ // Scaffolding
    { id: 'scf-01', text: 'Sole boards and screw base-jacks on compacted ground level', criteria: 'Timber sole boards min 225x38mm, base jacks leveled.', status: 'PASS', notes: 'Sole boards checked.' },
    { id: 'scf-02', text: 'Standards vertical, ledgers and transoms coupled with certified fittings', criteria: 'Right-angle couplers torqued to 50 Nm.', status: 'PASS', notes: 'Couplers torqued.' },
    { id: 'scf-03', text: 'Working platforms fully boarded without trap-ends or trip steps', criteria: 'Steel/timber scaffold boards clamped without gaps.', status: 'PASS', notes: 'Decking secure.' },
    { id: 'scf-04', text: 'Top guardrail (950mm), mid-rail (475mm) and toe-boards (150mm) fitted', criteria: 'Double guardrails on all exposed platform edges.', status: 'PASS', notes: 'Edge protection ok.' },
    { id: 'scf-05', text: 'Scaffold tag displayed with date of last inspection and auditor sign-off', criteria: 'Green inspection tag signed and hung at ladder point.', status: 'PASS', notes: 'Green tag displayed.' }
  ]
};

export const MOCK_REINSPECTIONS = [
  {
    id: 'reinsp-101',
    defect_id: 'def-01',
    original_inspection_id: 'insp-101',
    site_id: 'site-nh44-flyover',
    site_name: 'NH-44 Elevated Expressway Flyover',
    assigned_inspector_id: 'usr-insp-vp01',
    assigned_inspector_name: 'Vishnu Prasath',
    priority: 'CRITICAL',
    deadline: '2026-09-14T18:00:00.000Z',
    instructions: 'Re-inspect Pier P-14 concrete patch. Take new photo, run YOLO crack/spalling check, and verify rebar coverage.',
    original_defect: {
      id: 'def-01',
      title: 'Concrete Spalling & Exposed Rebar',
      description: 'Delamination of concrete cover measuring 85cm x 40cm with noticeable rust bleeding on secondary tie rebar.',
      severity: 'CRITICAL',
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80',
      location_details: 'Pier P-14 South Face'
    },
    status: 'COMPLETED',
    result: 'STILL_OPEN',
    new_evidence_photo: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
    notes: 'Initial polymer patch applied by contractor, but hairline shrinkage cracks observed on lower periphery. Needs secondary sealing coat.',
    yolo_detection: {
      finding: 'MICRO_FISSURE_CRACK',
      confidence: 0.89,
      severity: 'MEDIUM'
    },
    location_verified: true,
    coords: { latitude: 28.7041, longitude: 77.1025 },
    created_by: 'K. Selvakumar, IAS',
    created_at: '2026-09-11T09:30:00.000Z',
    completed_at: '2026-09-11T16:45:00.000Z',
    completed_by: 'Vishnu Prasath'
  },
  {
    id: 'reinsp-102',
    defect_id: 'def-01',
    original_inspection_id: 'insp-101',
    site_id: 'site-nh44-flyover',
    site_name: 'NH-44 Elevated Expressway Flyover',
    assigned_inspector_id: 'usr-insp-vp01',
    assigned_inspector_name: 'Vishnu Prasath',
    priority: 'HIGH',
    deadline: '2026-09-15T18:00:00.000Z',
    instructions: 'Follow-up re-inspection on secondary polymer sealant and elastomeric topcoat.',
    original_defect: {
      id: 'def-01',
      title: 'Concrete Spalling & Exposed Rebar',
      description: 'Delamination of concrete cover measuring 85cm x 40cm with noticeable rust bleeding on secondary tie rebar.',
      severity: 'CRITICAL',
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80',
      location_details: 'Pier P-14 South Face'
    },
    status: 'ASSIGNED',
    result: null,
    new_evidence_photo: null,
    notes: null,
    yolo_detection: null,
    location_verified: false,
    coords: null,
    created_by: 'K. Selvakumar, IAS',
    created_at: '2026-09-12T08:00:00.000Z',
    completed_at: null,
    completed_by: null
  },
  {
    id: 'reinsp-103',
    defect_id: 'def-04',
    original_inspection_id: 'insp-104',
    site_id: 'site-chennai-port',
    site_name: 'Deepwater Container Berth 04',
    assigned_inspector_id: 'usr-insp-sv03',
    assigned_inspector_name: 'Sivavaiyapuri',
    priority: 'MEDIUM',
    deadline: '2026-09-13T12:00:00.000Z',
    instructions: 'Verify marine anti-corrosion barrier coating on Bollard #12 quay deck anchors.',
    original_defect: {
      id: 'def-04',
      title: 'Surface Rust & Grout Micro-cracking',
      description: 'Marine epoxy coating weathering along anchor base flange. Structural integrity unaffected.',
      severity: 'MINOR',
      photo_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
      location_details: 'Bollard #12 Quay Deck'
    },
    status: 'COMPLETED',
    result: 'FIXED',
    new_evidence_photo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    notes: 'Dual-layer epoxy paint cure verified with Elcometer thickness gauge (320 microns). Issue successfully resolved and closed.',
    yolo_detection: {
      finding: 'COMPLIANT_SURFACE',
      confidence: 0.96,
      severity: 'LOW'
    },
    location_verified: true,
    coords: { latitude: 13.0827, longitude: 80.2707 },
    created_by: 'Dr. S. Radhakrishnan',
    created_at: '2026-09-09T10:15:00.000Z',
    completed_at: '2026-09-10T14:20:00.000Z',
    completed_by: 'Sivavaiyapuri'
  }
];

export const MOCK_AI_ALERTS = [
  {
    id: 'ALERT-CCTV-01',
    source: 'cctv',
    camera_id: 'CAM-01',
    camera_name: 'Site Camera 01 (Track Pier P-14)',
    site_id: 'site-delhi-metro',
    site_name: 'Delhi Metro Anand Vihar Interchange',
    detection_type: 'Concrete Spalling & Delamination',
    confidence: 0.94,
    location: 'Track Pier P-14 (West Cantilever)',
    snapshot_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop&q=80',
    status: 'OPEN',
    assigned_inspector_id: 'usr-insp-vp01',
    assigned_inspector_name: 'Vishnu Prasath',
    created_at: '2026-09-12T10:42:00.000Z'
  },
  {
    id: 'ALERT-CCTV-02',
    source: 'cctv',
    camera_id: 'CAM-02',
    camera_name: 'Site Camera 02 (Pier P-04 Overpass)',
    site_id: 'site-nh44-flyover',
    site_name: 'NH-44 Elevated Expressway Flyover',
    detection_type: 'Structural Micro-Fissure Crack',
    confidence: 0.91,
    location: 'Pier P-04 Joint Decking',
    snapshot_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
    status: 'REVIEWED',
    assigned_inspector_id: 'usr-insp-vp01',
    assigned_inspector_name: 'Vishnu Prasath',
    created_at: '2026-09-12T09:15:00.000Z'
  },
  {
    id: 'ALERT-INSP-01',
    source: 'inspector',
    camera_id: null,
    camera_name: 'Inspector Camera (Phone Lens)',
    site_id: 'site-blr-substation',
    site_name: '400kV Ultra-High Voltage Substation',
    detection_type: 'Electrolytic Surface Corrosion',
    confidence: 0.88,
    location: 'Transformer Bay 3B High-Side Bushing',
    snapshot_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    status: 'OPEN',
    assigned_inspector_id: 'usr-insp-sr04',
    assigned_inspector_name: 'Sriram',
    created_at: '2026-09-12T11:20:00.000Z'
  }
];

export const MOCK_CAMERAS = [
  {
    id: 'CAM-01',
    name: 'Delhi Metro — Track Pier P-14 Camera',
    site_id: 'site-delhi-metro',
    site_name: 'Delhi Metro Anand Vihar Interchange',
    status: 'CONNECTED',
    resolution: '4K UltraHD',
    fps: 28.4,
    stream_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=1200&auto=format&fit=crop&q=80',
    location: 'Pier P-14 Elevation'
  },
  {
    id: 'CAM-02',
    name: 'NH-44 Highway Overpass — Pier P-04 Camera',
    site_id: 'site-nh44-flyover',
    site_name: 'NH-44 Elevated Expressway Flyover',
    status: 'CONNECTED',
    resolution: '4K UltraHD',
    fps: 29.1,
    stream_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&auto=format&fit=crop&q=80',
    location: 'Overpass Pier P-04'
  },
  {
    id: 'CAM-03',
    name: 'Subsea Tunnel — Exhaust Duct Camera 3',
    site_id: 'site-mumbai-tunnel',
    site_name: 'Coastal Road Subsea Tunnel Twin-Tube',
    status: 'OFFLINE',
    resolution: '1080p Full HD',
    fps: 0,
    stream_url: null,
    location: 'Southbound Tube Jet Fan #7'
  },
  {
    id: 'CAM-NONE',
    name: 'Chennai Port Container Berth',
    site_id: 'site-chennai-port',
    site_name: 'Deepwater Container Berth 04',
    status: 'NOT_CONNECTED',
    resolution: null,
    fps: 0,
    stream_url: null,
    location: 'Quay Deck'
  }
];

