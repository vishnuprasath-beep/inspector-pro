const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function checkS3Size(ws, prj, v, fmt = 'yolov8') {
  const url = `https://api.roboflow.com/${ws}/${prj}/${v}/${fmt}?api_key=${apiKey}`;
  https.get(url, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const d = JSON.parse(b);
      console.log('Export info:', d);
      if (d.export && d.export.link) {
        https.get(d.export.link, res2 => {
          if (res2.statusCode === 302 && res2.headers.location) {
            https.get(res2.headers.location, { method: 'HEAD' }, res3 => {
              const cl = res3.headers['content-length'];
              console.log(`[${ws}/${prj}] S3 Content-Length:`, cl ? (parseInt(cl, 10) / 1048576).toFixed(2) + ' MB' : 'unknown');
            });
          }
        });
      }
    });
  });
}

checkS3Size('new-workspace', 'damage_dataset', 1);
