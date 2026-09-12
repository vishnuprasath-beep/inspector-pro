import React, { useState, useRef, useEffect } from 'react';
import { Columns, SplitSquareVertical, ZoomIn, AlertTriangle, CheckCircle2, ArrowLeftRight } from 'lucide-react';

/**
 * Inspectra Pro — Interactive Before & After Reinspection Comparison Tool
 * Allows site engineers and field auditors to visually align the original defect photo
 * against the contractor's remedial photo or newly captured reinspection evidence.
 */
export default function BeforeAfterComparison({
  beforePhoto,
  afterPhoto,
  beforeTitle = 'BEFORE: Original Defect Evidence',
  afterTitle = 'AFTER: Remedial Work / Reinspection',
  defectId = null,
  height = 360
}) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const containerRef = useRef(null);

  // Fallback placeholder images if photos are not provided
  const safeBefore = beforePhoto || 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop&q=80';
  const safeAfter = afterPhoto || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 14,
        overflow: 'hidden'
      }}
    >
      {/* Header with Mode Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeftRight size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)' }}>
            Visual Remediation Verification
          </span>
          {defectId && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              {defectId}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`btn btn-sm ${viewMode === 'slider' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <SplitSquareVertical size={13} />
            <span>Interactive Split Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`btn btn-sm ${viewMode === 'side-by-side' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Columns size={13} />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Comparison Display */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
          style={{
            position: 'relative',
            width: '100%',
            height,
            borderRadius: 8,
            overflow: 'hidden',
            cursor: 'ew-resize',
            userSelect: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Layer 1: AFTER Image (Full background) */}
          <img
            src={safeAfter}
            alt="After remedial work"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(16, 185, 129, 0.9)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            <CheckCircle2 size={12} />
            <span>{afterTitle}</span>
          </div>

          {/* Layer 2: BEFORE Image (Clipped to slider percentage) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${sliderPosition}%`,
              height: '100%',
              overflow: 'hidden',
              borderRight: '2px solid #38bdf8',
              boxShadow: '4px 0 16px rgba(0,0,0,0.5)'
            }}
          >
            <img
              src={safeBefore}
              alt="Before defect"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: containerRef.current ? containerRef.current.clientWidth : '100%',
                height: '100%',
                maxWidth: 'none',
                objectFit: 'cover'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              <AlertTriangle size={12} />
              <span>{beforeTitle}</span>
            </div>
          </div>

          {/* Draggable Slider Divider Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPosition}%`,
              width: 30,
              marginLeft: -15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#38bdf8',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(56, 189, 248, 0.8)',
                border: '2px solid #ffffff'
              }}
            >
              <ArrowLeftRight size={14} />
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Comparison Mode */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* BEFORE Frame */}
          <div style={{ position: 'relative', height, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <img
              src={safeBefore}
              alt="Before defect"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <AlertTriangle size={13} />
              <span>{beforeTitle}</span>
            </div>
          </div>

          {/* AFTER Frame */}
          <div style={{ position: 'relative', height, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <img
              src={safeAfter}
              alt="After remedial work"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(16, 185, 129, 0.9)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <CheckCircle2 size={13} />
              <span>{afterTitle}</span>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Guidance Footer */}
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>👈 Drag slider left/right to compare remediation alignment</span>
        <span>Position: {Math.round(sliderPosition)}%</span>
      </div>
    </div>
  );
}
