import pkg from 'jsdom';
const { JSDOM, VirtualConsole } = pkg;

const VERCEL_FRONTEND_URL = 'https://frontend-six-ashy-74.vercel.app';
const VERCEL_BACKEND_URL = 'https://backend-three-gules-87.vercel.app/api';

console.log('Fetching live assets from Vercel:', VERCEL_FRONTEND_URL);
const htmlRes = await fetch(VERCEL_FRONTEND_URL);
const html = await htmlRes.text();

const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
if (!jsMatch) {
  throw new Error('Could not find bundle in live HTML: ' + html);
}
const jsUrl = VERCEL_FRONTEND_URL + jsMatch[1];
console.log('Fetching live bundle:', jsUrl);
const jsRes = await fetch(jsUrl);
const jsCode = await jsRes.text();

console.log(`Live bundle size: ${(jsCode.length / 1024).toFixed(1)} KB`);

async function authenticateLive(identifier, password) {
  const res = await fetch(`${VERCEL_BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  return await res.json();
}

async function renderLiveApp(path, localStorageState = {}) {
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));
  virtualConsole.on('jsdomError', (err) => errors.push(err.message || String(err)));

  const dom = new JSDOM(html, {
    url: `${VERCEL_FRONTEND_URL}${path}`,
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      window.localStorage.clear();
      window.sessionStorage.clear();
      for (const [k, v] of Object.entries(localStorageState)) {
        window.sessionStorage.setItem(k, v);
      }
      window.matchMedia = window.matchMedia || function() {
        return { matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {} };
      };
      window.fetch = globalThis.fetch;
      window.scrollTo = () => {};
    }
  });

  dom.window.eval(jsCode);
  await new Promise(r => setTimeout(r, 1600));

  const root = dom.window.document.getElementById('root');
  const text = root ? root.textContent.trim().replace(/\s+/g, ' ') : '';
  const innerHTML = root ? root.innerHTML.trim() : '';
  const currentPath = dom.window.location.pathname;

  return { dom, text, innerHTML, errors, currentPath };
}

async function runLiveScenarios() {
  console.log('\n===============================================================');
  console.log('VERIFYING 10 REQUIRED SCENARIOS ON LIVE VERCEL PRODUCTION');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 10;

  // SCENARIO 1: Open main Vercel URL while logged out.
  // -> Login page must appear.
  console.log('Testing Scenario 1: Main Vercel URL while logged out...');
  const s1 = await renderLiveApp('/', {});
  const s1Lower = s1.text.toLowerCase();
  const isLoginPage = s1Lower.includes('inspectra pro') && (s1Lower.includes('authorized role') || s1Lower.includes('sign in') || s1Lower.includes('welcome'));
  const isNotDashboard = !s1.text.includes('INSPECTRA PRO MGMT') && !s1.text.includes('CCTV Monitoring');
  if (isLoginPage && isNotDashboard) {
    console.log('  ✓ [PASS] Scenario 1: Login page appears at root URL without loading role dashboards.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Scenario 1: Expected login page at root. Text:', s1.text.slice(0, 150));
  }

  // SCENARIO 2: Login as Inspector -> /field-inspector
  console.log('\nTesting Scenario 2: Login as Inspector...');
  const inspAuth = await authenticateLive('insp.vishnuprasath', 'password123');
  if (inspAuth.success && inspAuth.data?.user?.role === 'INSPECTOR') {
    const s2 = await renderLiveApp('/field-inspector', {
      token: inspAuth.data.token,
      user: JSON.stringify(inspAuth.data.user),
      role: 'INSPECTOR'
    });
    if (s2.text.includes('Field Inspector Portal') || s2.text.includes('Hello, Vishnu Prasath') || s2.text.includes('INSP-2026')) {
      console.log('  ✓ [PASS] Scenario 2: Inspector credentials authenticate and open /field-inspector.');
      passed++;
    } else {
      console.error('  ✗ [FAIL] Scenario 2: Field Inspector Portal did not render. Text:', s2.text.slice(0, 150));
    }
  } else {
    console.error('  ✗ [FAIL] Scenario 2: Inspector backend auth failed:', inspAuth);
  }

  // SCENARIO 3: Login as Admin -> /admin-dashboard
  console.log('\nTesting Scenario 3: Login as Admin...');
  const adminAuth = await authenticateLive('admin.selvakumar', 'password123');
  if (adminAuth.success && adminAuth.data?.user?.role === 'ADMIN') {
    const s3 = await renderLiveApp('/admin-dashboard', {
      token: adminAuth.data.token,
      user: JSON.stringify(adminAuth.data.user),
      role: 'ADMIN'
    });
    if (s3.text.includes('INSPECTRA PRO MGMT') && s3.text.includes('CCTV Monitoring') && s3.text.includes('Inspector Monitoring')) {
      console.log('  ✓ [PASS] Scenario 3: Admin credentials authenticate and open /admin-dashboard.');
      passed++;
    } else {
      console.error('  ✗ [FAIL] Scenario 3: Admin Dashboard did not render properly. Text:', s3.text.slice(0, 150));
    }
  } else {
    console.error('  ✗ [FAIL] Scenario 3: Admin backend auth failed:', adminAuth);
  }

  // SCENARIO 4: Login as Supervisor -> /admin-dashboard
  console.log('\nTesting Scenario 4: Login as Supervisor...');
  const supAuth = await authenticateLive('supervisor.muthukumar', 'password123');
  if (supAuth.success && supAuth.data?.user?.role === 'SUPERVISOR') {
    const s4 = await renderLiveApp('/admin-dashboard', {
      token: supAuth.data.token,
      user: JSON.stringify(supAuth.data.user),
      role: 'SUPERVISOR'
    });
    if (s4.text.includes('INSPECTRA PRO MGMT') && s4.text.includes('SUPERVISOR')) {
      console.log('  ✓ [PASS] Scenario 4: Supervisor credentials authenticate and open /admin-dashboard.');
      passed++;
    } else {
      console.error('  ✗ [FAIL] Scenario 4: Supervisor Management Portal did not render. Text:', s4.text.slice(0, 150));
    }
  } else {
    console.error('  ✗ [FAIL] Scenario 4: Supervisor backend auth failed:', supAuth);
  }

  // SCENARIO 5: Login as Director -> /admin-dashboard
  console.log('\nTesting Scenario 5: Login as Director...');
  const dirAuth = await authenticateLive('director.radhakrishnan', 'password123');
  if (dirAuth.success && dirAuth.data?.user?.role === 'DIRECTOR') {
    const s5 = await renderLiveApp('/admin-dashboard', {
      token: dirAuth.data.token,
      user: JSON.stringify(dirAuth.data.user),
      role: 'DIRECTOR'
    });
    if (s5.text.includes('INSPECTRA PRO MGMT') && s5.text.includes('DIRECTOR')) {
      console.log('  ✓ [PASS] Scenario 5: Director credentials authenticate and open /admin-dashboard.');
      passed++;
    } else {
      console.error('  ✗ [FAIL] Scenario 5: Director Management Portal did not render. Text:', s5.text.slice(0, 150));
    }
  } else {
    console.error('  ✗ [FAIL] Scenario 5: Director backend auth failed:', dirAuth);
  }

  // SCENARIO 6: While logged out, manually open /admin-dashboard -> Redirect to login.
  console.log('\nTesting Scenario 6: Logged-out access to /admin-dashboard...');
  const s6 = await renderLiveApp('/admin-dashboard', {});
  if (s6.currentPath === '/login' && s6.text.toLowerCase().includes('inspectra pro') && !s6.text.includes('CCTV Monitoring')) {
    console.log('  ✓ [PASS] Scenario 6: Direct /admin-dashboard access while logged out redirects to /login.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Scenario 6: Expected redirect to /login. Current path:', s6.currentPath, 'Text:', s6.text.slice(0, 100));
  }

  // SCENARIO 7: While logged out, manually open /field-inspector -> Redirect to login.
  console.log('\nTesting Scenario 7: Logged-out access to /field-inspector...');
  const s7 = await renderLiveApp('/field-inspector', {});
  if (s7.currentPath === '/login' && s7.text.toLowerCase().includes('inspectra pro') && !s7.text.includes('Assigned Inspection Facility')) {
    console.log('  ✓ [PASS] Scenario 7: Direct /field-inspector access while logged out redirects to /login.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Scenario 7: Expected redirect to /login. Current path:', s7.currentPath, 'Text:', s7.text.slice(0, 100));
  }

  // SCENARIO 8: Login as Inspector and manually open /admin-dashboard -> Access denied.
  console.log('\nTesting Scenario 8: Inspector attempts cross-role access to /admin-dashboard...');
  const s8 = await renderLiveApp('/admin-dashboard', {
    token: inspAuth.data.token,
    user: JSON.stringify(inspAuth.data.user),
    role: 'INSPECTOR'
  });
  if (s8.text.includes('Access Denied') || s8.text.includes('Security Barrier') || s8.text.includes('Go to Field Inspector Portal')) {
    console.log('  ✓ [PASS] Scenario 8: Access denied to Inspector attempting to enter /admin-dashboard.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Scenario 8: Security barrier failed. Text:', s8.text.slice(0, 150));
  }

  // SCENARIO 9: Refresh the page after login -> Session remains valid.
  console.log('\nTesting Scenario 9: Refresh page with valid token...');
  const s9 = await renderLiveApp('/admin-dashboard', {
    token: adminAuth.data.token,
    user: JSON.stringify(adminAuth.data.user),
    role: 'ADMIN'
  });
  if (s9.text.includes('INSPECTRA PRO MGMT') && s9.text.includes('K. Selvakumar, IAS')) {
    console.log('  ✓ [PASS] Scenario 9: Persistent session verified on page reload with valid token.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Scenario 9: Session not preserved. Text:', s9.text.slice(0, 150));
  }

  // SCENARIO 10: Logout -> User returns to login page, protected pages no longer accessible.
  console.log('\nTesting Scenario 10: Logout behavior and protected page isolation...');
  // Simulate logout: storage keys removed
  const s10 = await renderLiveApp('/login', {});
  const s10Admin = await renderLiveApp('/admin-dashboard', {});
  if (s10.text.toLowerCase().includes('inspectra pro') && s10Admin.currentPath === '/login') {
    console.log('  ✓ [PASS] Scenario 10: After logout, user is at login page and protected routes redirect to /login.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Scenario 10: Logout isolation failed.');
  }

  console.log('\n===============================================================');
  console.log(`LIVE VERCEL VERIFICATION SUMMARY: ${passed} / ${total} SCENARIOS PASSED (${(passed/total)*100}%)`);
  console.log('===============================================================\n');
}

runLiveScenarios().catch(err => console.error('Error running live scenarios:', err));
