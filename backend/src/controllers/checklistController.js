const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_CONFIGURABLE_CHECKLISTS = [
  // 1. PPE
  { id: 'chk-ppe-01', category: 'PPE', item: 'Safety Helmet (EN 397 / IS 2925) worn by all personnel', required: true, risk_weight: 'CRITICAL' },
  { id: 'chk-ppe-02', category: 'PPE', item: 'High-visibility retroreflective vest (Class 2/3) worn', required: true, risk_weight: 'HIGH' },
  { id: 'chk-ppe-03', category: 'PPE', item: 'Steel-toed safety footwear with puncture-resistant sole', required: true, risk_weight: 'HIGH' },
  { id: 'chk-ppe-04', category: 'PPE', item: 'Eye protection (goggles/face shield) during hot work or cutting', required: false, risk_weight: 'MEDIUM' },
  { id: 'chk-ppe-05', category: 'PPE', item: 'Heavy-duty cut-resistant gloves for rebar and masonry handling', required: false, risk_weight: 'MEDIUM' },

  // 2. Electrical Safety
  { id: 'chk-elec-01', category: 'Electrical Safety', item: 'Residual Current Device (ELCB / RCCB 30mA) operational on all DBs', required: true, risk_weight: 'CRITICAL' },
  { id: 'chk-elec-02', category: 'Electrical Safety', item: 'Double earthing provided for all DG sets and batching plant panels', required: true, risk_weight: 'HIGH' },
  { id: 'chk-elec-03', category: 'Electrical Safety', item: 'Cables routed overhead or protected with heavy-duty rubber ramps', required: false, risk_weight: 'MEDIUM' },

  // 3. Scaffolding & Heights
  { id: 'chk-scaff-01', category: 'Scaffolding', item: 'Base plates and sole boards installed on level, compacted ground', required: true, risk_weight: 'HIGH' },
  { id: 'chk-scaff-02', category: 'Scaffolding', item: 'Top rail (950-1150mm), mid-rail, and toe boards installed on all open edges', required: true, risk_weight: 'CRITICAL' },
  { id: 'chk-scaff-03', category: 'Scaffolding', item: 'Full body harness attached to 100% tie-off independent lifeline for work > 1.8m', required: true, risk_weight: 'CRITICAL' },

  // 4. Housekeeping
  { id: 'chk-house-01', category: 'Housekeeping', item: 'Walkways and primary evacuation corridors free of tripping hazards', required: true, risk_weight: 'MEDIUM' },
  { id: 'chk-house-02', category: 'Housekeeping', item: 'Nails bent or removed from shuttering timber immediately upon de-shuttering', required: false, risk_weight: 'MEDIUM' },

  // 5. Structural Condition
  { id: 'chk-struct-01', category: 'Structural Condition', item: 'Concrete cover thickness verified with cover meter before pouring', required: true, risk_weight: 'CRITICAL' },
  { id: 'chk-struct-02', category: 'Structural Condition', item: 'Rebar free of loose rust scales, oil, and grease coatings', required: true, risk_weight: 'HIGH' },
  { id: 'chk-struct-03', category: 'Structural Condition', item: 'Visual inspection reveals no honeycombing, cold joints, or unsealed fissures', required: true, risk_weight: 'CRITICAL' },

  // 6. Emergency Access & Fire
  { id: 'chk-emerg-01', category: 'Emergency Access', item: 'Fire extinguishers (ABC 6kg/CO2) inspected, tagged, and unblocked', required: true, risk_weight: 'HIGH' },
  { id: 'chk-emerg-02', category: 'Emergency Access', item: 'Emergency assembly point clearly signed and unobstructed', required: true, risk_weight: 'MEDIUM' },

  // 7. Site Hazards & Heavy Machinery
  { id: 'chk-haz-01', category: 'Site Hazards', item: '360° swing radius barricaded for excavators, cranes, and piling rigs', required: true, risk_weight: 'CRITICAL' },
  { id: 'chk-haz-02', category: 'Site Hazards', item: 'Reverse alarm and flashing beacon operational on all transit vehicles', required: true, risk_weight: 'HIGH' }
];

/**
 * Get Configurable Checklists
 * GET /api/checklists
 */
async function getChecklists(req, res) {
  try {
    const { category, site_id } = req.query;
    let items = db.getAll(TABLES.CHECKLIST_ITEMS);

    if (!items || items.length === 0) {
      DEFAULT_CONFIGURABLE_CHECKLISTS.forEach(def => {
        db.insert(TABLES.CHECKLIST_ITEMS, { ...def, is_active: true, created_at: new Date().toISOString() });
      });
      items = db.getAll(TABLES.CHECKLIST_ITEMS);
    }

    if (category) {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (site_id) {
      items = items.filter(i => !i.site_id || String(i.site_id) === String(site_id));
    }

    // Group by category
    const categoriesMap = {};
    items.forEach(item => {
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = [];
      }
      categoriesMap[item.category].push(item);
    });

    res.json({
      success: true,
      total_items: items.length,
      categories: Object.keys(categoriesMap),
      grouped: categoriesMap,
      data: items
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Add New Configurable Checklist Item
 * POST /api/checklists/item
 */
async function addChecklistItem(req, res) {
  try {
    const { category, item, required = false, risk_weight = 'MEDIUM', site_id } = req.body;

    if (!category || !item) {
      return res.status(400).json({ success: false, error: 'category and item text are required.' });
    }

    const newItem = {
      id: `chk-${uuidv4().slice(0, 8)}`,
      category,
      item,
      required: !!required,
      risk_weight: risk_weight.toUpperCase(),
      site_id: site_id || null,
      is_active: true,
      created_by: req.user?.id || 'admin',
      created_at: new Date().toISOString()
    };

    db.insert(TABLES.CHECKLIST_ITEMS, newItem);
    res.status(201).json({ success: true, message: 'Checklist item added.', data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update Checklist Item
 * PUT /api/checklists/item/:id
 */
async function updateChecklistItem(req, res) {
  try {
    const { id } = req.params;
    const existing = db.getById(TABLES.CHECKLIST_ITEMS, id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Checklist item not found.' });
    }

    const updated = db.update(TABLES.CHECKLIST_ITEMS, id, req.body);
    res.json({ success: true, message: 'Checklist item updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Delete Checklist Item
 * DELETE /api/checklists/item/:id
 */
async function deleteChecklistItem(req, res) {
  try {
    const { id } = req.params;
    const existing = db.getById(TABLES.CHECKLIST_ITEMS, id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Checklist item not found.' });
    }

    db.delete(TABLES.CHECKLIST_ITEMS, id);
    res.json({ success: true, message: 'Checklist item removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getChecklists,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
};
