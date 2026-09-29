const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API key without printing it
const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

if (!apiKey) {
  console.error('API key not found');
  process.exit(1);
}

function fetchProject(workspace, project) {
  return new Promise((resolve) => {
    const url = `https://api.roboflow.com/${workspace}/${project}?api_key=${apiKey}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            resolve({ workspace, project, error: data.error.message || data.error });
          } else {
            resolve({
              workspace,
              project,
              name: data.project ? data.project.name : project,
              type: data.project ? data.project.type : undefined,
              license: data.project ? data.project.license : undefined,
              classes: data.project ? data.project.classes : undefined,
              versions: data.project && data.project.versions ? data.project.versions.map(v => ({
                version: v.version,
                name: v.name,
                images: v.images,
                classes: v.classes
              })) : []
            });
          }
        } catch (e) {
          resolve({ workspace, project, error: e.message });
        }
      });
    }).on('error', e => resolve({ workspace, project, error: e.message }));
  });
}

async function main() {
  const candidates = [
    // Honeycombing
    ['ag-rf9yl', 'honeycomb-concrete'],
    ['pritha-ghosh-xrgsu', 'honeycomb_defect_detection'],
    ['lam-z3bxb', 'honeycombs-updated'],
    ['antmwa-tech', 'jenga-school-impact-project---detection-of-concrete-defects'],
    // Surface Damage / Concrete defects
    ['ali-saqlain-bwqfc', 'concrete-surface-defect'],
    ['defect-detection', 'bridge-defects-detection'],
    ['bridges-defects', 'bridge-defects'],
    ['computer-vision-a67b2', 'bridge-defects-detection'],
    ['inspection-pro', 'concrete-defect-detection'],
    ['dami-la4u0', 'concrete-defect-detection']
  ];

  console.log('Probing Roboflow candidate datasets...');
  for (const [ws, prj] of candidates) {
    const res = await fetchProject(ws, prj);
    console.log(`\n--- [${ws}/${prj}] ---`);
    if (res.error) {
      console.log(`Error/Inaccessible: ${res.error}`);
    } else {
      console.log(`Name: ${res.name}`);
      console.log(`Type: ${res.type}`);
      console.log(`License: ${res.license}`);
      console.log(`Classes:`, JSON.stringify(res.classes));
      console.log(`Versions count: ${res.versions.length}`);
      if (res.versions.length > 0) {
        console.log(`Latest Version:`, JSON.stringify(res.versions[0]));
      }
    }
  }
}

main();
