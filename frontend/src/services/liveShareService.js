/**
 * Inspectra Pro — WebRTC Live Camera & Voice Communication Engine
 * ===============================================================
 * Direct PeerConnection using STUN + OpenRelay TURN with serverless HTTP signaling.
 * Handles Camera Only, Voice Only, and Camera + Voice together.
 * Supported across mobile data (CGNAT), Wi-Fi, and corporate firewalls.
 */

import api from './api';

// STUN + OpenRelay TURN Servers for robust cross-network NAT traversal
export const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

// Internal singletons for current active stream and connections
let activeBroadcasterSession = null; // { sessionId, pc, stream, pollTimer, iceCandidateQueue }
let activeViewerSession = null;      // { sessionId, pc, remoteStream, localAudioStream, pollTimer }
let globalPollingInterval = null;

// =========================================================================
// 1. HARDWARE MEDIA ACQUISITION (Camera, Mic, Screen)
// =========================================================================

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
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
      });
    } catch (micErr) {
      console.warn('[Camera Stream Warning]: Audio track acquisition failed, trying video only:', micErr.message);
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    }

    return stream;
  } catch (err) {
    console.error('[WebRTC getUserMedia Error]:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Camera permission was denied. Please allow camera access in your browser settings.');
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      throw new Error('No camera hardware found on this device.');
    }
    throw new Error(err.message || 'Could not access device camera.');
  }
}

/**
 * Capture device microphone stream for Voice Only mode
 */
export async function captureMicrophoneStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Voice communication is not supported on this device/browser.');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Microphone permission was denied. Please allow microphone access.');
    }
    throw new Error(err.message || 'Could not access device microphone.');
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
    return await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Screen sharing was cancelled by user.');
    }
    throw new Error(err.message || 'Screen sharing could not be started.');
  }
}

/**
 * Stop all media tracks on a given MediaStream
 */
export function stopTracks(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach(t => {
      try { t.stop(); } catch (e) {}
    });
  } catch (e) {}
}

// =========================================================================
// 2. BROADCASTER (Inspector Side) - Publishes Video/Audio to WebRTC
// =========================================================================

// Multi-tier signaling dispatcher (instant cloud pub/sub bus + Database API)
async function dispatchWebRtcSignal(sessionId, targetRole, type, signalData) {
  const cleanId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
  let cleanSignalData = signalData;
  if (signalData) {
    if (type === 'offer' || type === 'answer') {
      cleanSignalData = {
        type: signalData.type,
        sdp: signalData.sdp
      };
    } else if (type === 'ice-candidate') {
      cleanSignalData = {
        candidate: signalData.candidate,
        sdpMid: signalData.sdpMid,
        sdpMLineIndex: signalData.sdpMLineIndex,
        usernameFragment: signalData.usernameFragment
      };
    }
  }

  const payload = {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    session_id: sessionId,
    target_role: targetRole,
    type,
    signal_data: cleanSignalData,
    timestamp: Date.now()
  };

  // 1. Instant real-time cloud pub/sub bus for sub-50ms peer traversal
  try {
    fetch('https://ntfy.sh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: `inspectra_webrtc_sig_${cleanId}`,
        message: JSON.stringify(payload)
      })
    }).catch(err => console.warn('[WebRTC Cloud Bus Warn]:', err.message));
  } catch (e) {}

  // 2. Database signaling persistence for reliability
  if (type === 'offer' || type === 'answer' || type === 'hangup' || type === 'request-offer') {
    try {
      await api.sendWebRtcSignal(sessionId, targetRole, type, cleanSignalData);
    } catch (e) {
      console.warn('[WebRTC Signaling DB Notice]:', e.message);
    }
  } else {
    // For ice-candidates (which fire 20-30 times in <500ms), fire asynchronously without blocking
    api.sendWebRtcSignal(sessionId, targetRole, type, cleanSignalData).catch(() => {});
  }
}

/**
 * Inspector starts broadcasting their stream (Camera or Screen or Voice) via native RTCPeerConnection
 * Uses serverless backend signaling (/api/live-share/signal)
 */
