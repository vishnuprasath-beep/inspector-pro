const fs = require('fs');
const path = require('path');

const RAW_DIR = 'yolo_pipeline/raw_defect_data';
const DEFECT_DIR = 'yolo_pipeline/dataset_defect';
const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.webp']);

console.log('='.repeat(70));
console.log('STEP 1 — INSPECT CURRENT DATA (MEASURED)');
console.log('='.repeat(70));

// 1. Inspect raw_defect_data
console.log('\n1. RAW DEFECT DATA:');
const rawFolders = fs.readdirSync(RAW_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

console.log('Folders found in raw_defect_data:', rawFolders);

const rawStats = {};
rawFolders.forEach(rf => {
  const fPath = path.join(RAW_DIR, rf);
  const dataYamlPath = path.join(fPath, 'data.yaml');
  let yamlContent = null;
  if (fs.existsSync(dataYamlPath)) {
    yamlContent = fs.readFileSync(dataYamlPath, 'utf8');
  }

  rawStats[rf] = {
    splits: {},
    totalImages: 0,
    totalLabels: 0,
    yamlContent
  };

  ['train', 'valid', 'val', 'test'].forEach(split => {
    let imgDir = path.join(fPath, split, 'images');
    let lblDir = path.join(fPath, split, 'labels');
    if (!fs.existsSync(imgDir) && fs.existsSync(path.join(fPath, 'images', split))) {
      imgDir = path.join(fPath, 'images', split);
      lblDir = path.join(fPath, 'labels', split);
    }
    if (fs.existsSync(imgDir)) {
      const imgs = fs.readdirSync(imgDir).filter(f => IMG_EXTS.has(path.extname(f).toLowerCase()));
      const lbls = fs.existsSync(lblDir) ? fs.readdirSync(lblDir).filter(f => f.endsWith('.txt')) : [];
      rawStats[rf].splits[split] = { images: imgs.length, labels: lbls.length };
      rawStats[rf].totalImages += imgs.length;
      rawStats[rf].totalLabels += lbls.length;
    }
  });

  console.log(`\n  Folder: ${rf}`);
  console.log(`    Total Images : ${rawStats[rf].totalImages}`);
  console.log(`    Total Labels : ${rawStats[rf].totalLabels}`);
  console.log(`    Splits       :`, JSON.stringify(rawStats[rf].splits));
  if (yamlContent) {
    const namesMatch = yamlContent.match(/names:\s*(.*)/);
    console.log(`    Classes      :`, namesMatch ? namesMatch[1] : 'unparsed');
  }
});

// 2. Inspect dataset_defect
console.log('\n2. CURRENT PREPARED DATASET (dataset_defect/):');
if (fs.existsSync(DEFECT_DIR)) {
  const dataYamlDefect = path.join(DEFECT_DIR, 'data.yaml');
  if (fs.existsSync(dataYamlDefect)) {
    console.log('  Current data.yaml:\n' + fs.readFileSync(dataYamlDefect, 'utf8'));
  }
  const splits = ['train', 'val', 'test'];
  splits.forEach(s => {
    const imgDir = path.join(DEFECT_DIR, 'images', s);
    const lblDir = path.join(DEFECT_DIR, 'labels', s);
    const imgCount = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter(f => IMG_EXTS.has(path.extname(f).toLowerCase())).length : 0;
    const lblCount = fs.existsSync(lblDir) ? fs.readdirSync(lblDir).filter(f => f.endsWith('.txt')).length : 0;
    console.log(`  Split ${s}: images=${imgCount}, labels=${lblCount}`);
  });
} else {
  console.log('  dataset_defect/ does not exist.');
}
