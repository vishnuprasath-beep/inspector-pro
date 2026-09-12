const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { verifyGeofence } = require('../services/geofenceService');
const { v4: uuidv4 } = require('uuid');

/**
 * Log GPS Coordinates from Mobile Field Device
 */
async function logGps(req, res) {
  try {
    const { inspector_id, inspection_id, site_id, lat, lng, accuracy = 10.0, altitude, speed } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, error: 'Latitude and Longitude are required.' });
    }

    let isWithin = false;
    let distanceToSite = null;

    if (site_id) {
      const site = db.getById(TABLES.SITES, site_id);
      if (site) {
        const geoCheck = verifyGeofence(lat, lng, site.geo_fence_lat, site.geo_fence_lng, site.geo_fence_radius_meters);
        isWithin = geoCheck.isValid;
        distanceToSite = geoCheck.distanceMeters;
      }
    }

    const logEntry = {
      id: `gps-${uuidv4()}`,
      inspector_id: inspector_id || 'insp-01',
      inspection_id: inspection_id || null,
      lat: Number(lat),
      lng: Number(lng),
      accuracy: Number(accuracy),
      altitude: altitude ? Number(altitude) : null,
      speed: speed ? Number(speed) : null,
      is_within_geofence: isWithin,
      distance_to_site_meters: distanceToSite,
      timestamp: new Date().toISOString()
    };

    db.insert(TABLES.GPS_LOGS, logEntry);

    // Update inspector's live telemetry in inspectors table
    if (inspector_id) {
      db.update(TABLES.INSPECTORS, inspector_id, {
        current_lat: Number(lat),
        current_lng: Number(lng),
        last_active_at: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'GPS coordinates logged.',
      data: logEntry
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Verify Geofence API endpoint
 */
async function verifyGeofenceEndpoint(req, res) {
  try {
    const { site_id, lat, lng } = req.body;

    if (!site_id || lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: 'site_id, lat, and lng are required parameters.'
      });
    }

    const site = db.getById(TABLES.SITES, site_id);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found.' });
    }

    const result = verifyGeofence(
      Number(lat),
      Number(lng),
      site.geo_fence_lat,
      site.geo_fence_lng,
      site.geo_fence_radius_meters
    );

    res.json({
      success: true,
      data: {
        ...result,
        site: {
          id: site.id,
          name: site.name,
          centerLat: site.geo_fence_lat,
          centerLng: site.geo_fence_lng,
          radiusMeters: site.geo_fence_radius_meters
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get GPS Breadcrumbs for Inspector or Inspection
 */
async function getGpsLogs(req, res) {
  try {
    const { inspector_id, inspection_id, limit = 100 } = req.query;
    let logs = db.getAll(TABLES.GPS_LOGS);

    if (inspector_id) {
      logs = logs.filter(l => l.inspector_id === inspector_id);
    }
    if (inspection_id) {
      logs = logs.filter(l => l.inspection_id === inspection_id);
    }

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, count: logs.length, data: logs.slice(0, Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Auto-Locate Nearest Destination
 * POST /api/gps/locate-nearest
 */
async function locateNearestDestination(req, res) {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, error: 'lat and lng are required.' });
    }

    const sites = db.getAll(TABLES.SITES);
    if (!sites || sites.length === 0) {
      return res.status(404).json({ success: false, error: 'No sites found in database.' });
    }

    let nearest = null;
    let minDistance = Infinity;

    sites.forEach(site => {
      const sLat = site.geo_fence_lat ?? site.latitude;
      const sLng = site.geo_fence_lng ?? site.longitude;
      if (sLat != null && sLng != null) {
        const check = verifyGeofence(Number(lat), Number(lng), Number(sLat), Number(sLng), site.geo_fence_radius_meters || 600);
        if (check.distanceMeters < minDistance) {
          minDistance = check.distanceMeters;
          nearest = {
            site: {
              id: site.id,
              name: site.name,
              code: site.code,
              latitude: sLat,
              longitude: sLng,
              radiusMeters: site.geo_fence_radius_meters || 600
            },
            distanceMeters: check.distanceMeters,
            isWithinGeofence: check.isValid,
            allowedRadiusMeters: site.geo_fence_radius_meters || 600
          };
        }
      }
    });

    res.json({
      success: true,
      data: nearest
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get All Destination Coordinates
 * GET /api/gps/destinations
 */
async function getDestinations(req, res) {
  try {
    const sites = db.getAll(TABLES.SITES);
    const destinations = sites.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      latitude: s.geo_fence_lat ?? s.latitude,
      longitude: s.geo_fence_lng ?? s.longitude,
      radiusMeters: s.geo_fence_radius_meters || 600,
      healthScore: s.health_score || 88,
      status: s.status || 'ACTIVE'
    }));

    res.json({
      success: true,
      count: destinations.length,
      data: destinations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  logGps,
  verifyGeofenceEndpoint,
  getGpsLogs,
  locateNearestDestination,
  getDestinations
};