export async function startBroadcasterSession({
  sessionId,
  stream,
  session = null,
  onStateChange,
  onRemoteAudio
}) {
  // Clean up any existing broadcaster session
  stopBroadcasterSession();

  console.log(`[WebRTC Broadcaster] Initializing session ${sessionId} with ${stream.getTracks().length} tracks`);

  const pc = new RTCPeerConnection(RTC_CONFIG);
  let lastSignalTimestamp = 0;
  let pollInterval = null;
  let isClosed = false;
  let pendingCandidates = [];
  const processedSignals = new Set();
  let busEventSource = null;

  // Track state
  const sessionState = {
    sessionId,
    session: session || { id: sessionId },
    pc,
    stream,
    pollTimer: null,
    eventSource: null
  };
  activeBroadcasterSession = sessionState;

  // 1. Add all local media tracks to PeerConnection
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
    console.log(`[WebRTC Broadcaster] Added local ${track.kind} track (id=${track.id}, enabled=${track.enabled})`);
  });

  // 2. Handle incoming remote tracks (e.g. Admin voice chat audio)
  pc.ontrack = (event) => {
    console.log(`[WebRTC Broadcaster] Received remote track: kind=${event.track.kind}`);
    if (event.track.kind === 'audio') {
      const audioStream = event.streams[0] || new MediaStream([event.track]);
      try {
        const audioEl = new Audio();
        audioEl.srcObject = audioStream;
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        audioEl.play().catch(e => console.warn('[WebRTC Broadcaster] Remote audio auto-play suppressed:', e));
      } catch (e) {}

      if (onRemoteAudio) {
        onRemoteAudio(audioStream);
      }
    }
  };

  // 3. ICE Candidate gathering: transmit candidates to viewer
  pc.onicecandidate = async (event) => {
    if (event.candidate && !isClosed) {
      dispatchWebRtcSignal(sessionId, 'MANAGEMENT', 'ice-candidate', event.candidate);
    }
  };

  // 4. Connection state logging & diagnostics
  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC Broadcaster] PC connectionState: ${pc.connectionState}`);
    if (onStateChange) onStateChange(pc.connectionState, pc.iceConnectionState);
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[WebRTC Broadcaster] ICE connectionState: ${pc.iceConnectionState}`);
    if (onStateChange) onStateChange(pc.connectionState, pc.iceConnectionState);
  };

  // Signal processing handler
  async function handleIncomingSignal(sig) {
    if (!sig || !sig.type || isClosed) return;
    const sigKey = `${sig.type}_${sig.timestamp || ''}_${JSON.stringify(sig.signal_data || '').slice(0, 40)}`;
    if (processedSignals.has(sigKey)) return;
    processedSignals.add(sigKey);

    if (sig.type === 'answer') {
      console.log('[WebRTC Broadcaster] Received SDP Answer from Management viewer.');
      if (pc.signalingState === 'have-local-offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.signal_data));
          console.log('[WebRTC Broadcaster] Remote description successfully applied.');
          // Drain queued ICE candidates
          while (pendingCandidates.length > 0) {
            const cand = pendingCandidates.shift();
            try { await pc.addIceCandidate(cand); } catch (e) {}
          }
        } catch (e) {
          console.warn('[WebRTC Broadcaster] Error applying answer:', e.message);
        }
      }
    } else if (sig.type === 'ice-candidate') {
      if (sig.signal_data) {
        try {
          const candidate = new RTCIceCandidate(sig.signal_data);
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
          } else {
            pendingCandidates.push(candidate);
          }
        } catch (e) {
          console.warn('[WebRTC Broadcaster] Error adding candidate:', e.message);
        }
      }
    } else if (sig.type === 'request-offer') {
      console.log('[WebRTC Broadcaster] Viewer requested fresh SDP Offer. Dispatching...');
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        await pc.setLocalDescription(offer);
        const offerPayload = { type: offer.type, sdp: offer.sdp };
        await dispatchWebRtcSignal(sessionId, 'MANAGEMENT', 'offer', offerPayload);
      } catch (err) {
        console.warn('[WebRTC Broadcaster] Error responding to request-offer:', err.message);
      }
    } else if (sig.type === 'hangup') {
      console.log('[WebRTC Broadcaster] Received hangup signal from Management.');
      stopBroadcasterSession();
    }
  }

  // 5. Create SDP Offer and dispatch
  try {
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    await pc.setLocalDescription(offer);
    console.log('[WebRTC Broadcaster] Created and set local SDP Offer. Dispatching...');
    const offerPayload = { type: offer.type, sdp: offer.sdp };
    await dispatchWebRtcSignal(sessionId, 'MANAGEMENT', 'offer', offerPayload);
  } catch (err) {
    console.error('[WebRTC Broadcaster] Failed to create or post SDP Offer:', err);
    throw err;
  }

  // 6. Real-time fast bus event listener (instant sub-50ms notifications)
  const cleanId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    busEventSource = new EventSource(`https://ntfy.sh/inspectra_webrtc_sig_${cleanId}/sse?since=2m`);
    busEventSource.onmessage = (event) => {
      if (isClosed) return;
      try {
        const raw = JSON.parse(event.data);
        const data = raw.message ? JSON.parse(raw.message) : raw;
        if (data && data.session_id === sessionId && (data.target_role === 'INSPECTOR' || data.target_role === 'ALL')) {
          handleIncomingSignal(data);
        }
      } catch (e) {}
    };
    sessionState.eventSource = busEventSource;
  } catch (e) {}

  // 7. Polling loop fallback (authoritative DB checks)
  async function pollSignaling() {
    if (isClosed || !activeBroadcasterSession) return;
    try {
      const res = await api.getWebRtcSignals(sessionId, lastSignalTimestamp);
      if (res.success && Array.isArray(res.signals) && res.signals.length > 0) {
        for (const sig of res.signals) {
          if (sig.timestamp > lastSignalTimestamp) {
            lastSignalTimestamp = sig.timestamp;
          }
          await handleIncomingSignal(sig);
        }
      }
    } catch (e) {}
  }

  // Immediate poll on session start
  pollSignaling();
  pollInterval = setInterval(pollSignaling, 1200);
  sessionState.pollTimer = pollInterval;

  return sessionState;
}

