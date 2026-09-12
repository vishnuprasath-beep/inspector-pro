import React, { useState, useEffect, useRef } from 'react';
import { 
  runRealtimeYoloDetection, 
  YOLO_DEFECT_TAXONOMY,
  broadcastInspectionStream,
  subscribeToAdminDirectives
} from '../services/yoloVisionService';
import { 
  Scan, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Radio, 
  Layers, 
  Sparkles,
  Camera,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';

const FALLBACK_DEFECT_SCENARIOS = [
  {
    id: 'CONCRETE_SPALLING',
    title: 'Metro Pier Concrete Spalling & Rust',
    category: 'Civil',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=1200&auto=format&fit=crop&q=80',
    description: 'Structural spalling with exposed aggregate and surface delamination.'
  },
  {
    id: 'STRUCTURAL_CRACK',
    title: 'Highway Overpass Tensile Micro-Crack',
    category: 'Civil',
    imageUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&auto=format&fit=crop&q=80',
    description: 'Longitudinal shear fissure extending across load-bearing abutment.'
  },
  {
    id: 'REBAR_EXPOSURE',
    title: 'Bridge Abutment Exposed Rebar Anomaly',
    category: 'Civil',
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1200&auto=format&fit=crop&q=80',
    description: 'Severe concrete detachment exposing rusted steel reinforcement mesh.'
  },
  {
    id: 'SURFACE_CORROSION',
    title: 'Solar Grid High-Voltage Busbar Corrosion',
    category: 'Electrical',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
    description: 'Electrolytic pitting corrosion on metal support framing.'
  }
];

export default function YoloCameraOverlay({
  videoRef,
  mediaStream,
  isStreaming,
  cameraError,
  onCaptureFrame,
  selectedSite,
  inspectorName = 'R. Saravanan',
  inspectorBadge = 'INSP-2024-001',
  activeChecklistItem = null,
  checklist = [],
  isBroadcasting = true,
  isScreenSharing = false
}) {
  const [yoloEnabled, setYoloEnabled] = useState(true);
  const [showScanlines, setShowScanlines] = useState(true);
  const [activeDefectKey, setActiveDefectKey] = useState('CONCRETE_SPALLING');
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [detectionState, setDetectionState] = useState(null);
  const [adminDirective, setAdminDirective] = useState(null);
  const [frameTick, setFrameTick] = useState(0);

  const containerRef = useRef(null);

  // Safely ensure video element has mediaStream attached
  useEffect(() => {
    if (videoRef?.current && mediaStream) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch(e => console.warn('[Video] Play caught:', e));
    }
  }, [mediaStream, isStreaming, videoRef]);

  // 1. Run real-time YOLO tracking loop (animates bounding boxes & confidence)
  useEffect(() => {
    if (!yoloEnabled) {
      setDetectionState(null);
      return;
    }

    const interval = setInterval(() => {
      setFrameTick(t => t + 1);
      const category = selectedSite?.category || 'Civil';
      const result = runRealtimeYoloDetection({
        frameIndex: frameTick,
        assetCategory: category,
        primaryDefectKey: activeDefectKey,
        cameraActive: isStreaming
      });
      setDetectionState(result);
    }, 450); // 450ms updates for smooth responsive UI

    return () => clearInterval(interval);
  }, [yoloEnabled, activeDefectKey, selectedSite, isStreaming, frameTick]);

  // 2. Broadcast live telemetry stream to Admin Command Center
  useEffect(() => {
    const broadcastInterval = setInterval(() => {
      // Grab snapshot preview if video is streaming
      let previewSnapshot = null;
      if (videoRef?.current && isStreaming) {
        try {
          const video = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = 360;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, 360, 200);
          previewSnapshot = canvas.toDataURL('image/jpeg', 0.6);
        } catch (e) {
          // ignore cross-origin or canvas read error
        }
      } else {
        // Fallback preview
        previewSnapshot = FALLBACK_DEFECT_SCENARIOS[selectedScenarioIndex].imageUrl;
      }

      const completedCount = checklist.filter(c => c.status === 'PASS' || c.status === 'FAIL').length;

      broadcastInspectionStream({
        streamActive: true,
        cameraActive: isStreaming,
        inspector: {
          name: inspectorName,
          badge: inspectorBadge,
          role: 'Lead Field Auditor'
        },
        site: {
          id: selectedSite?.id || 'DEL-MET-02',
          name: selectedSite?.name || 'Delhi Metro Central Terminal (Phase 2)',
          code: selectedSite?.code || 'DEL-MET-02',
          geofenceRadius: selectedSite?.geofence_radius || 650,
          geofenceVerified: true
        },
        activeChecklistItem: activeChecklistItem || 'Pier P-14 Concrete Integrity & Spalling',
        checklistProgress: {
          completed: completedCount,
          total: checklist.length || 4,
          percentage: checklist.length ? Math.round((completedCount / checklist.length) * 100) : 50
        },
        yoloEnabled,
        fps: detectionState?.fps || 27.5,
        primaryFinding: detectionState?.primaryFinding || 'CONCRETE_SPALLING',
        primarySeverity: detectionState?.primarySeverity || 'CRITICAL',
        detections: detectionState?.detections || [],
        previewSnapshot,
        timestamp: Date.now()
      });
    }, 1800); // Broadcast every 1.8s

    return () => clearInterval(broadcastInterval);
  }, [
    isStreaming, 
    detectionState, 
    yoloEnabled, 
    selectedSite, 
    inspectorName, 
    inspectorBadge, 
    activeChecklistItem, 
    checklist, 
    selectedScenarioIndex
  ]);

  // 3. Listen for real-time incoming Admin Directives
  useEffect(() => {
    const unsubscribe = subscribeToAdminDirectives((directive) => {
      setAdminDirective(directive);
      // Auto-hide directive banner after 10s
      setTimeout(() => setAdminDirective(null), 10000);
    });
    return () => unsubscribe();
  }, []);

  const activeScenario = FALLBACK_DEFECT_SCENARIOS[selectedScenarioIndex];

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#05070a',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* 1. Hardware Video Stream: Permanently mounted in DOM so videoRef.current is never null */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isStreaming ? 'block' : 'none'
        }}
      />

      {/* Fallback Simulated Asset Feed when camera is idle */}
      {!isStreaming && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src={activeScenario.imageUrl}
            alt={activeScenario.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.85) contrast(1.1)'
            }}
          />
          {/* Fallback Mode Banner */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              padding: '8px 14px',
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={16} color="#f59e0b" />
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Inspector Field Mode • {cameraError ? 'Camera Standby' : 'Simulation Feed'}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>
                  {activeScenario.title} ({activeScenario.category})
                </p>
              </div>
            </div>

            {/* Scenario Switcher Buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {FALLBACK_DEFECT_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioIndex(idx);
                    setActiveDefectKey(sc.id);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: selectedScenarioIndex === idx ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)',
                    backgroundColor: selectedScenarioIndex === idx ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: selectedScenarioIndex === idx ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {sc.id.split('_')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Cybernetic Scanline Matrix Overlay (Toggleable) */}
      {showScanlines && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
            backgroundSize: '100% 3px, 6px 100%',
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0.65
          }}
        />
      )}

      {/* 3. Crosshair Center Reticle */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 44,
          height: 44,
          pointerEvents: 'none',
          zIndex: 12,
          opacity: 0.75
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 21, width: 2, height: 12, backgroundColor: 'rgba(56, 189, 248, 0.8)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 21, width: 2, height: 12, backgroundColor: 'rgba(56, 189, 248, 0.8)' }} />
        <div style={{ position: 'absolute', top: 21, left: 0, height: 2, width: 12, backgroundColor: 'rgba(56, 189, 248, 0.8)' }} />
        <div style={{ position: 'absolute', top: 21, right: 0, height: 2, width: 12, backgroundColor: 'rgba(56, 189, 248, 0.8)' }} />
        <div style={{ position: 'absolute', top: 20, left: 20, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
      </div>

      {/* 4. Real-time YOLO Bounding Boxes HUD */}
      {yoloEnabled && detectionState?.detections?.map((det, index) => {
        const isCritical = det.severity === 'CRITICAL';
        return (
          <div
            key={det.id || index}
            style={{
              position: 'absolute',
              left: `${det.box.x}%`,
              top: `${det.box.y}%`,
              width: `${det.box.width}%`,
              height: `${det.box.height}%`,
              border: `2px solid ${det.color}`,
              backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.08)',
              boxShadow: `0 0 16px ${det.color}40, inset 0 0 12px ${det.color}25`,
              borderRadius: 4,
              pointerEvents: 'none',
              zIndex: 15,
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Corner Tech Reticles */}
            <div style={{ position: 'absolute', top: -3, left: -3, width: 8, height: 8, borderTop: `3px solid ${det.color}`, borderLeft: `3px solid ${det.color}` }} />
            <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderTop: `3px solid ${det.color}`, borderRight: `3px solid ${det.color}` }} />
            <div style={{ position: 'absolute', bottom: -3, left: -3, width: 8, height: 8, borderBottom: `3px solid ${det.color}`, borderLeft: `3px solid ${det.color}` }} />
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 8, height: 8, borderBottom: `3px solid ${det.color}`, borderRight: `3px solid ${det.color}` }} />

            {/* Floating Top Defect Label Pill */}
            <div
              style={{
                position: 'absolute',
                top: -24,
                left: -2,
                backgroundColor: det.color,
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                whiteSpace: 'nowrap'
              }}
            >
              <Zap size={11} />
              <span>{det.label}</span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.35)', padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>
                {det.confidenceScore}%
              </span>
            </div>

            {/* Bottom Spec Code Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: -18,
                right: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: det.color,
                border: `1px solid ${det.color}50`,
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: 8.5,
                fontWeight: 700
              }}
            >
              {det.specCode}
            </div>
          </div>
        );
      })}

      {/* 5. Real-Time HUD Telemetry Header */}
      <div
        style={{
          position: 'absolute',
          top: isStreaming ? 12 : 54,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
          zIndex: 25
        }}
      >
        {/* Left: AI & Model Status Badge + Cloud Broadcast Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 10px',
              backgroundColor: 'rgba(10, 15, 25, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 6
            }}
          >
            <div 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: yoloEnabled ? '#10b981' : '#64748b',
                boxShadow: yoloEnabled ? '0 0 8px #10b981' : 'none'
              }} 
            />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#ffffff', letterSpacing: 0.5 }}>
              {yoloEnabled ? 'YOLOv8 VISION CORE' : 'VISION PAUSED'}
            </span>
            {yoloEnabled && detectionState && (
              <span style={{ fontSize: 9.5, color: '#38bdf8', fontWeight: 600 }}>
                {detectionState.fps} FPS
              </span>
            )}
          </div>

          {/* Cloud Broadcast Status Pill */}
          {isBroadcasting && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 9px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 6,
                backdropFilter: 'blur(8px)'
              }}
              title="Transmitting live optical feed & YOLO telemetry to Admin Command Center across the Cloud"
            >
              <Radio size={12} color="#ef4444" className="pulse-active" />
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fca5a5' }}>
                {isScreenSharing ? 'SCREEN SHARE LIVE' : 'LIVE TO ADMIN'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls & Toggles */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setYoloEnabled(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              backgroundColor: yoloEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.8)',
              border: `1px solid ${yoloEnabled ? '#10b981' : '#475569'}`,
              borderRadius: 6,
              color: yoloEnabled ? '#34d399' : '#94a3b8',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {yoloEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>YOLO {yoloEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowScanlines(v => !v)}
            title="Toggle Scanline Grid"
            style={{
              padding: '5px 8px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: showScanlines ? '#38bdf8' : '#64748b',
              fontSize: 10,
              cursor: 'pointer'
            }}
          >
            <Layers size={13} />
          </button>
        </div>
      </div>

      {/* 6. Admin Real-Time Directive Banner (If Received) */}
      {adminDirective && (
        <div
          style={{
            position: 'absolute',
            bottom: 74,
            left: 12,
            right: 12,
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #f87171',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 40,
            animation: 'pulse 1.8s infinite',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)'
          }}
        >
          <Radio size={20} color="#ffffff" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
              DIRECTIVE FROM ADMIN ({adminDirective.sender || 'HQ COMMAND'})
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#fee2e2', fontWeight: 500 }}>
              {adminDirective.message || 'Please maintain camera focus on critical rebar spalling.'}
            </p>
          </div>
          <button
            onClick={() => setAdminDirective(null)}
            style={{
              padding: '3px 8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              fontSize: 10,
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            ACK
          </button>
        </div>
      )}

      {/* 7. Bottom Detection Status HUD */}
      {yoloEnabled && detectionState?.detections?.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            padding: '8px 12px',
            backgroundColor: 'rgba(10, 15, 25, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 25
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} color={detectionState.detections[0].color} />
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#ffffff' }}>
                {detectionState.detections[0].label}
              </p>
              <p style={{ margin: 0, fontSize: 9.5, color: '#94a3b8' }}>
                {detectionState.detections[0].mitigationAdvice}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 7px',
                fontSize: 9,
                fontWeight: 800,
                borderRadius: 4,
                backgroundColor: `${detectionState.detections[0].color}25`,
                color: detectionState.detections[0].color,
                border: `1px solid ${detectionState.detections[0].color}50`
              }}
            >
              {detectionState.detections[0].severity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
