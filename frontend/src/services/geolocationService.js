/**
 * Inspectra Pro — Hardware GPS Geolocation & Spatial Telemetry Service
 * ====================================================================
 * Features:
 * 1. Direct hardware browser GPS acquisition via navigator.geolocation.getCurrentPosition
 * 2. Continuous real-time GNSS watch position
 * 3. High-accuracy Haversine distance & compass bearing calculation
 * 4. Human-readable reverse-geocoding (Nominatim OpenStreetMap + fallback)
 * 5. Nearest infrastructure destination resolver
 */

/**
 * Checks the browser's Geolocation Permission state
 * @returns {Promise<'granted'|'prompt'|'denied'|'unknown'>}
 */
export async function checkGpsPermission() {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state; // 'granted', 'prompt', or 'denied'
  } catch (err) {
    return 'unknown';
  }
}

/**
 * Actively requests hardware GPS coordinates from the device
 * This triggers the native browser permission dialog if unprompted.
 * @param {PositionOptions} options
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, altitude: number|null, speed: number|null, timestamp: number}>}
 */
export function requestDeviceGps(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GEOLOCATION_UNSUPPORTED: Your browser or device does not support the Geolocation API.'));
      return;
    }

    const highAccuracyOptions = {
      enableHighAccuracy: true, // Request GPS hardware satellite lock
      timeout: 5000,            // Fast 5-second attempt before fallback
      maximumAge: 10000,
      ...options
    };

    const coarseOptions = {
      enableHighAccuracy: false, // Fallback to cellular / Wi-Fi network positioning
      timeout: 10000,           // 10 seconds for network fix
      maximumAge: 60000,        // Allow cached recent position
      ...options
    };

    // Attempt 1: High accuracy satellite GNSS
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy * 10) / 10,
          altitude: position.coords.altitude ? Math.round(position.coords.altitude * 10) / 10 : null,
          speed: position.coords.speed ? Math.round(position.coords.speed * 10) / 10 : null,
          timestamp: position.timestamp,
          mode: 'GNSS_HIGH_PRECISION'
        });
      },
      (error) => {
        // If high accuracy times out or position unavailable (e.g. indoors on mobile), attempt coarse fallback immediately
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          console.warn('[GPS Service] High accuracy satellite lock timed out. Engaging fast cellular/Wi-Fi positioning fallback...');
          navigator.geolocation.getCurrentPosition(
            (coarsePos) => {
              resolve({
                latitude: coarsePos.coords.latitude,
                longitude: coarsePos.coords.longitude,
                accuracy: Math.round(coarsePos.coords.accuracy * 10) / 10,
                altitude: coarsePos.coords.altitude ? Math.round(coarsePos.coords.altitude * 10) / 10 : null,
                speed: coarsePos.coords.speed ? Math.round(coarsePos.coords.speed * 10) / 10 : null,
                timestamp: coarsePos.timestamp,
                mode: 'NETWORK_CELLULAR_FALLBACK'
              });
            },
            (coarseError) => {
              let reason = 'UNKNOWN_ERROR';
              let userMessage = 'Unable to retrieve your location.';
              if (coarseError.code === coarseError.PERMISSION_DENIED) {
                reason = 'PERMISSION_DENIED';
                userMessage = 'Location access was denied. Please allow location permissions in your browser address bar.';
              } else if (coarseError.code === coarseError.TIMEOUT) {
                reason = 'TIMEOUT';
                userMessage = 'GPS request timed out. Please check location permissions and mobile data.';
              } else {
                reason = 'POSITION_UNAVAILABLE';
                userMessage = 'Location is currently unavailable. Please verify device location toggle is on.';
              }
              const err = new Error(userMessage);
              err.code = reason;
              reject(err);
            },
            coarseOptions
          );
          return;
        }

        // If permission denied, reject directly
        let reason = 'PERMISSION_DENIED';
        let userMessage = 'Location access was denied. Please allow location permissions in your browser address bar.';
        const err = new Error(userMessage);
        err.code = reason;
        reject(err);
      },
      highAccuracyOptions
    );
  });
}

/**
 * Starts continuous GNSS tracking
 * @param {Function} onLocation 
 * @param {Function} onError 
 * @param {PositionOptions} options 
 * @returns {number|null} watchId
 */
export function watchDeviceGps(onLocation, onError, options = {}) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error('GEOLOCATION_UNSUPPORTED'));
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 2000,
    ...options
  };

  return navigator.geolocation.watchPosition(
    (pos) => {
      onLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy * 10) / 10,
        speed: pos.coords.speed,
        timestamp: pos.timestamp
      });
    },
    (err) => {
      if (onError) onError(err);
    },
    defaultOptions
  );
}

