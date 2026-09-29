const { loadClassRemapStrict } = require('../yolo_pipeline/prepare_dataset.js');
const path = require('path');
const fs = require('fs');

const rawDir = 'yolo_pipeline/raw_defect_data';
const folders = fs.readdirSync(rawDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

folders.forEach(f => {
  console.log('\nTesting mapping for folder:', f);
  const remap = loadClassRemapStrict(path.join(rawDir, f), f);
  console.log('Result remap:', remap);
});
