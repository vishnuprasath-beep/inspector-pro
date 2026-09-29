const fs = require('fs');
const path = require('path');

const os = require('os');

let dataDir = path.resolve(__dirname, '../../data');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.accessSync(dataDir, fs.constants.W_OK);
} catch (e) {
  // Cloud serverless / read-only filesystem fallback
  dataDir = path.join(os.tmpdir(), 'inspectra_data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const dbFilePath = path.join(dataDir, 'inspection_store.json');

// Table collection templates
const initialSchema = {
  users: [],
  inspectors: [],
  sites: [],
  assets: [],
  inspection_templates: [],
  checklists: [],
  inspections: [],
  inspection_evidence: [],
  gps_logs: [],
  defects: [],
  corrective_actions: [],
  notifications: [],
  audit_logs: [],
  reinspections: [],
  cameras: [],
  ai_alerts: [],
  live_shares: [],
  live_share_requests: [],
  live_share_history: [],
  voice_sessions: [],
  checklist_items: [],
  ai_model_versions: [],
  verified_ai_samples: [],
  offline_sync_records: [],
  qr_codes: [],
  live_share_signals: []
};

class Database {
  constructor() {
    this.filePath = dbFilePath;
    this.data = { ...initialSchema };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...initialSchema, ...parsed };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing clean state:', err.message);
      this.data = { ...initialSchema };
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error saving database file:', err.message);
    }
  }

  getAll(table) {
    return this.data[table] || [];
  }

  getById(table, id) {
    const records = this.getAll(table);
    return records.find(r => String(r.id) === String(id)) || null;
  }

  find(table, predicate) {
    const records = this.getAll(table);
    if (typeof predicate === 'function') {
      return records.filter(predicate);
    }
    if (typeof predicate === 'object') {
      return records.filter(item => {
        return Object.entries(predicate).every(([k, v]) => String(item[k]) === String(v));
      });
    }
    return records;
  }

  findOne(table, predicate) {
    const results = this.find(table, predicate);
    return results.length > 0 ? results[0] : null;
  }

  insert(table, item) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    const record = {
      ...item,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    };
    this.data[table].push(record);
    this.save();
    return record;
  }

  update(table, id, updates) {
    const records = this.getAll(table);
    const index = records.findIndex(r => String(r.id) === String(id));
    if (index === -1) return null;

    const existing = records[index];
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    records[index] = updated;
    this.save();
    return updated;
  }

  delete(table, id) {
    const records = this.getAll(table);
    const index = records.findIndex(r => String(r.id) === String(id));
    if (index === -1) return false;

    records.splice(index, 1);
    this.save();
    return true;
  }

  count(table, filter = null) {
    if (!filter) return (this.data[table] || []).length;
    return this.find(table, filter).length;
  }

  reset() {
    this.data = { ...initialSchema };
    this.save();
  }
}

const db = new Database();

module.exports = db;
