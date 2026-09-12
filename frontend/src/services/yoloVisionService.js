/**
 * Inspectra Pro — YOLO Defect Vision Engine & Live Telemetry Service
 * Provides:
 * 1. Real-time YOLOv8 Computer Vision Defect Detection (Spalling, Crack, Corrosion, Rebar, Seepage)
 * 2. Dynamic Bounding Box Tracking & Non-Maximum Suppression (NMS)
 * 3. Bidirectional Real-time Telemetry Bus (Inspector Camera <-> Admin Command Center)
 * 4. Admin Live Directive Signaling (Acknowledge, Recalibrate, Emergency Halt)
 */

import { pushLiveTelemetry } from './firebaseService';
import { 
  publishCloudStream, 
  subscribeCloudStream, 
  sendCloudDirective as sendCloudDirectiveMsg, 
  subscribeCloudDirectives 
} from './cloudStreamService';

export const YOLO_DEFECT_TAXONOMY = {
  CONCRETE_SPALLING: {
    id: 'CONCRETE_SPALLING',
    label: 'Concrete Spalling & Delamination',
    severity: 'CRITICAL',
    color: '#ef4444', // Red
    minConf: 0.91,
    maxConf: 0.98,
    advice: 'Ultrasonic pulse velocity test advised. Spalling depth exceeds safety threshold. Reinforcement oxidation risk.',
    specCode: 'IS 456:2000 / IRC:SP:40',
    defaultBox: { x: 22, y: 28, width: 44, height: 38 } // percentages
  },
  STRUCTURAL_CRACK: {
    id: 'STRUCTURAL_CRACK',
    label: 'Structural Micro-Fissure Crack',
    severity: 'HIGH',
    color: '#f97316', // Orange
    minConf: 0.86,
    maxConf: 0.95,
    advice: 'Acoustic crack gauge monitoring required. Crack aperture exceeds 0.25mm design limit.',
    specCode: 'ASTM C1583 / IRC:83',
    defaultBox: { x: 38, y: 18, width: 36, height: 42 }
  },
  SURFACE_CORROSION: {
    id: 'SURFACE_CORROSION',
    label: 'Electrolytic Surface Corrosion',
    severity: 'HIGH',
    color: '#f59e0b', // Amber
    minConf: 0.84,
    maxConf: 0.93,
    advice: 'Perform mechanical grit-blasting and apply dual-layer zinc-rich epoxy barrier coating.',
    specCode: 'ISO 12944 C5-M',
    defaultBox: { x: 15, y: 40, width: 48, height: 32 }
  },
  REBAR_EXPOSURE: {
    id: 'REBAR_EXPOSURE',
    label: 'Exposed Reinforcement Steel Rebar',
    severity: 'CRITICAL',
    color: '#dc2626', // Deep Red
    minConf: 0.93,
    maxConf: 0.99,
    advice: 'Emergency structural stabilization required. Immediate anti-corrosion passivation before polymer mortar patch.',
    specCode: 'BS EN 1504-9',
    defaultBox: { x: 30, y: 25, width: 40, height: 46 }
  },
  WATER_SEEPAGE: {
    id: 'WATER_SEEPAGE',
    label: 'Hydrostatic Efflorescence & Seepage',
    severity: 'MEDIUM',
    color: '#38bdf8', // Cyan
    minConf: 0.79,
    maxConf: 0.89,
    advice: 'Inject crystalline polyurethane hydrophobic grout under 15 bar pressure to seal active hydro leakage.',
    specCode: 'ACI 506.2-13',
    defaultBox: { x: 20, y: 35, width: 52, height: 35 }
  }
};

// Storage & Channel Keys
const BROADCAST_CHANNEL_NAME = 'inspectra_live_telemetry_v1';
const DIRECTIVE_CHANNEL_NAME = 'inspectra_admin_directives_v1';
const LOCAL_STORAGE_KEY = 'INSPECTRA_LIVE_STREAM_STATE_V1';
const DIRECTIVES_STORAGE_KEY = 'INSPECTRA_ADMIN_DIRECTIVES_STATE_V1';

// Setup BroadcastChannels with safe fallback for all browser contexts
let telemetryChannel = null;
let directiveChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    telemetryChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    directiveChannel = new BroadcastChannel(DIRECTIVE_CHANNEL_NAME);
  }
} catch (err) {
  console.warn('[YOLO Service] BroadcastChannel init fallback to LocalStorage events:', err);
}

// Global cache for authentic ONNX inference results
let latestRealYoloResult = null;

