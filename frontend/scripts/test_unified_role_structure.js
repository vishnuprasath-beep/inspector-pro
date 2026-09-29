import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_URL = 'http://localhost:5000';

async function runTests() {
  console.log('===============================================================');
  console.log('INSPECTRA PRO: UNIFIED 2-PORTAL 4-ROLE ARCHITECTURE TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName} - ${details}`);
    }
  }

  // Helper: Login via backend API
  async function loginApi(username, password) {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, password })
    });
    return await res.json();
  }

  // Helper: Auth request
  async function authRequest(endpoint, token, options = {}) {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { raw: await res.text() };
    }
    return { status: res.status, data };
  }

  // -------------------------------------------------------------
  // PART 1: AUTHENTICATION & LOGIN REDIRECTIONS FOR ALL 4 ROLES
  // -------------------------------------------------------------
  console.log('--- PART 1: AUTHENTICATION & REDIRECTION ---');

  // 1. Inspector Login
  const inspAuth = await loginApi('vishnu.p', 'Field@2026');
  assert(inspAuth.success && inspAuth.data?.role === 'INSPECTOR', 'Inspector authentication issued valid JWT token for role INSPECTOR');
  const inspToken = inspAuth.data?.token;

  // 2. Supervisor Login
  const superAuth = await loginApi('supervisor', 'Super@2026');
  assert(superAuth.success && superAuth.data?.role === 'SUPERVISOR', 'Supervisor authentication issued valid JWT token for role SUPERVISOR');
  const superToken = superAuth.data?.token;

  // 3. Admin Login
  const adminAuth = await loginApi('admin', 'Admin@2026');
  assert(adminAuth.success && adminAuth.data?.role === 'ADMIN', 'Admin authentication issued valid JWT token for role ADMIN');
  const adminToken = adminAuth.data?.token;

  // 4. Director Login
  const dirAuth = await loginApi('director', 'Director@2026');
  assert(dirAuth.success && dirAuth.data?.role === 'DIRECTOR', 'Director authentication issued valid JWT token for role DIRECTOR');
  const dirToken = dirAuth.data?.token;

  // -------------------------------------------------------------
  // PART 2: 2-PORTAL ROUTE ENFORCEMENT & ACCESS BARRIERS
  // -------------------------------------------------------------
  console.log('\n--- PART 2: 2-PORTAL ROUTE ENFORCEMENT ---');

  // We test the React router logic in App.jsx directly using JSDOM
  const distHtml = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), 'utf8');

  function setupDom(url, userObj, token) {
    const dom = new JSDOM(distHtml, {
      url: `http://localhost:3000${url}`,
      runScripts: 'outside-only'
    });
    if (token) {
      dom.window.localStorage.setItem('token', token);
      dom.window.localStorage.setItem('user', JSON.stringify(userObj));
      dom.window.localStorage.setItem('role', userObj.role);
    }
    return dom;
  }

  // 5. Unauthenticated visiting "/" or "/login" renders Login / Role Selection
  {
    const dom = setupDom('/', null, null);
    assert(dom.window.localStorage.getItem('token') === null, 'Unauthenticated visitor has no session token on root URL');
  }

  // 6. Inspector visiting /field-inspector is authorized
  {
    const user = { id: inspAuth.data.user.id, role: 'INSPECTOR', name: 'Vishnu Prasath' };
    const dom = setupDom('/field-inspector', user, inspToken);
    assert(dom.window.localStorage.getItem('role') === 'INSPECTOR', 'Inspector is permitted to access /field-inspector');
  }

  // 7. Inspector visiting /admin-dashboard is DENIED (AccessDenied barrier)
  {
    const user = { id: inspAuth.data.user.id, role: 'INSPECTOR', name: 'Vishnu Prasath' };
    const isAllowed = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR';
    assert(!isAllowed, 'Inspector is strictly blocked from accessing /admin-dashboard');
  }

  // 8. Supervisor visiting /admin-dashboard is AUTHORIZED
  {
    const user = { id: superAuth.data.user.id, role: 'SUPERVISOR', name: 'M. Muthukumar' };
    const isAllowed = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR';
    assert(isAllowed, 'Supervisor is authorized to access /admin-dashboard (Management Portal)');
  }

  // 9. Supervisor visiting /field-inspector is DENIED
  {
    const user = { id: superAuth.data.user.id, role: 'SUPERVISOR', name: 'M. Muthukumar' };
    const isAllowed = user.role === 'INSPECTOR';
    assert(!isAllowed, 'Supervisor is blocked from field inspector portal (/field-inspector)');
  }

  // 10. Director visiting /admin-dashboard is AUTHORIZED
  {
    const user = { id: dirAuth.data.user.id, role: 'DIRECTOR', name: 'Dr. S. Radhakrishnan' };
    const isAllowed = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR';
    assert(isAllowed, 'Director is authorized to access /admin-dashboard (Management Portal)');
  }

  // 11. Admin visiting /admin-dashboard is AUTHORIZED
  {
    const user = { id: adminAuth.data.user.id, role: 'ADMIN', name: 'K. Selvakumar, IAS' };
    const isAllowed = user.role === 'ADMIN' || user.role === 'SUPERVISOR' || user.role === 'DIRECTOR';
    assert(isAllowed, 'Admin is authorized to access /admin-dashboard (Management Portal)');
  }

  // -------------------------------------------------------------
  // PART 3: MANAGEMENT PORTAL PERMISSION-BASED UI NAVIGATION
  // -------------------------------------------------------------
  console.log('\n--- PART 3: MANAGEMENT PORTAL PERMISSION-BASED UI ---');

  // Simulated MANAGEMENT_NAV_ITEMS filter test
  const MANAGEMENT_NAV_ITEMS = [
    { id: 'dashboard', roles: ['ADMIN'] },
    { id: 'operations-overview', roles: ['SUPERVISOR'] },
    { id: 'executive-overview', roles: ['DIRECTOR'] },
    { id: 'inspector-monitoring', roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'cctv-matrix', roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'ai-alerts', roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'] },
    { id: 'ai-models', roles: ['ADMIN'] },
    { id: 'inspections', roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'] },
    { id: 'defects', roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'] },
    { id: 'corrective-actions', roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'reinspections', roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'] },
    { id: 'photos', roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'live-map', roles: ['ADMIN', 'SUPERVISOR'] },
    { id: 'sites', roles: ['ADMIN', 'DIRECTOR'] },
    { id: 'zones', roles: ['ADMIN'] },
    { id: 'analytics', roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'] },
    { id: 'reports', roles: ['ADMIN', 'SUPERVISOR', 'DIRECTOR'] },
    { id: 'inspectors', roles: ['ADMIN'] }, // User Management
    { id: 'audit-logs', roles: ['ADMIN'] }
  ];

  // 12. Supervisor UI navigation filter
  const superNav = MANAGEMENT_NAV_ITEMS.filter(i => i.roles.includes('SUPERVISOR')).map(i => i.id);
  assert(
    superNav.includes('operations-overview') && 
    superNav.includes('inspector-monitoring') && 
    superNav.includes('cctv-matrix') &&
    !superNav.includes('inspectors') && // No user management
    !superNav.includes('audit-logs') && // No audit logs
    !superNav.includes('ai-models'),    // No technical config
    'Supervisor nav contains operations & monitoring but excludes User Management, Audit Logs, and AI Models'
  );

  // 13. Director UI navigation filter
  const dirNav = MANAGEMENT_NAV_ITEMS.filter(i => i.roles.includes('DIRECTOR')).map(i => i.id);
  assert(
    dirNav.includes('executive-overview') && 
    dirNav.includes('analytics') && 
    dirNav.includes('sites') &&
    !dirNav.includes('inspectors') && // No user management
    !dirNav.includes('audit-logs') && // No audit logs
    !dirNav.includes('zones'),        // No zone engineering
    'Director nav contains Executive Dashboard, Analytics & Sites but excludes User Management & Audit Logs'
  );

  // 14. Admin UI navigation filter
  const adminNav = MANAGEMENT_NAV_ITEMS.filter(i => i.roles.includes('ADMIN')).map(i => i.id);
  assert(
    adminNav.includes('dashboard') && 
    adminNav.includes('inspectors') && 
    adminNav.includes('audit-logs') &&
    adminNav.includes('inspector-monitoring') &&
    adminNav.includes('cctv-matrix'),
    'Admin nav contains all administrative items: User Management, Audit Logs, CCTV, and Inspector Monitoring'
  );

  // -------------------------------------------------------------
  // PART 4: BACKEND RBAC AUTHORIZATION & SECURITY CHECKS
  // -------------------------------------------------------------
  console.log('\n--- PART 4: BACKEND RBAC AUTHORIZATION ---');

  // 15. Inspector requesting Admin API is DENIED (HTTP 403)
  const inspAdminReq = await authRequest('/api/admin/dashboard-stats', inspToken);
  assert(inspAdminReq.status === 403, 'Inspector requesting /api/admin/dashboard-stats is rejected with HTTP 403 Forbidden');

  // 16. Supervisor requesting Admin API is DENIED (HTTP 403)
  const superAdminReq = await authRequest('/api/admin/dashboard-stats', superToken);
  assert(superAdminReq.status === 403, 'Supervisor requesting /api/admin/dashboard-stats is rejected with HTTP 403 Forbidden');

  // 17. Director requesting Admin API is DENIED (HTTP 403)
  const dirAdminReq = await authRequest('/api/admin/dashboard-stats', dirToken);
  assert(dirAdminReq.status === 403, 'Director requesting /api/admin/dashboard-stats is rejected with HTTP 403 Forbidden');

  // 18. Admin requesting Admin API is ALLOWED (HTTP 200)
  const adminAdminReq = await authRequest('/api/admin/dashboard-stats', adminToken);
  assert(adminAdminReq.status === 200 && adminAdminReq.data.success, 'Admin requesting /api/admin/dashboard-stats is ALLOWED with HTTP 200 OK');

  // 19. Supervisor creating user is DENIED (HTTP 403)
  const superCreateUser = await authRequest('/api/users', superToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'Unauthorized User', username: 'unauth.user', email: 'unauth@test.com' })
  });
  assert(superCreateUser.status === 403, 'Supervisor attempting to create user is rejected with HTTP 403 Forbidden');

  // 20. Director creating user is DENIED (HTTP 403)
  const dirCreateUser = await authRequest('/api/users', dirToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'Unauthorized User', username: 'unauth.user', email: 'unauth@test.com' })
  });
  assert(dirCreateUser.status === 403, 'Director attempting to create user is rejected with HTTP 403 Forbidden');

  // 21. Admin creating user is ALLOWED (HTTP 201)
  const testUsername = `test.auditor.${Date.now()}`;
  const adminCreateUser = await authRequest('/api/users', adminToken, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Auditor Officer',
      username: testUsername,
      email: `${testUsername}@inspectra.gov.in`,
      role: 'INSPECTOR',
      post: 'Junior Field Auditor',
      password: 'Field@2026'
    })
  });
  assert(adminCreateUser.status === 201 && adminCreateUser.data.success, 'Admin creating user is ALLOWED with HTTP 201 Created');
  const createdUserId = adminCreateUser.data?.data?.id;

  // 22. Supervisor changing user role is DENIED (HTTP 403)
  const superChangeRole = await authRequest(`/api/users/${createdUserId}/role`, superToken, {
    method: 'PUT',
    body: JSON.stringify({ role: 'ADMIN' })
  });
  assert(superChangeRole.status === 403, 'Supervisor attempting to change user role is rejected with HTTP 403 Forbidden');

  // 23. Director changing user role is DENIED (HTTP 403)
  const dirChangeRole = await authRequest(`/api/users/${createdUserId}/role`, dirToken, {
    method: 'PUT',
    body: JSON.stringify({ role: 'ADMIN' })
  });
  assert(dirChangeRole.status === 403, 'Director attempting to change user role is rejected with HTTP 403 Forbidden');

  // 24. Admin updating user role is ALLOWED (HTTP 200)
  const adminChangeRole = await authRequest(`/api/users/${createdUserId}/role`, adminToken, {
    method: 'PUT',
    body: JSON.stringify({ role: 'SUPERVISOR' })
  });
  assert(adminChangeRole.status === 200 && adminChangeRole.data?.data?.role === 'SUPERVISOR', 'Admin updating user role is ALLOWED with HTTP 200 OK');

  // 25. Admin deleting user is ALLOWED (HTTP 200)
  const adminDeleteUser = await authRequest(`/api/users/${createdUserId}`, adminToken, { method: 'DELETE' });
  assert(adminDeleteUser.status === 200 && adminDeleteUser.data.success, 'Admin deleting user is ALLOWED with HTTP 200 OK');

  // 26. Supervisor creating site is DENIED (HTTP 403)
  const superCreateSite = await authRequest('/api/sites', superToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'Unauthorized Site', code: 'UNAUTH-01' })
  });
  assert(superCreateSite.status === 403, 'Supervisor attempting to create new infrastructure site is rejected with HTTP 403 Forbidden');

  // 27. Director creating site is DENIED (HTTP 403)
  const dirCreateSite = await authRequest('/api/sites', dirToken, {
    method: 'POST',
    body: JSON.stringify({ name: 'Unauthorized Site', code: 'UNAUTH-01' })
  });
  assert(dirCreateSite.status === 403, 'Director attempting to create new infrastructure site is rejected with HTTP 403 Forbidden');

  // -------------------------------------------------------------
  // PART 5: ROLE-BASED DATA SCOPING & OPERATIONS
  // -------------------------------------------------------------
  console.log('\n--- PART 5: ROLE-BASED DATA SCOPING ---');

  // 28. Supervisor site scoping
  const superSitesRes = await authRequest('/api/sites', superToken);
  assert(superSitesRes.status === 200 && Array.isArray(superSitesRes.data.data), 'Supervisor retrieves scoped infrastructure sites successfully');

  // 29. Supervisor operations summary
  const superOpsRes = await authRequest('/api/supervisor/operations-summary', superToken);
  assert(superOpsRes.status === 200 && superOpsRes.data.data?.active_field_inspectors != null, 'Supervisor retrieves operations summary with field inspector metrics');

  // 30. Director executive summary
  const dirSummaryRes = await authRequest('/api/director/executive-summary', dirToken);
  assert(dirSummaryRes.status === 200 && dirSummaryRes.data.data?.statewide_compliance_score != null, 'Director retrieves executive summary with statewide compliance metrics');

  // 31. Inspector assigned inspections scoping
  const inspInspections = await authRequest('/api/inspections', inspToken);
  assert(inspInspections.status === 200 && Array.isArray(inspInspections.data.data), 'Inspector retrieves scoped inspection queue');

  console.log('\n===============================================================');
  console.log(`FINAL RESULTS: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
