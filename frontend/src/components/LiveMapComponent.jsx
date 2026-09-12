import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateHaversineDistance } from '../services/geolocationService';
import { MapPin, Navigation, Radio, X, Crosshair, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function LiveMapComponent({ 
  sites = [], 
  inspectors = [], 
  defects = [],
  height = '550px',
  focusedDestination = null,
  onSelectDestination = null,
  focusedInspector = null,
  onSelectInspector = null,
  onClearFocus = null,
  showSites = true,
  showInspectors = true,
  showDefects = true,
  showDensity = false,
  onSelectDefect = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersMapRef = useRef({});
  const inspectorMarkersMapRef = useRef({});
  const pulseCircleRef = useRef(null);
  const inspectorPulseRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Inspector & Duty Distance Metrics State
  const [activeTracking, setActiveTracking] = useState(null);

  // Initialize and rebuild map tiles and baseline markers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance cleanly if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersMapRef.current = {};
    inspectorMarkersMapRef.current = {};

    // Default center of India (approx. 22.5937° N, 78.9629° E)
    const map = L.map(mapContainerRef.current, {
      center: [22.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: true
    });
    mapInstanceRef.current = map;

    // High-Availability Production Tile Layer (CARTO Dark Matter CDN + OSM fallback)
    const primaryTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });
    primaryTiles.addTo(map);

    primaryTiles.on('tileerror', function() {
      console.warn('[Map CDN] Primary tile server issue, falling back to OSM standard');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    });

    // Custom Icon Creators
    const siteIcon = L.divIcon({
      className: 'custom-map-site-icon',
      html: `<div style="background:#0284c7; width:28px; height:28px; border-radius:50%; border:3px solid #38bdf8; box-shadow:0 0 16px rgba(56,189,248,0.85); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:800; cursor:pointer;">🏢</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const createInspectorIcon = (isSimulated, photoUrl) => {
      const borderColor = isSimulated ? '#a855f7' : '#10b981';
      const shadowColor = isSimulated ? 'rgba(168,85,247,0.9)' : 'rgba(16,185,129,0.9)';
      const badgeIcon = isSimulated ? '🎮' : '📍';
      return L.divIcon({
        className: 'custom-map-inspector-icon',
        html: `
          <div style="position:relative; width:34px; height:34px; border-radius:50%; border:3px solid ${borderColor}; box-shadow:0 0 18px ${shadowColor}; background:#0f172a; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            ${photoUrl 
              ? `<img src="${photoUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />` 
              : `<span style="font-size:14px;">${badgeIcon}</span>`}
            <span style="position:absolute; bottom:-4px; right:-4px; font-size:10px; background:#0f172a; border-radius:50%; width:14px; height:14px; display:flex; align-items:center; justify-content:center; border:1px solid ${borderColor};">
              ${isSimulated ? '⚡' : '✓'}
            </span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    };

    const createDefectIcon = (severity, isRecurring) => {
      const color = severity === 'CRITICAL' ? '#ef4444' 
        : severity === 'HIGH' ? '#f97316' 
        : severity === 'MEDIUM' ? '#f59e0b' 
        : '#3b82f6';
      return L.divIcon({
        className: 'custom-map-defect-icon',
        html: `
          <div style="position:relative; width:28px; height:28px; border-radius:50%; background:${color}; border:2.5px solid #ffffff; box-shadow:0 0 16px ${color}dd; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:12px; font-weight:900; cursor:pointer;">
            ${isRecurring ? '🔁' : '!'}
            <span style="position:absolute; bottom:-3px; right:-3px; width:10px; height:10px; border-radius:50%; background:#0f172a; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; font-size:6px; color:#fff;">
              ${severity[0]}
            </span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    };

    const bounds = L.latLngBounds([]);

    // 1. Render Infrastructure Sites & Geofences
    if (showSites) {
      sites.forEach(site => {
        const lat = site.latitude ?? site.geo_fence_lat;
        const lng = site.longitude ?? site.geo_fence_lng;
        const radius = site.geofence_radius ?? site.geo_fence_radius_meters ?? 600;

        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          // Geofence Circle Boundary
          const circle = L.circle([lat, lng], {
            radius: radius,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.16,
            weight: 2,
            dashArray: '5, 6'
          }).addTo(map);

          circle.on('click', () => {
            if (onSelectDestination) onSelectDestination(site);
          });

          // Site Marker
          const marker = L.marker([lat, lng], { icon: siteIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-family:'Inter',system-ui,sans-serif; min-width:220px; color:#0f172a; padding:4px;">
              <div style="font-size:10px; font-weight:800; color:#0284c7; text-transform:uppercase;">${site.code || 'STRATEGIC ASSET'}</div>
              <div style="font-size:14px; font-weight:700; margin:3px 0; color:#0f172a;">${site.name}</div>
              <div style="font-size:11px; color:#64748b; margin-bottom:8px;">${site.address || ''}</div>
              <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:6px 8px; border-radius:6px; font-size:11px; line-height:1.5;">
                <div><strong>Coordinates:</strong> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</div>
                <div><strong>Geofence Radius:</strong> ${radius} meters</div>
                <div><strong>Safety Score:</strong> <span style="color:#0284c7; font-weight:700;">${site.safety_score || site.health_score || 88}/100</span></div>
                <div><strong>Status:</strong> <span style="color:#10b981; font-weight:700;">${site.status || 'ACTIVE'}</span></div>
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectDestination) onSelectDestination(site);
          });

          markersMapRef.current[site.id] = marker;
        }
      });
    }

    // 2. Render Live Field Inspectors Telemetry Pins
    if (showInspectors) {
      inspectors.forEach(insp => {
        const lat = insp.latitude ?? insp.current_lat;
        const lng = insp.longitude ?? insp.current_lng;
        const isSim = Boolean(insp.is_simulated);
        const inspId = insp.id || insp.inspector_id;

        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          const inspIcon = createInspectorIcon(isSim, insp.avatar_url);
          const inspMarker = L.marker([lat, lng], { icon: inspIcon }).addTo(map);
          
          inspMarker.bindPopup(`
            <div style="font-family:'Inter',system-ui,sans-serif; min-width:210px; color:#0f172a; padding:4px;">
              <div style="font-size:10px; font-weight:800; color:${isSim ? '#9333ea' : '#10b981'}; text-transform:uppercase;">
                ${isSim ? '🎮 SIMULATION TELEMETRY' : '🛰️ LIVE FIELD AUDITOR'}
              </div>
              <div style="font-size:14px; font-weight:700; margin:2px 0;">${insp.name}</div>
              <div style="font-size:11px; color:#64748b;">${insp.badge_number || insp.employee_code || 'INSP-2024'} • ${insp.assigned_site_name || 'Assigned Zone'}</div>
              <div style="margin-top:6px; background:${isSim ? '#f3e8ff' : '#ecfdf5'}; border:1px solid ${isSim ? '#d8b4fe' : '#a7f3d0'}; padding:6px 8px; border-radius:6px; font-size:11px; color:${isSim ? '#6b21a8' : '#065f46'};">
                <div><strong>Current Coordinates:</strong> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</div>
                <div><strong>Duty Status:</strong> <span style="font-weight:700;">${insp.status || 'ACTIVE'}</span></div>
                <div><strong>Battery:</strong> ${insp.battery_level || 85}% • <strong>State:</strong> ${isSim ? 'Simulation Active' : 'GNSS Locked'}</div>
              </div>
            </div>
          `);

          inspMarker.on('click', () => {
            if (onSelectInspector) onSelectInspector(insp);
          });

          inspectorMarkersMapRef.current[inspId] = inspMarker;
        }
      });
    }

    // 3. Render Active Defects with Severity Markers (Red, Orange, Yellow, Blue)
    if (showDefects && Array.isArray(defects)) {
      defects.forEach((defect, idx) => {
        let lat = defect.gps_lat;
        let lng = defect.gps_lng;

        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
          const matchedSite = sites.find(s => s.id === defect.site_id || s.name === defect.site_name);
          if (matchedSite) {
            const baseLat = matchedSite.latitude ?? matchedSite.geo_fence_lat;
            const baseLng = matchedSite.longitude ?? matchedSite.geo_fence_lng;
            if (baseLat != null && baseLng != null) {
              const angle = (idx * 1.3) % (2 * Math.PI);
              const dist = 0.0012 + (idx % 4) * 0.0007;
              lat = baseLat + Math.cos(angle) * dist;
              lng = baseLng + Math.sin(angle) * dist;
            }
          }
        }

        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          const severity = (defect.severity || 'MEDIUM').toUpperCase();
          const isRecurring = Boolean(defect.is_recurring);
          const icon = createDefectIcon(severity, isRecurring);
          const marker = L.marker([lat, lng], { icon }).addTo(map);

          marker.bindPopup(`
            <div style="font-family:'Inter',system-ui,sans-serif; min-width:240px; color:#0f172a; padding:4px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; gap:6px;">
                <span style="font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; background:${severity === 'CRITICAL' ? '#fee2e2' : severity === 'HIGH' ? '#ffedd5' : '#fef3c7'}; color:${severity === 'CRITICAL' ? '#b91c1c' : severity === 'HIGH' ? '#c2410c' : '#b45309'}; text-transform:uppercase;">
                  ${severity} SEVERITY
                </span>
                ${isRecurring ? '<span style="font-size:9.5px; font-weight:800; color:#dc2626; background:#fee2e2; padding:2px 6px; border-radius:4px;">🔁 RECURRING (x' + (defect.recurrence_count || 2) + ')</span>' : ''}
              </div>
              <div style="font-size:13px; font-weight:700; color:#0f172a; margin:4px 0 2px;">${defect.title || 'Reported Issue'}</div>
              <div style="font-size:11px; color:#64748b; margin-bottom:6px;">${defect.location_details || defect.site_name || ''}</div>
              ${defect.photo_url ? '<div style="width:100%; height:110px; border-radius:6px; overflow:hidden; margin-bottom:6px; background:#f1f5f9;"><img src="' + defect.photo_url + '" style="width:100%; height:100%; object-fit:cover;" /></div>' : ''}
              <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:6px 8px; border-radius:6px; font-size:10.5px; line-height:1.4;">
                <div><strong>Status:</strong> <span style="color:#0284c7; font-weight:700;">${defect.status || 'OPEN'}</span></div>
                <div><strong>Officer:</strong> ${defect.assigned_officer_name || defect.assigned_to || 'Unassigned'}</div>
                ${defect.root_cause ? '<div><strong>Cause:</strong> ' + defect.root_cause + '</div>' : ''}
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onSelectDefect) onSelectDefect(defect);
          });
        }
      });
    }

    // 4. Render Density / Heatmap Clusters
    if (showDensity && Array.isArray(defects)) {
      const densityMap = {};
      defects.forEach(d => {
        const sId = d.site_id || 'site-01';
        if (!densityMap[sId]) densityMap[sId] = [];
        densityMap[sId].push(d);
      });

      Object.entries(densityMap).forEach(([sId, cluster]) => {
        const site = sites.find(s => s.id === sId);
        if (site) {
          const sLat = site.latitude ?? site.geo_fence_lat;
          const sLng = site.longitude ?? site.geo_fence_lng;
          if (sLat != null && sLng != null) {
            const hasCritical = cluster.some(c => (c.severity || '').toUpperCase() === 'CRITICAL');
            const color = hasCritical ? '#ef4444' : '#f59e0b';
            const radius = Math.min(1000, 250 + cluster.length * 90);

            L.circle([sLat, sLng], {
              radius: radius,
              color: color,
              fillColor: color,
              fillOpacity: 0.3,
              weight: 3,
              dashArray: '4, 4'
            }).addTo(map).bindPopup(`
              <div style="font-family:'Inter',system-ui,sans-serif; padding:4px;">
                <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase;">🔥 Issue Density Cluster</div>
                <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">${site.name}</div>
                <div style="font-size:11px; color:#64748b; margin-top:4px;">
                  Concentration: <strong>${cluster.length} Active Defects</strong>
                </div>
              </div>
            `);
          }
        }
      });
    }

    // Auto-fit bounds if markers exist and no destination or inspector is pre-focused
    if (!focusedDestination && !focusedInspector && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    // Force multi-stage tile recalculation after container mount
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 400);
    const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 1000);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleWindowResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [sites, inspectors, defects, showSites, showInspectors, showDefects, showDensity]);

  // Handle Dynamic Auto-Locate when focusedDestination changes (site only)
  useEffect(() => {
    if (!focusedDestination || focusedInspector || !mapInstanceRef.current) return;

    const lat = focusedDestination.latitude ?? focusedDestination.geo_fence_lat;
    const lng = focusedDestination.longitude ?? focusedDestination.geo_fence_lng;

    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });

      const marker = markersMapRef.current[focusedDestination.id];
      if (marker) {
        setTimeout(() => {
          if (marker && mapInstanceRef.current) marker.openPopup();
        }, 600);
      }

      if (pulseCircleRef.current) {
        pulseCircleRef.current.remove();
        pulseCircleRef.current = null;
      }

      const pulseRadius = (focusedDestination.geofence_radius ?? focusedDestination.geo_fence_radius_meters ?? 600) * 1.2;
      pulseCircleRef.current = L.circle([lat, lng], {
        radius: pulseRadius,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.15,
        weight: 3,
        dashArray: '4, 4'
      }).addTo(mapInstanceRef.current);
    }
  }, [focusedDestination, focusedInspector]);

  // =========================================================================
  // CRITICAL FEATURE: LOCATE INSPECTOR CURRENT POSITION & DUTY SPOT DISTANCE
  // =========================================================================
  useEffect(() => {
    if (!focusedInspector || !mapInstanceRef.current) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (inspectorPulseRef.current) {
        inspectorPulseRef.current.remove();
        inspectorPulseRef.current = null;
      }
      setActiveTracking(null);
      return;
    }

    const map = mapInstanceRef.current;

    // 1. Resolve Inspector Current Coordinates
    const inspLat = focusedInspector.latitude ?? focusedInspector.current_lat;
    const inspLng = focusedInspector.longitude ?? focusedInspector.current_lng;

    if (inspLat == null || inspLng == null || isNaN(inspLat) || isNaN(inspLng)) {
      console.warn('[LiveMap] Inspector does not have valid coordinates:', focusedInspector);
      return;
    }

    // 2. Resolve Respective Assigned Duty Spot (Facility)
    const dutySite = sites.find(s => 
      s.id === focusedInspector.assigned_site_id || 
      s.name === focusedInspector.assigned_site_name ||
      (focusedInspector.assigned_site_id && s.id.includes(focusedInspector.assigned_site_id))
    ) || sites[0];

    const siteLat = dutySite ? (dutySite.latitude ?? dutySite.geo_fence_lat) : null;
    const siteLng = dutySite ? (dutySite.longitude ?? dutySite.geo_fence_lng) : null;

    if (siteLat != null && siteLng != null && !isNaN(siteLat) && !isNaN(siteLng)) {
      // 3. Calculate Exact Haversine Distance
      const distanceMeters = calculateHaversineDistance(inspLat, inspLng, siteLat, siteLng);
      const geofenceRadius = dutySite.geofence_radius ?? dutySite.geo_fence_radius_meters ?? 800;
      const isInsideGeofence = distanceMeters <= geofenceRadius;

      // 4. Update tracking metrics for Floating HUD
      setActiveTracking({
        inspector: focusedInspector,
        site: dutySite,
        distanceMeters: Math.round(distanceMeters),
        formattedDistance: distanceMeters >= 1000 
          ? `${(distanceMeters / 1000).toFixed(2)} km` 
          : `${Math.round(distanceMeters)} meters`,
        isInsideGeofence,
        geofenceRadius,
        isSimulated: Boolean(focusedInspector.is_simulated),
        inspLat,
        inspLng,
        siteLat,
        siteLng
      });

      // 5. Clean up old routes and pulse rings
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (inspectorPulseRef.current) {
        inspectorPulseRef.current.remove();
        inspectorPulseRef.current = null;
      }
      if (pulseCircleRef.current) {
        pulseCircleRef.current.remove();
        pulseCircleRef.current = null;
      }

      // 6. Draw Glowing Connecting Polyline between Inspector and Duty Spot
      const routeColor = focusedInspector.is_simulated ? '#a855f7' : '#0284c7';
      const polyline = L.polyline(
        [[inspLat, inspLng], [siteLat, siteLng]], 
        {
          color: routeColor,
          weight: 4,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round'
        }
      ).addTo(map);

      // Bind distance tooltip directly in the midpoint of the route
      const distanceLabel = distanceMeters >= 1000 
        ? `${(distanceMeters / 1000).toFixed(2)} km` 
        : `${Math.round(distanceMeters)} m`;

      polyline.bindTooltip(`
        <div style="font-family:'Inter',system-ui,sans-serif; font-size:11px; font-weight:800; color:#0f172a; padding:3px 8px; border-radius:4px; text-align:center;">
          📍 Distance to Duty Spot: <strong>${distanceLabel}</strong><br/>
          <span style="font-size:10px; color:${isInsideGeofence ? '#10b981' : '#ef4444'}; font-weight:700;">
            ${isInsideGeofence ? '✓ Inside Geofence' : '⚠️ Outside Perimeter'}
          </span>
        </div>
      `, {
        permanent: true,
        direction: 'center',
        className: 'route-vector-tooltip'
      }).openTooltip();

      routePolylineRef.current = polyline;

      // 7. Pulse Ring around Inspector's live location
      inspectorPulseRef.current = L.circle([inspLat, inspLng], {
        radius: 300,
        color: routeColor,
        fillColor: routeColor,
        fillOpacity: 0.2,
        weight: 3,
        dashArray: '4, 4'
      }).addTo(map);

      // 8. Highlight the duty facility geofence
      pulseCircleRef.current = L.circle([siteLat, siteLng], {
        radius: geofenceRadius,
        color: isInsideGeofence ? '#10b981' : '#f59e0b',
        fillColor: isInsideGeofence ? '#10b981' : '#f59e0b',
        fillOpacity: 0.2,
        weight: 3,
        dashArray: '5, 5'
      }).addTo(map);

      // 9. Frame both inspector and duty spot perfectly in view
      const dualBounds = L.latLngBounds([
        [inspLat, inspLng],
        [siteLat, siteLng]
      ]);

      map.fitBounds(dualBounds, {
        padding: [90, 90],
        maxZoom: 15
      });

      // Open inspector popup
      const inspId = focusedInspector.id || focusedInspector.inspector_id;
      const inspMarker = inspectorMarkersMapRef.current[inspId];
      if (inspMarker) {
        setTimeout(() => inspMarker.openPopup(), 600);
      }
    } else {
      // If no duty site found, just fly to the inspector's position
      map.flyTo([inspLat, inspLng], 15, { animate: true, duration: 1.2 });
    }
  }, [focusedInspector, sites]);

  // Actions for Floating HUD
  const handleCenterInspector = () => {
    if (activeTracking && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activeTracking.inspLat, activeTracking.inspLng], 16, { animate: true });
    }
  };

  const handleCenterDutySpot = () => {
    if (activeTracking && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activeTracking.siteLat, activeTracking.siteLng], 16, { animate: true });
    }
  };

  const handleFrameBoth = () => {
    if (activeTracking && mapInstanceRef.current) {
      const b = L.latLngBounds([
        [activeTracking.inspLat, activeTracking.inspLng],
        [activeTracking.siteLat, activeTracking.siteLng]
      ]);
      mapInstanceRef.current.fitBounds(b, { padding: [80, 80], maxZoom: 15 });
    }
  };

  const handleDismissTracking = () => {
    setActiveTracking(null);
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (inspectorPulseRef.current) {
      inspectorPulseRef.current.remove();
      inspectorPulseRef.current = null;
    }
    if (pulseCircleRef.current) {
      pulseCircleRef.current.remove();
      pulseCircleRef.current = null;
    }
    if (onClearFocus) onClearFocus();
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: height || '550px', 
        minHeight: '350px', 
        borderRadius: 16, 
        overflow: 'hidden', 
        border: '1px solid var(--border-subtle)',
        background: '#0f172a'
      }}
    >
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '350px' 
        }} 
      />

      {/* ========================================================= */}
      {/* FLOATING HUD: LIVE INSPECTOR DUTY & DISTANCE TRACKER      */}
      {/* ========================================================= */}
      {activeTracking && (
        <div 
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            maxWidth: '480px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: activeTracking.isSimulated ? '1.5px solid #a855f7' : '1.5px solid #0284c7',
            boxShadow: activeTracking.isSimulated 
              ? '0 8px 30px rgba(168, 85, 247, 0.35)' 
              : '0 8px 30px rgba(2, 132, 199, 0.35)',
            borderRadius: 14,
            padding: '14px 16px',
            zIndex: 1000,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img 
                src={activeTracking.inspector.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} 
                alt={activeTracking.inspector.name}
                style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 10, 
                  border: activeTracking.isSimulated ? '2px solid #a855f7' : '2px solid #10b981',
                  objectFit: 'cover'
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {activeTracking.inspector.name}
                  </h4>
                  <span style={{ 
                    fontSize: 9.5, 
                    fontWeight: 700, 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    background: activeTracking.isSimulated ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: activeTracking.isSimulated ? '#d8b4fe' : '#34d399',
                    border: activeTracking.isSimulated ? '1px solid #a855f7' : '1px solid #10b981'
                  }}>
                    {activeTracking.isSimulated ? '🎮 PROXIMITY SIMULATION' : '🛰️ LIVE GNSS'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {activeTracking.inspector.badge_number || activeTracking.inspector.employee_code || 'INSP-2024'} • {activeTracking.inspector.specialization || 'Infrastructure Auditor'}
                </div>
              </div>
            </div>

            <button
              onClick={handleDismissTracking}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close Duty Inspector Focus"
            >
              <X size={15} />
            </button>
          </div>

          {/* Distance & Geofence Metric Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 10,
            background: 'rgba(30, 41, 59, 0.7)',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned Duty Spot
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeTracking.site.name}
              </div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 1 }}>
                Geofence: {activeTracking.geofenceRadius}m radius
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Distance To Duty Spot
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 900, 
                color: activeTracking.isInsideGeofence ? '#34d399' : '#f87171',
                marginTop: 1
              }}>
                {activeTracking.formattedDistance}
              </div>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                color: activeTracking.isInsideGeofence ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4
              }}>
                {activeTracking.isInsideGeofence ? (
                  <>
                    <ShieldCheck size={11} />
                    <span>Inside Geofence</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={11} />
                    <span>Outside Geofence</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Location Coordinates & Real-time Quick Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
              Loc: <span style={{ color: '#fff' }}>{activeTracking.inspLat.toFixed(4)}° N, {activeTracking.inspLng.toFixed(4)}° E</span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleCenterInspector}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Officer Pin
              </button>
              <button
                onClick={handleCenterDutySpot}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Duty Spot
              </button>
              <button
                onClick={handleFrameBoth}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '1px solid #38bdf8',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Frame Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div 
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          zIndex: 900,
          fontSize: 11,
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', fontSize: 10, letterSpacing: '0.05em' }}>
          Real-Time Geofence Telemetry
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#0284c7', border: '2px solid #38bdf8' }}></span>
          <span>Monitored Facility Site</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px dashed #0284c7' }}></span>
          <span>Statutory Geofence Boundary</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #ffffff' }}></span>
          <span>Critical Defect Pin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f97316', border: '1.5px solid #ffffff' }}></span>
          <span>High Severity Defect Pin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', border: '1.5px solid #ffffff' }}></span>
          <span>Medium Severity Defect Pin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px dashed #ef4444', background: 'rgba(239, 68, 68, 0.3)' }}></span>
          <span>Density Cluster (Heatmap)</span>
        </div>
      </div>
    </div>
  );
}
