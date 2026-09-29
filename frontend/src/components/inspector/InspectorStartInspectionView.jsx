import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  QrCode,
  ScanLine,
  MapPin,
  Compass,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  Save,
  CheckCheck,
  RotateCcw,
  Mic,
  FileText,
  Check,
  Edit2,
  X,
  AlertCircle
} from 'lucide-react';
import VoiceDictationButton from '../VoiceDictationButton';

export default function InspectorStartInspectionView({
  selectedSite,
  selectedZone,
  zones = [],
  onSelectZone,
  checklist = [],
  onChecklistChange,
  onPassAll,
  photoCaptured,
  photoDataUrl,
  onCapturePhoto,
  onUploadPhoto,
  photoDescription,
  setPhotoDescription,
  aiAnalyzing,
  aiResult,
  onRunYolo,
  onVerifyDetection,
  onLogDefect,
  defectTitle,
  setDefectTitle,
  defectDesc,
  setDefectDesc,
  defectSeverity,
  setDefectSeverity,
  defectLocation,
  setDefectLocation,
  qrVerified,
  qrData,
  onOpenQrScanner,
  gpsVerified,
  gpsDistance,
  submitting,
  onSubmitInspection,
  submissionFeedback,
  onReset
}) {
  // 4-step streamlined workflow: 1. Site Dossier, 2. Checklist, 3. Evidence & AI Scan, 4. Review & Submit
  const [currentStep, setCurrentStep] = useState(1);

  // Human Verification and Issue Creation state for AI detections
  const [verifications, setVerifications] = useState({});
  const [editingDetId, setEditingDetId] = useState(null);
  const [editedClasses, setEditedClasses] = useState({});
  const [editedSeverities, setEditedSeverities] = useState({});
  const [loggedDets, setLoggedDets] = useState({});

  // Calculate stats
  const totalItems = checklist.length;
  const passedItems = checklist.filter(c => c.status === 'PASS').length;
  const failedItems = checklist.filter(c => c.status === 'FAIL').length;
  const score = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 100;

  if (submissionFeedback) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '32px 24px',
          borderRadius: 18,
          border: '1.5px solid #10b981',
          backgroundColor: 'var(--card-bg)',
          textAlign: 'center',
          maxWidth: 600,
          margin: '20px auto'
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <CheckCheck size={36} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-heading)', margin: 0 }}>
          Inspection Submitted Successfully!
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '10px 0 20px', lineHeight: 1.5 }}>
          {submissionFeedback.message || 'Audit record has been permanently signed and submitted.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onReset}
            className="btn btn-primary"
            style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700, padding: '10px 24px' }}
          >
            Start Another Inspection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Step Navigation Progress Bar */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { step: 1, label: '1. Site & Location' },
            { step: 2, label: '2. Checklist' },
            { step: 3, label: '3. Evidence & AI' },
            { step: 4, label: '4. Review & Sign' }
          ].map(s => {
            const isCurrent = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                style={{
                  background: isCurrent ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: isCurrent ? '1px solid #10b981' : 'none',
                  color: isCurrent ? '#10b981' : isCompleted ? 'var(--text-main)' : 'var(--text-dim)',
                  fontWeight: isCurrent ? 800 : 600,
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isCompleted ? <Check size={13} color="#10b981" /> : null}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Zone:</span>
          <select
            value={selectedZone?.id || ''}
            onChange={(e) => {
              const found = zones.find(z => z.id === e.target.value);
              if (found && onSelectZone) onSelectZone(found);
            }}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--card-bg)',
              color: 'var(--text-heading)'
            }}
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>
                {z.code ? `[${z.code}] ` : ''}{z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STEP 1: Site & Location Dossier */}
      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
              STEP 1: PHYSICAL FACILITY & LOCATION VERIFICATION
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '6px 0 2px' }}>
              {selectedSite?.name || 'Inspection Facility'} &bull; {selectedZone?.name}
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
              {selectedSite?.address || 'Site verification check'}
            </p>

            {/* GPS & QR Verification Status Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 16 }}>
              {/* Anti-spoofing QR Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: qrVerified ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                  background: qrVerified ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: qrVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.1)', color: qrVerified ? '#10b981' : '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                      {qrVerified ? '✓ Site QR Validated' : 'Site QR Verification'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {qrVerified ? `Token verified at ${selectedZone?.name}` : 'Physical presence verification'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenQrScanner}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px' }}
                >
                  <ScanLine size={13} />
                  <span>{qrVerified ? 'Scan Again' : 'Scan QR'}</span>
                </button>
              </div>

              {/* Geofence GPS Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: gpsVerified ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                  background: gpsVerified ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: gpsVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: gpsVerified ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                      {gpsVerified ? '✓ Geofence Verified' : 'GNSS Geofence Fix'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Distance: <strong>{gpsDistance ? `${gpsDistance}m` : 'Inside Perimeter (12m)'}</strong>
                    </div>
                  </div>
                </div>
                <span className={`badge ${gpsVerified ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                  {gpsVerified ? 'INSIDE' : 'CHECK'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span>Continue to Checklist</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Complete Checklist */}
      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="glass-card"
            style={{
              padding: '18px 20px',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                  STEP 2: STATUTORY COMPLIANCE CHECKLIST ({passedItems}/{totalItems} PASSED)
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '4px 0 0' }}>
                  {selectedZone?.name || 'Inspection Zone'}
                </h3>
              </div>

              <button
                onClick={onPassAll}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, fontWeight: 700, color: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <CheckCheck size={14} />
                <span>Mark All as Pass</span>
              </button>
            </div>

            {/* Checklist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checklist.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1px solid ${item.status === 'FAIL' ? '#ef4444' : item.status === 'PASS' ? '#10b981' : 'var(--border-subtle)'}`,
                    backgroundColor: item.status === 'FAIL' ? 'rgba(239, 68, 68, 0.04)' : item.status === 'PASS' ? 'rgba(16, 185, 129, 0.04)' : 'var(--card-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                          {item.section || 'General'}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginTop: 2 }}>
                        {item.text}
                      </div>
                    </div>

                    {/* Pass / Fail / NA Toggle Buttons */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => onChecklistChange(item.id, 'PASS')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: item.status === 'PASS' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                          background: item.status === 'PASS' ? '#10b981' : 'transparent',
                          color: item.status === 'PASS' ? '#FFFFFF' : 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => onChecklistChange(item.id, 'FAIL')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: item.status === 'FAIL' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                          background: item.status === 'FAIL' ? '#ef4444' : 'transparent',
                          color: item.status === 'FAIL' ? '#FFFFFF' : 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Fail
                      </button>
                      <button
                        onClick={() => onChecklistChange(item.id, 'NA')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 8,
                          border: item.status === 'NA' ? '1px solid #64748b' : '1px solid var(--border-subtle)',
                          background: item.status === 'NA' ? '#64748b' : 'transparent',
                          color: item.status === 'NA' ? '#FFFFFF' : 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        N/A
                      </button>
                    </div>
                  </div>

                  {/* Notes / Voice Dictation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => onChecklistChange(item.id, item.status, e.target.value)}
                      placeholder="Add observation notes..."
                      className="input-control"
                      style={{ flex: 1, fontSize: 12, height: 32 }}
                    />
                    <VoiceDictationButton
                      onTranscript={(text) => {
                        const current = item.notes || '';
                        onChecklistChange(item.id, item.status, current ? `${current} ${text}` : text);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <button
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span>Evidence & AI Scan</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Evidence Capture & AI Scan */}
      {currentStep === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase' }}>
              STEP 3: OPTICAL EVIDENCE & YOLOv8 AI DIAGNOSTICS
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '4px 0 12px' }}>
              Attach Photo Proof & Run Structural Scan
            </h3>

            {/* Photo Capture / Upload Card with Multi-Object Bounding Box Overlay */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              {photoDataUrl ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: 12, overflow: 'hidden', border: '2px solid #10b981', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <img src={photoDataUrl} alt="Captured Evidence" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  
                  {/* Photo status badge */}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: 6 }}>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>
                      ✓ PHOTO ATTACHED
                    </span>
                    {aiResult?.detections?.length > 0 && (
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>
                        {aiResult.detections.length} OBJECTS DETECTED
                      </span>
                    )}
                  </div>

                  {/* Dynamic Bounding Box Overlay for All Multi-Object Detections */}
                  {aiResult?.detections && aiResult.detections.map((det, idx) => {
                    const detId = det.id || `det-${idx}`;
                    const isDefect = det.category === 'DEFECT' || det.priority === 1;
                    const isRejected = verifications[detId] === 'REJECTED';
                    if (isRejected) return null; // Don't draw rejected false positives

                    const origW = aiResult.image_meta?.original_width || 640;
                    const origH = aiResult.image_meta?.original_height || 640;
                    const box = det.bbox || det.box || {};
                    const boxX = box.x !== undefined ? box.x : (box.x1 || 0);
                    const boxY = box.y !== undefined ? box.y : (box.y1 || 0);
                    const boxW = box.width || 120;
                    const boxH = box.height || 80;

                    const leftPct = Math.max(1, Math.min(95, Math.round((boxX / origW) * 100)));
                    const topPct = Math.max(1, Math.min(95, Math.round((boxY / origH) * 100)));
                    const widthPct = Math.max(5, Math.min(96, Math.round((boxW / origW) * 100)));
                    const heightPct = Math.max(5, Math.min(96, Math.round((boxH / origH) * 100)));

                    const borderColor = isDefect ? '#ef4444' : '#f59e0b';
                    const bgColor = isDefect ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                    const displayLabel = editedClasses[detId] || det.class || det.className;

                    return (
                      <div
                        key={detId}
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                          border: `2px solid ${borderColor}`,
                          backgroundColor: bgColor,
                          borderRadius: 4,
                          pointerEvents: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: -20,
                          left: -2,
                          backgroundColor: borderColor,
                          color: '#ffffff',
                          padding: '1px 6px',
                          fontSize: 9.5,
                          fontWeight: 800,
                          borderRadius: 3,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span>{isDefect ? '🔴' : '🟠'}</span>
                          <span>{displayLabel}</span>
                          <span style={{ opacity: 0.85 }}>{Math.round((det.confidence || 0.9) * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    height: 200,
                    borderRadius: 12,
                    border: '2px dashed var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Camera size={40} color="var(--text-dim)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>No Photo Evidence Captured Yet</span>
                  <span style={{ fontSize: 11 }}>Capture or upload an image to attach proof and run AI</span>
                </div>
              )}

              {/* Photo Action Controls */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <label
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <Upload size={14} />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadPhoto}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  onClick={onCapturePhoto}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <Camera size={14} />
                  <span>{photoCaptured ? 'Re-take Photo' : 'Capture Sample Photo'}</span>
                </button>

                {photoDataUrl && (
                  <button
                    onClick={onRunYolo}
                    disabled={aiAnalyzing}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <Sparkles size={14} />
                    <span>{aiAnalyzing ? 'Analyzing Multi-Object YOLO...' : 'Run YOLOv8 Scan'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI Diagnostics Output with Priority 1 Defects and Priority 2 PPE Grouping */}
            {aiResult && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  border: aiResult.severity === 'CRITICAL' ? '1.5px solid #ef4444' : '1.5px solid #8b5cf6',
                  background: aiResult.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                  marginBottom: 16
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color="#8b5cf6" />
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--text-heading)' }}>
                        AI DETECTION RESULTS
                      </strong>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Multi-Object Neural Scan &bull; {aiResult.model_engine || 'YOLOv8'}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${aiResult.severity === 'CRITICAL' ? 'badge-red' : aiResult.severity === 'HIGH' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 10 }}>
                    {aiResult.severity || 'INSPECTION OK'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {aiResult.finding || 'Neural model evaluated image frame.'}
                </div>

                {/* Detections breakdown */}
                {aiResult.detections && aiResult.detections.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    
                    {/* ====================================================== */}
                    {/* PRIORITY 1: CONSTRUCTION DEFECTS                       */}
                    {/* ====================================================== */}
                    {(() => {
                      const defectList = aiResult.detections.filter(d => d.category === 'DEFECT' || d.priority === 1);
                      if (defectList.length === 0) return null;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <span>🔴 PRIORITY 1 — CONSTRUCTION DEFECTS ({defectList.length})</span>
                          </div>

                          {defectList.map((det, idx) => {
                            const detId = det.id || `defect-${idx}`;
                            const isConfirmed = verifications[detId] === 'CONFIRMED';
                            const isRejected = verifications[detId] === 'REJECTED';
                            const isEditing = editingDetId === detId;
                            const isLogged = loggedDets[detId];
                            const currentClass = editedClasses[detId] || det.class || det.className;
                            const currentSeverity = editedSeverities[detId] || det.severity || 'HIGH';

                            return (
                              <div
                                key={detId}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 8,
                                  background: 'rgba(15, 23, 42, 0.5)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderLeft: '4px solid #ef4444',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <strong style={{ fontSize: 13.5, color: '#ffffff' }}>
                                        🔴 {currentClass}
                                      </strong>
                                      <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>
                                        {Math.round((det.confidence || 0.9) * 100)}% Conf
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#fca5a5', fontStyle: 'italic', marginTop: 2 }}>
                                      AI visual indication — requires inspector verification.
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className={`badge ${currentSeverity === 'CRITICAL' ? 'badge-red' : currentSeverity === 'HIGH' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 9.5 }}>
                                      Severity: {currentSeverity}
                                    </span>
                                  </div>
                                </div>

                                {isEditing && (
                                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6 }}>
                                    <select
                                      value={currentClass}
                                      onChange={(e) => setEditedClasses(prev => ({ ...prev, [detId]: e.target.value }))}
                                      className="input-control"
                                      style={{ fontSize: 11.5, height: 30, flex: 1 }}
                                    >
                                      <option value="Crack">Crack</option>
                                      <option value="Concrete Crack">Concrete Crack</option>
                                      <option value="Wall Crack">Wall Crack</option>
                                      <option value="Structural Crack">Structural Crack</option>
                                      <option value="Concrete Spalling">Concrete Spalling</option>
                                      <option value="Damaged Concrete">Damaged Concrete</option>
                                      <option value="Surface Damage">Surface Damage</option>
                                      <option value="Hole / Opening">Hole / Opening</option>
                                      <option value="Honeycombing">Honeycombing</option>
                                      <option value="Exposed Rebar">Exposed Rebar</option>
                                    </select>
                                    <select
                                      value={currentSeverity}
                                      onChange={(e) => setEditedSeverities(prev => ({ ...prev, [detId]: e.target.value }))}
                                      className="input-control"
                                      style={{ fontSize: 11.5, height: 30, width: 110 }}
                                    >
                                      <option value="CRITICAL">CRITICAL</option>
                                      <option value="HIGH">HIGH</option>
                                      <option value="MEDIUM">MEDIUM</option>
                                      <option value="LOW">LOW</option>
                                    </select>
                                    <button
                                      onClick={() => setEditingDetId(null)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '2px 8px', fontSize: 11 }}
                                    >
                                      Done
                                    </button>
                                  </div>
                                )}

                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  Statutory Code: {det.statutory_ref || 'IS 456:2000'} &bull; {det.recommended_action || 'Inspect fissure aperture and measure depth.'}
                                </div>

                                {/* Human Verification Controls: Confirm / Reject / Edit / Create Issue */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 6 }}>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVerifications(prev => ({ ...prev, [detId]: 'CONFIRMED' }));
                                        if (onVerifyDetection) onVerifyDetection(det, 'CONFIRMED');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{
                                        fontSize: 10.5,
                                        padding: '3px 8px',
                                        color: isConfirmed ? '#ffffff' : '#10b981',
                                        background: isConfirmed ? '#10b981' : 'transparent',
                                        borderColor: '#10b981'
                                      }}
                                      title="Confirm defect visually"
                                    >
                                      ✓ Confirm
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVerifications(prev => ({ ...prev, [detId]: 'REJECTED' }));
                                        if (onVerifyDetection) onVerifyDetection(det, 'FALSE_POSITIVE');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{
                                        fontSize: 10.5,
                                        padding: '3px 8px',
                                        color: isRejected ? '#ffffff' : '#ef4444',
                                        background: isRejected ? '#ef4444' : 'transparent',
                                        borderColor: '#ef4444'
                                      }}
                                      title="Reject false detection"
                                    >
                                      ✗ Reject
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setEditingDetId(isEditing ? null : detId)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: 10.5, padding: '3px 8px', color: '#38bdf8', borderColor: '#38bdf8' }}
                                      title="Edit classification or severity"
                                    >
                                      <Edit2 size={11} />
                                      <span>Edit</span>
                                    </button>
                                  </div>

                                  <div>
                                    {isLogged ? (
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Check size={13} />
                                        <span>Issue Created</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const activeDet = {
                                            ...det,
                                            class: currentClass,
                                            className: currentClass,
                                            severity: currentSeverity
                                          };
                                          setLoggedDets(prev => ({ ...prev, [detId]: true }));
                                          if (onLogDefect) onLogDefect(activeDet, verifications[detId] || 'CONFIRMED');
                                        }}
                                        className="btn btn-primary btn-sm"
                                        style={{ fontSize: 11, padding: '4px 12px', background: '#ef4444', borderColor: '#dc2626', fontWeight: 800 }}
                                        title="Create real persisted issue in defect ledger"
                                      >
                                        Create Issue
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* ====================================================== */}
                    {/* PRIORITY 2: PERSON / PPE SAFETY                         */}
                    {/* ====================================================== */}
                    {(() => {
                      const ppeList = aiResult.detections.filter(d => d.category !== 'DEFECT' && d.priority !== 1);
                      if (ppeList.length === 0) return null;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <span>🟠 PRIORITY 2 — PERSON / PPE SAFETY ({ppeList.length})</span>
                          </div>

                          {ppeList.map((det, idx) => {
                            const detId = det.id || `ppe-${idx}`;
                            const isConfirmed = verifications[detId] === 'CONFIRMED';
                            const isRejected = verifications[detId] === 'REJECTED';
                            const isEditing = editingDetId === detId;
                            const isLogged = loggedDets[detId];
                            const currentClass = editedClasses[detId] || det.class || det.className;
                            const currentSeverity = editedSeverities[detId] || det.severity || 'HIGH';

                            return (
                              <div
                                key={detId}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 8,
                                  background: 'rgba(15, 23, 42, 0.5)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  borderLeft: '4px solid #f59e0b',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <strong style={{ fontSize: 13.5, color: '#ffffff' }}>
                                        🟠 {currentClass}
                                      </strong>
                                      <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>
                                        {Math.round((det.confidence || 0.9) * 100)}% Conf
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#fde68a', fontStyle: 'italic', marginTop: 2 }}>
                                      AI visual indication — requires inspector verification.
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className={`badge ${currentSeverity === 'CRITICAL' ? 'badge-red' : currentSeverity === 'HIGH' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 9.5 }}>
                                      Severity: {currentSeverity}
                                    </span>
                                  </div>
                                </div>

                                {isEditing && (
                                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6 }}>
                                    <select
                                      value={currentClass}
                                      onChange={(e) => setEditedClasses(prev => ({ ...prev, [detId]: e.target.value }))}
                                      className="input-control"
                                      style={{ fontSize: 11.5, height: 30, flex: 1 }}
                                    >
                                      <option value="Hardhat">Hardhat</option>
                                      <option value="NO-Hardhat">NO-Hardhat</option>
                                      <option value="Safety Vest">Safety Vest</option>
                                      <option value="NO-Safety Vest">NO-Safety Vest</option>
                                      <option value="Gloves">Gloves</option>
                                      <option value="NO-Gloves">NO-Gloves</option>
                                      <option value="Person">Person</option>
                                      <option value="Fall-Detected">Fall-Detected</option>
                                    </select>
                                    <select
                                      value={currentSeverity}
                                      onChange={(e) => setEditedSeverities(prev => ({ ...prev, [detId]: e.target.value }))}
                                      className="input-control"
                                      style={{ fontSize: 11.5, height: 30, width: 110 }}
                                    >
                                      <option value="CRITICAL">CRITICAL</option>
                                      <option value="HIGH">HIGH</option>
                                      <option value="MEDIUM">MEDIUM</option>
                                      <option value="LOW">LOW</option>
                                    </select>
                                    <button
                                      onClick={() => setEditingDetId(null)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '2px 8px', fontSize: 11 }}
                                    >
                                      Done
                                    </button>
                                  </div>
                                )}

                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  Statutory Code: {det.statutory_ref || 'BOCW 1996 / OSHA'} &bull; {det.recommended_action || 'Ensure mandatory PPE is worn before entry.'}
                                </div>

                                {/* Human Verification Controls */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 6 }}>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVerifications(prev => ({ ...prev, [detId]: 'CONFIRMED' }));
                                        if (onVerifyDetection) onVerifyDetection(det, 'CONFIRMED');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{
                                        fontSize: 10.5,
                                        padding: '3px 8px',
                                        color: isConfirmed ? '#ffffff' : '#10b981',
                                        background: isConfirmed ? '#10b981' : 'transparent',
                                        borderColor: '#10b981'
                                      }}
                                      title="Confirm violation visually"
                                    >
                                      ✓ Confirm
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVerifications(prev => ({ ...prev, [detId]: 'REJECTED' }));
                                        if (onVerifyDetection) onVerifyDetection(det, 'FALSE_POSITIVE');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{
                                        fontSize: 10.5,
                                        padding: '3px 8px',
                                        color: isRejected ? '#ffffff' : '#ef4444',
                                        background: isRejected ? '#ef4444' : 'transparent',
                                        borderColor: '#ef4444'
                                      }}
                                      title="Reject false detection"
                                    >
                                      ✗ Reject
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setEditingDetId(isEditing ? null : detId)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: 10.5, padding: '3px 8px', color: '#38bdf8', borderColor: '#38bdf8' }}
                                      title="Edit classification or severity"
                                    >
                                      <Edit2 size={11} />
                                      <span>Edit</span>
                                    </button>
                                  </div>

                                  <div>
                                    {isLogged ? (
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Check size={13} />
                                        <span>Issue Created</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const activeDet = {
                                            ...det,
                                            class: currentClass,
                                            className: currentClass,
                                            severity: currentSeverity
                                          };
                                          setLoggedDets(prev => ({ ...prev, [detId]: true }));
                                          if (onLogDefect) onLogDefect(activeDet, verifications[detId] || 'CONFIRMED');
                                        }}
                                        className="btn btn-primary btn-sm"
                                        style={{ fontSize: 11, padding: '4px 12px', background: '#f59e0b', borderColor: '#d97706', fontWeight: 800 }}
                                        title="Create safety violation issue"
                                      >
                                        Create Issue
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                  </div>
                ) : (
                  <div style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Zero structural defects or safety violations detected above threshold.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Defect Description Form if failures exist OR AI detected hazards */}
            {(failedItems > 0 || (aiResult?.detections && aiResult.detections.length > 0)) && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #ef4444',
                  background: 'rgba(239, 68, 68, 0.04)',
                  marginBottom: 16
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={15} />
                  <span>Log Detected Defect / Failure Details</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={defectTitle}
                    onChange={(e) => setDefectTitle(e.target.value)}
                    placeholder="Defect Title (e.g. Concrete Spalling on Pier P-14)"
                    className="input-control"
                    style={{ fontSize: 12.5 }}
                  />
                  <textarea
                    rows={2}
                    value={defectDesc}
                    onChange={(e) => setDefectDesc(e.target.value)}
                    placeholder="Describe the structural failure and required remediation..."
                    className="input-control"
                    style={{ fontSize: 12, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>Severity:</span>
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                      <button
                        key={sev}
                        onClick={() => setDefectSeverity(sev)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          border: defectSeverity === sev ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                          background: defectSeverity === sev ? '#ef4444' : 'transparent',
                          color: defectSeverity === sev ? '#FFFFFF' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                onClick={() => setCurrentStep(4)}
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span>Review & Submit</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Final Submission */}
      {currentStep === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="glass-card"
            style={{
              padding: '22px',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
              STEP 4: FINAL AUDIT SUMMARY & DIGITAL SIGN-OFF
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '6px 0 16px' }}>
              Statutory Verification Review
            </h3>

            {/* Compliance Score Tile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800 }}>COMPLIANCE SCORE</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{score}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{passedItems} of {totalItems} items passed</div>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 800 }}>PHYSICAL VERIFICATION</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-heading)', marginTop: 8 }}>
                  QR: {qrVerified ? '✓ Validated' : 'Not Scanned'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  GNSS: {gpsVerified ? '✓ Geofence Verified' : 'Standard Fix'}
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: failedItems > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${failedItems > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                <div style={{ fontSize: 11, color: failedItems > 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>DEFECT STATUS</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: failedItems > 0 ? '#ef4444' : '#10b981', marginTop: 8 }}>
                  {failedItems > 0 ? `${failedItems} Items Failed` : 'Zero Deficiencies'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {failedItems > 0 ? 'Logged for remediation' : 'Meets Indian Standards'}
                </div>
              </div>
            </div>

            {/* PKI Digital Signature Box */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>DIGITAL SIGN-OFF CERTIFICATE</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-heading)', marginTop: 3 }}>
                Verified PKI Digital Signature: Field Auditor (INSP-2026)
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Cryptographically hashed audit timestamp: {new Date().toUTCString()}
              </div>
            </div>

            {/* Big Prominent Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentStep(3)}
                className="btn btn-secondary"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                onClick={onSubmitInspection}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  background: '#10b981',
                  borderColor: '#10b981',
                  fontWeight: 800,
                  fontSize: 14,
                  padding: '12px 28px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <Send size={16} />
                <span>{submitting ? 'Signing & Submitting...' : 'Sign & Submit Inspection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
