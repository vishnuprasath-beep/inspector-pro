const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envContent = fs.readFileSync('yolo_pipeline/.env', 'utf8');
const match = envContent.match(/ROBOFLOW_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1].trim() : '';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function test() {
  const ws = 'new-workspace';
  const prj = 'damage_dataset';
  const v = 1;
  const apiUrl = `https://api.roboflow.com/${ws}/${prj}/${v}/yolov8?api_key=${apiKey}`;
  
  console.log('Fetching download link...');
  const res = await new Promise(r => {
    https.get(apiUrl, res2 => {
      let b = '';
      res2.on('data', c => b += c);
      res2.on('end', () => r(JSON.parse(b)));
    });
  });

  const link = res.export.link;
  console.log('Got link, downloading to scratch/test_damage.zip ...');
  await download(link, 'scratch/test_damage.zip');
  const sz = fs.statSync('scratch/test_damage.zip').size;
  console.log('Downloaded size:', (sz / 1048576).toFixed(2), 'MB');

  console.log('Testing extraction with tar...');
  fs.mkdirSync('scratch/test_damage_extracted', { recursive: true });
  execSync('tar -xf "scratch/test_damage.zip" -C "scratch/test_damage_extracted"');
  console.log('Extracted! Checking contents:');
  const items = fs.readdirSync('scratch/test_damage_extracted');
  console.log('Root items:', items);
  if (fs.existsSync('scratch/test_damage_extracted/data.yaml')) {
    console.log('data.yaml:\n' + fs.readFileSync('scratch/test_damage_extracted/data.yaml', 'utf8'));
  }
}

test().catch(e => console.error(e));
