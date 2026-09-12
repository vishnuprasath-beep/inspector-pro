import { Peer } from 'peerjs';
import api from './api';

// Cached stream and connection instances
let currentMediaStream = null;
let currentAdminAudioStream = null;
let currentPeer = null;
let currentCall = null;
let pollingInterval = null;

/**
 * Capture device camera stream with video + audio for combined WebRTC inspection
 */
export async function captureCameraStream({ facingMode = 'environment', audio = true } = {}) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Live camera sharing is not supported on this device/browser.');
  }

  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      });
    } catch (micErr) {
      console.warn('[Microphone Warning]: Could not acquire audio, falling back to video-only.', micErr.message);
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    }

    currentMediaStream = stream;
    return stream;
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Camera permission is required to start live sharing.');
    }
    throw new Error(err.message || 'Could not access device camera.');
  }
}

/**
 * Capture device screen stream using getDisplayMedia
 */
export async function captureScreenStream() {
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
    throw new Error('Screen sharing is not supported on this device/browser.');
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: false
    });
    currentMediaStream = stream;

    // Listen for browser's native "Stop Sharing" floating bar
    if (stream.getVideoTracks() && stream.getVideoTracks()[0]) {
      stream.getVideoTracks()[0].onended = () => {
        stopLocalStream();
      };
    }

    return stream;
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Screen sharing was cancelled by user.');
    }
    throw new Error(err.message || 'Screen sharing is not supported on this device/browser.');
  }
}

/**
 * Toggle inspector's local microphone track
 */
export function toggleLocalMicrophone(enabled) {
  if (currentMediaStream) {
    const tracks = currentMediaStream.getAudioTracks();
    tracks.forEach(t => { t.enabled = enabled; });
    return enabled;
  }
  return false;
}

/**
 * Toggle admin's local microphone track
 */
export function toggleAdminMicrophone(enabled) {
  if (currentAdminAudioStream) {
    const tracks = currentAdminAudioStream.getAudioTracks();
    tracks.forEach(t => { t.enabled = enabled; });
    return enabled;
  }
  return false;
}

/**
 * Stop and release local media tracks
 */
export function stopLocalStream() {
  if (currentMediaStream) {
    currentMediaStream.getTracks().forEach(t => {
      try { t.stop(); } catch (e) {}
    });
    currentMediaStream = null;
  }
  if (currentCall) {
    try { currentCall.close(); } catch (e) {}
    currentCall = null;
  }
}

/**
 * Initialize PeerJS instance for an actor
 */
export function initializePeer(peerId) {
  return new Promise((resolve) => {
    if (currentPeer && !currentPeer.destroyed) {
      if (currentPeer.id === peerId) {
        return resolve(currentPeer);
      }
      try { currentPeer.destroy(); } catch (e) {}
    }

    try {
      // PeerJS Cloud Signaling broker
      const peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('open', () => {
        currentPeer = peer;
        resolve(peer);
      });

      peer.on('error', (err) => {
        console.warn('[PeerJS Broker Notice]:', err.type, err.message);
        currentPeer = peer;
        resolve(peer);
      });

      setTimeout(() => {
        if (!currentPeer) {
          currentPeer = peer;
          resolve(peer);
        }
      }, 2500);
    } catch (e) {
      console.warn('[PeerJS Init Fallback]:', e.message);
      resolve(null);
    }
  });
}

/**
 * Inspector: Listen for incoming WebRTC call from Admin and answer with live stream
 */
export function listenForIncomingCall(peer, stream, onConnected, onDisconnected) {
  if (!peer) return;

  peer.on('call', (incomingCall) => {
    currentCall = incomingCall;
    incomingCall.answer(stream);

    incomingCall.on('stream', (adminStream) => {
      // Plays incoming audio from admin
      if (adminStream && adminStream.getAudioTracks().length > 0) {
        try {
          const audioEl = new Audio();
          audioEl.srcObject = adminStream;
          audioEl.play().catch(e => console.warn('Admin audio auto-play suppressed:', e));
        } catch (e) {}
      }
      if (onConnected) onConnected();
    });

    incomingCall.on('close', () => {
      if (onDisconnected) onDisconnected();
    });

    incomingCall.on('error', () => {
      if (onDisconnected) onDisconnected();
    });
  });
}

/**
 * Admin: Call inspector's Peer ID to receive their live video stream and send microphone audio
 */
