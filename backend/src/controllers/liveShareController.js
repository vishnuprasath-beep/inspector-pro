const db = require('../config/db');
const { TABLES, LIVE_SHARE_SOURCES, LIVE_SHARE_STATUSES, VOICE_SESSION_STATUSES, ROLES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

/**
 * Clean up old signaling records older than 15 minutes from db
 */
function purgeOldSignals() {
  try {
    const FIFTEEN_MINS = 15 * 60 * 1000;
    const cutoff = Date.now() - FIFTEEN_MINS;
    const all = db.getAll(TABLES.LIVE_SHARE_SIGNALS) || [];
    const stale = all.filter(s => s.timestamp && s.timestamp < cutoff);
    stale.forEach(s => {
      try { db.delete(TABLES.LIVE_SHARE_SIGNALS, s.id); } catch (e) {}
    });
  } catch (e) {}
}

const CLOUD_BUS_TOPICS = {
  REQUESTS: 'inspectra_live_requests_bus',
  ACTIVE_SHARES: 'inspectra_active_shares_bus',
  VOICE: 'inspectra_voice_chat_bus'
};

async function publishCloudBus(topic, payload) {
  try {
    await fetch('https://ntfy.sh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, message: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(1500)
    });
  } catch (e) {}
}

async function queryCloudBus(topic, since = '3m') {
  try {
    const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=${since}`, {
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return [];
    const text = await res.text();
    const list = [];
    const lines = text.trim().split('\n');
    for (const line of lines) {
      if (!line) continue;
      try {
        const raw = JSON.parse(line);
        if (raw.event === 'message' && raw.message) {
          list.push(JSON.parse(raw.message));
        }
      } catch (e) {}
    }
    return list;
  } catch (e) {
    return [];
  }
}

/**
 * Admin requests camera or screen sharing from an inspector
 * POST /api/live-share/request
 */
async function createRequest(req, res) {
  try {
    const { inspector_id, source_type = LIVE_SHARE_SOURCES.CAMERA, site_id, site_name } = req.body;

    if (!inspector_id) {
      return res.status(400).json({ success: false, error: 'Inspector ID is required.' });
    }

    // Resolve inspector by user ID, username, or inspector record ID
    let inspector = db.getById(TABLES.USERS, inspector_id) || db.findOne(TABLES.USERS, { username: inspector_id });
    if (!inspector) {
      const inspRecord = db.getById(TABLES.INSPECTORS, inspector_id) || db.findOne(TABLES.INSPECTORS, { id: inspector_id });
      if (inspRecord && inspRecord.user_id) {
        inspector = db.getById(TABLES.USERS, inspRecord.user_id);
      }
    }
    if (!inspector) {
      return res.status(404).json({ success: false, error: 'Inspector account not found.' });
    }

    // Cancel/expire any older pending requests for this inspector
    const existing = db.find(TABLES.LIVE_SHARE_REQUESTS, { inspector_id: inspector.id }) || [];
    existing.forEach(r => {
      if (r.status === LIVE_SHARE_STATUSES.PENDING) {
        db.update(TABLES.LIVE_SHARE_REQUESTS, r.id, { status: LIVE_SHARE_STATUSES.EXPIRED });
      }
    });

    const requestId = `req-live-${uuidv4().slice(0, 8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 1000).toISOString(); // Strict 2 min expiry

    const newRequest = {
      id: requestId,
      inspector_id: inspector.id,
      inspector_name: inspector.name,
      admin_id: req.user.id,
      admin_name: req.user.name,
      site_id: site_id || inspector.assigned_site_id || 'site-01',
      site_name: site_name || inspector.assigned_site_name || 'Central Infrastructure Terminal',
      source_type: source_type.toUpperCase() === 'SCREEN' ? LIVE_SHARE_SOURCES.SCREEN : LIVE_SHARE_SOURCES.CAMERA,
      status: LIVE_SHARE_STATUSES.PENDING,
      created_at: now.toISOString(),
      expires_at: expiresAt
    };

    db.insert(TABLES.LIVE_SHARE_REQUESTS, newRequest);

    // Cross-container serverless broadcast
    await publishCloudBus(CLOUD_BUS_TOPICS.REQUESTS, { event: 'CREATE', request: newRequest });

    // Send in-app notification to inspector
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: inspector.id,
        type: 'LIVE_SHARE_REQUEST',
        title: source_type.toUpperCase() === 'SCREEN' ? '🖥 Screen Share Requested' : '📹 Live Camera Requested',
        message: `${req.user.name} has requested access to view your ${source_type.toLowerCase()} in real time.`,
        request_id: requestId,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: `Live share request dispatched to ${inspector.name}.`,
      data: newRequest
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get active/pending requests
 * GET /api/live-share/requests
 */
async function getRequests(req, res) {
  try {
    const all = db.getAll(TABLES.LIVE_SHARE_REQUESTS) || [];

    // Pull from cloud bus to ensure cross-container availability (last 3 minutes only)
    const busEvents = await queryCloudBus(CLOUD_BUS_TOPICS.REQUESTS, '3m');
    busEvents.forEach(item => {
      if (item.event === 'CREATE' && item.request) {
        const existingIdx = all.findIndex(r => r.id === item.request.id);
        if (existingIdx === -1) {
          all.push(item.request);
          try { db.insert(TABLES.LIVE_SHARE_REQUESTS, item.request); } catch (e) {}
        }
      } else if (item.event === 'RESPOND' && item.requestId) {
        const match = all.find(r => r.id === item.requestId);
        if (match) {
          match.status = item.status;
          try { db.update(TABLES.LIVE_SHARE_REQUESTS, item.requestId, { status: item.status }); } catch (e) {}
        }
      }
    });

    const now = Date.now();
    const TWO_MINUTES = 2 * 60 * 1000;
    const FIVE_MINUTES = 5 * 60 * 1000;

    // Auto-expire requests older than 2 minutes
    all.forEach(r => {
      const age = now - new Date(r.created_at || now).getTime();
      const isExpiredByDate = r.expires_at && new Date(r.expires_at).getTime() < now;
      if (r.status === LIVE_SHARE_STATUSES.PENDING && (age > TWO_MINUTES || isExpiredByDate)) {
        r.status = LIVE_SHARE_STATUSES.EXPIRED;
        try { db.update(TABLES.LIVE_SHARE_REQUESTS, r.id, { status: LIVE_SHARE_STATUSES.EXPIRED }); } catch (e) {}
      }
    });

    // Deduplicate requests by ID keeping freshest state
    const uniqueMap = new Map();
    all.forEach(r => {
      if (!uniqueMap.has(r.id) || new Date(r.created_at) > new Date(uniqueMap.get(r.id).created_at)) {
        uniqueMap.set(r.id, r);
      }
    });
    const deduplicated = Array.from(uniqueMap.values());

    let filtered = deduplicated.filter(r => {
      const age = now - new Date(r.created_at || now).getTime();
      if (r.status === LIVE_SHARE_STATUSES.PENDING) {
        return age < TWO_MINUTES;
      }
      if (r.status === LIVE_SHARE_STATUSES.ACCEPTED) {
        return age < FIVE_MINUTES;
      }
      if (r.status === LIVE_SHARE_STATUSES.DECLINED) {
        const respAge = now - new Date(r.responded_at || r.created_at).getTime();
        return respAge < TWO_MINUTES;
      }
      return false;
    });

    // If Inspector, only return fresh PENDING requests directed strictly to them
    if (req.user.role === ROLES.INSPECTOR) {
      filtered = filtered.filter(r => 
        r.status === LIVE_SHARE_STATUSES.PENDING && 
        (r.inspector_id === req.user.id || r.inspector_id === req.user.username)
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered.reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Inspector accepts or declines an access request
 * POST /api/live-share/respond
 */
async function respondRequest(req, res) {
  try {
    const { request_id, status } = req.body;

    if (!request_id || !status) {
      return res.status(400).json({ success: false, error: 'Request ID and status (ACCEPTED/DECLINED) required.' });
    }

    let shareReq = db.getById(TABLES.LIVE_SHARE_REQUESTS, request_id);
    if (!shareReq) {
      // Cross-container recovery
      const busEvents = await queryCloudBus(CLOUD_BUS_TOPICS.REQUESTS);
      for (const item of busEvents) {
        if (item.event === 'CREATE' && item.request && item.request.id === request_id) {
          shareReq = item.request;
          try { db.insert(TABLES.LIVE_SHARE_REQUESTS, shareReq); } catch (e) {}
          break;
        }
      }
    }

    if (!shareReq) {
      return res.status(404).json({ success: false, error: 'Share request not found.' });
    }

    const isAccepted = status.toUpperCase() === LIVE_SHARE_STATUSES.ACCEPTED;
    const newStatus = isAccepted ? LIVE_SHARE_STATUSES.ACCEPTED : LIVE_SHARE_STATUSES.DECLINED;

    db.update(TABLES.LIVE_SHARE_REQUESTS, request_id, {
      status: newStatus,
      responded_at: new Date().toISOString()
    });

    await publishCloudBus(CLOUD_BUS_TOPICS.REQUESTS, { event: 'RESPOND', requestId: request_id, status: newStatus });

    // Notify requesting Admin
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: shareReq.admin_id,
        type: isAccepted ? 'LIVE_SHARE_ACCEPTED' : 'LIVE_SHARE_DECLINED',
        title: isAccepted ? 'Live Share Request Accepted' : 'Live Share Request Declined',
        message: `${shareReq.inspector_name} has ${isAccepted ? 'accepted' : 'declined'} the ${shareReq.source_type.toLowerCase()} request.`,
        request_id: shareReq.id,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Request ${newStatus.toLowerCase()} successfully.`,
      data: { ...shareReq, status: newStatus }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Inspector registers active live stream session
 * POST /api/live-share/start
 */
async function startSession(req, res) {
  try {
    const { source_type = 'CAMERA', peer_id, request_id } = req.body;
    const inspector = req.user;

    // Check if inspector has an active session already, end it across all containers
    const active = db.find(TABLES.LIVE_SHARES, { inspector_id: inspector.id, status: LIVE_SHARE_STATUSES.ACTIVE });
    for (const s of active) {
      db.update(TABLES.LIVE_SHARES, s.id, { status: LIVE_SHARE_STATUSES.ENDED });
      await publishCloudBus(CLOUD_BUS_TOPICS.ACTIVE_SHARES, {
        event: 'STOP',
        sessionId: s.id,
        inspectorId: inspector.id
      });
    }

    const sessionId = `live-${uuidv4().slice(0, 8)}`;
    const newSession = {
      id: sessionId,
      inspector_id: inspector.id,
      inspector_name: inspector.name,
      source_type: source_type.toUpperCase() === 'SCREEN' ? LIVE_SHARE_SOURCES.SCREEN : LIVE_SHARE_SOURCES.CAMERA,
      peer_id: peer_id || `peer-${inspector.id}-${Date.now().toString().slice(-4)}`,
      request_id: request_id || null,
      status: LIVE_SHARE_STATUSES.ACTIVE,
      viewers_count: 0,
      started_at: new Date().toISOString(),
      last_ping: new Date().toISOString()
    };

    db.insert(TABLES.LIVE_SHARES, newSession);

    // Cross-container serverless sync for active sessions
    await publishCloudBus(CLOUD_BUS_TOPICS.ACTIVE_SHARES, { event: 'START', session: newSession });

    // Notify administrators of active live stream
    try {
      const admins = db.find(TABLES.USERS, { role: ROLES.ADMIN });
      admins.forEach(adm => {
        db.insert(TABLES.NOTIFICATIONS, {
          id: `notif-${uuidv4().slice(0, 8)}`,
          user_id: adm.id,
          type: 'LIVE_SHARE_STARTED',
          title: `🔴 ${newSession.source_type} Live Stream Active`,
          message: `${inspector.name} is now broadcasting ${newSession.source_type.toLowerCase()} live.`,
          session_id: sessionId,
          read: false,
          created_at: new Date().toISOString()
        });
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Live share session activated.',
      data: newSession
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * End live streaming session
 * POST /api/live-share/stop
 */
async function stopSession(req, res) {
  try {
    const { session_id, reason = 'USER_STOPPED' } = req.body;
    let session = null;

    if (session_id) {
      session = db.getById(TABLES.LIVE_SHARES, session_id);
      if (!session) {
        // Cross-container recovery from active shares bus
        const busEvents = await queryCloudBus(CLOUD_BUS_TOPICS.ACTIVE_SHARES, '15m');
        for (const item of busEvents) {
          if (item.event === 'START' && item.session && item.session.id === session_id) {
            session = item.session;
            break;
          }
        }
      }
    } else {
      session = db.findOne(TABLES.LIVE_SHARES, { 
        inspector_id: req.user.id, 
        status: LIVE_SHARE_STATUSES.ACTIVE 
      });
    }

    const targetSessionId = session_id || session?.id;
    if (targetSessionId) {
      // Always broadcast STOP on active shares bus to purge from all serverless lambdas
      await publishCloudBus(CLOUD_BUS_TOPICS.ACTIVE_SHARES, { 
        event: 'STOP', 
        sessionId: targetSessionId, 
        inspectorId: session?.inspector_id || req.user.id 
      });

      // Always broadcast hangup to immediately terminate WebRTC on all connected peers
      const cleanId = String(targetSessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
      await publishCloudBus(`inspectra_webrtc_sig_${cleanId}`, {
        session_id: targetSessionId,
        type: 'hangup',
        target_role: 'ALL',
        timestamp: Date.now()
      });
    }

    if (!session) {
      return res.status(200).json({ success: true, message: 'Session termination broadcast dispatched.' });
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - new Date(session.started_at).getTime()) / 1000));
    const durationFormatted = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;

    // Mark session as ended
    db.update(TABLES.LIVE_SHARES, session.id, {
      status: LIVE_SHARE_STATUSES.ENDED,
      ended_at: endedAt.toISOString(),
      duration: durationFormatted,
      duration_seconds: durationSeconds
    });

    // Terminate any active voice sessions linked to this live share session
    try {
      const voiceSessions = db.find(TABLES.VOICE_SESSIONS, { live_share_session_id: session.id });
      voiceSessions.forEach(vs => {
        if (vs.status === VOICE_SESSION_STATUSES.CONNECTED || vs.status === VOICE_SESSION_STATUSES.REQUESTED) {
          db.update(TABLES.VOICE_SESSIONS, vs.id, {
            status: VOICE_SESSION_STATUSES.ENDED,
            ended_at: endedAt.toISOString()
          });
        }
      });
    } catch (e) {}

    // Append to live_share_history
    const historyRecord = {
      id: `hist-${uuidv4().slice(0, 8)}`,
      session_id: session.id,
      inspector_id: session.inspector_id,
      inspector_name: session.inspector_name,
      source_type: session.source_type,
      started_at: session.started_at,
      ended_at: endedAt.toISOString(),
      duration: durationFormatted,
      duration_seconds: durationSeconds,
      reason,
      status: 'COMPLETED'
    };
    db.insert(TABLES.LIVE_SHARE_HISTORY, historyRecord);

    // Clean up signaling records for this session
    try {
      const allSig = db.find(TABLES.LIVE_SHARE_SIGNALS, { session_id: session.id }) || [];
      allSig.forEach(s => {
        try { db.delete(TABLES.LIVE_SHARE_SIGNALS, s.id); } catch (e) {}
      });
    } catch (e) {}

    // Mark any associated live share request as ENDED
    try {
      if (session.request_id) {
        db.update(TABLES.LIVE_SHARE_REQUESTS, session.request_id, { status: LIVE_SHARE_STATUSES.ENDED });
      }
    } catch (e) {}

    res.json({
      success: true,
      message: 'Live share session terminated gracefully.',
      data: historyRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get all active live share sessions
 * GET /api/live-share/active
 */
async function getActiveShares(req, res) {
  try {
    const activeSessions = db.find(TABLES.LIVE_SHARES, { status: LIVE_SHARE_STATUSES.ACTIVE });

    // Cross-container synchronization for active sessions
    const busEvents = await queryCloudBus(CLOUD_BUS_TOPICS.ACTIVE_SHARES);
    busEvents.forEach(item => {
      if (item.event === 'START' && item.session) {
        if (!activeSessions.some(s => s.id === item.session.id)) {
          activeSessions.push(item.session);
          try { db.insert(TABLES.LIVE_SHARES, item.session); } catch (e) {}
        }
      } else if (item.event === 'STOP' && item.sessionId) {
        const idx = activeSessions.findIndex(s => s.id === item.sessionId);
        if (idx !== -1) {
          activeSessions.splice(idx, 1);
        }
        try { db.update(TABLES.LIVE_SHARES, item.sessionId, { status: LIVE_SHARE_STATUSES.ENDED }); } catch (e) {}
      }
    });

    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();
    const validActiveSessions = activeSessions.filter(s => {
      if (!s.started_at) return true;
      const started = new Date(s.started_at).getTime();
      return (now - started) < ONE_HOUR;
    });

    // Deduplicate: Each inspector can have at most ONE active session. The newest session wins.
    validActiveSessions.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
    const latestSessionsByInspector = new Map();
    const deduplicatedActiveSessions = [];
    for (const s of validActiveSessions) {
      const inspKey = s.inspector_id;
      if (!latestSessionsByInspector.has(inspKey)) {
        latestSessionsByInspector.set(inspKey, s);
        deduplicatedActiveSessions.push(s);
      } else {
        // Suppress and mark older active session for the same inspector as ended
        try { db.update(TABLES.LIVE_SHARES, s.id, { status: LIVE_SHARE_STATUSES.ENDED }); } catch (e) {}
      }
    }

    const allInspectors = db.getAll(TABLES.INSPECTORS);
    const users = db.getAll(TABLES.USERS);
    const allVoiceSessions = db.getAll(TABLES.VOICE_SESSIONS) || [];

    // Annotate inspectors with their current live share state & voice state
    const inspectorRoster = allInspectors.map(insp => {
      const user = users.find(u => u.id === insp.user_id) || {};
      const activeShare = latestSessionsByInspector.get(insp.user_id) || latestSessionsByInspector.get(insp.id) || null;
      let voiceState = 'NOT_CONNECTED';
      let activeVoice = null;
      if (activeShare) {
        activeVoice = allVoiceSessions.find(v => 
          v.live_share_session_id === activeShare.id && 
          (v.status === VOICE_SESSION_STATUSES.CONNECTED || v.status === VOICE_SESSION_STATUSES.REQUESTED)
        );
        if (activeVoice) {
          voiceState = activeVoice.status === VOICE_SESSION_STATUSES.CONNECTED 
            ? 'VOICE_CONNECTED' 
            : 'VOICE_REQUESTED';
        }
      }

      return {
        id: insp.id,
        user_id: insp.user_id,
        name: user.name || insp.name,
        badge_number: insp.badge_number,
        assigned_site_name: insp.assigned_site_name || 'Central Infrastructure Terminal',
        status: insp.status || 'AVAILABLE',
        is_online: true,
        live_share_status: activeShare ? (activeShare.source_type === 'SCREEN' ? 'SCREEN_LIVE' : 'CAMERA_LIVE') : 'NOT_SHARING',
        voice_status: voiceState,
        active_voice: activeVoice || null,
        active_session: activeShare || null
      };
    });

    res.json({
      success: true,
      active_count: deduplicatedActiveSessions.length,
      active_sessions: deduplicatedActiveSessions,
      inspectors: inspectorRoster
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get live share history
 * GET /api/live-share/history
 */
async function getHistory(req, res) {
  try {
    const history = db.getAll(TABLES.LIVE_SHARE_HISTORY);
    res.json({
      success: true,
      count: history.length,
      data: history.slice(-50).reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Post WebRTC Signaling Packet (SDP Offer/Answer or ICE Candidate)
 * POST /api/live-share/signal
 */
async function postSignal(req, res) {
  try {
    const { session_id, target_role, type, signal_data } = req.body;
    if (!session_id || !type || !signal_data) {
      return res.status(400).json({ success: false, error: 'Session ID, type, and signal_data are required.' });
    }

    purgeOldSignals();

    const isManagementRole = (r) => [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DIRECTOR].includes(r);
    const defaultTarget = req.user.role === ROLES.INSPECTOR ? 'MANAGEMENT' : 'INSPECTOR';

    const packet = {
      id: `sig-${uuidv4().slice(0, 8)}`,
      session_id,
      sender_id: req.user.id,
      sender_role: req.user.role,
      target_role: target_role || defaultTarget,
      type, // 'offer', 'answer', 'ice-candidate', 'hangup'
      signal_data,
      timestamp: Date.now()
    };

    db.insert(TABLES.LIVE_SHARE_SIGNALS, packet);

    // Cross-container serverless broadcast via instant cloud bus
    const cleanId = String(session_id).replace(/[^a-zA-Z0-9_-]/g, '_');
    await publishCloudBus(`inspectra_webrtc_sig_${cleanId}`, packet);

    res.json({ success: true, message: 'Signal registered.', packet_id: packet.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get WebRTC Signaling Packets for a session
 * GET /api/live-share/signals/:session_id
 */
async function getSignals(req, res) {
  try {
    const { session_id } = req.params;
    const { after_timestamp = 0 } = req.query;

    let allSignals = db.find(TABLES.LIVE_SHARE_SIGNALS, { session_id }) || [];

    // Also pull signals from the cross-container bus to bridge separate serverless lambdas
    const cleanId = String(session_id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const busSignals = await queryCloudBus(`inspectra_webrtc_sig_${cleanId}`, '5m');
    busSignals.forEach(sig => {
      if (!sig || sig.session_id !== session_id) return;
      const isDuplicate = allSignals.some(s => {
        if (sig.id && s.id) return s.id === sig.id;
        return s.type === sig.type && Math.abs((s.timestamp || 0) - (sig.timestamp || 0)) < 1000;
      });
      if (!isDuplicate) {
        if (!sig.id) sig.id = `sig-${uuidv4().slice(0, 8)}`;
        allSignals.push(sig);
        try { db.insert(TABLES.LIVE_SHARE_SIGNALS, sig); } catch (e) {}
      }
    });

    const isCallerManagement = [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.DIRECTOR].includes(req.user.role);

    // Filter signals targeted to the caller and newer than cursor, ignoring self-signals
    const incoming = allSignals.filter(s => {
      if (s.sender_id === req.user.id) return false;
      if (s.timestamp <= Number(after_timestamp)) return false;

      // Target matching
      if (s.target_role === 'ALL') return true;
      if (s.target_role === req.user.role) return true;
      if (isCallerManagement && (s.target_role === 'MANAGEMENT' || s.target_role === 'ADMIN' || s.target_role === 'SUPERVISOR' || s.target_role === 'DIRECTOR')) {
        return true;
      }
      if (!isCallerManagement && s.target_role === 'INSPECTOR') {
        return true;
      }
      return false;
    });

    res.json({
      success: true,
      count: incoming.length,
      signals: incoming
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Admin requests Voice Chat for an active live share session or directly for an inspector (Voice Only)
 * POST /api/live-share/voice/request
 */
async function requestVoiceChat(req, res) {
  try {
    const { live_share_session_id, inspector_id } = req.body;
    if (!live_share_session_id && !inspector_id) {
      return res.status(400).json({ success: false, error: 'Live share session ID or Inspector ID is required.' });
    }

    let session = null;
    if (live_share_session_id) {
      session = db.getById(TABLES.LIVE_SHARES, live_share_session_id);
      if (!session) {
        // Cross-container fallback lookup
        const busEvents = await queryCloudBus(CLOUD_BUS_TOPICS.ACTIVE_SHARES);
        for (const item of busEvents) {
          if (item.event === 'START' && item.session && item.session.id === live_share_session_id) {
            session = item.session;
            try { db.insert(TABLES.LIVE_SHARES, session); } catch (e) {}
            break;
          }
        }
      }
    }
    if (!session && inspector_id) {
      session = db.findOne(TABLES.LIVE_SHARES, { inspector_id, status: LIVE_SHARE_STATUSES.ACTIVE });
    }

    let inspector = null;
    if (session) {
      inspector = db.getById(TABLES.USERS, session.inspector_id) || db.getById(TABLES.INSPECTORS, session.inspector_id);
    } else if (inspector_id) {
      inspector = db.getById(TABLES.USERS, inspector_id) || db.findOne(TABLES.USERS, { username: inspector_id }) || db.getById(TABLES.INSPECTORS, inspector_id);
    }

    if (!inspector && !session) {
      return res.status(404).json({ success: false, error: 'Target inspector or active session not found.' });
    }

    const effectiveInspectorId = session ? session.inspector_id : inspector.id;
    const effectiveInspectorName = session ? session.inspector_name : (inspector.name || 'Inspector');

    // If no live share session existed, create a VOICE session container
    if (!session) {
      const newSessionId = `sess-voice-${uuidv4().slice(0, 8)}`;
      session = {
        id: newSessionId,
        inspector_id: effectiveInspectorId,
        inspector_name: effectiveInspectorName,
        source_type: 'VOICE',
        peer_id: `peer-voice-${effectiveInspectorId}`,
        status: LIVE_SHARE_STATUSES.ACTIVE,
        started_at: new Date().toISOString()
      };
      db.insert(TABLES.LIVE_SHARES, session);
    }

    // End any previous voice session on this live share
    const existing = db.find(TABLES.VOICE_SESSIONS, { live_share_session_id: session.id });
    existing.forEach(v => {
      if (v.status === VOICE_SESSION_STATUSES.REQUESTED || v.status === VOICE_SESSION_STATUSES.CONNECTED) {
        db.update(TABLES.VOICE_SESSIONS, v.id, { status: VOICE_SESSION_STATUSES.ENDED, ended_at: new Date().toISOString() });
      }
    });

    const voiceSessionId = `voice-${uuidv4().slice(0, 8)}`;
    const voiceSession = {
      id: voiceSessionId,
      live_share_session_id: session.id,
      admin_id: req.user.id,
      admin_name: req.user.name,
      inspector_id: effectiveInspectorId,
      status: VOICE_SESSION_STATUSES.REQUESTED,
      started_at: null,
      ended_at: null,
      created_at: new Date().toISOString()
    };

    db.insert(TABLES.VOICE_SESSIONS, voiceSession);

    // Cross-container sync for voice session
    await publishCloudBus(CLOUD_BUS_TOPICS.VOICE, { event: 'REQUEST', voiceSession });

    // Notify inspector in real time
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: effectiveInspectorId,
        type: 'VOICE_REQUESTED',
        title: '🎤 Voice Chat Requested',
        message: `${req.user.name} wants to talk with you about this inspection.`,
        voice_session_id: voiceSessionId,
        live_share_session_id: session.id,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Voice chat requested. Waiting for inspector to accept.',
      data: voiceSession,
      session_id: session.id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Inspector responds (Accept / Decline) to voice chat request
 * POST /api/live-share/voice/respond
 */
async function respondVoiceChat(req, res) {
  try {
    const { voice_session_id, live_share_session_id, status } = req.body;
    let voiceSession = null;

    if (voice_session_id) {
      voiceSession = db.getById(TABLES.VOICE_SESSIONS, voice_session_id);
      if (!voiceSession) {
        // Cross-container fallback for voice session
        const busEvents = await queryCloudBus(CLOUD_BUS_TOPICS.VOICE);
        for (const item of busEvents) {
          if (item.event === 'REQUEST' && item.voiceSession && item.voiceSession.id === voice_session_id) {
            voiceSession = item.voiceSession;
            try { db.insert(TABLES.VOICE_SESSIONS, voiceSession); } catch (e) {}
            break;
          }
        }
      }
    } else if (live_share_session_id) {
      voiceSession = db.findOne(TABLES.VOICE_SESSIONS, { 
        live_share_session_id, 
        status: VOICE_SESSION_STATUSES.REQUESTED 
      });
    }

    if (!voiceSession) {
      return res.status(404).json({ success: false, error: 'Voice chat session not found.' });
    }

    const isAccepted = status?.toUpperCase() === 'ACCEPTED';
    const newStatus = isAccepted ? VOICE_SESSION_STATUSES.CONNECTED : VOICE_SESSION_STATUSES.DECLINED;
    const updatePayload = {
      status: newStatus,
      responded_at: new Date().toISOString()
    };
    if (isAccepted) {
      updatePayload.started_at = new Date().toISOString();
    }

    db.update(TABLES.VOICE_SESSIONS, voiceSession.id, updatePayload);

    await publishCloudBus(CLOUD_BUS_TOPICS.VOICE, { event: 'RESPOND', voiceSessionId: voiceSession.id, status: newStatus });

    // Notify requesting Admin
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: voiceSession.admin_id,
        type: isAccepted ? 'VOICE_CONNECTED' : 'VOICE_DECLINED',
        title: isAccepted ? '🎤 Voice Chat Connected' : 'Voice Chat Declined',
        message: isAccepted 
          ? 'Inspector accepted voice chat. You can now talk in real time.'
          : 'Inspector declined the voice chat request.',
        voice_session_id: voiceSession.id,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Voice chat ${newStatus.toLowerCase()}.`,
      data: { ...voiceSession, ...updatePayload }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * End active voice chat
 * POST /api/live-share/voice/end
 */
async function endVoiceChat(req, res) {
  try {
    const { voice_session_id, live_share_session_id } = req.body;
    let voiceSession = null;

    if (voice_session_id) {
      voiceSession = db.getById(TABLES.VOICE_SESSIONS, voice_session_id);
    } else if (live_share_session_id) {
      voiceSession = db.findOne(TABLES.VOICE_SESSIONS, {
        live_share_session_id,
        status: VOICE_SESSION_STATUSES.CONNECTED
      });
    }

    if (!voiceSession) {
      return res.status(200).json({ success: true, message: 'No active voice chat to end.' });
    }

    db.update(TABLES.VOICE_SESSIONS, voiceSession.id, {
      status: VOICE_SESSION_STATUSES.ENDED,
      ended_at: new Date().toISOString()
    });

    await publishCloudBus(CLOUD_BUS_TOPICS.VOICE, { event: 'END', voiceSessionId: voiceSession.id });

    res.json({
      success: true,
      message: 'Voice chat ended.',
      data: { ...voiceSession, status: VOICE_SESSION_STATUSES.ENDED }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get status of voice chat for a session
 * GET /api/live-share/voice/status/:session_id
 */
async function getVoiceSessionStatus(req, res) {
  try {
    const { session_id } = req.params;
    let voiceSession = db.getById(TABLES.VOICE_SESSIONS, session_id);
    if (!voiceSession) {
      voiceSession = db.findOne(TABLES.VOICE_SESSIONS, {
        live_share_session_id: session_id
      });
    }

    res.json({
      success: true,
      data: voiceSession || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  createRequest,
  getRequests,
  respondRequest,
  startSession,
  stopSession,
  getActiveShares,
  getHistory,
  postSignal,
  getSignals,
  requestVoiceChat,
  respondVoiceChat,
  endVoiceChat,
  getVoiceSessionStatus
};
