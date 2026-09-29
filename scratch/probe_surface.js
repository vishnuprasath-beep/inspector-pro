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
              versions: data.project ? data.project.versions : undefined,
              splits: data.project ? data.project.splits : undefined,
              images: data.project ? data.project.images : undefined
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
    ['hannahs-workspace-gu7ic', 'bridge-damage-detection-gjp5m'],
    ['pkugdu', 'bridges-damage-detection'],
    ['bridgescience', 'bridge-segmentation-sxkl5'],
    ['railway-defect-detection', 'concrete-bridge-defect-gfdzk'],
    ['van-dqben', 'bridge-defect-yolo-gyu-det-2htkd-s9ue4-iaiai']
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
      console.log('Images:', r.images);
    }
  }
}

run();
