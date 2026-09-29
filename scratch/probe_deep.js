const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function probe(ws, prj) {
  const url = `https://api.roboflow.com/${ws}/${prj}?api_key=${apiKey}`;
  https.get(url, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      const data = JSON.parse(body);
      console.log(`=== ${ws}/${prj} ===`);
      if (data.error) console.log('Error:', data.error);
      else {
        console.log('Name:', data.project.name);
        console.log('Type:', data.project.type);
        console.log('License:', data.project.license);
        console.log('Classes:', data.project.classes);
        console.log('Versions:', data.project.versions);
        console.log('Images:', data.project.images);
      }
    });
  });
}

probe('deep-zqmpp', 'concrete-defect-detection-zuym8-0jcxx');
