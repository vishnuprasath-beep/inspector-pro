const db = require('../config/db');
const { TABLES, LIVE_SHARE_SOURCES, LIVE_SHARE_STATUSES, VOICE_SESSION_STATUSES, ROLES } = require('../models/schema');
const { v4: uuidv4 } = require('uuid');

// In-memory WebRTC signaling message exchange buffer
// Key: session_id, Value: array of { id, sender_role, type, data, timestamp }
const signalingExchange = new Map();

/**
 * Clean up old signaling buffers older than 1 hour
 */
function purgeOldSignals() {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [sessionId, signals] of signalingExchange.entries()) {
    const recent = signals.filter(s => now - s.timestamp < ONE_HOUR);
    if (recent.length === 0) {
      signalingExchange.delete(sessionId);
    } else {
      signalingExchange.set(sessionId, recent);
    }
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

    const inspector = db.getById(TABLES.USERS, inspector_id) || db.findOne(TABLES.USERS, { username: inspector_id });
    if (!inspector) {
      return res.status(404).json({ success: false, error: 'Inspector account not found.' });
    }

    // Cancel any older pending requests for this inspector & source
    const existing = db.find(TABLES.LIVE_SHARE_REQUESTS, { 
      inspector_id: inspector.id, 
      status: LIVE_SHARE_STATUSES.PENDING 
    });
    existing.forEach(r => {
      db.update(TABLES.LIVE_SHARE_REQUESTS, r.id, { status: LIVE_SHARE_STATUSES.EXPIRED });
    });

    const requestId = `req-live-${uuidv4().slice(0, 8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 min expiry

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
    const all = db.getAll(TABLES.LIVE_SHARE_REQUESTS);
    let filtered = all.filter(r => r.status === LIVE_SHARE_STATUSES.PENDING || r.status === LIVE_SHARE_STATUSES.ACCEPTED);

    // If Inspector, only return requests directed to them
    if (req.user.role === ROLES.INSPECTOR) {
      filtered = filtered.filter(r => r.inspector_id === req.user.id);
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

    const shareReq = db.getById(TABLES.LIVE_SHARE_REQUESTS, request_id);
    if (!shareReq) {
      return res.status(404).json({ success: false, error: 'Share request not found.' });
    }

    const isAccepted = status.toUpperCase() === LIVE_SHARE_STATUSES.ACCEPTED;
    const newStatus = isAccepted ? LIVE_SHARE_STATUSES.ACCEPTED : LIVE_SHARE_STATUSES.DECLINED;

    db.update(TABLES.LIVE_SHARE_REQUESTS, request_id, {
      status: newStatus,
      responded_at: new Date().toISOString()
    });

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

    // Check if inspector has an active session already, end it
    const active = db.find(TABLES.LIVE_SHARES, { inspector_id: inspector.id, status: LIVE_SHARE_STATUSES.ACTIVE });
    active.forEach(s => {
      db.update(TABLES.LIVE_SHARES, s.id, { status: LIVE_SHARE_STATUSES.ENDED });
    });

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
    } else {
      // If no session_id provided, find active session for current user
      session = db.findOne(TABLES.LIVE_SHARES, { 
        inspector_id: req.user.id, 
        status: LIVE_SHARE_STATUSES.ACTIVE 
      });
    }

    if (!session) {
      return res.status(200).json({ success: true, message: 'No active session to terminate.' });
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

    // Clean up signaling exchange
    signalingExchange.delete(session.id);

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
    const allInspectors = db.getAll(TABLES.INSPECTORS);
    const users = db.getAll(TABLES.USERS);
    const allVoiceSessions = db.getAll(TABLES.VOICE_SESSIONS) || [];

    // Annotate inspectors with their current live share state & voice state
    const inspectorRoster = allInspectors.map(insp => {
      const user = users.find(u => u.id === insp.user_id) || {};
      const activeShare = activeSessions.find(s => s.inspector_id === insp.user_id);
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
      active_count: activeSessions.length,
      active_sessions: activeSessions,
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

    if (!signalingExchange.has(session_id)) {
      signalingExchange.set(session_id, []);
    }

    const packet = {
      id: `sig-${uuidv4().slice(0, 8)}`,
      session_id,
      sender_id: req.user.id,
      sender_role: req.user.role,
      target_role: target_role || (req.user.role === ROLES.INSPECTOR ? 'ADMIN' : 'INSPECTOR'),
      type, // 'offer', 'answer', 'ice-candidate'
      signal_data,
      timestamp: Date.now()
    };

    signalingExchange.get(session_id).push(packet);

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

    const signals = signalingExchange.get(session_id) || [];
    // Filter signals targeted to the caller's role and newer than cursor
    const incoming = signals.filter(s => 
      s.target_role === req.user.role && 
      s.timestamp > Number(after_timestamp)
    );

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
 * Admin requests Voice Chat for an active live share session
 * POST /api/live-share/voice/request
 */
async function requestVoiceChat(req, res) {
  try {
    const { live_share_session_id } = req.body;
    if (!live_share_session_id) {
      return res.status(400).json({ success: false, error: 'Live share session ID is required.' });
    }

    const session = db.getById(TABLES.LIVE_SHARES, live_share_session_id);
    if (!session || session.status !== LIVE_SHARE_STATUSES.ACTIVE) {
      return res.status(404).json({ success: false, error: 'Active live share session not found.' });
    }

    // End any previous voice session on this live share
    const existing = db.find(TABLES.VOICE_SESSIONS, { live_share_session_id });
    existing.forEach(v => {
      if (v.status === VOICE_SESSION_STATUSES.REQUESTED || v.status === VOICE_SESSION_STATUSES.CONNECTED) {
        db.update(TABLES.VOICE_SESSIONS, v.id, { status: VOICE_SESSION_STATUSES.ENDED, ended_at: new Date().toISOString() });
      }
    });

    const voiceSessionId = `voice-${uuidv4().slice(0, 8)}`;
    const voiceSession = {
      id: voiceSessionId,
      live_share_session_id,
      admin_id: req.user.id,
      admin_name: req.user.name,
      inspector_id: session.inspector_id,
      status: VOICE_SESSION_STATUSES.REQUESTED,
      started_at: null,
      ended_at: null,
      created_at: new Date().toISOString()
    };

    db.insert(TABLES.VOICE_SESSIONS, voiceSession);

    // Notify inspector in real time
    try {
      db.insert(TABLES.NOTIFICATIONS, {
        id: `notif-${uuidv4().slice(0, 8)}`,
        user_id: session.inspector_id,
        type: 'VOICE_REQUESTED',
        title: '🎤 Voice Chat Requested',
        message: `${req.user.name} wants to talk with you about this inspection.`,
        voice_session_id: voiceSessionId,
        live_share_session_id,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Voice chat requested. Waiting for inspector to accept.',
      data: voiceSession
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