/**
 * Execute Authentic Neural Network YOLO Inference
 * Evaluates real ONNX model on backend with zero fake detections
 */
export async function runRealYoloInference({
  image,
  confThreshold = 0.25,
  iouThreshold = 0.45,
  siteId = null,
  zoneId = null
} = {}) {
  if (!image) return null;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/ai/yolo/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        image,
        conf_threshold: confThreshold,
        iou_threshold: iouThreshold,
        site_id: siteId,
        zone_id: zoneId
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        latestRealYoloResult = data;
        return data;
      }
    }
  } catch (err) {
    console.warn('[YOLO Service] Real inference request notice:', err.message);
  }
  return null;
}

/**
 * Real-Time YOLO Defect Inference Processor
 * Returns authentic neural network detections when evaluated, or authentic empty detections.
 */
export function runRealtimeYoloDetection({
  frameIndex = 0,
  assetCategory = 'Civil',
  primaryDefectKey = null,
  cameraActive = true,
  realDetections = null
} = {}) {
  const activeSource = realDetections || latestRealYoloResult;

  if (activeSource && Array.isArray(activeSource.detections)) {
    const origW = activeSource.image_meta?.original_width || 640;
    const origH = activeSource.image_meta?.original_height || 640;

    const mapped = activeSource.detections.map((det, idx) => {
      const box = det.box || {};
      const pctX = Math.round(((box.x1 || 0) / origW) * 100);
      const pctY = Math.round(((box.y1 || 0) / origH) * 100);
      const pctW = Math.round(((box.width || 100) / origW) * 100);
      const pctH = Math.round(((box.height || 100) / origH) * 100);

      const color = det.severity === 'CRITICAL' ? '#ef4444' 
        : det.severity === 'HIGH' ? '#f97316'
        : det.severity === 'MEDIUM' ? '#f59e0b'
        : '#10b981';

      return {
        id: `det_real_${idx}_${Date.now()}`,
        defectKey: det.class,
        label: det.class.replace(/-/g, ' '),
        severity: det.severity || 'MEDIUM',
        color,
        confidenceScore: parseFloat((det.confidence * 100).toFixed(1)),
        specCode: det.statutory_ref || 'IS 456 / BOCW',
        mitigationAdvice: det.recommended_action || 'Inspect and apply standard safety controls.',
        box: {
          x: Math.max(2, Math.min(90, pctX)),
          y: Math.max(2, Math.min(90, pctY)),
          width: Math.max(8, Math.min(95, pctW)),
          height: Math.max(8, Math.min(95, pctH))
        }
      };
    });

    const primary = mapped[0] || null;

    return {
      timestamp: Date.now(),
      modelEngine: activeSource.model?.name ? `ONNX Runtime (${activeSource.model.name})` : 'YOLOv8 ONNX Neural Engine',
      fps: activeSource.inference_ms ? Math.round(1000 / Math.max(activeSource.inference_ms, 1)) : 24,
      detectionsCount: mapped.length,
      cameraActive,
      primaryFinding: primary ? primary.label : 'Area Clear (No Defects Detected)',
      primarySeverity: primary ? primary.severity : 'COMPLIANT',
      detections: mapped
    };
  }

  // If no real inference has run yet or camera is inactive
  return {
    timestamp: Date.now(),
    modelEngine: 'ONNX Runtime YOLOv8 (Standby)',
    fps: 0,
    detectionsCount: 0,
    cameraActive,
    primaryFinding: 'Standby — Ready for Neural Scan',
    primarySeverity: 'COMPLIANT',
    detections: []
  };
}

/**
 * Broadcasts live field inspection telemetry from Inspector -> Admin
 * Transmits across browser tabs (BroadcastChannel), local storage, and globally across physical devices via Cloud Pub/Sub
 */
export function broadcastInspectionStream(payload) {
  const streamData = {
    ...payload,
    lastUpdated: Date.now()
  };

  // 1. Post to BroadcastChannel for instant same-browser cross-tab sync
  if (telemetryChannel) {
    try {
      telemetryChannel.postMessage(streamData);
    } catch (e) {
      console.warn('BroadcastChannel postMessage failed:', e);
    }
  }

  // 2. Persist in LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(streamData));
    // Dispatch custom DOM event in case same-tab listeners exist
    window.dispatchEvent(new CustomEvent('inspectra_telemetry_event', { detail: streamData }));
  } catch (e) {
    console.warn('LocalStorage telemetry sync failed:', e);
  }

  // 3. Sync to Firebase Cloud Firestore collection `live_telemetry`
  try {
    pushLiveTelemetry(streamData);
  } catch (e) {}

  // 4. CROSS-DEVICE CLOUD BROADCAST: Publish to global cloud bus (ntfy.sh SSE)
  // This allows the Admin on ANY physical laptop or phone to see the live feed in real-time!
  try {
    publishCloudStream(streamData, Boolean(payload.isCaptureEvent));
  } catch (e) {
    console.warn('Cloud stream broadcast warning:', e);
  }
}

