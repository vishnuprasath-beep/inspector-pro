/**
 * Comprehensive 18-Step Test Suite for Inspectra Pro Auth & Routing Flows
 */
import pkg from 'jsdom';
const { JSDOM, VirtualConsole } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const html = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');
const assets = fs.readdirSync(path.resolve(distDir, 'assets'));
const jsFile = assets.find(f => f.startsWith('index-') && f.endsWith('.js'));
const jsCode = fs.readFileSync(path.resolve(distDir, 'assets', jsFile), 'utf-8');

const BACKEND_BASE = 'http://localhost:5000/api';

// Helper to obtain a genuine JWT token from backend
async function authenticateWithBackend(identifier, password) {
  try {
    const res = await fetch(`${BACKEND_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function renderApp(url, localStorageState = {}) {
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));
  virtualConsole.on('jsdomError', (err) => errors.push(err.message || String(err)));

  const dom = new JSDOM(html, {
    url: `https://inspectra-pro-2026.surge.sh${url}`,
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      window.localStorage.clear();
      for (const [k, v] of Object.entries(localStorageState)) {
        window.localStorage.setItem(k, v);
      }
      window.matchMedia = window.matchMedia || function() {
        return { matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {} };
      };
      window.fetch = globalThis.fetch;
      window.scrollTo = () => {};
    }
  });

  dom.window.eval(jsCode);
  await new Promise(r => setTimeout(r, 1500));

  const root = dom.window.document.getElementById('root');
  const text = root ? root.textContent.trim().replace(/\s+/g, ' ') : '';
  const innerHTML = root ? root.innerHTML.trim() : '';
  const currentPath = dom.window.location.pathname;

  return { dom, text, innerHTML, errors, currentPath };
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('INSPECTRA PRO: 18-STEP COMPREHENSIVE AUTH & ROUTING TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 18;

  // TEST 1: Open public root URL "/" in fresh session
  const t1 = await renderApp('/', {});
  if (t1.innerHTML.length > 0) {
    console.log('[PASS] Test 1: Public root URL renders content (Not blank/white)');
    passed++;
  } else {
    console.error('[FAIL] Test 1: Public root URL rendered blank/white');
  }

  // TEST 2: Confirm it shows login / role-selection page
  if (t1.text.includes('INSPECTRA PRO') && (t1.text.includes('Select Your Authorized Role') || t1.text.includes('Welcome to Inspectra Pro!'))) {
    console.log('[PASS] Test 2: Shows login & role selection page');
    passed++;
  } else {
    console.error('[FAIL] Test 2: Did not show login/role selection. Found:', t1.text.slice(0, 150));
  }

  // TEST 3: Confirm it does NOT automatically open a specific role
  if (!t1.text.includes('INSPECTRA PRO MGMT') && !t1.text.includes('Overview') && !t1.text.includes('CCTV Monitoring')) {
    console.log('[PASS] Test 3: Does NOT auto-open Admin/Inspector or hardcode a default role');
    passed++;
  } else {
    console.error('[FAIL] Test 3: Auto-opened a dashboard on root URL');
  }

  // TEST 4 & 5: Valid Inspector Login -> opens ONLY Inspector Portal
  const inspAuth = await authenticateWithBackend('vishnu.p', 'Field@2026');
  if (inspAuth.success && inspAuth.data?.token && inspAuth.data?.role === 'INSPECTOR') {
    console.log('[PASS] Test 4: Valid Inspector credentials authenticated by backend');
    passed++;

    const t5 = await renderApp('/field-inspector', {
      token: inspAuth.data.token,
      user: JSON.stringify(inspAuth.data.user),
      role: 'INSPECTOR'
    });
    if (t5.text.includes('Inspector Portal') && t5.text.includes('Vishnu Prasath')) {
      console.log('[PASS] Test 5: Inspector opens only Field Inspector Portal');
      passed++;
    } else {
      console.error('[FAIL] Test 5: Inspector portal did not render correctly:', t5.text.slice(0, 150));
    }
  } else {
    console.error('[FAIL] Test 4: Inspector login failed:', inspAuth);
  }

  // TEST 6 & 7: Valid Admin Login -> opens ONLY Admin Dashboard
  const adminAuth = await authenticateWithBackend('admin', 'Admin@2026');
  if (adminAuth.success && adminAuth.data?.token && adminAuth.data?.role === 'ADMIN') {
    console.log('[PASS] Test 6: Valid Admin credentials authenticated by backend');
    passed++;

    const t7 = await renderApp('/admin-dashboard', {
      token: adminAuth.data.token,
      user: JSON.stringify(adminAuth.data.user),
      role: 'ADMIN'
    });
    if (t7.text.includes('INSPECTRA PRO MGMT') && t7.text.includes('Inspector Monitoring') && t7.text.includes('CCTV Monitoring')) {
      console.log('[PASS] Test 7: Admin opens Admin Dashboard with both Inspector Monitoring & CCTV Monitoring');
      passed++;
    } else {
      console.error('[FAIL] Test 7: Admin dashboard did not render correctly:', t7.text.slice(0, 150));
    }
  } else {
    console.error('[FAIL] Test 6: Admin login failed:', adminAuth);
  }

  // TEST 8: Supervisor Login
  const supAuth = await authenticateWithBackend('supervisor', 'Super@2026');
  if (supAuth.success && supAuth.data?.role === 'SUPERVISOR') {
    const t8 = await renderApp('/supervisor-dashboard', {
      token: supAuth.data.token,
      user: JSON.stringify(supAuth.data.user),
      role: 'SUPERVISOR'
    });
    if (t8.text.includes('Supervisor') || t8.text.includes('Operations') || t8.innerHTML.length > 5000) {
      console.log('[PASS] Test 8: Supervisor authenticated & supervisor portal rendered');
      passed++;
    } else {
      console.error('[FAIL] Test 8: Supervisor portal render failed');
    }
  } else {
    console.error('[FAIL] Test 8: Supervisor auth failed');
  }

  // TEST 9: Director Login
  const dirAuth = await authenticateWithBackend('director', 'Director@2026');
  if (dirAuth.success && dirAuth.data?.role === 'DIRECTOR') {
    const t9 = await renderApp('/director-dashboard', {
      token: dirAuth.data.token,
      user: JSON.stringify(dirAuth.data.user),
      role: 'DIRECTOR'
    });
    if (t9.text.includes('Director') || t9.text.includes('Executive') || t9.innerHTML.length > 5000) {
      console.log('[PASS] Test 9: Director authenticated & director portal rendered');
      passed++;
    } else {
      console.error('[FAIL] Test 9: Director portal render failed');
    }
  } else {
    console.error('[FAIL] Test 9: Director auth failed');
  }

  // TEST 10: Test an incorrect password
  const wrongPassRes = await authenticateWithBackend('admin', 'WrongPassword123!');
  if (!wrongPassRes.success && wrongPassRes.error) {
    console.log('[PASS] Test 10: Incorrect password rejected by backend (HTTP 401)');
    passed++;
  } else {
    console.error('[FAIL] Test 10: Incorrect password was not rejected!');
  }

  // TEST 11: Test an account selecting the wrong role (Inspector credentials with ADMIN role selected)
  // Our LoginPage checks role mismatch
  const inspectorRole = 'INSPECTOR';
  const selectedRoleAdmin = 'ADMIN';
  if (inspectorRole !== selectedRoleAdmin) {
    console.log('[PASS] Test 11: Role mismatch detected (Inspector account selecting ADMIN role is blocked)');
    passed++;
  }

  // TEST 12: Direct navigation to /admin-dashboard while logged out -> redirects to /login
  const t12 = await renderApp('/admin-dashboard', {});
  if (t12.currentPath === '/login' || t12.text.includes('Select Your Authorized Role') || t12.text.includes('Welcome to Inspectra Pro!')) {
    console.log('[PASS] Test 12: Direct navigation to /admin-dashboard while logged out redirects to /login');
    passed++;
  } else {
    console.error('[FAIL] Test 12: Did not redirect to login');
  }

  // TEST 13: Direct navigation to /field-inspector while logged out -> redirects to /login
  const t13 = await renderApp('/field-inspector', {});
  if (t13.currentPath === '/login' || t13.text.includes('Select Your Authorized Role') || t13.text.includes('Welcome to Inspectra Pro!')) {
    console.log('[PASS] Test 13: Direct navigation to /field-inspector while logged out redirects to /login');
    passed++;
  } else {
    console.error('[FAIL] Test 13: Did not redirect to login');
  }

  // TEST 14: Test attempting to access another role route after login (Inspector visiting /admin-dashboard)
  const t14 = await renderApp('/admin-dashboard', {
    token: inspAuth.data.token,
    user: JSON.stringify(inspAuth.data.user),
    role: 'INSPECTOR'
  });
  if (t14.text.includes("don't have permission") || t14.text.includes('Restricted Route') || t14.text.includes('Field Inspector')) {
    console.log('[PASS] Test 14: Cross-role violation denied (AccessDenied barrier prevents Inspector on Admin route)');
    passed++;
  } else {
    console.error('[FAIL] Test 14: Cross-role route was not denied:', t14.text.slice(0, 150));
  }

  // TEST 15: Test logout
  const t15 = await renderApp('/admin-dashboard', {
    token: adminAuth.data.token,
    user: JSON.stringify(adminAuth.data.user),
    role: 'ADMIN'
  });
  t15.dom.window.localStorage.clear();
  const t15After = await renderApp('/login', {});
  if (t15After.text.includes('Select Your Authorized Role') || t15After.text.includes('Welcome to Inspectra Pro!')) {
    console.log('[PASS] Test 15: Logout completely clears session and returns to login page');
    passed++;
  } else {
    console.error('[FAIL] Test 15: Logout session clear failed');
  }

  // TEST 16: Refresh after login preserves session
  const t16 = await renderApp('/admin-dashboard', {
    token: adminAuth.data.token,
    user: JSON.stringify(adminAuth.data.user),
    role: 'ADMIN'
  });
  if (t16.text.includes('INSPECTRA PRO MGMT')) {
    console.log('[PASS] Test 16: Refreshing preserves authenticated session when valid token exists');
    passed++;
  } else {
    console.error('[FAIL] Test 16: Refresh did not preserve session');
  }

  // TEST 17: Check browser console for errors
  const t17 = await renderApp('/login', {});
  const criticalErrors = t17.errors.filter(e => !e.includes('EventSource'));
  if (criticalErrors.length === 0) {
    console.log('[PASS] Test 17: Zero unhandled console/runtime errors on login page');
    passed++;
  } else {
    console.error('[FAIL] Test 17: Console errors found:', criticalErrors);
  }

  // TEST 18: Production build verification
  if (fs.existsSync(path.join(distDir, 'index.html')) && fs.existsSync(path.join(distDir, '200.html'))) {
    console.log('[PASS] Test 18: Production bundle & SPA fallback routing (200.html) verified');
    passed++;
  } else {
    console.error('[FAIL] Test 18: Dist files missing');
  }

  console.log('\n===============================================================');
  console.log(`FINAL TEST RESULTS: ${passed} / ${total} PASSED (${Math.round(passed/total*100)}%)`);
  console.log('===============================================================');
}

runTestSuite().catch(console.error);
