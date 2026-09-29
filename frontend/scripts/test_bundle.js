// Minimal mock browser environment to test bundle execution and catch runtime crashes
import fs from 'fs';
import path from 'path';

const storage = {};
globalThis.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

globalThis.window = {
  localStorage: globalThis.localStorage,
  location: {
    pathname: '/',
    search: '',
    hash: '',
    protocol: 'https:',
    host: 'inspectra-pro-2026.surge.sh',
    href: 'https://inspectra-pro-2026.surge.sh/'
  },
  history: {
    pushState: () => {},
    replaceState: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  screen: { deviceXDPI: 96, logicalXDPI: 96, width: 1920, height: 1080 },
  WebKitCSSMatrix: class WebKitCSSMatrix { m11 = 1; },
  navigator: {
    userAgent: 'Mozilla/5.0 NodeTest',
    platform: 'Win32',
    mediaDevices: {
      getUserMedia: async () => {},
      getDisplayMedia: async () => {}
    }
  }
};

globalThis.document = {
  getElementById: (id) => {
    return {
      id,
      nodeType: 1,
      innerHTML: '',
      appendChild: () => {},
      removeChild: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      classList: { add: () => {}, remove: () => {} },
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    setAttribute: () => {},
    getAttribute: () => null,
    style: {},
    appendChild: () => {},
    removeChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  }),
  documentElement: {
    style: {},
    classList: { add: () => {}, remove: () => {} }
  }
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      ...globalThis.window.navigator,
      platform: 'Win32'
    },
    writable: true,
    configurable: true
  });
} catch(e) {}
try {
  Object.defineProperty(globalThis, 'location', {
    value: globalThis.window.location,
    writable: true,
    configurable: true
  });
} catch(e) {}
globalThis.MutationObserver = class MutationObserver {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};
globalThis.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};

console.log('Testing bundle execution with NO logged-in user...');
try {
  await import('../dist/assets/index-CyE7hfjJ.js');
  console.log('SUCCESS: Bundle executed without top-level crash!');
} catch (err) {
  console.error('BUNDLE RUNTIME CRASH DETECTED:');
  console.error(err);
}
