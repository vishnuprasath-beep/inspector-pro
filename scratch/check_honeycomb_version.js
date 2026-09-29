const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function checkVersion(ws, prj, ver) {
  const url = `https://api.roboflow.com/${ws}/${prj}/${ver}?api_key=${apiKey}`;
  https.get(url, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`=== ${ws}/${prj}/${ver} ===`);
        if (data.error) {
          console.log('Error:', data.error);
        } else {
          console.log('Images:', data.version ? data.version.images : data.images);
          console.log('Splits:', data.version ? data.version.splits : data.splits);
          console.log('Exports:', data.version ? Object.keys(data.version.exports || {}) : Object.keys(data.exports || {}));
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });
}

checkVersion('lam-z3bxb', 'honeycombs-updated', 1);
checkVersion('ag-rf9yl', 'honeycomb-concrete', 1);
checkVersion('ag-rf9yl', 'honeycomb-concrete', 3);