/**
 * Stop active broadcaster session
 */
export function stopBroadcasterSession() {
  if (activeBroadcasterSession) {
    const { pc, stream, pollTimer, eventSource } = activeBroadcasterSession;
    if (pollTimer) clearInterval(pollTimer);
    if (eventSource) {
      try { eventSource.close(); } catch (e) {}
    }
    if (pc) {
      try { pc.close(); } catch (e) {}
    }
    if (stream) {
      stopTracks(stream);
    }
    activeBroadcasterSession = null;
  }
}

// =========================================================================
// 3. VIEWER (Admin / Supervisor Management Portal Side)
// =========================================================================

/**
 * Management viewer subscribes to an inspector's live session via native RTCPeerConnection
 * Automatically answers SDP offer, negotiates ICE, and receives remote MediaStream
 */
export async function startViewerSession({
  sessionId,
  role = 'ADMIN',
  onRemoteStream,
  onStateChange,
  onDisconnected
}) {
  // Clean up any existing viewer session
  stopViewerSession();

  console.log(`[WebRTC Viewer] Connecting to live session ${sessionId} as ${role}`);

  const pc = new RTCPeerConnection(RTC_CONFIG);
  let lastSignalTimestamp = 0;
  let pollInterval = null;
  let isClosed = false;
  let hasAnswered = false;
  let pendingCandidates = [];
  const processedSignals = new Set();
  const remoteStream = new MediaStream();
  let busEventSource = null;

  const sessionState = {
    sessionId,
    pc,
    remoteStream,
    localAudioStream: null,
    pollTimer: null,
    eventSource: null
  };
  activeViewerSession = sessionState;

  // Pre-configure transceivers so Viewer is immediately ready to negotiate video and audio
  try {
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'sendrecv' });
  } catch (e) {
    console.warn('[WebRTC Viewer] Transceiver warning:', e.message);
  }

  // 1. Handle incoming remote media tracks (Video from camera + Audio from mic)
  pc.ontrack = (event) => {
    console.log(`[WebRTC Viewer] Remote track received: kind=${event.track.kind}, id=${event.track.id}, readyState=${event.track.readyState}`);
    
    // Add track to unified remoteStream
    if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
      remoteStream.addTrack(event.track);
    }

    if (onRemoteStream) {
      onRemoteStream(remoteStream, event.track);
    }

    // Monitor track ended or muted
    event.track.onended = () => {
      console.log(`[WebRTC Viewer] Remote track ${event.track.kind} ended.`);
      if (remoteStream.getTracks().every(t => t.readyState === 'ended')) {
        if (onDisconnected) onDisconnected('Remote camera stream was stopped by inspector.');
      }
    };
  };

  // 2. ICE Candidate gathering: transmit to Inspector
  pc.onicecandidate = async (event) => {
    if (event.candidate && !isClosed) {
      dispatchWebRtcSignal(sessionId, 'INSPECTOR', 'ice-candidate', event.candidate);
    }
  };

  // 3. Connection state changes
  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC Viewer] PC connectionState: ${pc.connectionState}`);
    const videoTracks = remoteStream.getVideoTracks().filter(t => t.readyState === 'live');
    const audioTracks = remoteStream.getAudioTracks().filter(t => t.readyState === 'live');
    
    if (onStateChange) {
      onStateChange({
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        hasVideo: videoTracks.length > 0,
        hasAudio: audioTracks.length > 0
      });
    }

    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      if (onDisconnected) onDisconnected('WebRTC connection closed or failed.');
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`[WebRTC Viewer] ICE connectionState: ${pc.iceConnectionState}`);
    if (onStateChange) {
      const videoTracks = remoteStream.getVideoTracks().filter(t => t.readyState === 'live');
      const audioTracks = remoteStream.getAudioTracks().filter(t => t.readyState === 'live');
      onStateChange({
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        hasVideo: videoTracks.length > 0,
        hasAudio: audioTracks.length > 0
      });
    }
  };

  // Signal processing handler
  async function handleIncomingSignal(sig) {
    if (!sig || !sig.type || isClosed) return;
    const sigKey = `${sig.type}_${sig.timestamp || ''}_${JSON.stringify(sig.signal_data || '').slice(0, 40)}`;
    if (processedSignals.has(sigKey)) return;
    processedSignals.add(sigKey);

    if (sig.type === 'offer') {
      console.log('[WebRTC Viewer] Received SDP Offer from Inspector. Setting remote description...');
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sig.signal_data));
        
        // Drain any queued candidates
        while (pendingCandidates.length > 0) {
          const cand = pendingCandidates.shift();
          try { await pc.addIceCandidate(cand); } catch (e) {}
        }

        // Create and send SDP Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        hasAnswered = true;
        console.log('[WebRTC Viewer] Created and set local SDP Answer. Sending to Inspector...');
        const answerPayload = { type: answer.type, sdp: answer.sdp };
        await dispatchWebRtcSignal(sessionId, 'INSPECTOR', 'answer', answerPayload);
      } catch (e) {
        console.warn('[WebRTC Viewer] Error handling offer:', e.message);
      }
    } else if (sig.type === 'ice-candidate') {
      if (sig.signal_data) {
        try {
          const candidate = new RTCIceCandidate(sig.signal_data);
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
          } else {
            pendingCandidates.push(candidate);
          }
        } catch (e) {
          console.warn('[WebRTC Viewer] Error adding candidate:', e.message);
        }
      }
    } else if (sig.type === 'hangup') {
      console.log('[WebRTC Viewer] Stream was ended by inspector.');
      if (onDisconnected) onDisconnected('Stream ended by inspector.');
      stopViewerSession();
    }
  }

  // 4. Real-time fast bus event listener (instant sub-50ms notifications)
  const cleanId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    busEventSource = new EventSource(`https://ntfy.sh/inspectra_webrtc_sig_${cleanId}/sse?since=2m`);
    busEventSource.onmessage = (event) => {
      if (isClosed) return;
      try {
        const raw = JSON.parse(event.data);
        const data = raw.message ? JSON.parse(raw.message) : raw;
        if (data && data.session_id === sessionId && (data.target_role === 'MANAGEMENT' || data.target_role === 'ALL')) {
          handleIncomingSignal(data);
        }
      } catch (e) {}
    };
    sessionState.eventSource = busEventSource;
  } catch (e) {}

  // 5. Polling loop fallback (authoritative DB checks)
  async function pollSignaling() {
    if (isClosed || !activeViewerSession) return;
    try {
      const res = await api.getWebRtcSignals(sessionId, lastSignalTimestamp);
      if (res.success && Array.isArray(res.signals) && res.signals.length > 0) {
        for (const sig of res.signals) {
          if (sig.timestamp > lastSignalTimestamp) {
            lastSignalTimestamp = sig.timestamp;
          }
          await handleIncomingSignal(sig);
        }
      }
    } catch (e) {
      // Network retry
    }
  }

  // Immediate poll on viewer start
  pollSignaling();
  pollInterval = setInterval(pollSignaling, 1200);
  sessionState.pollTimer = pollInterval;

  // Immediately dispatch request-offer so any existing or newly-joined Broadcaster sends fresh SDP Offer
  dispatchWebRtcSignal(sessionId, 'INSPECTOR', 'request-offer', { viewerRole: role });

  return sessionState;
}

