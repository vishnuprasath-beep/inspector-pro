/**
 * Inspectra Pro — Cross-Device Cloud Relay & WebRTC Streaming Bus
 * ================================================================
 * Enables real-time camera feeds, YOLO defect detection, and screen sharing
 * from the Inspector's mobile phone to the Admin Dashboard on ANY device anywhere.
 *
 * Architecture:
 * 1. Cloud Pub/Sub Relay (ntfy.sh HTTPS SSE):
 *    - Instant cross-device frame snapshots (1-2 FPS), YOLO bounding boxes, GPS coords, and captured evidence.
 *    - Zero configuration, zero credentials, sub-100ms global latency.
 * 2. WebRTC Peer-to-Peer Video (PeerJS cloud signaling @ 0.peerjs.com):
 *    - Direct 30 FPS hardware camera / screen sharing stream between Inspector phone and Admin laptop.
 * 3. Bidirectional Cloud Directives:
 *    - Admin transmits directives (e.g. "Zoom in", "Flag Critical") to the field inspector in real time.
 */

import { Peer } from 'peerjs';

const TELEMETRY_TOPIC = 'inspectra_telemetry_saravanan_v2';
const DIRECTIVE_TOPIC = 'inspectra_directive_saravanan_v2';
const NTFY_BASE_URL = 'https://ntfy.sh';

export const INSPECTOR_PEER_ID = 'inspectra-cam-saravanan-live';
export const ADMIN_PEER_ID = 'inspectra-admin-terminal-live';

// Rate-limiting throttle for cloud frame publishing
let lastPublishTime = 0;
const MIN_PUBLISH_INTERVAL_MS = 1000; // 1 FPS cloud snapshot stream

/**
 * Publishes live inspection telemetry and camera frame snapshot to the Cloud Relay
 * Accessible by any admin device on the internet.
 * @param {Object} payload 
 * @param {boolean} forceInstant Bypass rate limit (for captures or critical alerts)
 */