export async function connectToInspectorStream(adminPeerId, inspectorPeerId, onRemoteStream, onDisconnected) {
  const peer = await initializePeer(adminPeerId);
  if (!peer) {
    throw new Error('WebRTC signaling broker unavailable.');
  }

  // Acquire admin microphone for voice chat capability
  let adminStream = null;
  try {
    adminStream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true, noiseSuppression: true }, 
      video: false 
    });
    // Mute mic by default until Voice Chat is explicitly requested & accepted
    adminStream.getAudioTracks().forEach(t => { t.enabled = false; });
  } catch (e) {
    console.warn('[Admin Mic Info]: Microphones not accessible, using silent fallback audio track.');
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const dst = osc.connect(ctx.createMediaStreamDestination());
      osc.start();
      adminStream = dst.stream;
    } catch (err) {
      adminStream = new MediaStream();
    }
  }

  currentAdminAudioStream = adminStream;

  const call = peer.call(inspectorPeerId, adminStream);
  currentCall = call;

  if (!call) {
    throw new Error('Failed to initiate WebRTC call to inspector.');
  }

  call.on('stream', (remoteStream) => {
    if (onRemoteStream) onRemoteStream(remoteStream);
  });

  call.on('close', () => {
    if (onDisconnected) onDisconnected('Connection closed.');
  });

  call.on('error', (err) => {
    if (onDisconnected) onDisconnected(err.message || 'WebRTC call failed.');
  });

  return call;
}

/**
 * Disconnect current viewing call and release admin microphone
 */
export function disconnectView() {
  if (currentCall) {
    try { currentCall.close(); } catch (e) {}
    currentCall = null;
  }
  if (currentAdminAudioStream) {
    currentAdminAudioStream.getTracks().forEach(t => {
      try { t.stop(); } catch (e) {}
    });
    currentAdminAudioStream = null;
  }
}

/**
 * Real-time polling subscriber for active live shares, voice chat, and incoming requests
 */
export function subscribeToLiveShareUpdates({
  role,
  inspectorId,
  onIncomingRequest,
  onVoiceRequestReceived,
  onVoiceStatusUpdate,
  onActiveSharesUpdate,
  intervalMs = 2000
} = {}) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  let lastSeenRequestId = null;
  let lastSeenVoiceRequestId = null;

  async function poll() {
    try {
      if (role === 'INSPECTOR') {
        const [reqRes, activeRes] = await Promise.all([
          api.getLiveShareRequests(),
          api.getActiveLiveShares()
        ]);

        // Incoming Camera/Screen requests
        if (reqRes.success && Array.isArray(reqRes.data) && reqRes.data.length > 0) {
          const pending = reqRes.data.find(r => r.status === 'PENDING');
          if (pending && pending.id !== lastSeenRequestId) {
            lastSeenRequestId = pending.id;
            if (onIncomingRequest) onIncomingRequest(pending);
          } else if (!pending && lastSeenRequestId) {
            lastSeenRequestId = null;
            if (onIncomingRequest) onIncomingRequest(null);
          }
        } else {
          if (lastSeenRequestId && onIncomingRequest) {
            lastSeenRequestId = null;
            onIncomingRequest(null);
          }
        }

        // Voice Chat requests for this inspector
        if (activeRes.success && Array.isArray(activeRes.inspectors)) {
          const myProfile = activeRes.inspectors.find(i => 
            i.user_id === inspectorId || i.id === inspectorId || i.username === inspectorId
          );
          if (myProfile && myProfile.active_voice) {
            const voice = myProfile.active_voice;
            if (voice.status === 'REQUESTED' && voice.id !== lastSeenVoiceRequestId) {
              lastSeenVoiceRequestId = voice.id;
              if (onVoiceRequestReceived) onVoiceRequestReceived(voice);
            } else if (voice.status !== 'REQUESTED' && lastSeenVoiceRequestId) {
              lastSeenVoiceRequestId = null;
              if (onVoiceRequestReceived) onVoiceRequestReceived(null);
            }
            if (onVoiceStatusUpdate) onVoiceStatusUpdate(voice);
          } else {
            if (lastSeenVoiceRequestId && onVoiceRequestReceived) {
              lastSeenVoiceRequestId = null;
              onVoiceRequestReceived(null);
            }
            if (onVoiceStatusUpdate) onVoiceStatusUpdate(null);
          }
        }
      }

      // Admin & Supervisor poll active shares
      if (role === 'ADMIN' || role === 'SUPERVISOR') {
        const activeRes = await api.getActiveLiveShares();
        if (activeRes.success && onActiveSharesUpdate) {
          onActiveSharesUpdate(activeRes);
        }
      }
    } catch (e) {
      // Silently retry on next interval tick
    }
  }

  poll();
  pollingInterval = setInterval(poll, intervalMs);

  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
}

/**
 * Cleanly stop camera, microphone, and WebRTC peer connection on logout
 */
export function cleanupLiveShareOnLogout() {
  try {
    stopLocalStream();
  } catch (e) {}
  try {
    disconnectView();
  } catch (e) {}
  if (currentPeer) {
    try {
      currentPeer.destroy();
    } catch (e) {}
    currentPeer = null;
  }
}

export default {
  captureCameraStream,
  captureScreenStream,
  toggleLocalMicrophone,
  toggleAdminMicrophone,
  stopLocalStream,
  initializePeer,
  listenForIncomingCall,
  connectToInspectorStream,
  disconnectView,
  subscribeToLiveShareUpdates,
  cleanupLiveShareOnLogout
};

