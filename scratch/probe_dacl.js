const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function probe(ws, prj) {
  return new Promise((resolve) => {
    const url = `https://api.roboflow.com/${ws}/${prj}?api_key=${apiKey}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            resolve({ ws, prj, error: data.error.message || data.error });
          } else {
            resolve({
              ws,
              prj,
              name: data.project ? data.project.name : prj,
              type: data.project ? data.project.type : undefined,
              license: data.project ? data.project.license : undefined,
              classes: data.project ? data.project.classes : undefined,
              versions: data.project ? data.project.versions : undefined
            });
          }
        } catch (e) {
          resolve({ ws, prj, error: e.message });
        }
      });
    }).on('error', e => resolve({ ws, prj, error: e.message }));
  });
}

async function run() {
  const list = [
    ['dacl10ktrain', 'concrete-defects'],
    ['dacl10ktrain', 'concrete-defect-detection'],
    ['dacl10ktrain', 'dacl10k_train'],
    ['deep-v96v9', 'concrete-defect-detection'],
    ['six1five-studio', 'concrete-defects'],
    ['concrete-defects-0j2j5', 'concrete-defects'],
    ['concrete-surface-defects', 'concrete-surface-defects'],
    ['surface-defect-detection', 'surface-defect-detection']
  ];

  for (const [w, p] of list) {
    const r = await probe(w, p);
    console.log(`\n=== [${w}/${p}] ===`);
    if (r.error) console.log('Error:', r.error);
    else {
      console.log('Name:', r.name);
      console.log('Type:', r.type);
      console.log('License:', r.license);
      console.log('Classes:', JSON.stringify(r.classes));
      console.log('Versions:', r.versions);
    }
  }
}

run();
