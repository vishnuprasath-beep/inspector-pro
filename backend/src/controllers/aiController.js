const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');
const { runYoloInference, getYoloModelStatus } = require('../services/yoloInferenceService');
const { SAFETY_RULES } = require('../config/safetyRules');
const { predictMaintenanceRisk, recommendInspectionFrequency } = require('../services/aiService');

/**
 * Real YOLOv8 Computer Vision Inference Endpoint
 * POST /api/ai/yolo/detect
 */
async function detectYolo(req, res) {
  try {
    const { image, conf_threshold = 0.25, iou_threshold = 0.45, source = 'INSPECTOR_APP', site_id, zone_id } = req.body;
    let imageInput = image;

    // Handle file upload via Multer if provided
    if (req.file && req.file.buffer) {
      imageInput = req.file.buffer;
    }

    if (!imageInput) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please supply an image buffer, base64 string, or data URL.'
      });
    }

    const inferenceResult = await runYoloInference(imageInput, {
      confThreshold: parseFloat(conf_threshold),
      iouThreshold: parseFloat(iou_threshold),
      source,
      site_id,
      zone_id
    });

    res.json(inferenceResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Human Verification of AI Predictions
 * POST /api/ai/verify
 */
async function verifyDetection(req, res) {
  try {
    const { detection_id, class_name, confidence, is_correct, feedback, inspection_id, site_id } = req.body;

    if (typeof is_correct !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Field is_correct (boolean) is required.' });
    }

    const sample = {
      id: `sample-${uuidv4().slice(0, 8)}`,
      detection_id: detection_id || `det-${uuidv4().slice(0, 8)}`,
      class_name: class_name || 'UNKNOWN',
      confidence: confidence || 0,
      is_correct, // true: Confirmed Detection, false: False Positive
      feedback: feedback || (is_correct ? 'Confirmed accurate on-site' : 'Marked as false detection'),
      verifier_id: req.user?.id || 'usr-system',
      verifier_name: req.user?.name || 'Authorized Verifier',
      verifier_role: req.user?.role || 'INSPECTOR',
      inspection_id: inspection_id || null,
      site_id: site_id || null,
      verified_at: new Date().toISOString()
    };

    db.insert(TABLES.VERIFIED_AI_SAMPLES, sample);

    res.json({
      success: true,
      message: is_correct ? 'AI Detection confirmed and cataloged.' : 'False detection recorded for candidate retraining.',
      data: sample
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get AI Model Live Status & Telemetry
 * GET /api/ai/model-status
 */
async function getModelStatus(req, res) {
  try {
    const status = getYoloModelStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Model Registry & Version History
 * GET /api/ai/models
 */
async function getModelVersions(req, res) {
  try {
    let versions = db.getAll(TABLES.AI_MODEL_VERSIONS);
    if (!versions || versions.length === 0) {
      // Seed initial production model record
      const defaultModel = {
        id: 'mdl-v1.0-ppe',
        model_name: 'construction_safety_yolov8.onnx',
        version: 'v1.0',
        architecture: 'YOLOv8-Medium (ONNX Runtime Engine)',
        classes_count: 14,
        classes: [
          'Fall-Detected', 'Gloves', 'Goggles', 'Hardhat', 'Ladder', 'Mask', 'NO-Gloves',
          'NO-Goggles', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 'Person', 'Safety Cone', 'Safety Vest'
        ],
        dataset_name: 'Personal Protective Equipment Combined Model v4',
        dataset_license: 'CC-BY-4.0',
        dataset_version: 'v4.0',
        status: 'ACTIVE',
        trained_at: '2026-02-18T11:35:05.000Z',
        mAP50: 0.836,
        precision: 0.852,
        recall: 0.814,
        is_production: true
      };
      db.insert(TABLES.AI_MODEL_VERSIONS, defaultModel);
      versions = [defaultModel];
    }

    res.json({
      success: true,
      data: versions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Verified AI Training Samples
 * GET /api/ai/verified-samples
 */
async function getVerifiedSamples(req, res) {
  try {
    const samples = db.getAll(TABLES.VERIFIED_AI_SAMPLES) || [];
    const total = samples.length;
    const confirmed = samples.filter(s => s.is_correct).length;
    const falsePositives = total - confirmed;
    const accuracyRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 100.0;

    res.json({
      success: true,
      summary: {
        total_samples: total,
        confirmed_detections: confirmed,
        false_detections: falsePositives,
        accuracy_percentage: parseFloat(accuracyRate)
      },
      data: samples
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Institutional Safety Severity Rules
 * GET /api/ai/severity-rules
 */
async function getSeverityRules(req, res) {
  try {
    res.json({
      success: true,
      data: SAFETY_RULES
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Backwards-compatible Defect Detection Endpoint
 * POST /api/ai/detect-defects
 */
async function detectDefects(req, res) {
  try {
    const { image, image_url } = req.body;
    const input = image || image_url;
    if (input) {
      const yoloResult = await runYoloInference(input, { confThreshold: 0.25 });
      return res.json({
        success: true,
        data: {
          processed: true,
          engine: yoloResult.model.name,
          analyzedAt: new Date().toISOString(),
          total_detections: yoloResult.total_detections,
          primaryFinding: yoloResult.detections[0]?.class || 'No Defect Detected',
          confidence: yoloResult.detections[0]?.confidence || 0,
          recommendedSeverity: yoloResult.detections[0]?.severity || 'COMPLIANT',
          boundingBox: yoloResult.detections[0]?.box ? [
            yoloResult.detections[0].box.x1,
            yoloResult.detections[0].box.y1,
            yoloResult.detections[0].box.width,
            yoloResult.detections[0].box.height
          ] : null,
          mitigationAdvice: yoloResult.detections[0]?.recommended_action || 'Area complies with safety standards.',
          allDetections: yoloResult.detections
        }
      });
    }

    res.json({
      success: true,
      data: {
        processed: true,
        primaryFinding: 'No Defect Detected',
        confidence: 0,
        recommendedSeverity: 'COMPLIANT',
        allDetections: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Predictive Maintenance Failure Risk Endpoint
 */
async function predictiveMaintenance(req, res) {
  try {
    const { asset_id } = req.body;
    let asset = asset_id ? db.getById(TABLES.ASSETS, asset_id) : db.getAll(TABLES.ASSETS)[0];
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const defects = db.getAll(TABLES.DEFECTS);
    const forecast = predictMaintenanceRisk(asset, inspections, defects);
    res.json({ success: true, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Smart Inspection Frequency Recommendation Endpoint
 */
async function frequencyRecommendations(req, res) {
  try {
    const { site_id } = req.body;
    let site = site_id ? db.getById(TABLES.SITES, site_id) : db.getAll(TABLES.SITES)[0];
    const inspections = db.find(TABLES.INSPECTIONS, { site_id: site.id });
    const allDefects = db.getAll(TABLES.DEFECTS);
    const siteDefects = allDefects.filter(d => inspections.some(i => i.id === d.inspection_id));
    const recommendation = recommendInspectionFrequency(site, inspections, siteDefects);
    res.json({ success: true, data: recommendation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  detectYolo,
  verifyDetection,
  getModelStatus,
  getModelVersions,
  getVerifiedSamples,
  getSeverityRules,
  detectDefects,
  predictiveMaintenance,
  frequencyRecommendations
};
