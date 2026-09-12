const db = require('../config/db');
const { TABLES, SEVERITIES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

/**
 * Transparent Site Safety Score Calculation Engine
 */
function calculateSiteSafetyScore(siteId) {
  const site = db.getById(TABLES.SITES, siteId);
  if (!site) return null;

  const inspections = db.find(TABLES.INSPECTIONS, { site_id: siteId });
  const allDefects = db.getAll(TABLES.DEFECTS);
  const siteDefects = allDefects.filter(d => {
    if (d.site_id && String(d.site_id) === String(siteId)) return true;
    const insp = inspections.find(i => i.id === d.inspection_id);
    return insp && String(insp.site_id) === String(siteId);
  });

  const openDefects = siteDefects.filter(d => d.status !== 'CLOSED' && d.status !== 'RESOLVED');
  const critical = openDefects.filter(d => d.severity === SEVERITIES.CRITICAL).length;
  const high = openDefects.filter(d => d.severity === SEVERITIES.HIGH).length;
  const medium = openDefects.filter(d => d.severity === SEVERITIES.MEDIUM).length;
  const recurring = openDefects.filter(d => d.is_recurring).length;

  const passedInspections = inspections.filter(i => (i.compliance_score || 0) >= 80).length;

  let score = 100;
  const deductions = [];
  const bonuses = [];

  if (critical > 0) {
    const pts = critical * 15;
    score -= pts;
    deductions.push({
      reason: `${critical} Unresolved Critical Severity Defect${critical > 1 ? 's' : ''}`,
      severity: 'CRITICAL',
      points: -pts
    });
  }

  if (high > 0) {
    const pts = high * 8;
    score -= pts;
    deductions.push({
      reason: `${high} Open High Severity Defect${high > 1 ? 's' : ''}`,
      severity: 'HIGH',
      points: -pts
    });
  }

  if (medium > 0) {
    const pts = medium * 3;
    score -= pts;
    deductions.push({
      reason: `${medium} Open Medium Severity Defect${medium > 1 ? 's' : ''}`,
      severity: 'MEDIUM',
      points: -pts
    });
  }

  if (recurring > 0) {
    const pts = recurring * 10;
    score -= pts;
    deductions.push({
      reason: `${recurring} Recurring Issue${recurring > 1 ? 's' : ''} detected at same location`,
      severity: 'HIGH',
      points: -pts
    });
  }

  if (passedInspections > 0) {
    const pts = Math.min(25, passedInspections * 5);
    score += pts;
    bonuses.push({
      reason: `${passedInspections} Verified Compliant Inspection${passedInspections > 1 ? 's' : ''}`,
      points: +pts
    });
  }

  const finalScore = Math.min(100, Math.max(0, score));

  let grade = 'A';
  let badgeColor = '#10b981';
  if (finalScore < 50) {
    grade = 'CRITICAL RISK (F)';
    badgeColor = '#ef4444';
  } else if (finalScore < 70) {
    grade = 'ATTENTION REQUIRED (C)';
    badgeColor = '#f59e0b';
  } else if (finalScore < 85) {
    grade = 'MODERATE (B)';
    badgeColor = '#3b82f6';
  } else {
    grade = 'EXCELLENT (A)';
    badgeColor = '#10b981';
  }

  return {
    site_id: site.id,
    site_name: site.name,
    safety_score: finalScore,
    grade,
    badge_color: badgeColor,
    metrics: {
      open_critical: critical,
      open_high: high,
      open_medium: medium,
      recurring_issues: recurring,
      passed_inspections: passedInspections,
      total_site_defects: siteDefects.length
    },
    deductions,
    bonuses,
    calculated_at: new Date().toISOString()
  };
}

/**
 * Get All Infrastructure Sites
 */
async function getAllSites(req, res) {
  try {
    const sites = db.getAll(TABLES.SITES);
    const assets = db.getAll(TABLES.ASSETS);
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const defects = db.getAll(TABLES.DEFECTS);
    const users = db.getAll(TABLES.USERS);

    const enrichedSites = sites.map(site => {
      const siteAssets = assets.filter(a => a.site_id === site.id);
      const siteInspections = inspections.filter(i => i.site_id === site.id);
      const siteDefects = defects.filter(d => {
        if (d.site_id && String(d.site_id) === String(site.id)) return true;
        const insp = inspections.find(i => i.id === d.inspection_id);
        return insp && String(insp.site_id) === String(site.id);
      });
      const supervisor = users.find(u => u.id === site.supervisor_id);

      const openDefects = siteDefects.filter(d => d.status !== 'CLOSED' && d.status !== 'RESOLVED').length;
      const criticalDefects = siteDefects.filter(d => d.severity === 'CRITICAL' && d.status !== 'CLOSED').length;
      const safety = calculateSiteSafetyScore(site.id);

      return {
        ...site,
        supervisor_name: supervisor ? supervisor.name : 'Unassigned',
        asset_count: siteAssets.length,
        total_inspections: siteInspections.length,
        open_defects_count: openDefects,
        critical_defects_count: criticalDefects,
        safety_score: safety ? safety.safety_score : 85,
        safety_grade: safety ? safety.grade : 'B'
      };
    });

    res.json({ success: true, count: enrichedSites.length, data: enrichedSites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Single Site by ID
 */
async function getSiteById(req, res) {
  try {
    const { id } = req.params;
    const site = db.getById(TABLES.SITES, id);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found.' });
    }

    const assets = db.find(TABLES.ASSETS, { site_id: site.id });
    const inspections = db.find(TABLES.INSPECTIONS, { site_id: site.id });
    const safety = calculateSiteSafetyScore(site.id);

    res.json({
      success: true,
      data: {
        ...site,
        assets,
        inspections,
        safety_score_details: safety
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Transparent Site Safety Score Details
 * GET /api/sites/:id/safety-score
 */
async function getSiteSafetyScore(req, res) {
  try {
    const { id } = req.params;
    const safetyDetails = calculateSiteSafetyScore(id);
    if (!safetyDetails) {
      return res.status(404).json({ success: false, error: 'Site not found.' });
    }

    res.json({
      success: true,
      data: safetyDetails
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Verify and Resolve QR Code for Site/Zone Inspection
 * POST /api/sites/verify-qr
 */
async function verifyQrCode(req, res) {
  try {
    const { qr_code } = req.body;
    if (!qr_code) {
      return res.status(400).json({ success: false, error: 'qr_code string is required.' });
    }

    const sites = db.getAll(TABLES.SITES);
    const zones = db.getAll(TABLES.ZONES) || [];

    // Parse potential QR format: "INSPECTRA:SITE:SITE_ID:ZONE:ZONE_ID" or plain ID/Code
    let matchedSite = null;
    let matchedZone = null;

    const raw = String(qr_code).trim();

    if (raw.startsWith('INSPECTRA:')) {
      const parts = raw.split(':');
      const siteKey = parts[2];
      const zoneKey = parts[4];

      matchedSite = sites.find(s => s.id === siteKey || s.code === siteKey);
      if (zoneKey) {
        matchedZone = zones.find(z => z.id === zoneKey || z.code === zoneKey);
      }
    } else {
      matchedSite = sites.find(s => s.id === raw || s.code === raw || s.name.toLowerCase().includes(raw.toLowerCase()));
      matchedZone = zones.find(z => z.id === raw || z.code === raw);
    }

    if (!matchedSite && !matchedZone) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or unregistered QR code. Please scan an authorized Inspectra site QR badge.'
      });
    }

    if (!matchedSite && matchedZone) {
      matchedSite = sites.find(s => s.id === matchedZone.site_id);
    }

    res.json({
      success: true,
      message: 'QR code verified successfully.',
      data: {
        qr_code: raw,
        site: matchedSite,
        zone: matchedZone || null,
        verified_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Create New Infrastructure Site
 */
async function createSite(req, res) {
  try {
    const { name, code, city, state, geo_fence_lat, geo_fence_lng, geo_fence_radius_meters, supervisor_id } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Site name and code are required.' });
    }

    const newSite = {
      id: `site-${uuidv4().slice(0, 8)}`,
      name,
      code: code.toUpperCase(),
      city: city || 'New Delhi',
      state: state || 'Delhi',
      geo_fence_lat: parseFloat(geo_fence_lat) || 28.6139,
      geo_fence_lng: parseFloat(geo_fence_lng) || 77.2090,
      geo_fence_radius_meters: parseInt(geo_fence_radius_meters, 10) || 500,
      supervisor_id: supervisor_id || null,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    db.insert(TABLES.SITES, newSite);
    res.status(201).json({ success: true, message: 'Site registered successfully.', data: newSite });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update Existing Site
 */
async function updateSite(req, res) {
  try {
    const { id } = req.params;
    const existing = db.getById(TABLES.SITES, id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Site not found.' });
    }

    const updated = db.update(TABLES.SITES, id, req.body);
    res.json({ success: true, message: 'Site updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get Site Geofence Boundary
 * GET /api/sites/:id/geofence
 */
async function getSiteGeofence(req, res) {
  try {
    const { id } = req.params;
    const site = db.getById(TABLES.SITES, id);
    if (!site) return res.status(404).json({ success: false, error: 'Site not found.' });
    res.json({
      success: true,
      data: {
        site_id: site.id,
        name: site.name,
        lat: site.geo_fence_lat,
        lng: site.geo_fence_lng,
        radius_meters: site.geo_fence_radius_meters || 500
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllSites,
  getSiteById,
  getSiteSafetyScore,
  getSiteGeofence,
  verifyQrCode,
  createSite,
  updateSite,
  calculateSiteSafetyScore
};

