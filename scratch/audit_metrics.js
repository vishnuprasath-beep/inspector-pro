const fs = require('fs');
const path = require('path');

const base = 'yolo_pipeline/dataset_defect';
const splits = ['train', 'val', 'test'];
const classNames = ['Crack', 'Spalling', 'Honeycombing', 'Exposed-Rebar', 'Concrete-Surface-Damage', 'Pothole'];

const stats = {
  instances: {0:0, 1:0, 2:0, 3:0, 4:0, 5:0},
  imagesPerClass: {0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set()},
  bySplit: {
    train: {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, totalImgs: 0},
    val:   {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, totalImgs: 0},
    test:  {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, totalImgs: 0}
  }
};

let totalInstances = 0;
let totalImages = 0;

splits.forEach(split => {
  const lblDir = path.join(base, 'labels', split);
  const imgDir = path.join(base, 'images', split);
  const imgFiles = fs.readdirSync(imgDir).filter(f => f.match(/\.(jpg|jpeg|png|bmp|webp)$/i));
  stats.bySplit[split].totalImgs = imgFiles.length;
  totalImages += imgFiles.length;

  fs.readdirSync(lblDir).filter(f => f.endsWith('.txt')).forEach(lblFile => {
    const lines = fs.readFileSync(path.join(lblDir, lblFile), 'utf8').split(/\r?\n/).filter(Boolean);
    const classesInImg = new Set();
    lines.forEach(l => {
      totalInstances++;
      const cid = parseInt(l.split(/\s+/)[0], 10);
      if (stats.instances[cid] !== undefined) {
        stats.instances[cid]++;
        stats.bySplit[split][cid]++;
        classesInImg.add(cid);
      }
    });
    classesInImg.forEach(cid => {
      stats.imagesPerClass[cid].add(split + '/' + lblFile);
    });
  });
});

console.log('TOTAL IMAGES:', totalImages);
console.log('TOTAL INSTANCES:', totalInstances);
console.log('\n--- SPLIT IMAGE COUNTS ---');
splits.forEach(s => {
  console.log(`  ${s}: ${stats.bySplit[s].totalImgs} images`);
});

console.log('\n--- CLASS DETAILS ---');
for (let cid = 0; cid < 6; cid++) {
  const inst = stats.instances[cid];
  const imgs = stats.imagesPerClass[cid].size;
  const pct = ((inst / totalInstances) * 100).toFixed(2);
  const tr = stats.bySplit.train[cid];
  const va = stats.bySplit.val[cid];
  const te = stats.bySplit.test[cid];
  console.log(`Class ${cid} (${classNames[cid]}): instances=${inst} (${pct}%), images=${imgs} | train=${tr}, val=${va}, test=${te}`);
}
