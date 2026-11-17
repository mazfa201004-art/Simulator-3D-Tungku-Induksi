import React, { useEffect, useRef, useState } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface LadleSteeringHUDProps {
  isMobile?: boolean;
  isShortLandscape?: boolean;
}

/**
 * Mobile & Desktop HUD controller for the pouring ladle handwheel.
 * Lets operators tilt the ladle cleanly without accidental camera pitch/yaw movement,
 * plus provides a dedicated Camera Lock toggle for direct 3D wheel dragging.
 */
export const LadleSteeringHUD: React.FC<LadleSteeringHUDProps> = ({
  isMobile = false,
  isShortLandscape = false,
}) => {
  const isLadleControlOpen = useSimStore((s) => s.isLadleControlOpen);
  const setIsLadleControlOpen = useSimStore((s) => s.setIsLadleControlOpen);
  const isCraneRemoteHeld = useSimStore((s) => s.isCraneRemoteHeld);
  const ladleTiltDeg = useSimStore((s) => s.ladleTiltDeg);
  const setLadleTiltDeg = useSimStore((s) => s.setLadleTiltDeg);
  const isLadleCameraLocked = useSimStore((s) => s.isLadleCameraLocked);
  const setIsLadleCameraLocked = useSimStore((s) => s.setIsLadleCameraLocked);
  const ladleFilledFraction = useSimStore((s) => s.ladleFilledFraction);

  const [holdDir, setHoldDir] = useState<-1 | 0 | 1>(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Smooth continuous handwheel rotation loop while holding TUANG (+) or TEGAK (-)
  useEffect(() => {
    if (holdDir === 0) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }

    const speedDegPerSec = 38; // ~2.3 seconds for full 0 -> 90 deg controlled pour
    const step = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
        const curr = useSimStore.getState().ladleTiltDeg;
        const next = Math.max(0, Math.min(90, curr + holdDir * speedDegPerSec * dt));
        useSimStore.getState().setLadleTiltDeg(next);
      }
      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [holdDir]);

  // Safety stop on window blur
  useEffect(() => {
    const stopHold = () => setHoldDir(0);
    window.addEventListener('blur', stopHold);
    return () => window.removeEventListener('blur', stopHold);
  }, []);

  // Show compact pill toggle when crane remote is held and steering deck is collapsed
  if (!isLadleControlOpen) {
    if (!isCraneRemoteHeld) return null;

    return (
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          inductionAudio.resume();
          inductionAudio.playClick();
          setIsLadleControlOpen(true);
        }}
        style={{
          minHeight: '44px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: '#0f172a',
          border: `1.5px solid ${isLadleCameraLocked || ladleTiltDeg > 0 ? '#38bdf8' : '#475569'}`,
          color: '#f8fafc',
          fontSize: '10.5px',
          fontWeight: 800,
          letterSpacing: '0.03em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.55)',
          touchAction: 'manipulation',
          whiteSpace: 'nowrap',
        }}
        title="Buka Pengaturan Steering Wheel Ladel & Kunci Kamera"
      >
        <span style={{ color: '#38bdf8', fontSize: '13px', lineHeight: 1 }}>◎</span>
        <span>RODA LADEL ({ladleTiltDeg.toFixed(0)}°)</span>
        {isLadleCameraLocked && (
          <span
            style={{
              fontSize: '9px',
              background: '#0284c7',
              color: '#fff',
              padding: '1px 5px',
              borderRadius: '4px',
            }}
          >
            KUNCI
          </span>
        )}
      </button>
    );
  }

  const isPourZone = ladleTiltDeg >= 26;
  const isPouringLiquid = isPourZone && ladleFilledFraction > 0.002;
  const deckWidth = isMobile ? (isShortLandscape ? '186px' : '188px') : '216px';

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: deckWidth,
        background: '#0f172a',
        border: `1.5px solid ${isLadleCameraLocked ? '#38bdf8' : isPouringLiquid ? '#f97316' : '#475569'}`,
        borderRadius: '12px',
        padding: isShortLandscape ? '8px' : '10px',
        boxShadow: '0 10px 26px rgba(0, 0, 0, 0.72)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: isShortLandscape ? '6px' : '7px',
        boxSizing: 'border-box',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '5px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.04em' }}>
            STEERING LADEL
          </div>
          <div style={{ fontSize: '8.5px', color: isPouringLiquid ? '#fb923c' : '#94a3b8', fontWeight: 700 }}>
            {isPouringLiquid
              ? 'MENUANG LOGAM'
              : isPourZone
              ? 'SUDUT TUANG'
              : 'SIAP TEGAK'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 900,
              color: ladleTiltDeg >= 89.5 ? '#f87171' : isPourZone ? '#fbbf24' : '#4ade80',
              background: '#020617',
              border: '1px solid #334155',
              padding: '2px 6px',
              borderRadius: '5px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {ladleTiltDeg.toFixed(0)}°
          </span>
          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setHoldDir(0);
              if (!isCraneRemoteHeld) {
                setIsLadleCameraLocked(false);
              }
              setIsLadleControlOpen(false);
            }}
            aria-label="Tutup Panel Steering Ladel"
            style={{
              minWidth: '28px',
              minHeight: '28px',
              borderRadius: '6px',
              background: '#1e293b',
              border: '1px solid #475569',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCraneRemoteHeld ? '_' : '✕'}
          </button>
        </div>
      </div>

      {/* Hold-to-Rotate Buttons: TEGAK (-) and TUANG (+) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            inductionAudio.resume();
            inductionAudio.playClick();
            setHoldDir(-1);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setHoldDir(0);
          }}
          onPointerCancel={() => setHoldDir(0)}
          onPointerLeave={() => {
            if (holdDir === -1) setHoldDir(0);
          }}
          style={{
            minHeight: '44px',
            borderRadius: '8px',
            background: holdDir === -1 ? '#0369a1' : '#1e293b',
            border: `1.5px solid ${holdDir === -1 ? '#38bdf8' : '#475569'}`,
            color: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
            touchAction: 'none',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1 }}>↺</span>
          <span style={{ fontSize: '8.5px', fontWeight: 800 }}>TEGAK (-)</span>
        </button>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            inductionAudio.resume();
            inductionAudio.playClick();
            setHoldDir(1);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setHoldDir(0);
          }}
          onPointerCancel={() => setHoldDir(0)}
          onPointerLeave={() => {
            if (holdDir === 1) setHoldDir(0);
          }}
          style={{
            minHeight: '44px',
            borderRadius: '8px',
            background: holdDir === 1 ? '#c2410c' : '#1e293b',
            border: `1.5px solid ${holdDir === 1 ? '#fb923c' : '#475569'}`,
            color: '#f8fafc',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
            touchAction: 'none',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 900, lineHeight: 1 }}>↻</span>
          <span style={{ fontSize: '8.5px', fontWeight: 800 }}>TUANG (+)</span>
        </button>
      </div>

      {/* Precision Angle Slider + Quick Zero Reset */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#020617',
          border: '1px solid #334155',
          borderRadius: '7px',
          padding: '4px 7px',
        }}
      >
        <input
          type="range"
          min={0}
          max={90}
          step={1}
          value={ladleTiltDeg}
          aria-label="Sudut Kemiringan Ladel (0 sampai 90 derajat)"
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => setLadleTiltDeg(Number(e.target.value))}
          style={{
            flex: 1,
            minWidth: 0,
            height: '28px',
            accentColor: '#f97316',
            cursor: 'pointer',
            touchAction: 'none',
          }}
        />
        <button
          onClick={() => {
            inductionAudio.resume();
            inductionAudio.playClick();
            setHoldDir(0);
            setLadleTiltDeg(0);
          }}
          style={{
            minHeight: '30px',
            padding: '0 7px',
            borderRadius: '5px',
            background: ladleTiltDeg === 0 ? '#1e293b' : '#334155',
            border: '1px solid #475569',
            color: ladleTiltDeg === 0 ? '#64748b' : '#f8fafc',
            fontSize: '9px',
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          title="Kembalikan posisi ladel tegak 0 derajat"
        >
          0°
        </button>
      </div>

      {/* Camera Lock Toggle for 3D Steering Wheel */}
      <button
        onClick={() => {
          inductionAudio.resume();
          inductionAudio.playClick();
          setIsLadleCameraLocked(!isLadleCameraLocked);
        }}
        style={{
          minHeight: '44px',
          width: '100%',
          borderRadius: '8px',
          padding: '4px 8px',
          background: isLadleCameraLocked ? 'rgba(2, 132, 199, 0.28)' : '#1e293b',
          border: `1.5px solid ${isLadleCameraLocked ? '#38bdf8' : '#475569'}`,
          color: isLadleCameraLocked ? '#38bdf8' : '#e2e8f0',
          fontSize: '9.5px',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
        }}
        title="Kunci gerak kamera layar saat memutar roda ladel 3D di HP"
      >
        <span>{isLadleCameraLocked ? '🔒 KAMERA TERKUNCI' : '🔓 KUNCI KAMERA'}</span>
        <span
          style={{
            fontSize: '8.5px',
            padding: '2px 5px',
            borderRadius: '4px',
            background: isLadleCameraLocked ? '#0284c7' : '#334155',
            color: '#fff',
          }}
        >
          {isLadleCameraLocked ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
};