/**
 * Stops continuous GNSS tracking
 * @param {number} watchId 
 */
export function clearGpsWatch(watchId) {
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Calculate Great-Circle Haversine distance between two coordinates
 * @returns {number} distance in meters
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculate compass bearing from location 1 to location 2
 * @returns {{degrees: number, cardinal: string}}
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const degrees = Math.round(((θ * 180) / Math.PI + 360) % 360);

  const cardinals = ['North', 'North-Northeast', 'Northeast', 'East-Northeast', 'East', 'East-Southeast', 'Southeast', 'South-Southeast', 'South', 'South-Southwest', 'Southwest', 'West-Southwest', 'West', 'West-Northwest', 'Northwest', 'North-Northwest'];
  const index = Math.round(degrees / 22.5) % 16;
  return { degrees, cardinal: cardinals[index] };
}

/**
 * Human-readable Reverse Geocoding
 * Uses OpenStreetMap Nominatim with a high-speed fallback lookup
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<string>} e.g. "Guindy, Chennai, Tamil Nadu"
 */
export async function reverseGeocodeLocation(lat, lng) {
  if (lat == null || lng == null) return 'Unknown Location';

  // 1. Try OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 sec timeout
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.town || addr.village;
        const city = addr.city || addr.state_district || addr.county;
        const state = addr.state;
        const parts = [locality, city, state].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      if (data && data.display_name) {
        const parts = data.display_name.split(',').slice(0, 3).map(s => s.trim());
        return parts.join(', ');
      }
    }
  } catch (err) {
    // Network timeout or blocked CORS - proceed to smart heuristic fallback
  }

  // 2. Intelligent Geographic Region Fallback for Indian Coordinates
  return approximateIndianRegion(lat, lng);
}

/**
 * Approximate Region fallback for Indian coordinates
 */
function approximateIndianRegion(lat, lng) {
  // Tamil Nadu: ~8.0 to ~13.5 N, ~76.0 to ~80.5 E
  if (lat >= 12.8 && lat <= 13.3 && lng >= 80.0 && lng <= 80.4) {
    return 'Chennai Metropolitan Area, Tamil Nadu';
  }
  if (lat >= 10.8 && lat <= 11.2 && lng >= 76.8 && lng <= 77.2) {
    return 'Coimbatore District, Tamil Nadu';
  }
  if (lat >= 9.8 && lat <= 10.1 && lng >= 78.0 && lng <= 78.3) {
    return 'Madurai District, Tamil Nadu';
  }
  if (lat >= 8.0 && lat <= 13.5 && lng >= 76.0 && lng <= 80.5) {
    return 'Tamil Nadu Region';
  }
  // NCR / Delhi: ~28.4 to ~28.9 N, ~76.8 to ~77.4 E
  if (lat >= 28.4 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) {
    return 'National Capital Region (Delhi/NCR)';
  }
  // Maharashtra / Mumbai: ~18.8 to ~19.3 N, ~72.7 to ~73.1 E
  if (lat >= 18.8 && lat <= 19.3 && lng >= 72.7 && lng <= 73.1) {
    return 'Mumbai Metropolitan Region, Maharashtra';
  }
  // Karnataka / Bengaluru: ~12.8 to ~13.2 N, ~77.4 to ~77.8 E
  if (lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) {
    return 'Bengaluru Urban, Karnataka';
  }
  // Nagpur / NH-44: ~21.0 to ~21.3 N, ~79.0 to ~79.2 E
  if (lat >= 21.0 && lat <= 21.3 && lng >= 79.0 && lng <= 79.2) {
    return 'Nagpur Overpass Zone, Maharashtra';
  }
  // Rajasthan / Bhadla: ~27.3 to ~27.8 N, ~71.7 to ~72.2 E
  if (lat >= 27.3 && lat <= 27.8 && lng >= 71.7 && lng <= 72.2) {
    return 'Phalodi / Bhadla Solar Zone, Rajasthan';
  }

  return `Geographic Coordinates (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
}

/**
 * Finds the closest destination from an array of sites
 */
export function findClosestDestination(userCoords, sites = []) {
  if (!userCoords || !sites || sites.length === 0) return null;
  let closest = null;
  let minDistance = Infinity;

  sites.forEach(site => {
    const sLat = site.latitude ?? site.geo_fence_lat;
    const sLng = site.longitude ?? site.geo_fence_lng;
    if (sLat != null && sLng != null) {
      const dist = calculateHaversineDistance(userCoords.latitude, userCoords.longitude, sLat, sLng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = { site, distance: dist };
      }
    }
  });

  return closest;
}
