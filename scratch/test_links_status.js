const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function testDownloadLink(ws, prj, v, fmt = 'yolov8') {
  const apiUrl = `https://api.roboflow.com/${ws}/${prj}/${v}/${fmt}?api_key=${apiKey}`;
  https.get(apiUrl, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const d = JSON.parse(b);
      if (d.export && d.export.link) {
        console.log(`[${ws}/${prj}] got link:`, d.export.link.slice(0, 40) + '...');
        https.get(d.export.link, res2 => {
          console.log(`[${ws}/${prj}] Link status:`, res2.statusCode);
          if (res2.statusCode === 302) {
            console.log(`[${ws}/${prj}] Redirect to S3:`, res2.headers.location ? res2.headers.location.slice(0, 60) + '...' : 'none');
          }
        });
      } else {
        console.log(`[${ws}/${prj}] No export link in response:`, d);
      }
    });
  });
}

testDownloadLink('lam-z3bxb', 'honeycombs-updated', 1);
testDownloadLink('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx', 1);