/**
 * Add Admin's microphone audio track to active viewer peer connection (for two-way voice chat)
 */
export async function enableViewerVoiceChat() {
  if (!activeViewerSession || !activeViewerSession.pc) {
    throw new Error('No active viewing session to attach voice chat.');
  }

  const { pc, sessionId } = activeViewerSession;

  try {
    const stream = await captureMicrophoneStream();
    activeViewerSession.localAudioStream = stream;

    stream.getAudioTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log(`[WebRTC Voice] Admin microphone track ${track.id} attached to session ${sessionId}`);
    });

    // Renegotiate offer/answer if needed
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await dispatchWebRtcSignal(sessionId, 'INSPECTOR', 'offer', offer);

    return stream;
  } catch (err) {
    console.error('[WebRTC Voice Enable Error]:', err);
    throw err;
  }
}

/**
 * Stop active viewer session
 */
export function stopViewerSession() {
  if (activeViewerSession) {
    const { pc, pollTimer, localAudioStream, remoteStream, eventSource } = activeViewerSession;
    if (pollTimer) clearInterval(pollTimer);
    if (eventSource) {
      try { eventSource.close(); } catch (e) {}
    }
    if (pc) {
      try { pc.close(); } catch (e) {}
    }
    if (localAudioStream) {
      stopTracks(localAudioStream);
    }
    if (remoteStream) {
      stopTracks(remoteStream);
    }
    activeViewerSession = null;
  }
}

