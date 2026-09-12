/**
 * Geofencing Service using Haversine Geodesic Distance
 */

/**
 * Calculates distance between two latitude/longitude points in meters
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in meters
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place
}

/**
 * Verifies whether a given coordinate falls within the site geofence radius
 * @param {number} inspectorLat 
 * @param {number} inspectorLng 
 * @param {number} siteLat 
 * @param {number} siteLng 
 * @param {number} radiusMeters 
 * @returns {Object} verification result
 */
function verifyGeofence(inspectorLat, inspectorLng, siteLat, siteLng, radiusMeters = 500) {
  if (inspectorLat == null || inspectorLng == null || siteLat == null || siteLng == null) {
    return {
      isValid: false,
      distanceMeters: null,
      allowedRadiusMeters: radiusMeters,
      reason: 'Missing geographic coordinates for calculation.'
    };
  }

  const distance = calculateDistanceMeters(
    Number(inspectorLat),
    Number(inspectorLng),
    Number(siteLat),
    Number(siteLng)
  );

  const isValid = distance <= radiusMeters;

  return {
    isValid,
    distanceMeters: distance,
    allowedRadiusMeters: radiusMeters,
    varianceMeters: isValid ? 0 : Math.round(distance - radiusMeters),
    message: isValid
      ? `Verified: Inspector is within geofence perimeter (${distance}m from site origin).`
      : `Warning: Out of bounds! Inspector is ${distance}m away (exceeds allowed radius of ${radiusMeters}m).`
  };
}

module.exports = {
  calculateDistanceMeters,
  verifyGeofence
};
