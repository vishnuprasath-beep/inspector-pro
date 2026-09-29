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
      console.log(`=== ${ws}/${prj}/${v} ===`);
      if (d.error) console.log('Error:', d.error);
      else {
        console.log('Images:', d.version ? d.version.images : d.images);
        console.log('Splits:', d.version ? d.version.splits : d.splits);
        console.log('Classes:', d.version ? d.version.classes : d.classes);
      }
    });
  });
}

checkVersionDetails('new-workspace', 'damage_dataset', 1);