/**
 * Subscribes to live inspection stream (used in Admin Command Center)
 * Listens to BroadcastChannel (local tabs) AND Global Cloud SSE (any external physical device)
 */
export function subscribeToInspectionStream(callback) {
  // Handler for incoming messages
  const handleMessage = (data) => {
    if (data && callback) {
      callback(data);
    }
  };

  // 1. Listen on BroadcastChannel (same machine tabs)
  const channelListener = (event) => {
    handleMessage(event.data);
  };
  if (telemetryChannel) {
    telemetryChannel.addEventListener('message', channelListener);
  }

  // 2. Listen on Storage event for cross-tab fallback
  const storageListener = (event) => {
    if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        handleMessage(parsed);
      } catch (err) {
        console.warn('Failed to parse telemetry update from storage:', err);
      }
    }
  };
  window.addEventListener('storage', storageListener);

  // 3. Listen on custom DOM event for same-tab updates
  const domEventListener = (e) => {
    handleMessage(e.detail);
  };
  window.addEventListener('inspectra_telemetry_event', domEventListener);

  // 4. CROSS-DEVICE CLOUD STREAM: Listen via Server-Sent Events from external physical devices
  const unsubscribeCloud = subscribeCloudStream((cloudTelemetry) => {
    handleMessage(cloudTelemetry);
  });

  // Return unsubscribe function
  return () => {
    if (telemetryChannel) {
      telemetryChannel.removeEventListener('message', channelListener);
    }
    window.removeEventListener('storage', storageListener);
    window.removeEventListener('inspectra_telemetry_event', domEventListener);
    if (unsubscribeCloud) unsubscribeCloud();
  };
}

/**
 * Retrieve latest active stream state from storage
 */
export function getLatestStreamState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Sends an administrative directive from Admin -> Field Inspector
 * (e.g. "Request Re-scan", "Acknowledge Alert", "Direct Message")
 * Propagates locally and globally across physical devices via Cloud Bus
 */
export function sendAdminDirective(directive) {
  const directivePayload = {
    id: `dir_${Date.now()}`,
    ...directive,
    issuedAt: Date.now()
  };

  if (directiveChannel) {
    try {
      directiveChannel.postMessage(directivePayload);
    } catch (e) {
      console.warn('DirectiveChannel postMessage error:', e);
    }
  }

  try {
    localStorage.setItem(DIRECTIVES_STORAGE_KEY, JSON.stringify(directivePayload));
    window.dispatchEvent(new CustomEvent('inspectra_directive_event', { detail: directivePayload }));
  } catch (e) {
    console.warn('Directive storage failed:', e);
  }

  // Also transmit across Cloud to remote mobile phone
  try {
    sendCloudDirectiveMsg(directivePayload);
  } catch (e) {}

  return directivePayload;
}

/**
 * Subscribes the Field Inspector to incoming Admin Directives
 * Listens locally and across Cloud Bus from remote Admin devices
 */
export function subscribeToAdminDirectives(callback) {
  const handleDirective = (data) => {
    if (data && callback) {
      callback(data);
    }
  };

  const channelListener = (e) => handleDirective(e.data);
  if (directiveChannel) {
    directiveChannel.removeEventListener('message', channelListener);
  }

  const storageListener = (e) => {
    if (e.key === DIRECTIVES_STORAGE_KEY && e.newValue) {
      try {
        handleDirective(JSON.parse(e.newValue));
      } catch (err) {}
    }
  };
  window.addEventListener('storage', storageListener);

  const domListener = (e) => handleDirective(e.detail);
  window.addEventListener('inspectra_directive_event', domListener);

  // Subscribe to Cloud Directives from external devices
  const unsubscribeCloud = subscribeCloudDirectives((cloudDirective) => {
    handleDirective(cloudDirective);
  });

  return () => {
    if (directiveChannel) {
      directiveChannel.removeEventListener('message', channelListener);
    }
    window.removeEventListener('storage', storageListener);
    window.removeEventListener('inspectra_directive_event', domListener);
    if (unsubscribeCloud) unsubscribeCloud();
  };
}
