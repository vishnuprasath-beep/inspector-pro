const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { detectDefectsFromImage } = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload Evidence Photo with GPS & AI Pre-analysis
 */
async function uploadEvidence(req, res) {
  try {
    const { inspection_id, checklist_item_id, caption, gps_lat, gps_lng, run_ai_analysis = true } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided in upload.' });
    }

    const fileRelativePath = `/uploads/${req.file.filename}`;
    let aiResult = { processed: false };

    if (String(run_ai_analysis) === 'true') {
      try {
        aiResult = await detectDefectsFromImage(fileRelativePath, 'Civil');
      } catch (e) {
        console.warn('[AI] Optional AI scan skipped:', e.message);
      }
    }

    const evidenceRecord = {
      id: `ev-${uuidv4().slice(0, 8)}`,
      inspection_id: inspection_id || null,
      checklist_item_id: checklist_item_id || null,
      file_path: fileRelativePath,
      file_type: req.file.mimetype,
      file_size_kb: Math.round(req.file.size / 1024),
      caption: caption || 'Field Inspection Photograph',
      gps_lat: gps_lat ? Number(gps_lat) : null,
      gps_lng: gps_lng ? Number(gps_lng) : null,
      ai_detected_defect: aiResult.confidence > 0.7,
      ai_confidence: aiResult.confidence || 0.0,
      ai_analysis_tags: aiResult.primaryFinding ? [aiResult.primaryFinding] : [],
      ai_meta: aiResult,
      timestamp: new Date().toISOString()
    };

    db.insert(TABLES.INSPECTION_EVIDENCE, evidenceRecord);

    res.status(201).json({
      success: true,
      message: 'Evidence image uploaded and logged successfully.',
      data: evidenceRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Evidence for an Inspection
 */
async function getEvidenceByInspection(req, res) {
  try {
    const { inspectionId } = req.params;
    const evidence = db.find(TABLES.INSPECTION_EVIDENCE, { inspection_id: inspectionId });

    res.json({ success: true, count: evidence.length, data: evidence });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  uploadEvidence,
  getEvidenceByInspection
};
