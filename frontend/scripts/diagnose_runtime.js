import pkg from 'jsdom';
const { JSDOM, VirtualConsole } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const html = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');
const jsCode = fs.readFileSync(path.resolve(distDir, 'assets/index-SVgZlQS9.js'), 'utf-8');

async function testUrl(url, initialLocalStorage = {}) {
  console.log(`\n======================================================`);
  console.log(`TESTING URL: ${url}`);
  console.log(`INITIAL LOCALSTORAGE:`, JSON.stringify(initialLocalStorage));
  console.log(`======================================================`);

  const virtualConsole = new VirtualConsole();
  const errors = [];
  const logs = [];

  virtualConsole.on('error', (...args) => {
    errors.push(args.join(' '));
    console.error('  [CONSOLE ERROR]', ...args);
  });
  virtualConsole.on('warn', (...args) => {
    console.warn('  [CONSOLE WARN]', ...args);
  });
  virtualConsole.on('log', (...args) => {
    logs.push(args.join(' '));
    console.log('  [CONSOLE LOG]', ...args);
  });
  virtualConsole.on('jsdomError', (err) => {
    errors.push(err.message || String(err));
    console.error('  [JSDOM ERROR]', err);
  });

  const dom = new JSDOM(html, {
    url: `https://inspectra-pro-2026.surge.sh${url}`,
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      window.localStorage.clear();
      for (const [k, v] of Object.entries(initialLocalStorage)) {
        window.localStorage.setItem(k, v);
      }

      window.matchMedia = window.matchMedia || function() {
        return {
          matches: false,
          addListener: function() {},
          removeListener: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
          dispatchEvent: function() {}
        };
      };

      window.fetch = globalThis.fetch;
      window.scrollTo = () => {};
    }
  });

  try {
    dom.window.eval(jsCode);
  } catch (err) {
    console.error('  [EVAL RUNTIME ERROR]:', err);
  }

  // Wait for scripts to execute and React to mount
  await new Promise(r => setTimeout(r, 2000));

  const root = dom.window.document.getElementById('root');
  const renderedHtml = root ? root.innerHTML.trim() : '';

  console.log(`\nRENDERED HTML LENGTH: ${renderedHtml.length}`);
  if (renderedHtml.length === 0) {
    console.error('!!! PAGE IS COMPLETELY BLANK/WHITE !!!');
  } else {
    console.log('PAGE RENDERED! Sample text content:');
    console.log(root.textContent.slice(0, 300).trim().replace(/\s+/g, ' '));
  }

  return { errors, renderedHtml };
}

async function runAll() {
  // Test 1: First visit, no localStorage, URL: /
  await testUrl('/', {});

  // Test 2: First visit, no localStorage, URL: /login
  await testUrl('/login', {});

  // Test 3: Unauthenticated visit to protected route /admin-dashboard
  await testUrl('/admin-dashboard', {});

  // Test 4: Authenticated ADMIN user in localStorage visiting /
  await testUrl('/', {
    token: 'valid-test-token',
    user: JSON.stringify({ id: 'usr-admin-01', name: 'K. Selvakumar, IAS', role: 'ADMIN' }),
    role: 'ADMIN'
  });

  // Test 5: Authenticated INSPECTOR user in localStorage visiting /
  await testUrl('/', {
    token: 'valid-test-token',
    user: JSON.stringify({ id: 'usr-insp-vp01', name: 'Vishnu Prasath', role: 'INSPECTOR' }),
    role: 'INSPECTOR'
  });
}

runAll().catch(console.error);
