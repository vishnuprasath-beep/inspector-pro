const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { TABLES, ROLES, SEVERITIES, INSPECTION_STATUSES, DEFECT_STATUSES, ACTION_STATUSES } = require('../models/schema');

function generateHash(password) {
  return bcrypt.hashSync(password, 10);
}

function seedDatabase() {
  console.log('[Seed] Starting database seeding with realistic SIH demo data...');
  db.reset();

  const defaultPasswordHash = generateHash('Password123!');

  // ==========================================
  // 1. USERS & INSPECTORS (3 Admin Posts + 6 Field Inspectors)
  // ==========================================
  const users = [
    // 3 Leadership / Admin Posts (Tamil Leadership)
    {
      id: 'usr-admin-01',
      name: 'K. Selvakumar, IAS',
      email: 'selvakumar.ias@inspection.gov.in',
      username: 'admin',
      password_hash: generateHash('Admin@2026'),
      role: ROLES.ADMIN,
      post: 'Principal Administrator',
      badge: 'Principal Administrator / State Directorate',
      phone: '+91 98401 23451',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-director-01',
      name: 'Dr. S. Radhakrishnan',
      email: 'radhakrishnan@inspection.gov.in',
      username: 'director',
      password_hash: generateHash('Director@2026'),
      role: ROLES.DIRECTOR,
      post: 'State Director of Inspections',
      badge: 'State Director of Inspections',
      phone: '+91 98401 23452',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-supervisor-01',
      name: 'M. Muthukumar',
      email: 'muthukumar@inspection.gov.in',
      username: 'supervisor',
      password_hash: generateHash('Super@2026'),
      role: ROLES.SUPERVISOR,
      post: 'Chief Infrastructure Supervisor',
      badge: 'Chief Safety & Compliance Supervisor',
      phone: '+91 98401 23453',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      status: 'ACTIVE'
    },
    // 6 Certified Field Inspectors
    {
      id: 'usr-insp-vp01',
      name: 'Vishnu Prasath',
      email: 'vishnu.prasath@inspectra.gov.in',
      username: 'vishnu.p',
      password_hash: generateHash('Field@2026'),
      role: ROLES.INSPECTOR,
      post: 'Lead Field Auditor',
      badge: 'Lead Field Auditor / INSP-2026-VP01',
      phone: '+91 98401 11001',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-insp-vv02',
      name: 'Vishnu Varthan',
      email: 'vishnu.varthan@inspectra.gov.in',
      username: 'vishnu.v',
      password_hash: generateHash('Field@2026'),
      role: ROLES.INSPECTOR,
      post: 'Field Structural Auditor',
      badge: 'Field Structural Auditor / INSP-2026-VV02',
      phone: '+91 98401 11002',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-insp-sv03',
      name: 'Sivavaiyapuri',
      email: 'sivavaiyapuri@inspectra.gov.in',
      username: 'siva.v',
      password_hash: generateHash('Field@2026'),
      role: ROLES.INSPECTOR,
      post: 'Senior NDT Specialist',
      badge: 'Senior NDT Specialist / INSP-2026-SV03',
      phone: '+91 98401 11003',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-insp-sr04',
      name: 'Sriram',
      email: 'sriram@inspectra.gov.in',
      username: 'sriram',
      password_hash: generateHash('Field@2026'),
      role: ROLES.INSPECTOR,
      post: 'Highway & Geotech Auditor',
      badge: 'Highway & Geotech Auditor / INSP-2026-SR04',
      phone: '+91 98401 11004',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-insp-ml05',
      name: 'Mahalakshmi',
      email: 'mahalakshmi@inspectra.gov.in',
      username: 'maha.l',
      password_hash: generateHash('Field@2026'),
      role: ROLES.INSPECTOR,
      post: 'Maritime & Port Auditor',
      badge: 'Maritime Auditor / INSP-2026-ML05',
      phone: '+91 98401 11005',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'usr-insp-sm06',
      name: 'Sivamathi',
      email: 'sivamathi@inspectra.gov.in',
      username: 'sivamathi',
      password_hash: generateHash('Field@2026'),
      role: ROLES.INSPECTOR,
      post: 'Energy & Grid Auditor',
      badge: 'Energy Auditor / INSP-2026-SM06',
      phone: '+91 98401 11006',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'ACTIVE'
    }
  ];

  users.forEach(u => db.insert(TABLES.USERS, u));

  const inspectors = [
    {
      id: 'insp-01',
      user_id: 'usr-insp-vp01',
      name: 'Vishnu Prasath',
      employee_code: 'INSP-2026-VP01',
      specialization: 'Civil & Structural Engineering',
      qualification: 'B.Tech Civil, NDT Level II Certified',
      assigned_site_name: 'Delhi Metro Central Terminal (Phase 2)',
      current_lat: 28.6289,
      current_lng: 77.2219,
      last_active_at: new Date(Date.now() - 5 * 60000).toISOString(),
      assigned_sites_count: 2,
      status: 'ON_SITE'
    },
    {
      id: 'insp-02',
      user_id: 'usr-insp-vv02',
      name: 'Vishnu Varthan',
      employee_code: 'INSP-2026-VV02',
      specialization: 'Elevated Highways & Bridges',
      qualification: 'M.E. Structural Engineering',
      assigned_site_name: 'NH-44 Elevated Expressway Flyover',
      current_lat: 28.6472,
      current_lng: 77.3155,
      last_active_at: new Date(Date.now() - 15 * 60000).toISOString(),
      assigned_sites_count: 2,
      status: 'ON_SITE'
    },
    {
      id: 'insp-03',
      user_id: 'usr-insp-sv03',
      name: 'Sivavaiyapuri',
      employee_code: 'INSP-2026-SV03',
      specialization: 'Subsea Tunnels & Coastal Works',
      qualification: 'B.E. Ocean & Coastal Systems',
      assigned_site_name: 'Coastal Road Subsea Tunnel Twin-Tube',
      current_lat: 18.9754,
      current_lng: 72.8126,
      last_active_at: new Date(Date.now() - 30 * 60000).toISOString(),
      assigned_sites_count: 1,
      status: 'AVAILABLE'
    },
    {
      id: 'insp-04',
      user_id: 'usr-insp-sr04',
      name: 'Sriram',
      employee_code: 'INSP-2026-SR04',
      specialization: 'Ultra-High Voltage Substation Grids',
      qualification: 'B.Tech Electrical & Electronics',
      assigned_site_name: '400kV Ultra-High Voltage Smart Grid Substation',
      current_lat: 13.0978,
      current_lng: 77.3917,
      last_active_at: new Date(Date.now() - 10 * 60000).toISOString(),
      assigned_sites_count: 2,
      status: 'ON_SITE'
    },
    {
      id: 'insp-05',
      user_id: 'usr-insp-ml05',
      name: 'Mahalakshmi',
      employee_code: 'INSP-2026-ML05',
      specialization: 'Deepwater Maritime Container Berths',
      qualification: 'B.Tech Marine & Harbor Infrastructure',
      assigned_site_name: 'Deepwater Container Berth 04 Marine Terminal',
      current_lat: 13.0840,
      current_lng: 80.2990,
      last_active_at: new Date(Date.now() - 25 * 60000).toISOString(),
      assigned_sites_count: 1,
      status: 'ON_SITE'
    },
    {
      id: 'insp-06',
      user_id: 'usr-insp-sm06',
      name: 'Sivamathi',
      employee_code: 'INSP-2026-SM06',
      specialization: 'Solar Photovoltaic & Substation Systems',
      qualification: 'B.E. Renewable Energy Engineering',
      assigned_site_name: 'Bhadla Solar Power Ultra Park (Sector 4)',
      current_lat: 27.5387,
      current_lng: 71.9161,
      last_active_at: new Date(Date.now() - 8 * 60000).toISOString(),
      assigned_sites_count: 1,
      status: 'AVAILABLE'
    }
  ];

  inspectors.forEach(i => db.insert(TABLES.INSPECTORS, i));

  // ==========================================
  // 2. SITES (5 Strategic SIH National Infrastructure Sites)
  // ==========================================
  const sites = [
    {
      id: 'site-01',
      name: 'Delhi Metro Central Terminal (Phase 2)',
      code: 'DEL-MET-02',
      site_type: 'Metro Transit Infrastructure',
      address: 'Barakhamba Road, Connaught Place, New Delhi',
      city: 'New Delhi',
      state: 'Delhi NCR',
      geo_fence_lat: 28.6289,
      geo_fence_lng: 77.2219,
      geo_fence_radius_meters: 650,
      supervisor_id: 'usr-supervisor-01',
      status: 'ACTIVE'
    },
    {
      id: 'site-02',
      name: 'Bhadla Solar Power Ultra Park (Sector 4)',
      code: 'RAJ-SOL-04',
      site_type: 'Renewable Energy Facility',
      address: 'Phalodi Tehsil, Jodhpur District',
      city: 'Jodhpur',
      state: 'Rajasthan',
      geo_fence_lat: 27.5387,
      geo_fence_lng: 71.9161,
      geo_fence_radius_meters: 1200,
      supervisor_id: 'usr-supervisor-01',
      status: 'ACTIVE'
    },
    {
      id: 'site-03',
      name: 'Smart City High-Capacity Water Treatment Plant',
      code: 'BHO-WTP-01',
      site_type: 'Municipal Water Utility',
      address: 'Upper Lake Watershed Zone, Kolar Road',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      geo_fence_lat: 23.1895,
      geo_fence_lng: 77.4293,
      geo_fence_radius_meters: 500,
      supervisor_id: 'usr-supervisor-01',
      status: 'ACTIVE'
    },
    {
      id: 'site-04',
      name: 'Cyber Innovation Tech Park (Block C)',
      code: 'BLR-TEC-03',
      site_type: 'Commercial Smart Building',
      address: 'Outer Ring Road, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      geo_fence_lat: 12.9260,
      geo_fence_lng: 77.6762,
      geo_fence_radius_meters: 450,
      supervisor_id: 'usr-supervisor-01',
      status: 'ACTIVE'
    },
    {
      id: 'site-05',
      name: 'National Highway NH-44 Multi-Span Overpass Bridge',
      code: 'NAG-NH-044',
      site_type: 'National Highway & Bridge',
      address: 'Km Marker 342, North-South Corridor, Butibori',
      city: 'Nagpur',
      state: 'Maharashtra',
      geo_fence_lat: 20.9320,
      geo_fence_lng: 78.9629,
      geo_fence_radius_meters: 800,
      supervisor_id: 'usr-supervisor-01',
      status: 'ACTIVE'
    }
  ];

  sites.forEach(s => db.insert(TABLES.SITES, s));

  // ==========================================
  // 3. ASSETS (High-value assets per site)
  // ==========================================
  const assets = [
    {
      id: 'ast-01',
      site_id: 'site-01',
      name: 'Primary Escalator Bank 3B',
      asset_tag: 'AST-DEL-ESC-003',
      category: 'Transit Mechanics',
      manufacturer: 'Otis Infrastructure',
      model_number: 'NPE-2022',
      install_date: '2021-04-12',
      last_maintenance_date: '2024-01-10',
      criticality: 'HIGH',
      status: 'OPERATIONAL',
      qr_code: 'QR-AST-DEL-ESC-003'
    },
    {
      id: 'ast-02',
      site_id: 'site-01',
      name: '33kV Gas Insulated Traction Switchgear',
      asset_tag: 'AST-DEL-SWG-012',
      category: 'High Voltage Power',
      manufacturer: 'Siemens Energy',
      model_number: '8DA10-GIS',
      install_date: '2020-08-15',
      last_maintenance_date: '2023-11-20',
      criticality: 'CRITICAL',
      status: 'DEGRADED',
      qr_code: 'QR-AST-DEL-SWG-012'
    },
    {
      id: 'ast-03',
      site_id: 'site-02',
      name: '2.5MW Central Inverter Unit 04',
      asset_tag: 'AST-RAJ-INV-004',
      category: 'Power Electronics',
      manufacturer: 'ABB Power Solutions',
      model_number: 'PVS980-58',
      install_date: '2022-02-18',
      last_maintenance_date: '2023-12-05',
      criticality: 'CRITICAL',
      status: 'OPERATIONAL',
      qr_code: 'QR-AST-RAJ-INV-004'
    },
    {
      id: 'ast-04',
      site_id: 'site-03',
      name: 'High-Lift Raw Water Intake Pump #2',
      asset_tag: 'AST-BHO-PMP-002',
      category: 'Fluid Machinery',
      manufacturer: 'Kirloskar Brothers',
      model_number: 'KS-650-M',
      install_date: '2019-11-10',
      last_maintenance_date: '2023-10-18',
      criticality: 'HIGH',
      status: 'OPERATIONAL',
      qr_code: 'QR-AST-BHO-PMP-002'
    },
    {
      id: 'ast-05',
      site_id: 'site-05',
      name: 'Pre-Stressed Concrete Pier P-14 & Expansion Joint',
      asset_tag: 'AST-NAG-PIER-014',
      category: 'Bridge Structural',
      manufacturer: 'L&T Heavy Civil',
      model_number: 'PSC-BOX-32M',
      install_date: '2018-05-20',
      last_maintenance_date: '2023-08-12',
      criticality: 'CRITICAL',
      status: 'INSPECTION_DUE',
      qr_code: 'QR-AST-NAG-PIER-014'
    }
  ];

  assets.forEach(a => db.insert(TABLES.ASSETS, a));

  // ==========================================
  // 4. TEMPLATES & CHECKLISTS
  // ==========================================
  const template1 = {
    id: 'tpl-01',
    title: 'Standard Infrastructure Structural & Safety Audit (v2.4)',
    category: 'Structural Safety',
    version: '2.4',
    description: 'Statutory compliance inspection covering concrete structural health, corrosion, emergency pathways, and environmental safety.',
    created_by_user_id: 'usr-admin-01',
    status: 'ACTIVE'
  };

  const template2 = {
    id: 'tpl-02',
    title: 'High-Voltage Electrical & Grid Integrity Protocol',
    category: 'Electrical & Power',
    version: '1.8',
    description: 'Thermal imaging, earthing resistance, insulation resistance, and arc-flash barrier inspection protocol.',
    created_by_user_id: 'usr-admin-01',
    status: 'ACTIVE'
  };

  db.insert(TABLES.INSPECTION_TEMPLATES, template1);
  db.insert(TABLES.INSPECTION_TEMPLATES, template2);

  const checklists = [
    {
      id: 'chk-01',
      template_id: 'tpl-01',
      section_name: 'Structural Integrity',
      item_text: 'Inspect load-bearing piers and columns for cracks, spalling, or rebar exposure.',
      input_type: 'PASS_FAIL',
      mandatory: true,
      passing_criteria: 'No visible cracks exceeding 0.3mm width or spalling with exposed rebar.',
      order_index: 1
    },
    {
      id: 'chk-02',
      template_id: 'tpl-01',
      section_name: 'Structural Integrity',
      item_text: 'Expansion joint seal integrity and alignment check.',
      input_type: 'PASS_FAIL',
      mandatory: true,
      passing_criteria: 'Elastomeric seals intact with no debris jams or severe water leakage.',
      order_index: 2
    },
    {
      id: 'chk-03',
      template_id: 'tpl-01',
      section_name: 'Safety & Life Systems',
      item_text: 'Emergency egress routes unobstructed and luminous exit signage functional.',
      input_type: 'PASS_FAIL',
      mandatory: true,
      passing_criteria: 'Clear width maintained with working 90-minute battery backup signs.',
      order_index: 3
    },
    {
      id: 'chk-04',
      template_id: 'tpl-01',
      section_name: 'Safety & Life Systems',
      item_text: 'Fire suppression hydrants and dry riser pressure verification.',
      input_type: 'NUMERIC',
      mandatory: true,
      passing_criteria: 'Minimum 4.5 bar dynamic static pressure at top outlet.',
      order_index: 4
    },
    {
      id: 'chk-05',
      template_id: 'tpl-01',
      section_name: 'Environmental Compliance',
      item_text: 'Drainage sumps, storm runoff channels, and oil-water separator condition.',
      input_type: 'PASS_FAIL',
      mandatory: false,
      passing_criteria: 'Free flowing without heavy sludge or environmental sheen.',
      order_index: 5
    }
  ];

  checklists.forEach(c => db.insert(TABLES.CHECKLISTS, c));

  // ==========================================
  // 5. 10 INSPECTIONS (Complete SIH demo set with varied statuses)
  // ==========================================
  const inspections = [
    {
      id: 'insp-rec-01',
      template_id: 'tpl-01',
      site_id: 'site-01',
      inspector_id: 'insp-01',
      title: 'Delhi Metro Pier & Viaduct Quarterly Safety Audit',
      scheduled_date: '2024-03-01T09:00:00Z',
      completed_date: '2024-03-01T14:30:00Z',
      status: INSPECTION_STATUSES.COMPLETED,
      compliance_score: 92.5,
      total_items_checked: 5,
      passed_items_count: 5,
      failed_items_count: 0,
      geofence_verified: true,
      geofence_distance_meters: 142.3,
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M10 20 Q 30 5, 60 25 T 90 10" fill="none" stroke="blue" stroke-width="2"/></svg>',
      supervisor_remarks: 'Excellent compliance. All pier joints cleared for public transit safety.',
      summary: 'Viaduct section 12 to 18 inspected. Minor hairline settlement crack noted but well within IS-456 tolerances.'
    },
    {
      id: 'insp-rec-02',
      template_id: 'tpl-01',
      site_id: 'site-05',
      inspector_id: 'insp-05',
      title: 'NH-44 Overpass Pier 14 Structural Distress Inspection',
      scheduled_date: '2024-03-02T10:00:00Z',
      completed_date: '2024-03-02T16:15:00Z',
      status: INSPECTION_STATUSES.FLAGGED,
      compliance_score: 64.0,
      total_items_checked: 5,
      passed_items_count: 3,
      failed_items_count: 2,
      geofence_verified: true,
      geofence_distance_meters: 85.0,
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M10 15 Q 40 2, 70 20 T 95 12" fill="none" stroke="black" stroke-width="2"/></svg>',
      supervisor_remarks: 'URGENT: Flagged for high-priority reinforcement. Structural spalling confirmed on Pier 14.',
      summary: 'Concrete spalling observed on southern face with oxidation of secondary tie rebar. Immediate epoxy grouting and shoring recommended.'
    },
    {
      id: 'insp-rec-03',
      template_id: 'tpl-02',
      site_id: 'site-02',
      inspector_id: 'insp-02',
      title: 'Bhadla Solar Sector 4 Transformer Substation Thermal Scan',
      scheduled_date: '2024-03-03T11:00:00Z',
      completed_date: '2024-03-03T15:00:00Z',
      status: INSPECTION_STATUSES.APPROVED,
      compliance_score: 98.0,
      total_items_checked: 5,
      passed_items_count: 5,
      failed_items_count: 0,
      geofence_verified: true,
      geofence_distance_meters: 210.5,
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M5 25 Q 50 5, 80 15" fill="none" stroke="navy" stroke-width="2"/></svg>',
      supervisor_remarks: 'Verified by Kavita Menon. Full compliance with Central Electricity Authority grid guidelines.',
      summary: 'Inverters and step-up transformers operating within thermal safety envelope. Earthing grid tested at 0.42 ohms.'
    },
    {
      id: 'insp-rec-04',
      template_id: 'tpl-01',
      site_id: 'site-03',
      inspector_id: 'insp-03',
      title: 'Bhopal Water Treatment Chemical & Pump Hall Safety Audit',
      scheduled_date: '2024-03-04T09:30:00Z',
      completed_date: '2024-03-04T13:45:00Z',
      status: INSPECTION_STATUSES.COMPLETED,
      compliance_score: 78.5,
      total_items_checked: 5,
      passed_items_count: 4,
      failed_items_count: 1,
      geofence_verified: true,
      geofence_distance_meters: 95.0,
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M12 22 Q 45 8, 75 18 T 90 8" fill="none" stroke="green" stroke-width="2"/></svg>',
      supervisor_remarks: 'Chlorine scrubber ventilation valve requires gasket replacement.',
      summary: 'Pump hall 2 operational. Leakage identified at flange joint B-4. Remedial action logged.'
    },
    {
      id: 'insp-rec-05',
      template_id: 'tpl-01',
      site_id: 'site-04',
      inspector_id: 'insp-04',
      title: 'Bengaluru Tech Park Block C Fire Evacuation & HVAC Audit',
      scheduled_date: '2024-03-05T14:00:00Z',
      completed_date: '2024-03-05T17:30:00Z',
      status: INSPECTION_STATUSES.COMPLETED,
      compliance_score: 84.0,
      total_items_checked: 5,
      passed_items_count: 4,
      failed_items_count: 1,
      geofence_verified: true,
      geofence_distance_meters: 45.0,
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M10 20 L 40 10 L 70 25 L 90 12" fill="none" stroke="darkblue" stroke-width="2"/></svg>',
      supervisor_remarks: 'North emergency stairwell door lock removed as instructed.',
      summary: 'Smoke dampers and pressurization fans tested satisfactorily. Blocked fire exit cleared.'
    },
    {
      id: 'insp-rec-06',
      template_id: 'tpl-02',
      site_id: 'site-01',
      inspector_id: 'insp-02',
      title: 'Delhi Metro 33kV GIS Traction Switchgear Diagnostic',
      scheduled_date: '2024-03-06T10:00:00Z',
      completed_date: null,
      status: INSPECTION_STATUSES.IN_PROGRESS,
      compliance_score: 0.0,
      total_items_checked: 2,
      passed_items_count: 1,
      failed_items_count: 1,
      geofence_verified: true,
      geofence_distance_meters: 68.0,
      signature_url: null,
      supervisor_remarks: null,
      summary: 'Field inspection active. SF6 gas pressure reading at 5.2 bar.'
    },
    {
      id: 'insp-rec-07',
      template_id: 'tpl-01',
      site_id: 'site-02',
      inspector_id: 'insp-01',
      title: 'Bhadla Solar Perimeter Inverter Foundations & Civil Check',
      scheduled_date: '2024-03-07T09:00:00Z',
      completed_date: null,
      status: INSPECTION_STATUSES.SCHEDULED,
      compliance_score: 0.0,
      total_items_checked: 0,
      passed_items_count: 0,
      failed_items_count: 0,
      geofence_verified: false,
      geofence_distance_meters: null,
      signature_url: null,
      supervisor_remarks: null,
      summary: 'Scheduled for tomorrow morning. Pre-audit briefing dispatched to inspector.'
    },
    {
      id: 'insp-rec-08',
      template_id: 'tpl-01',
      site_id: 'site-03',
      inspector_id: 'insp-03',
      title: 'Bhopal Treatment Plant Chlorine Scrubbers & Bio-Filter Check',
      scheduled_date: '2024-03-08T10:30:00Z',
      completed_date: null,
      status: INSPECTION_STATUSES.SCHEDULED,
      compliance_score: 0.0,
      total_items_checked: 0,
      passed_items_count: 0,
      failed_items_count: 0,
      geofence_verified: false,
      geofence_distance_meters: null,
      signature_url: null,
      supervisor_remarks: null,
      summary: 'Routine bi-weekly environmental audit.'
    },
    {
      id: 'insp-rec-09',
      template_id: 'tpl-01',
      site_id: 'site-04',
      inspector_id: 'insp-04',
      title: 'Tech Park Basement 2 Water Harvesting Sump Inspection',
      scheduled_date: '2024-03-09T11:00:00Z',
      completed_date: '2024-03-09T13:00:00Z',
      status: INSPECTION_STATUSES.REJECTED,
      compliance_score: 45.0,
      total_items_checked: 5,
      passed_items_count: 2,
      failed_items_count: 3,
      geofence_verified: false,
      geofence_distance_meters: 1450.0,
      signature_url: null,
      supervisor_remarks: 'REJECTED: GPS telemetry logs indicate submission originated 1.45km outside perimeter fence. Re-inspection required with physical verification.',
      summary: 'Submission rejected due to geofence mismatch and missing photographic verification of float valves.'
    },
    {
      id: 'insp-rec-10',
      template_id: 'tpl-02',
      site_id: 'site-05',
      inspector_id: 'insp-05',
      title: 'Nagpur Highway NH-44 High-Mast Lighting & Electrical Junctions',
      scheduled_date: '2024-03-10T15:00:00Z',
      completed_date: '2024-03-10T18:30:00Z',
      status: INSPECTION_STATUSES.COMPLETED,
      compliance_score: 95.0,
      total_items_checked: 5,
      passed_items_count: 5,
      failed_items_count: 0,
      geofence_verified: true,
      geofence_distance_meters: 120.0,
      signature_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M15 15 Q 35 30, 65 10 T 92 18" fill="none" stroke="purple" stroke-width="2"/></svg>',
      supervisor_remarks: 'All 12 high-mast towers operational. Earth pit values within 1.2 ohms limit.',
      summary: 'LED clusters and lightning arresters tested. Ready for monsoon operation.'
    }
  ];

  inspections.forEach(i => db.insert(TABLES.INSPECTIONS, i));

  // ==========================================
  // 6. DEFECTS (Varied Severities: CRITICAL, HIGH, MEDIUM, LOW)
  // ==========================================
  const defects = [
    {
      id: 'def-01',
      inspection_id: 'insp-rec-02',
      asset_id: 'ast-05',
      title: 'Severe Concrete Spalling & Exposed Tie Rebar on Pier P-14',
      description: 'Delamination of concrete cover measuring 85cm x 40cm with noticeable rust bleeding and exposed 16mm rebar on the south load-bearing column.',
      severity: SEVERITIES.CRITICAL,
      status: DEFECT_STATUSES.ACTION_REQUIRED,
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600',
      location_details: 'Pier P-14, 2.5m above ground line, Highway Overpass NH-44',
      deadline: '2024-03-15T18:00:00Z',
      root_cause: 'Moisture ingress through compromised bridge deck drainage seal.',
      risk_score: 95
    },
    {
      id: 'def-02',
      inspection_id: 'insp-rec-06',
      asset_id: 'ast-02',
      title: 'Thermal Hotspot on 33kV Busbar Connection Terminal',
      description: 'FLIR thermal imaging shows 88.5°C hotspot at Phase-B busbar connector clamp, exceeding maximum allowable rise of 30°C over ambient.',
      severity: SEVERITIES.HIGH,
      status: DEFECT_STATUSES.OPEN,
      photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600',
      location_details: 'Traction Substation 3B, Incomer Cubicle 2',
      deadline: '2024-03-12T12:00:00Z',
      root_cause: 'Loose bolt torque and micro-arcing across terminal contact.',
      risk_score: 85
    },
    {
      id: 'def-03',
      inspection_id: 'insp-rec-04',
      asset_id: 'ast-04',
      title: 'Water Flange Packing Gland Gasket Leak',
      description: 'Continuous trickling leak (approx. 2.5 liters/min) at primary pump discharge flange packing gland.',
      severity: SEVERITIES.MEDIUM,
      status: DEFECT_STATUSES.IN_REVIEW,
      photo_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
      location_details: 'Pump House Bay 2, Raw Water Intake Flange',
      deadline: '2024-03-20T18:00:00Z',
      root_cause: 'Degraded neoprene gasket following prolonged pressure cycle.',
      risk_score: 60
    },
    {
      id: 'def-04',
      inspection_id: 'insp-rec-05',
      asset_id: null,
      title: 'Blocked Emergency Fire Exit Door by Material Staging',
      description: 'Pallets of interior drywall stacked directly against Level 2 East fire exit door, compromising emergency evacuation egress.',
      severity: SEVERITIES.HIGH,
      status: DEFECT_STATUSES.RESOLVED,
      photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600',
      location_details: 'Block C, 2nd Floor East Corridor Fire Exit Door E-2',
      deadline: '2024-03-06T12:00:00Z',
      root_cause: 'Unauthorized contractor material staging during office fit-out.',
      risk_score: 75
    },
    {
      id: 'def-05',
      inspection_id: 'insp-rec-01',
      asset_id: 'ast-01',
      title: 'Handrail Comb-Plate Lighting Defect on Escalator 3B',
      description: 'Lower step entry indicator LED lighting strip failed, creating low-visibility step entrance hazard during evening peak hours.',
      severity: SEVERITIES.LOW,
      status: DEFECT_STATUSES.CLOSED,
      photo_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600',
      location_details: 'Concourse Level to Platform 1 Escalator Entrance',
      deadline: '2024-03-10T18:00:00Z',
      root_cause: 'Driver circuit diode burn-out.',
      risk_score: 30
    }
  ];

  defects.forEach(d => db.insert(TABLES.DEFECTS, d));

  // ==========================================
  // 7. CORRECTIVE ACTIONS (Workflow Lifecycle)
  // ==========================================
  const correctiveActions = [
    {
      id: 'act-01',
      defect_id: 'def-01',
      assigned_to_user_id: 'usr-insp-05',
      action_taken: 'Erected safety exclusion barricade around Pier P-14. Issued work order WO-2024-094 to NHAI bridge repair team for rust conversion primer and polymer modified mortar injection.',
      action_type: 'STRUCTURAL_REPAIR',
      status: ACTION_STATUSES.IN_PROGRESS,
      proof_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
      verified_by_id: null,
      verified_at: null,
      notes: 'Structural engineer scheduled to certify compressive strength on March 14.',
      estimated_cost: 85000.00
    },
    {
      id: 'act-02',
      defect_id: 'def-04',
      assigned_to_user_id: 'usr-insp-04',
      action_taken: 'Direct verbal order given to site contractor. All stacked pallets removed within 45 minutes and fire exit route restored to full 2.4m clearance.',
      action_type: 'SAFETY_CORRECTION',
      status: ACTION_STATUSES.VERIFIED,
      proof_image_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600',
      verified_by_id: 'usr-supervisor-01',
      verified_at: '2024-03-05T18:00:00Z',
      notes: 'Verified via photo inspection. Contractor penalized under safety clause 14B.',
      estimated_cost: 0.00
    },
    {
      id: 'act-03',
      defect_id: 'def-05',
      assigned_to_user_id: 'usr-insp-01',
      action_taken: 'Replaced LED strip and 24V DC driver unit. Tested continuous lumination for 2 hours.',
      action_type: 'MAINTENANCE',
      status: ACTION_STATUSES.VERIFIED,
      proof_image_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600',
      verified_by_id: 'usr-supervisor-01',
      verified_at: '2024-03-02T11:00:00Z',
      notes: 'Closed and logged in escalator maintenance history.',
      estimated_cost: 4200.00
    }
  ];

  correctiveActions.forEach(a => db.insert(TABLES.CORRECTIVE_ACTIONS, a));

  // ==========================================
  // 8. EVIDENCE FILES (With simulated AI detection tags)
  // ==========================================
  const evidence = [
    {
      id: 'ev-01',
      inspection_id: 'insp-rec-02',
      checklist_item_id: 'chk-01',
      file_path: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800',
      file_type: 'image/jpeg',
      file_size_kb: 1420,
      caption: 'Concrete spall and rebar oxidation on Pier 14 South Face',
      gps_lat: 20.9322,
      gps_lng: 78.9631,
      ai_detected_defect: true,
      ai_confidence: 0.942,
      ai_analysis_tags: ['CONCRETE_SPALLING', 'REBAR_EXPOSURE', 'CORROSION_RUST_STAINING']
    },
    {
      id: 'ev-02',
      inspection_id: 'insp-rec-01',
      checklist_item_id: 'chk-01',
      file_path: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
      file_type: 'image/jpeg',
      file_size_kb: 980,
      caption: 'Metro viaduct segment joint alignment verification',
      gps_lat: 28.6291,
      gps_lng: 77.2221,
      ai_detected_defect: false,
      ai_confidence: 0.12,
      ai_analysis_tags: ['SOUND_STRUCTURE', 'ALIGNED_BEAM']
    }
  ];

  evidence.forEach(e => db.insert(TABLES.INSPECTION_EVIDENCE, e));

  // ==========================================
  // 9. NOTIFICATIONS & AUDIT LOGS
  // ==========================================
  const notifications = [
    {
      id: 'notif-01',
      user_id: 'usr-supervisor-01',
      title: 'CRITICAL DEFECT DETECTED: NH-44 Pier P-14',
      message: 'Inspector Vikram Singh reported concrete spalling on Pier P-14 with risk score 95/100.',
      type: 'DEFECT_CRITICAL',
      is_read: false,
      link_url: '/defects'
    },
    {
      id: 'notif-02',
      user_id: 'usr-insp-01',
      title: 'New Inspection Scheduled: Solar Sector 4',
      message: 'You have been assigned to conduct an integrity audit at Bhadla Solar Ultra Park.',
      type: 'INSPECTION_ASSIGNED',
      is_read: true,
      link_url: '/inspections'
    },
    {
      id: 'notif-03',
      user_id: 'usr-director-01',
      title: 'Monthly Compliance Summary Generated',
      message: 'Overall national infrastructure safety score reached 82.9% across 5 facilities.',
      type: 'SYSTEM',
      is_read: false,
      link_url: '/reports'
    }
  ];

  notifications.forEach(n => db.insert(TABLES.NOTIFICATIONS, n));

  const auditLogs = [
    {
      id: 'aud-01',
      user_id: 'usr-admin-01',
      action: 'SYSTEM_BOOTSTRAP',
      entity_type: 'SYSTEM',
      entity_id: 'SYS-INIT',
      ip_address: '103.21.244.2',
      user_agent: 'Antigravity-Engine/2.0',
      details: { message: 'Database initialized and seeded with SIH realistic dataset' }
    },
    {
      id: 'aud-02',
      user_id: 'usr-insp-05',
      action: 'DEFECT_LOGGED',
      entity_type: 'DEFECT',
      entity_id: 'def-01',
      ip_address: '103.24.18.90',
      user_agent: 'Flutter/3.19.0 (Android 14; Mobile Inspector)',
      details: { severity: 'CRITICAL', asset: 'AST-NAG-PIER-014', geofenceVerified: true }
    },
    {
      id: 'aud-03',
      user_id: 'usr-supervisor-01',
      action: 'CORRECTIVE_ACTION_VERIFIED',
      entity_type: 'CORRECTIVE_ACTION',
      entity_id: 'act-02',
      ip_address: '103.24.18.92',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0',
      details: { defectId: 'def-04', resolution: 'FIRE_EXIT_CLEARED' }
    }
  ];

  auditLogs.forEach(a => db.insert(TABLES.AUDIT_LOGS, a));

  console.log(`[Seed] Completed! Seeded:
    - ${users.length} Users & ${inspectors.length} Inspectors
    - ${sites.length} Strategic Infrastructure Sites
    - ${assets.length} Tracked Assets
    - ${checklists.length} Checklist Rules across 2 Templates
    - ${inspections.length} Inspections
    - ${defects.length} Defects & ${correctiveActions.length} Corrective Action records
    - ${evidence.length} Evidence Records
    - ${notifications.length} Notifications & ${auditLogs.length} Audit Trail Logs`);
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
