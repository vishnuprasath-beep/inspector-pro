const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function checkVersionDetails(ws, prj, v) {
  const url = `https://api.roboflow.com/${ws}/${prj}/${v}?api_key=${apiKey}`;
  https.get(url, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const d = JSON.parse(b);
      console.log(`Version ${v} classes:`, d.version ? d.version.classes : 'no classes');
    });
  });
}

checkVersionDetails('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx', 1);
checkVersionDetails('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx', 4);
