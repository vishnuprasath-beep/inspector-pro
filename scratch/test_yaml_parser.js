const fs = require('fs');
const path = require('path');

function parseDataYamlNames(content) {
  // Try inline list: names: ['a', 'b']
  const inlineMatch = content.match(/names:\s*\[(.*?)\]/s);
  if (inlineMatch) {
    const rawItems = inlineMatch[1].split(',');
    return rawItems.map(item => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }

  // Try multiline:
  const lines = content.split(/\r?\n/);
  const names = [];
  let inNames = false;
  let isMap = false;
  const mapObj = {};

  for (let line of lines) {
    if (/^names:\s*$/.test(line.trim())) {
      inNames = true;
      continue;
    }
    if (inNames) {
      // Check if another top-level key started
      if (/^[a-zA-Z0-9_-]+:/.test(line) && !line.startsWith(' ') && !line.startsWith('\t')) {
        break;
      }
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('-')) {
        names.push(trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim());
      } else {
        const kvMatch = trimmed.match(/^(\d+):\s*(.*)$/);
        if (kvMatch) {
          isMap = true;
          mapObj[parseInt(kvMatch[1], 10)] = kvMatch[2].replace(/^['"]|['"]$/g, '').trim();
        }
      }
    }
  }

  if (isMap) {
    const sortedKeys = Object.keys(mapObj).map(Number).sort((a, b) => a - b);
    return sortedKeys.map(k => mapObj[k]);
  }
  return names;
}

const base = 'yolo_pipeline/raw_defect_data';
const datasets = ['crack', 'spalling_rebar', 'pothole'];
datasets.forEach(ds => {
  const p = path.join(base, ds, 'data.yaml');
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    console.log(ds, '->', parseDataYamlNames(content));
  }
});
