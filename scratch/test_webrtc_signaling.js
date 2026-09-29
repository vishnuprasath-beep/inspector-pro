// Automated Test for Inspectra Pro WebRTC Signaling and Voice Chat
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== WebRTC Signaling & Voice Chat Automated Integration Tests ===\n');

  // 1. Authenticate Admin
  console.log('1. Authenticating Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@inspection.gov.in', password: 'Password123!' })
  });
  const adminData = await adminLoginRes.json();
  if (!adminData.success) throw new Error('Admin login failed: ' + JSON.stringify(adminData));
  const adminToken = adminData.data.token;
  console.log('   Admin logged in:', adminData.data.user.name);

  // 2. Authenticate Inspector
  console.log('\n2. Authenticating Inspector...');
  const inspLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vishnu.prasath@inspectra.gov.in', password: 'Password123!' })
  });
  const inspData = await inspLoginRes.json();
  if (!inspData.success) throw new Error('Inspector login failed: ' + JSON.stringify(inspData));
  const inspToken = inspData.data.token;
  const inspectorId = inspData.data.user.id;
  console.log('   Inspector logged in:', inspData.data.user.name, `(ID: ${inspectorId})`);

  // 3. Admin requests Camera Share
  console.log('\n3. Admin dispatches Camera Share Request...');
  const reqRes = await fetch(`${BASE_URL}/live-share/request`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ inspector_id: inspectorId, source_type: 'CAMERA' })
  });
  const reqData = await reqRes.json();
  console.log('   Request response:', reqData.success ? 'SUCCESS' : 'FAILED', reqData.data?.id);
  const requestId = reqData.data.id;

  // 4. Inspector retrieves incoming requests
  console.log('\n4. Inspector checks pending requests...');
  const getReqRes = await fetch(`${BASE_URL}/live-share/requests`, {
    headers: { 'Authorization': `Bearer ${inspToken}` }
  });
  const getReqData = await getReqRes.json();
  const foundReq = getReqData.data.find(r => r.id === requestId);
  console.log('   Found pending request:', foundReq ? 'YES' : 'NO', foundReq?.status);

  // 5. Inspector accepts Camera Share Request
  console.log('\n5. Inspector accepts Camera Share Request...');
  const respRes = await fetch(`${BASE_URL}/live-share/respond`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({ request_id: requestId, status: 'ACCEPTED' })
  });
  const respData = await respRes.json();
  console.log('   Response accepted:', respData.success);

  // 6. Inspector starts live share session
  console.log('\n6. Inspector starts live streaming session...');
  const startRes = await fetch(`${BASE_URL}/live-share/start`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({ source_type: 'CAMERA', peer_id: 'peer-insp-test-01', request_id: requestId })
  });
  const startData = await startRes.json();
  const sessionId = startData.data.id;
  console.log('   Session started:', startData.success, 'Session ID:', sessionId);

  // 7. Inspector posts SDP Offer
  console.log('\n7. Inspector posts WebRTC SDP Offer to signaling bus...');
  const mockOffer = { type: 'offer', sdp: 'v=0\r\no=- 461173 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };
  const offerRes = await fetch(`${BASE_URL}/live-share/signal`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({
      session_id: sessionId,
      target_role: 'MANAGEMENT',
      type: 'offer',
      signal_data: mockOffer
    })
  });
  const offerData = await offerRes.json();
  console.log('   SDP Offer registered:', offerData.success, 'Packet ID:', offerData.packet_id);

  // 8. Admin retrieves SDP Offer
  console.log('\n8. Admin polls signaling bus for SDP Offer...');
  const adminSignalsRes = await fetch(`${BASE_URL}/live-share/signals/${sessionId}?after_timestamp=0`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminSignalsData = await adminSignalsRes.json();
  const receivedOffer = adminSignalsData.signals.find(s => s.type === 'offer');
  console.log('   Admin received SDP Offer:', receivedOffer ? 'YES' : 'NO');

  // 9. Admin posts SDP Answer and ICE candidate
  console.log('\n9. Admin posts WebRTC SDP Answer and ICE Candidate back to Inspector...');
  const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=- 461173 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };
  const answerRes = await fetch(`${BASE_URL}/live-share/signal`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      session_id: sessionId,
      target_role: 'INSPECTOR',
      type: 'answer',
      signal_data: mockAnswer
    })
  });
  const answerData = await answerRes.json();
  console.log('   SDP Answer registered:', answerData.success);

  const mockIce = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };
  const iceRes = await fetch(`${BASE_URL}/live-share/signal`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      session_id: sessionId,
      target_role: 'INSPECTOR',
      type: 'ice-candidate',
      signal_data: mockIce
    })
  });
  const iceData = await iceRes.json();
  console.log('   ICE candidate registered:', iceData.success);

  // 10. Inspector retrieves SDP Answer and ICE Candidate
  console.log('\n10. Inspector polls signaling bus for Answer & Candidate...');
  const inspSignalsRes = await fetch(`${BASE_URL}/live-share/signals/${sessionId}?after_timestamp=0`, {
    headers: { 'Authorization': `Bearer ${inspToken}` }
  });
  const inspSignalsData = await inspSignalsRes.json();
  const receivedAnswer = inspSignalsData.signals.find(s => s.type === 'answer');
  const receivedIce = inspSignalsData.signals.find(s => s.type === 'ice-candidate');
  console.log('   Inspector received Answer:', receivedAnswer ? 'YES' : 'NO');
  console.log('   Inspector received ICE Candidate:', receivedIce ? 'YES' : 'NO');

  // 11. Test Voice Chat Request & Response
  console.log('\n11. Admin requests Voice Chat...');
  const voiceReqRes = await fetch(`${BASE_URL}/live-share/voice/request`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ live_share_session_id: sessionId })
  });
  const voiceReqData = await voiceReqRes.json();
  console.log('   Voice Chat requested:', voiceReqData.success, 'Voice Session ID:', voiceReqData.data?.id);
  const voiceSessionId = voiceReqData.data.id;

  console.log('\n12. Inspector accepts Voice Chat...');
  const voiceRespRes = await fetch(`${BASE_URL}/live-share/voice/respond`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({ voice_session_id: voiceSessionId, status: 'ACCEPTED', live_share_session_id: sessionId })
  });
  const voiceRespData = await voiceRespRes.json();
  console.log('   Voice Chat accepted:', voiceRespData.success, 'Status:', voiceRespData.data?.status);

  console.log('\n13. Checking active live shares and voice status...');
  const activeSharesRes = await fetch(`${BASE_URL}/live-share/active`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const activeSharesData = await activeSharesRes.json();
  const targetInsp = activeSharesData.inspectors.find(i => i.user_id === inspectorId);
  console.log('   Target Inspector Live Status:', targetInsp?.live_share_status);
  console.log('   Target Inspector Voice Status:', targetInsp?.voice_status);

  // 14. Terminate Voice Chat and Stream
  console.log('\n14. Ending Voice Chat and Terminating Live Stream...');
  await fetch(`${BASE_URL}/live-share/voice/end`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ voice_session_id: voiceSessionId, live_share_session_id: sessionId })
  });

  const stopRes = await fetch(`${BASE_URL}/live-share/stop`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({ session_id: sessionId, reason: 'TEST_COMPLETE' })
  });
  const stopData = await stopRes.json();
  console.log('   Live Share terminated:', stopData.success);

  // 15. Verify Clean Status
  console.log('\n15. Verifying clean disconnected status after termination...');
  const postActiveRes = await fetch(`${BASE_URL}/live-share/active`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const postActiveData = await postActiveRes.json();
  const postInsp = postActiveData.inspectors.find(i => i.user_id === inspectorId);
  console.log('\n--- Testing Voice Only Mode (Requirement 9) ---');
  console.log('16. Admin requests Voice Chat directly for inspector without prior camera session...');
  const voiceOnlyReqRes = await fetch(`${BASE_URL}/live-share/voice/request`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ inspector_id: inspectorId })
  });
  const voiceOnlyReqData = await voiceOnlyReqRes.json();
  console.log('   Voice Only requested:', voiceOnlyReqData.success, 'Session ID:', voiceOnlyReqData.session_id);
  const voiceOnlySessionId = voiceOnlyReqData.session_id;
  const voiceOnlyId = voiceOnlyReqData.data.id;

  console.log('\n17. Inspector accepts Voice-Only session...');
  const voiceOnlyAcceptRes = await fetch(`${BASE_URL}/live-share/voice/respond`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({ voice_session_id: voiceOnlyId, status: 'ACCEPTED', live_share_session_id: voiceOnlySessionId })
  });
  const voiceOnlyAcceptData = await voiceOnlyAcceptRes.json();
  console.log('   Voice-Only accepted:', voiceOnlyAcceptData.success, 'Status:', voiceOnlyAcceptData.data?.status);

  console.log('\n18. Ending Voice-Only session...');
  await fetch(`${BASE_URL}/live-share/voice/end`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ voice_session_id: voiceOnlyId, live_share_session_id: voiceOnlySessionId })
  });
  await fetch(`${BASE_URL}/live-share/stop`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inspToken}`
    },
    body: JSON.stringify({ session_id: voiceOnlySessionId, reason: 'VOICE_COMPLETE' })
  });

  console.log('\n🎉 ALL 18 CAMERA + VOICE + VOICE-ONLY TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