// =========================================================================
// 4. MICROPHONE & AUDIO CONTROLS
// =========================================================================

/**
 * Toggle inspector's local microphone track
 */
export function toggleLocalMicrophone(enabled) {
  if (activeBroadcasterSession && activeBroadcasterSession.stream) {
    const tracks = activeBroadcasterSession.stream.getAudioTracks();
    tracks.forEach(t => { t.enabled = enabled; });
    return enabled;
  }
  return false;
}

/**
 * Toggle admin's local microphone track
 */
export function toggleAdminMicrophone(enabled) {
  if (activeViewerSession && activeViewerSession.localAudioStream) {
    const tracks = activeViewerSession.localAudioStream.getAudioTracks();
    tracks.forEach(t => { t.enabled = enabled; });
    return enabled;
  }
  return false;
}

// =========================================================================
// 5. LEGACY & HELPER COMPATIBILITY METHODS
// =========================================================================

export function stopLocalStream() {
  stopBroadcasterSession();
}

export function disconnectView() {
  stopViewerSession();
}

/**
 * Backward compatibility wrapper for connectToInspectorStream
 */
export async function connectToInspectorStream(
  adminPeerId,
  inspectorPeerId,
  onRemoteStream,
  onDisconnected,
  explicitSessionId
) {
  const sessionId = explicitSessionId || inspectorPeerId;
  return startViewerSession({
    sessionId,
    role: 'ADMIN',
    onRemoteStream: (stream) => {
      if (onRemoteStream) onRemoteStream(stream);
    },
    onDisconnected
  });
}

