'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const envPath = path.join(WORKSPACE_ROOT, 'yolo_pipeline', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

if (!apiKey) {
  console.error('[ERROR] No Roboflow API key found in yolo_pipeline/.env');
  process.exit(1);
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        if (!res.headers.location) {
          return reject(new Error(`Redirect ${res.statusCode} with no Location header`));
        }
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url.slice(0, 100)}`));
      }
      const out = fs.createWriteStream(destPath);
      res.pipe(out);
      out.on('finish', () => {
        out.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      out.on('error', err => {
        try { fs.unlinkSync(destPath); } catch {}
        reject(err);
      });
    });
    req.on('error', err => {
      try { fs.unlinkSync(destPath); } catch {}
      reject(err);
    });
  });
}

function getRoboflowDownloadUrl(workspace, project, version, format, key) {
  return new Promise((resolve, reject) => {
    const url = `https://api.roboflow.com/${workspace}/${project}/${version}/${format}?api_key=${key}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.export && data.export.link) {
            resolve(data.export.link);
          } else if (data.error) {
            reject(new Error(data.error.message || JSON.stringify(data.error)));
          } else {
            reject(new Error(`Unexpected response: ${body.slice(0, 200)}`));
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const ws = 'lam-z3bxb';
  const prj = 'honeycombs-updated';
  const ver = 1;
  const targetDir = path.join(WORKSPACE_ROOT, 'yolo_pipeline', 'raw_defect_data', 'honeycombing_lam_z3bxb');
  const tempZip = path.join(WORKSPACE_ROOT, 'yolo_pipeline', 'raw_defect_data', 'honeycombing_lam_z3bxb.zip');

  console.log('='.repeat(70));
  console.log(`ACQUIRING: Honeycombing from ${ws}/${prj} (v${ver})`);
  console.log(`Target: ${targetDir}`);
  console.log('='.repeat(70));

  if (fs.existsSync(targetDir)) {
    console.log('[INFO] Target directory already exists. Checking files...');
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log('[1/3] Requesting export URL from Roboflow API...');
  const exportUrl = await getRoboflowDownloadUrl(ws, prj, ver, 'yolov8', apiKey);
  console.log('[OK] Export URL obtained.');

  console.log('[2/3] Downloading ZIP archive...');
  await downloadFile(exportUrl, tempZip);
  const sizeMB = (fs.statSync(tempZip).size / 1048576).toFixed(2);
  console.log(`[OK] Downloaded archive: ${sizeMB} MB`);

  console.log('[3/3] Extracting archive via tar...');
  execSync(`tar -xf "${tempZip}" -C "${targetDir}"`, { stdio: 'inherit' });
  console.log('[OK] Extraction complete.');

  // Clean up temporary zip
  try { fs.unlinkSync(tempZip); } catch {}

  console.log('\n[SUCCESS] Honeycombing raw dataset ready at: ' + targetDir);
}

main().catch(err => {
  console.error('\n[FATAL ERROR]', err.message);
  process.exit(1);
});
