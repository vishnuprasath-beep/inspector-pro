const fs = require('fs');
const path = require('path');

const DEFECT_DIR = 'yolo_pipeline/dataset_defect';
const classNames = ['Crack', 'Spalling', 'Honeycombing', 'Exposed-Rebar', 'Concrete-Surface-Damage', 'Pothole'];
const splits = ['train', 'val', 'test'];

const classImgs = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
const classBoxes = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const splitBoxes = {
  train: { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 },
  val:   { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 },
  test:  { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }
};

let totalBoxes = 0;
let totalImages = 0;

splits.forEach(s => {
  const lblDir = path.join(DEFECT_DIR, 'labels', s);
  const imgDir = path.join(DEFECT_DIR, 'images', s);
  const imgs = fs.readdirSync(imgDir);
  totalImages += imgs.length;

  fs.readdirSync(lblDir).filter(f => f.endsWith('.txt')).forEach(f => {
    const lines = fs.readFileSync(path.join(lblDir, f), 'utf8').split(/\r?\n/).filter(Boolean);
    const inThisImg = new Set();
    lines.forEach(l => {
      totalBoxes++;
      const cid = parseInt(l.split(/\s+/)[0], 10);
      if (classBoxes[cid] !== undefined) {
        classBoxes[cid]++;
        splitBoxes[s][cid]++;
        inThisImg.add(cid);
      }
    });
    inThisImg.forEach(cid => classImgs[cid].add(s + '/' + f));
  });
});

console.log('='.repeat(70));
console.log('FINAL ACTUAL CLASS DISTRIBUTION (MEASURED)');
console.log('='.repeat(70));
console.log(`Total Images: ${totalImages}`);
console.log(`Total Annotations: ${totalBoxes}\n`);

console.log('Class | Images containing class | Bounding-box instances | Train | Val | Test | Pct of Total');
console.log('-'.repeat(85));
for (let i = 0; i < 6; i++) {
  const cname = classNames[i];
  const imgCount = classImgs[i].size;
  const boxCount = classBoxes[i];
  const tr = splitBoxes.train[i];
  const va = splitBoxes.val[i];
  const te = splitBoxes.test[i];
  const pct = ((boxCount / totalBoxes) * 100).toFixed(2);
  console.log(`${cname.padEnd(23)} | ${String(imgCount).padStart(23)} | ${String(boxCount).padStart(22)} | ${String(tr).padStart(5)} | ${String(va).padStart(3)} | ${String(te).padStart(4)} | ${pct}%`);
}
