const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function checkVersion(ws, prj, v) {
  const url = `https://api.roboflow.com/${ws}/${prj}/${v}?api_key=${apiKey}`;
  https.get(url, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const d = JSON.parse(b);
      console.log(`Version ${v}:`, d.version ? { images: d.version.images, splits: d.version.splits } : d);
    });
  });
}

for (let v = 1; v <= 4; v++) {
  checkVersion('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx', v);
}
