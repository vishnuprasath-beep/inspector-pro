const fs = require('fs');
const path = require('path');

const apiFile = path.resolve('frontend/src/services/api.js');
const apiContent = fs.readFileSync(apiFile, 'utf-8');

// Load exported api object keys
const methodRegex = /^\s*([a-zA-Z0-9_]+)\s*:\s*(async\s*)?(\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/gm;
const apiMethods = new Set();
let m;
while ((m = methodRegex.exec(apiContent)) !== null) {
  apiMethods.add(m[1]);
}

const missing = [];
function scanDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const p = path.join(dir, item);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        scanDir(p);
      }
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      if (p === apiFile) continue;
      const content = fs.readFileSync(p, 'utf-8');
      const callRegex = /\bapi\.([a-zA-Z0-9_]+)\b/g;
      let match;
      while ((match = callRegex.exec(content)) !== null) {
        const method = match[1];
        if (!apiMethods.has(method)) {
          missing.push({ file: path.relative('.', p), method });
        }
      }
    }
  }
}

scanDir(path.resolve('frontend/src'));
console.log('TOTAL MISSING CALLS:', missing.length);
const uniqueMethods = {};
for (const item of missing) {
  if (!uniqueMethods[item.method]) uniqueMethods[item.method] = [];
  uniqueMethods[item.method].push(item.file);
}

for (const [method, files] of Object.entries(uniqueMethods)) {
  console.log(`- api.${method} called in:`, files.join(', '));
}
