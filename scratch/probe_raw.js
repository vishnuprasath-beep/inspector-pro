const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function probeRaw(ws, prj) {
  const url = `https://api.roboflow.com/${ws}/${prj}?api_key=${apiKey}`;
  https.get(url, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      const data = JSON.parse(body);
      console.log(`\n=== ${ws}/${prj} ===`);
      console.log('Keys in data:', Object.keys(data));
      if (data.project) {
        console.log('Keys in project:', Object.keys(data.project));
        console.log('project.name:', data.project.name);
        console.log('project.license:', data.project.license);
        console.log('project.type:', data.project.type);
        console.log('project.classes:', data.project.classes);
        console.log('project.versions:', typeof data.project.versions, Array.isArray(data.project.versions) ? data.project.versions.length : data.project.versions);
      }
      if (data.versions) {
        console.log('data.versions:', typeof data.versions, Array.isArray(data.versions) ? data.versions.length : data.versions);
      }
    });
  });
}

probeRaw('pritha-ghosh-xrgsu', 'honeycomb_defect_detection');
probeRaw('ag-rf9yl', 'honeycomb-concrete');
probeRaw('lam-z3bxb', 'honeycombs-updated');
