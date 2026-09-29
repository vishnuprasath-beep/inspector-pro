const path = require('path');
const http = require('http');
const { PNG } = require('../backend/node_modules/pngjs');
const app = require('../backend/src/app');

async function runPlatformTests() {
  console.log('===============================================================');
  console.log('  INSPECTRA PRO: ENTERPRISE AI PLATFORM COMPREHENSIVE TEST SUITE');
  console.log('===============================================================\n');

  // Start server on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[INIT] Ephemeral test server listening on ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('[TEST 1] API Health Endpoint');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'HEALTHY', 'GET /api/health returned 200 HEALTHY');

    // 2. Authentication & JWT tokens
    console.log('\n[TEST 2] Authentication & Token Generation');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'password123' })
    });
    const adminLoginJson = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginJson.data?.token, 'Admin login returned valid JWT token');
    const adminToken = adminLoginJson.data?.token;

    const inspLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'vishnu.p', password: 'password123' })
    });
    const inspLoginJson = await inspLoginRes.json();
    assert(inspLoginRes.status === 200 && inspLoginJson.data?.token, 'Inspector login returned valid JWT token');
    const inspToken = inspLoginJson.data?.token;

    // 3. Real YOLO ONNX Model Health
    console.log('\n[TEST 3] Real YOLOv8 ONNX Model Status & Health Metrics');
    const modelStatusRes = await fetch(`${baseUrl}/ai/model-status`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const modelStatusJson = await modelStatusRes.json();
    assert(modelStatusRes.status === 200 && modelStatusJson.success, 'GET /api/ai/model-status returns 200');
    assert(modelStatusJson.data.status === 'ONLINE', 'YOLO model state is strictly ONLINE');
    assert(modelStatusJson.data.is_loaded === true, 'ONNX runtime tensor session is loaded in memory');
    assert(modelStatusJson.data.classes_count >= 14, `YOLO model classes count (${modelStatusJson.data.classes_count}) reflects Roboflow PPE/Safety dataset`);

    // 4. Model Registry Versions
    console.log('\n[TEST 4] AI Model Versions Registry');
    const modelsRes = await fetch(`${baseUrl}/ai/models`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const modelsJson = await modelsRes.json();
    assert(modelsRes.status === 200 && modelsJson.data?.length > 0, 'GET /api/ai/models returns version history');
    assert(modelsJson.data[0].dataset_license.includes('CC-BY-4.0'), 'Model records valid dataset license (CC-BY-4.0)');

    // 5. Decoupled Severity Engine Rules
    console.log('\n[TEST 5] Decoupled Institutional Safety Rules');
    const rulesRes = await fetch(`${baseUrl}/ai/severity-rules`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const rulesJson = await rulesRes.json();
    assert(rulesRes.status === 200 && rulesJson.success, 'GET /api/ai/severity-rules returns 200');
    assert(rulesJson.data['NO-Hardhat']?.severity === 'CRITICAL', 'Rule: NO-Hardhat mapped to CRITICAL');
    assert(rulesJson.data['concrete_spalling']?.severity === 'CRITICAL', 'Rule: concrete_spalling mapped to CRITICAL');

    // 6. Zero Fake Detections Test (Real Tensor Processing on Blank Canvas)
    console.log('\n[TEST 6] Real YOLO Inference: Blank Test Canvas (Zero Fake Detections)');
    const png = new PNG({ width: 640, height: 640 });
    for (let i = 0; i < 640 * 640 * 4; i += 4) {
      png.data[i] = 100; png.data[i + 1] = 120; png.data[i + 2] = 140; png.data[i + 3] = 255;
    }
    const pngBuffer = PNG.sync.write(png);
    const base64Data = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    const detectRes = await fetch(`${baseUrl}/ai/yolo/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspToken}`
      },
      body: JSON.stringify({ image: base64Data, conf_threshold: 0.25 })
    });
    const detectJson = await detectRes.json();
    assert(detectRes.status === 200 && detectJson.success, 'POST /api/ai/yolo/detect evaluated successfully');
    assert(detectJson.total_detections === 0, 'Zero fake detections: Blank image honestly returned 0 detections');
    assert(Array.isArray(detectJson.detections) && detectJson.detections.length === 0, 'Detections array is strictly empty');
    assert(typeof detectJson.inference_ms === 'number', `Real tensor latency recorded: ${detectJson.inference_ms} ms`);

    // 7. Human Verification Feedback Loop
    console.log('\n[TEST 7] Human Verification Feedback Loop');
    const verifyRes = await fetch(`${baseUrl}/ai/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspToken}`
      },
      body: JSON.stringify({
        detection_id: 'det-test-01',
        verified_status: 'CONFIRMED',
        feedback: 'Field Auditor verified genuine structural spalling at pier cap',
        detection_class: 'concrete_spalling',
        confidence: 0.892,
        severity: 'CRITICAL'
      })
    });
    const verifyJson = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyJson.success, 'POST /api/ai/verify records auditor feedback');

    const samplesRes = await fetch(`${baseUrl}/ai/verified-samples`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const samplesJson = await samplesRes.json();
    assert(samplesRes.status === 200 && samplesJson.summary.confirmed_detections >= 1, 'Verified sample recorded in dataset curation ledger');

    // 8. Dynamic Configurable Checklists
    console.log('\n[TEST 8] Configurable Regulatory Checklists');
    const chkRes = await fetch(`${baseUrl}/checklists`, {
      headers: { 'Authorization': `Bearer ${inspToken}` }
    });
    const chkJson = await chkRes.json();
    assert(chkRes.status === 200 && chkJson.data?.length > 0, 'GET /api/checklists returns configurable items');
    assert(chkJson.grouped && chkJson.grouped['PPE'], 'Checklists categorized under PPE');
    assert(chkJson.grouped && chkJson.grouped['Structural Condition'], 'Checklists categorized under Structural Condition');

    // 9. QR Code Site Validation
    console.log('\n[TEST 9] Anti-Spoofing Site QR Code Verification');
    const qrSuccessRes = await fetch(`${baseUrl}/sites/verify-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspToken}`
      },
      body: JSON.stringify({ qr_code: 'INSPECTRA:SITE:DEL-MET-02' })
    });
    const qrSuccessJson = await qrSuccessRes.json();
    assert(qrSuccessRes.status === 200 && qrSuccessJson.success, 'Valid QR code successfully validated with site metadata');
    assert(qrSuccessJson.data?.site_name.includes('Delhi Metro'), 'QR decoded to correct site: Delhi Metro');

    const qrFailRes = await fetch(`${baseUrl}/sites/verify-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspToken}`
      },
      body: JSON.stringify({ qr_code: 'SPOOFED_FAKE_QR_999' })
    });
    assert(qrFailRes.status === 404 || qrFailRes.status === 400, 'Forged QR code rejected by anti-spoofing engine');

    // 10. Transparent Site Safety Score Calculation
    console.log('\n[TEST 10] Transparent Site Safety Score Calculation');
    const scoreRes = await fetch(`${baseUrl}/sites/DEL-MET-02/safety-score`, {
      headers: { 'Authorization': `Bearer ${inspToken}` }
    });
    const scoreJson = await scoreRes.json();
    assert(scoreRes.status === 200 && scoreJson.success, 'GET /api/sites/:id/safety-score returns 200');
    assert(typeof scoreJson.data.safety_score === 'number', `Calculated score: ${scoreJson.data.safety_score}/100`);
    assert(Array.isArray(scoreJson.data.deductions), 'Returns transparent itemized point deductions array');
    assert(scoreJson.data.formula.includes('Score = 100'), 'Returns institutional mathematical formula');

    // 11. Recurring Issue Detection Algorithm
    console.log('\n[TEST 11] Recurring Issue Detection Algorithm');
    // Query defects to find an existing defect's site and zone
    const defectsListRes = await fetch(`${baseUrl}/defects`, {
      headers: { 'Authorization': `Bearer ${inspToken}` }
    });
    const defectsListJson = await defectsListRes.json();
    const existingDefect = defectsListJson.data?.[0];
    const targetSiteId = existingDefect?.site_id || existingDefect?.site?.id || 'site-05';

    const newRecurringDefectRes = await fetch(`${baseUrl}/defects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${inspToken}`
      },
      body: JSON.stringify({
        title: 'Recurring Spalling at Bridge Pier P-14',
        site_id: targetSiteId,
        site_name: existingDefect?.site_name || existingDefect?.site?.name || 'NH-44 Overpass Bridge',
        zone_id: existingDefect?.zone_id || null,
        category: 'STRUCTURAL',
        severity: 'CRITICAL',
        component: 'Pier P-14',
        location_details: 'Pier P-14, 2.5m above ground line, Highway Overpass NH-44',
        description: 'Repeated structural concrete spalling and tie rebar exposure observed again.'
      })
    });
    const recurringJson = await newRecurringDefectRes.json();
    assert(newRecurringDefectRes.status === 201 && recurringJson.success, 'New defect submitted successfully');
    assert(recurringJson.data.is_recurring === true, 'Defect automatically flagged as RECURRING ISSUE');
    assert(recurringJson.data.recurrence_count >= 2, `Recurrence count accurately computed: x${recurringJson.data.recurrence_count}`);

    // 12. Defect Assignment Endpoint
    console.log('\n[TEST 12] Defect Assignment Endpoint');
    const assignRes = await fetch(`${baseUrl}/defects/${recurringJson.data.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        assigned_to: 'National Highway Civil Engineering Rapid Response Unit',
        priority: 'CRITICAL',
        instructions: 'Erect temporary shoring and hydro-demolish damaged cover.'
      })
    });
    const assignJson = await assignRes.json();
    assert(assignRes.status === 200 && assignJson.success, 'POST /api/defects/:id/assign succeeded');
    assert(assignJson.data.status === 'ASSIGNED', 'Defect status updated to ASSIGNED');

    // 13. Comprehensive Analytics & Metrics
    console.log('\n[TEST 13] Comprehensive Analytics Metrics');
    const analyticsRes = await fetch(`${baseUrl}/analytics/comprehensive`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analyticsJson = await analyticsRes.json();
    assert(analyticsRes.status === 200 && analyticsJson.success, 'GET /api/analytics/comprehensive returned 200');
    assert(typeof analyticsJson.data.recurring_issues_count === 'number', 'Recurring issues count tracked in analytics');
    assert(typeof analyticsJson.data.ai_false_detection_rate === 'number', `AI false detection rate tracked: ${analyticsJson.data.ai_false_detection_rate}%`);

    // 14. Strict Role-Based Access Isolation (RBAC)
    console.log('\n[TEST 14] Strict Role-Based Access Isolation (RBAC)');
    const rbacDeniedRes = await fetch(`${baseUrl}/admin/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${inspToken}` }
    });
    assert(rbacDeniedRes.status === 403, 'Inspector JWT strictly blocked from Admin endpoint (403 Forbidden)');

    const rbacAllowedRes = await fetch(`${baseUrl}/admin/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(rbacAllowedRes.status === 200, 'Admin JWT permitted to Admin endpoint (200 OK)');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n===============================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('===============================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPlatformTests();