export async function publishCloudStream(payload, forceInstant = false) {
  const now = Date.now();
  if (!forceInstant && now - lastPublishTime < MIN_PUBLISH_INTERVAL_MS) {
    return; // Throttled
  }
  lastPublishTime = now;

  const dataToSend = {
    ...payload,
    publishedAt: now,
    cloudRelay: 'ACTIVE_INTERNET_BUS'
  };

  try {
    // Post to cloud pub/sub topic
    await fetch(`${NTFY_BASE_URL}/${TELEMETRY_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title': 'Inspectra Telemetry Frame',
        'Priority': forceInstant ? 'high' : 'low',
        'Tags': forceInstant ? 'camera_flash,warning' : 'satellite'
      },
      body: JSON.stringify(dataToSend)
    });
  } catch (err) {
    console.warn('[CloudStream] Publish error (fallback to local bus):', err);
  }
}

/**
 * Subscribes to the live cloud inspection stream from any physical device
 * @param {Function} onData Callback with incoming telemetry data
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeCloudStream(onData) {
  let eventSource = null;
  let isCancelled = false;

  // 1. Immediately poll latest cached message so UI populates on initial load
  fetch(`${NTFY_BASE_URL}/${TELEMETRY_TOPIC}/json?poll=1`)
    .then(res => res.text())
    .then(text => {
      if (isCancelled || !text) return;
      const lines = text.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(lines[i]);
          if (parsed.message) {
            const telemetry = JSON.parse(parsed.message);
            onData(telemetry);
            break;
          }
        } catch (e) {}
      }
    })
    .catch(() => {});

  // 2. Open continuous Server-Sent Events (SSE) stream
  try {
    eventSource = new EventSource(`${NTFY_BASE_URL}/${TELEMETRY_TOPIC}/sse`);

    eventSource.onmessage = (event) => {
      if (isCancelled || !event.data) return;
      try {
        const wrapper = JSON.parse(event.data);
        if (wrapper.message) {
          const payload = JSON.parse(wrapper.message);
          onData(payload);
        }
      } catch (err) {
        // Raw json fallback
        try {
          const raw = JSON.parse(event.data);
          onData(raw);
        } catch (e) {}
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[CloudStream] SSE reconnecting...', err);
    };
  } catch (e) {
    console.warn('[CloudStream] EventSource unsupported:', e);
  }

  // Return unsubscribe cleanup
  return () => {
    isCancelled = true;
    if (eventSource) {
      eventSource.close();
    }
  };
}

/**
 * Transmits an administrative directive from Admin laptop to Inspector mobile phone across the cloud
 * @param {Object} directive 
 */
export async function sendCloudDirective(directive) {
  const payload = {
    ...directive,
    issuedAt: Date.now(),
    source: 'ADMIN_COMMAND_CENTER'
  };

  try {
    await fetch(`${NTFY_BASE_URL}/${DIRECTIVE_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title': `Admin Directive: ${directive.severity || 'NOTICE'}`,
        'Priority': 'urgent',
        'Tags': 'bell,loudspeaker'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('[CloudStream] Directive publish warning:', err);
  }

  return payload;
}

/**
 * Subscribes the Field Inspector mobile device to incoming Admin directives
 * @param {Function} onDirective 
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeCloudDirectives(onDirective) {
  let eventSource = null;
  let isCancelled = false;

  try {
    eventSource = new EventSource(`${NTFY_BASE_URL}/${DIRECTIVE_TOPIC}/sse`);

    eventSource.onmessage = (event) => {
      if (isCancelled || !event.data) return;
      try {
        const wrapper = JSON.parse(event.data);
        if (wrapper.message) {
          const directive = JSON.parse(wrapper.message);
          onDirective(directive);
        }
      } catch (err) {}
    };
  } catch (e) {}

  return () => {
    isCancelled = true;
    if (eventSource) eventSource.close();
  };
}

/**
 * ====================================================================
 * WebRTC PEER-TO-PEER VIDEO ENGINE (PeerJS Cloud Signaling)
 * Enables smooth 30 FPS camera / screen streaming across different physical devices
 * ====================================================================
 */

/**
 * Initializes Inspector Mobile WebRTC Node
 * Serves live camera stream or screen share to Admin
 * @param {MediaStream} localStream Active camera or screen capture stream
 * @param {Function} onStatusChange Connection status callback ('READY'|'CONNECTED'|'CALLING'|'ERROR')
 * @returns {Object} { peer, updateStream, close }
 */
export function initInspectorWebRtc(localStream, onStatusChange) {
  let activeStream = localStream;
  let activeCall = null;

  let peer = null;
  try {
    peer = new Peer(INSPECTOR_PEER_ID, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('[WebRTC Inspector] Peer online with ID:', id);
      if (onStatusChange) onStatusChange('READY', id);

      // Proactively call Admin if Admin is already waiting
      if (activeStream) {
        try {
          activeCall = peer.call(ADMIN_PEER_ID, activeStream);
          if (activeCall) {
            activeCall.on('close', () => {
              if (onStatusChange) onStatusChange('READY', id);
            });
          }
        } catch (e) {}
      }
    });

    // Answer incoming call from Admin Command Center
    peer.on('call', (call) => {
      console.log('[WebRTC Inspector] Incoming call from Admin:', call.peer);
      activeCall = call;
      if (activeStream) {
        call.answer(activeStream);
      } else {
        call.answer();
      }

      if (onStatusChange) onStatusChange('CONNECTED', call.peer);

      call.on('close', () => {
        if (onStatusChange) onStatusChange('READY', peer.id);
      });
    });

    peer.on('error', (err) => {
      console.warn('[WebRTC Inspector] Error:', err);
      // If ID is already taken (e.g. page refreshed), create randomized room peer ID
      if (err.type === 'unavailable-id') {
        const fallbackId = `${INSPECTOR_PEER_ID}-${Math.floor(Math.random() * 1000)}`;
        peer.destroy();
        peer = new Peer(fallbackId);
      }
      if (onStatusChange) onStatusChange('ERROR', err.message);
    });
  } catch (err) {
    console.warn('[WebRTC Inspector] Failed to init Peer:', err);
  }

  return {
    peer,
    updateStream: (newStream) => {
      activeStream = newStream;
      // Re-call Admin if connected
      if (peer && !peer.destroyed && newStream) {
        try {
          activeCall = peer.call(ADMIN_PEER_ID, newStream);
        } catch (e) {}
      }
    },
    close: () => {
      if (activeCall) activeCall.close();
      if (peer && !peer.destroyed) peer.destroy();
    }
  };
}

/**
 * Initializes Admin Dashboard WebRTC Node
 * Receives live camera stream from Inspector's phone
 * @param {Function} onRemoteStream Callback receiving incoming remote MediaStream
 * @param {Function} onStatusChange Status callback ('READY'|'CONNECTED'|'WAITING'|'ERROR')
 * @returns {Object} { peer, callInspector, close }
 */
export function initAdminWebRtc(onRemoteStream, onStatusChange) {
  let peer = null;
  let activeCall = null;

  try {
    peer = new Peer(ADMIN_PEER_ID, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    const attemptCallInspector = () => {
      if (!peer || peer.destroyed) return;
      if (onStatusChange) onStatusChange('CALLING', INSPECTOR_PEER_ID);
      
      try {
        // Create an empty dummy audio/video track for calling receiver
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const dummyStream = canvas.captureStream ? canvas.captureStream(1) : undefined;

        activeCall = peer.call(INSPECTOR_PEER_ID, dummyStream);
        if (activeCall) {
          activeCall.on('stream', (remoteStream) => {
            console.log('[WebRTC Admin] Remote camera stream received!');
            if (onRemoteStream) onRemoteStream(remoteStream);
            if (onStatusChange) onStatusChange('CONNECTED', INSPECTOR_PEER_ID);
          });

          activeCall.on('close', () => {
            if (onStatusChange) onStatusChange('WAITING', 'Stream closed by inspector');
          });

          activeCall.on('error', () => {
            if (onStatusChange) onStatusChange('WAITING', 'Connecting to field mobile...');
          });
        }
      } catch (e) {
        if (onStatusChange) onStatusChange('WAITING', 'Waiting for inspector camera...');
      }
    };

    peer.on('open', (id) => {
      console.log('[WebRTC Admin] Admin Peer online with ID:', id);
      if (onStatusChange) onStatusChange('READY', id);
      // Attempt connection to inspector
      attemptCallInspector();
    });

    // Also handle if Inspector calls Admin
    peer.on('call', (call) => {
      console.log('[WebRTC Admin] Incoming call from Inspector mobile:', call.peer);
      activeCall = call;
      call.answer(); // Admin answers without sending stream
      call.on('stream', (remoteStream) => {
        console.log('[WebRTC Admin] Remote stream received from incoming call!');
        if (onRemoteStream) onRemoteStream(remoteStream);
        if (onStatusChange) onStatusChange('CONNECTED', call.peer);
      });
    });

    peer.on('error', (err) => {
      console.warn('[WebRTC Admin] Peer error:', err);
      if (err.type === 'peer-unavailable') {
        if (onStatusChange) onStatusChange('WAITING', 'Inspector mobile cam is currently offline');
      } else {
        if (onStatusChange) onStatusChange('ERROR', err.message);
      }
    });

  } catch (err) {
    console.warn('[WebRTC Admin] Init error:', err);
  }

  return {
    peer,
    reconnect: () => {
      if (peer && !peer.destroyed) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 10;
          canvas.height = 10;
          const dummyStream = canvas.captureStream ? canvas.captureStream(1) : undefined;
          activeCall = peer.call(INSPECTOR_PEER_ID, dummyStream);
          if (activeCall) {
            activeCall.on('stream', (remoteStream) => {
              if (onRemoteStream) onRemoteStream(remoteStream);
              if (onStatusChange) onStatusChange('CONNECTED', INSPECTOR_PEER_ID);
            });
          }
        } catch (e) {}
      }
    },
    close: () => {
      if (activeCall) activeCall.close();
      if (peer && !peer.destroyed) peer.destroy();
    }
  };
}
