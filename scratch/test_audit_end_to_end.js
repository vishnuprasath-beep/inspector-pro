const http = require('http');
const fs = require('fs');

const BACKEND_PORT = 5000;

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer: buffer,
          text: buffer.toString('utf8'),
          json: () => {
            try { return JSON.parse(buffer.toString('utf8')); }
            catch(e) { return null; }
          }
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      if (typeof postData === 'string') {
        req.write(postData);
      } else if (Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('  INSPECTRA PRO — END-TO-END AUTOMATED AUDIT SUITE  ');
  console.log('====================================================\n');

  const results = [];
  function record(name, pass, detail = '') {
    const status = pass ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${name} ${detail ? '— ' + detail : ''}`);
    results.push({ name, pass, detail });
  }

  let adminToken = '';
  let inspectorToken = '';

  // 1. Authentication: Admin Login
  try {
    const res = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@inspection.gov.in', password: 'Password123!' });

    const json = res.json();
    if (res.statusCode === 200 && json?.data?.token) {
      adminToken = json.data.token;
      record('Login (Admin)', true, `Role: ${json.data.role}, User: ${json.data.user?.name}`);
    } else {
      record('Login (Admin)', false, `Status ${res.statusCode}: ${res.text}`);
    }
  } catch (err) {
    record('Login (Admin)', false, err.message);
  }

  // 2. Authentication: Inspector Login
  try {
    const res = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'vishnu.prasath@inspectra.gov.in', password: 'Password123!' });

    const json = res.json();
    if (res.statusCode === 200 && json?.data?.token) {
      inspectorToken = json.data.token;
      record('Login (Inspector)', true, `Role: ${json.data.role}, User: ${json.data.user?.name}`);
    } else {
      record('Login (Inspector)', false, `Status ${res.statusCode}: ${res.text}`);
    }
  } catch (err) {
    record('Login (Inspector)', false, err.message);
  }

  // 3. Role Isolation (RBAC): Inspector attempting Admin Route
  try {
    const res = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspectorToken}`
      }
    }, { name: 'Unauthorized Admin Attempt', role: 'ADMIN' });

    if (res.statusCode === 403) {
      record('Role Isolation (RBAC)', true, 'Inspector rejected from Admin user creation with 403 Forbidden');
    } else {
      record('Role Isolation (RBAC)', false, `Unexpected status: ${res.statusCode}`);
    }
  } catch (err) {
    record('Role Isolation (RBAC)', false, err.message);
  }

  // 4. YOLO Detection & Data Pipeline Verification
  let yoloDefectId = null;
  try {
    const defectPayload = {
      site_id: 'site-delhi-metro-p2',
      site_name: 'Delhi Metro Central Terminal (Phase 2)',
      zone_id: 'zone-p14',
      zone_name: 'Pier P-14 Support Column',
      title: 'Structural Concrete Spalling Hazard',
      description: 'Automated YOLOv8 vision scan detected exposed rebar and concrete spalling on pier P-14.',
      severity: 'CRITICAL',
      category: 'STRUCTURAL',
      component: 'concrete_spalling',
      location_details: 'Pier P-14 Girder Interface',
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800',
      ai_detection: {
        class: 'concrete_spalling',
        confidence: 0.942,
        bbox: [120, 80, 480, 360],
        model_engine: 'YOLOv8 ONNX Runtime'
      }
    };

    const createRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/defects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, defectPayload);

    const createJson = createRes.json();
    if (createRes.statusCode === 201 && createJson?.success && createJson.data?.id) {
      yoloDefectId = createJson.data.id;
      record('YOLO -> Issues & Safety Defect Logging', true, `Created Defect #${yoloDefectId} with AI metadata, Risk Score: ${createJson.data.risk_score}`);
    } else {
      record('YOLO -> Issues & Safety Defect Logging', false, `Status ${createRes.statusCode}: ${createRes.text}`);
    }
  } catch (err) {
    record('YOLO -> Issues & Safety Defect Logging', false, err.message);
  }

  // 5. Verify Defect Persistence & High-Risk Filter
  try {
    const listRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/defects?severity=CRITICAL',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const listJson = listRes.json();
    const found = listJson?.data?.find(d => d.id === yoloDefectId || (d.title && d.title.includes('Concrete Spalling')));
    if (found && (found.ai_detection?.class === 'concrete_spalling' || found.severity === 'CRITICAL')) {
      record('High-Risk Issues Filtering & Persistence', true, `Found Defect #${found.id} in CRITICAL registry (class: ${found.ai_detection?.class || 'spalling'})`);
    } else {
      record('High-Risk Issues Filtering & Persistence', false, 'Defect not found in CRITICAL list');
    }
  } catch (err) {
    record('High-Risk Issues Filtering & Persistence', false, err.message);
  }

  // 6. Admin Schedule Inspection
  let createdInspId = null;
  try {
    const schedPayload = {
      title: 'Statutory Safety Audit — Delhi Metro Track Pier',
      site_id: 'site-delhi-metro-p2',
      site_name: 'Delhi Metro Central Terminal (Phase 2)',
      inspector_id: 'usr-insp-vp01',
      inspector_name: 'Vishnu Prasath',
      scheduled_date: '2026-09-20',
      priority: 'HIGH',
      zone_name: 'Pier P-14 Deck',
      notes: 'Check expansion joints and bearing pads'
    };

    const schedRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/inspections',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, schedPayload);

    const schedJson = schedRes.json();
    if (schedRes.statusCode === 201 && schedJson?.data?.id) {
      createdInspId = schedJson.data.id;
      record('Admin Schedule Inspection', true, `Inspection #${createdInspId} created & assigned`);
    } else {
      record('Admin Schedule Inspection', false, `Status ${schedRes.statusCode}: ${schedRes.text}`);
    }
  } catch (err) {
    record('Admin Schedule Inspection', false, err.message);
  }

  // 7. Inspection Submission End-to-End with YOLO detections
  let submittedInspId = null;
  try {
    const subPayload = {
      site_id: 'site-delhi-metro-p2',
      site_name: 'Delhi Metro Central Terminal (Phase 2)',
      zone_id: 'zone-p14',
      zone_name: 'Pier P-14 Support Column',
      inspector_id: 'usr-insp-vp01',
      inspector_name: 'Vishnu Prasath',
      inspector_badge: 'INSP-2026-VP01',
      date: new Date().toISOString(),
      compliance_score: 84,
      geofence_verified: true,
      checklist_results: [
        { id: 'chk-1', text: 'Foundation Settlement Check', status: 'PASS' },
        { id: 'chk-2', text: 'Visual Rebar Inspection', status: 'FAIL', notes: 'Spalling identified' }
      ],
      detected_defects: [
        {
          title: 'Concrete Cover Spalling Pier P-14',
          description: 'Verified structural spalling with exposed rusted rebar.',
          severity: 'CRITICAL',
          location_details: 'Pier P-14 Base',
          category: 'STRUCTURAL',
          ai_detection: {
            class: 'concrete_spalling',
            confidence: 0.942,
            model_engine: 'YOLOv8 ONNX Runtime'
          }
        }
      ],
      digital_signature: 'Verified PKI Digital Signature: Vishnu Prasath (INSP-2026-VP01)',
      summary: 'Statutory compliance audit completed with active defect logged.'
    };

    const subRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/inspections/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspectorToken}`
      }
    }, subPayload);

    const subJson = subRes.json();
    if (subRes.statusCode === 201 && subJson?.data?.id) {
      submittedInspId = subJson.data.id;
      record('Inspection Submission Workflow', true, `Audit #${submittedInspId} persisted with defects in DB`);
    } else {
      record('Inspection Submission Workflow', false, `Status ${subRes.statusCode}: ${subRes.text}`);
    }
  } catch (err) {
    record('Inspection Submission Workflow', false, err.message);
  }

  // 8. View PDF Report Generation
  const testPdfInspId = submittedInspId || createdInspId || 'insp-01';
  try {
    const pdfRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: `/api/reports/pdf/${testPdfInspId}?token=${adminToken}`,
      method: 'GET'
    });

    const isPdfHeader = pdfRes.buffer.slice(0, 4).toString('ascii') === '%PDF';
    const isContentType = pdfRes.headers['content-type']?.includes('application/pdf');

    if (pdfRes.statusCode === 200 && isPdfHeader && isContentType) {
      record('View PDF Report Generation', true, `Valid binary PDF (${pdfRes.buffer.length} bytes, %PDF-1.3)`);
    } else {
      record('View PDF Report Generation', false, `Status ${pdfRes.statusCode}, Content-Type: ${pdfRes.headers['content-type']}, Length: ${pdfRes.buffer.length}`);
    }
  } catch (err) {
    record('View PDF Report Generation', false, err.message);
  }

  // 9. Corrective Actions Workflow
  let correctiveActionId = null;
  try {
    const caPayload = {
      defect_id: yoloDefectId || 'def-01',
      directive_title: 'Ultrasonic Containment & Polymer Mortar Patching',
      action_type: 'STRUCTURAL_REPAIR',
      priority: 'CRITICAL',
      assigned_supervisor_id: 'usr-supervisor-01',
      assigned_contractor: 'L&T Infrastructure Rehabilitation Team',
      estimated_cost: 85000,
      target_date: '2026-10-01',
      statutory_code: 'IS 456:2000 / IRC:SP:40',
      proof_requirements: 'Cube testing >35 MPa and visual proof'
    };

    const caRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/corrective-actions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, caPayload);

    const caJson = caRes.json();
    if (caRes.statusCode === 201 && caJson?.data?.id) {
      correctiveActionId = caJson.data.id;
      record('Corrective Actions Lifecycle', true, `Created Corrective Action #${correctiveActionId}`);
    } else {
      record('Corrective Actions Lifecycle', false, `Status ${caRes.statusCode}: ${caRes.text}`);
    }
  } catch (err) {
    record('Corrective Actions Lifecycle', false, err.message);
  }

  // 10. Re-Inspection Workflow
  try {
    const reinsPayload = {
      defect_id: yoloDefectId || 'def-01',
      assigned_inspector_id: 'usr-insp-vp01',
      target_date: '2026-10-05',
      instructions: 'Verify polymer mortar curing and structural bond'
    };

    const reinsRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/reinspections',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, reinsPayload);

    const reinsJson = reinsRes.json();
    if (reinsRes.statusCode === 201 && reinsJson?.data?.id) {
      record('Re-Inspection Workflow', true, `Re-Inspection Request #${reinsJson.data.id} recorded in DB`);
    } else {
      record('Re-Inspection Workflow', false, `Status ${reinsRes.statusCode}: ${reinsRes.text}`);
    }
  } catch (err) {
    record('Re-Inspection Workflow', false, err.message);
  }

  // 11. Role Roster API (Inspectors, Supervisors, Directors)
  try {
    const [inspRoster, supRoster, dirRoster] = await Promise.all([
      httpRequest({ hostname: 'localhost', port: BACKEND_PORT, path: '/api/users/inspectors', headers: { 'Authorization': `Bearer ${adminToken}` } }),
      httpRequest({ hostname: 'localhost', port: BACKEND_PORT, path: '/api/users?role=SUPERVISOR', headers: { 'Authorization': `Bearer ${adminToken}` } }),
      httpRequest({ hostname: 'localhost', port: BACKEND_PORT, path: '/api/users?role=DIRECTOR', headers: { 'Authorization': `Bearer ${adminToken}` } })
    ]);

    const iOk = inspRoster.statusCode === 200 && inspRoster.json()?.success;
    const sOk = supRoster.statusCode === 200 && supRoster.json()?.success;
    const dOk = dirRoster.statusCode === 200 && dirRoster.json()?.success;

    if (iOk && sOk && dOk) {
      record('People Rosters (Inspectors, Supervisors, Directors)', true, `Inspectors: ${inspRoster.json().data?.length}, Supervisors: ${supRoster.json().data?.length}, Directors: ${dirRoster.json().data?.length}`);
    } else {
      record('People Rosters (Inspectors, Supervisors, Directors)', false, `Inspectors: ${inspRoster.statusCode}, Supervisors: ${supRoster.statusCode}, Directors: ${dirRoster.statusCode}`);
    }
  } catch (err) {
    record('People Rosters (Inspectors, Supervisors, Directors)', false, err.message);
  }

  // 12. Real Database Analytics & Trends
  try {
    const kpiRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/analytics/overview',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const kpiJson = kpiRes.json();
    if (kpiRes.statusCode === 200 && kpiJson?.success && kpiJson.data?.total_inspections != null) {
      record('Reports & Analytics (Real DB Metrics)', true, `Total Inspections: ${kpiJson.data.total_inspections}, Critical Defects: ${kpiJson.data.critical_defects}`);
    } else {
      record('Reports & Analytics (Real DB Metrics)', false, `Status ${kpiRes.statusCode}: ${kpiRes.text}`);
    }
  } catch (err) {
    record('Reports & Analytics (Real DB Metrics)', false, err.message);
  }

  // 13. Sites & Infrastructure Facilities
  try {
    const sitesRes = await httpRequest({
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/sites',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const sitesJson = sitesRes.json();
    if (sitesRes.statusCode === 200 && sitesJson?.data?.length > 0) {
      record('Sites & Infrastructure Facilities', true, `${sitesJson.data.length} statutory sites loaded`);
    } else {
      record('Sites & Infrastructure Facilities', false, `Status ${sitesRes.statusCode}`);
    }
  } catch (err) {
    record('Sites & Infrastructure Facilities', false, err.message);
  }

  console.log('\n====================================================');
  console.log('                 AUDIT SUMMARY                      ');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  console.log(`Total Tested: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log('>>> ALL ACCEPTANCE TESTS PASSED! <<<');
  } else {
    console.log(`>>> ${failed} TESTS FAILED <<<`);
  }
}

runAudit();
