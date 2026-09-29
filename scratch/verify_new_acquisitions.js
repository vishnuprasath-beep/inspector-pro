const fs = require('fs');
const path = require('path');

const base = 'yolo_pipeline/raw_defect_data';
const datasets = ['honeycombing_lam_z3bxb', 'concrete_surface_damage_deep_zqmpp'];

const report = {};

datasets.forEach(dsName => {
  const dsDir = path.join(base, dsName);
  report[dsName] = {
    exists: fs.existsSync(dsDir),
    splits: {},
    totalImages: 0,
    totalLabels: 0,
    unpairedImages: 0,
    unpairedLabels: 0,
    emptyLabels: 0,
    corruptImages: 0,
    totalAnnotations: 0,
    classCounts: {},
    annotationFormat: { bbox5: 0, polygonGt5: 0, malformed: 0 },
    dataYaml: null
  };

  // Read data.yaml
  const yamlPath = path.join(dsDir, 'data.yaml');
  if (fs.existsSync(yamlPath)) {
    report[dsName].dataYaml = fs.readFileSync(yamlPath, 'utf8');
  }

  // Walk all splits
  ['train', 'valid', 'val', 'test'].forEach(split => {
    let imgDir = path.join(dsDir, split, 'images');
    let lblDir = path.join(dsDir, split, 'labels');
    if (!fs.existsSync(imgDir) && fs.existsSync(path.join(dsDir, 'images', split))) {
      imgDir = path.join(dsDir, 'images', split);
      lblDir = path.join(dsDir, 'labels', split);
    }

    if (fs.existsSync(imgDir)) {
      const imgs = fs.readdirSync(imgDir).filter(f => f.match(/\.(jpg|jpeg|png|bmp|webp)$/i));
      const lbls = fs.existsSync(lblDir) ? fs.readdirSync(lblDir).filter(f => f.endsWith('.txt')) : [];

      const imgStems = new Set(imgs.map(f => path.parse(f).name));
      const lblStems = new Set(lbls.map(f => path.parse(f).name));

      let unpImg = 0;
      let unpLbl = 0;
      imgStems.forEach(s => { if (!lblStems.has(s)) unpImg++; });
      lblStems.forEach(s => { if (!imgStems.has(s)) unpLbl++; });

      report[dsName].splits[split] = {
        images: imgs.length,
        labels: lbls.length,
        unpairedImages: unpImg,
        unpairedLabels: unpLbl
      };

      report[dsName].totalImages += imgs.length;
      report[dsName].totalLabels += lbls.length;
      report[dsName].unpairedImages += unpImg;
      report[dsName].unpairedLabels += unpLbl;

      // Check image sizes
      imgs.forEach(f => {
        try {
          const sz = fs.statSync(path.join(imgDir, f)).size;
          if (sz === 0) report[dsName].corruptImages++;
        } catch {
          report[dsName].corruptImages++;
        }
      });

      // Parse labels
      lbls.forEach(f => {
        const full = path.join(lblDir, f);
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          report[dsName].emptyLabels++;
        }
        lines.forEach(l => {
          report[dsName].totalAnnotations++;
          const parts = l.split(/\s+/);
          if (parts.length === 5) {
            report[dsName].annotationFormat.bbox5++;
          } else if (parts.length > 5) {
            report[dsName].annotationFormat.polygonGt5++;
          } else {
            report[dsName].annotationFormat.malformed++;
          }

          const clsId = parseInt(parts[0], 10);
          if (!isNaN(clsId)) {
            report[dsName].classCounts[clsId] = (report[dsName].classCounts[clsId] || 0) + 1;
          }
        });
      });
    }
  });
});

console.log(JSON.stringify(report, null, 2));