/**
 * Backward compatibility wrapper for listenForIncomingCall
 */
export function listenForIncomingCall(peer, stream, onConnected, onDisconnected) {
  // If native broadcaster is running, ontrack and answer handling is already live
  console.log('[WebRTC Engine] Native broadcaster handling incoming connections.');
}

/**
 * Backward compatibility stub for initializePeer
 */
export function initializePeer(peerId) {
  return Promise.resolve({
    id: peerId,
    destroyed: false,
    destroy: () => {}
  });
}

// =========================================================================
// 6. REAL-TIME EVENT SUBSCRIBER (Requests & Active Shares)
// =========================================================================

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
  onRequestsUpdate,
  intervalMs = 2000
} = {}) {
  if (globalPollingInterval) {
    clearInterval(globalPollingInterval);
    globalPollingInterval = null;
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

        // 1. Incoming Camera/Screen requests (strictly filtered for this inspector and <2 min old)
        if (reqRes.success && Array.isArray(reqRes.data) && reqRes.data.length > 0) {
          const now = Date.now();
          const pending = reqRes.data.find(r => 
            r.status === 'PENDING' && 
            (
              r.inspector_id === inspectorId || 
              (inspectorId === 'insp-01' && r.inspector_id === 'usr-insp-vp01') ||
              (inspectorId === 'usr-insp-vp01' && r.inspector_id === 'insp-01')
            ) &&
            (now - new Date(r.created_at || now).getTime() < 2 * 60 * 1000)
          );
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

        // 2. Voice Chat requests directed to this inspector
        if (activeRes.success && Array.isArray(activeRes.inspectors)) {
          const myProfile = activeRes.inspectors.find(i => 
            i.user_id === inspectorId || i.id === inspectorId || i.badge_number === inspectorId
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

      // Admin & Supervisor & Director poll active shares and requests
      if (['ADMIN', 'SUPERVISOR', 'DIRECTOR'].includes(role)) {
        const [activeRes, reqRes] = await Promise.all([
          api.getActiveLiveShares(),
          api.getLiveShareRequests()
        ]);
        if (activeRes && activeRes.success && onActiveSharesUpdate) {
          onActiveSharesUpdate(activeRes);
        }
        if (reqRes && reqRes.success && onRequestsUpdate) {
          onRequestsUpdate(reqRes.data || []);
        }
      }
    } catch (e) {
      // Silently retry
    }
  }

  poll();
  globalPollingInterval = setInterval(poll, intervalMs);

  return () => {
    if (globalPollingInterval) {
      clearInterval(globalPollingInterval);
      globalPollingInterval = null;
    }
  };
}

/**
 * Get active broadcaster session state (if running)
 */
export function getActiveBroadcasterSession() {
  return activeBroadcasterSession;
}

/**
 * Get active viewer session state (if running)
 */
export function getActiveViewerSession() {
  return activeViewerSession;
}

/**
 * Cleanly stop camera, microphone, and WebRTC peer connection on logout
 */
export function cleanupLiveShareOnLogout() {
  try {
    stopBroadcasterSession();
  } catch (e) {}
  try {
    stopViewerSession();
  } catch (e) {}
}

export default {
  RTC_CONFIG,
  captureCameraStream,
  captureMicrophoneStream,
  captureScreenStream,
  stopTracks,
  startBroadcasterSession,
  stopBroadcasterSession,
  startViewerSession,
  stopViewerSession,
  enableViewerVoiceChat,
  toggleLocalMicrophone,
  toggleAdminMicrophone,
  stopLocalStream,
  disconnectView,
  connectToInspectorStream,
  listenForIncomingCall,
  initializePeer,
  subscribeToLiveShareUpdates,
  cleanupLiveShareOnLogout,
  getActiveBroadcasterSession,
  getActiveViewerSession
};
