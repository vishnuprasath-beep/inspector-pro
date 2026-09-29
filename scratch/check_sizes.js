const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function getHead(ws, prj, v, fmt = 'yolov8') {
  const url = `https://api.roboflow.com/${ws}/${prj}/${v}/${fmt}?api_key=${apiKey}`;
  https.get(url, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const d = JSON.parse(b);
      if (d.export && d.export.link) {
        https.get(d.export.link, res2 => {
          console.log(`[${ws}/${prj}] HTTP ${res2.statusCode}, Content-Length:`, res2.headers['content-length'] ? (parseInt(res2.headers['content-length'], 10) / 1048576).toFixed(2) + ' MB' : 'unknown');
        });
      }
    });
  });
}

getHead('lam-z3bxb', 'honeycombs-updated', 1);
getHead('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx', 1);
