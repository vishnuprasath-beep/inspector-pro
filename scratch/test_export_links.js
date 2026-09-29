const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function checkExport(ws, prj, v, fmt = 'yolov8') {
  const url = `https://api.roboflow.com/${ws}/${prj}/${v}/${fmt}?api_key=${apiKey}`;
  https.get(url, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      try {
        const d = JSON.parse(b);
        console.log(`=== ${ws}/${prj}/${v}/${fmt} ===`);
        if (d.error) console.log('Error:', d.error);
        else {
          console.log('Export status:', d.export ? 'Ready (link available)' : 'Not ready');
          if (d.progress) console.log('Progress:', d.progress);
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });
}

checkExport('lam-z3bxb', 'honeycombs-updated', 1, 'yolov8');
checkExport('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx', 1, 'yolov8');
