import React, { useState, useEffect, useCallback } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';
import { LadleSteeringHUD } from './LadleSteeringHUD';

function detectMobileViewport(): { isMobile: boolean; isShortLandscape: boolean } {
  if (typeof window === 'undefined') return { isMobile: false, isShortLandscape: false };
  const isNarrow = window.innerWidth <= 840;
  const isShortLandscape = window.innerHeight <= 520 && window.innerWidth <= 960;
  const isTouch = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return {
    isMobile: isNarrow || isShortLandscape || isTouch,
    isShortLandscape,
  };
}

/**
 * Remote controller interface for the overhead crane (Telecrane F24-6D),
 * paired in a non-overlapping right-side dock with LadleSteeringHUD.
 */
export const HeldCraneRemoteHUD: React.FC = () => {
  const isCraneRemoteHeld = useSimStore((s) => s.isCraneRemoteHeld);
  const isLadleControlOpen = useSimStore((s) => s.isLadleControlOpen);
  const setIsCraneRemoteHeld = useSimStore((s) => s.setIsCraneRemoteHeld);
  const setCraneMoveDir = useSimStore((s) => s.setCraneMoveDir);
  const cranePosition = useSimStore((s) => s.cranePosition);
  const singleMoldFillLevel = useSimStore((s) => s.singleMoldFillLevel);
  const currentSopStepIndex = useSimStore((s) => s.currentSopStepIndex);

  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewport, setViewport] = useState(detectMobileViewport);

  useEffect(() => {
    const handleResize = () => setViewport(detectMobileViewport());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearAllDirs = useCallback(() => {
    setActiveButtons({});
    setCraneMoveDir('x', 0);
    setCraneMoveDir('y', 0);
    setCraneMoveDir('z', 0);
  }, [setCraneMoveDir]);

  useEffect(() => {
    window.addEventListener('blur', clearAllDirs);
    return () => window.removeEventListener('blur', clearAllDirs);
  }, [clearAllDirs]);

  if (!isCraneRemoteHeld && !isLadleControlOpen) return null;

  const { isMobile, isShortLandscape } = viewport;

  const handlePressDir = (
    e: React.PointerEvent<HTMLButtonElement>,
    axis: 'x' | 'y' | 'z',
    dir: number,
    key: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture error
    }
    inductionAudio.resume();
    inductionAudio.playClick();
    setActiveButtons((prev) => ({ ...prev, [key]: true }));
    if (useSimStore.getState().craneDestination !== 'manual') {
      useSimStore.getState().setCraneDestination('manual');
    }
    setCraneMoveDir(axis, dir);
  };

  const handleReleaseDir = (
    e: React.PointerEvent<HTMLButtonElement>,
    axis: 'x' | 'y' | 'z',
    key: string
  ) => {
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release error
    }
    setActiveButtons((prev) => ({ ...prev, [key]: false }));
    setCraneMoveDir(axis, 0);
  };

  const distToStandby = Math.hypot(cranePosition[0] - 4.0, cranePosition[2] - 0.0);
  const isAtStandby = distToStandby <= 1.25;
  const needReturnAfterPour = singleMoldFillLevel >= 0.90 || currentSopStepIndex === 17;

  const dirButtons: Array<{
    axis: 'x' | 'y' | 'z';
    dir: number;
    key: string;
    icon: string;
    label: string;
    activeBg: string;
    activeBorder: string;
  }> = [
    { axis: 'y', dir: 1, key: 'up', icon: '▲', label: 'HOIST UP', activeBg: '#15803d', activeBorder: '#4ade80' },
    { axis: 'y', dir: -1, key: 'down', icon: '▼', label: 'HOIST DOWN', activeBg: '#15803d', activeBorder: '#4ade80' },
    { axis: 'x', dir: -1, key: 'left', icon: '◀', label: 'TROLLEY L', activeBg: '#0369a1', activeBorder: '#38bdf8' },
    { axis: 'x', dir: 1, key: 'right', icon: '▶', label: 'TROLLEY R', activeBg: '#0369a1', activeBorder: '#38bdf8' },
    { axis: 'z', dir: 1, key: 'fwd', icon: '▲▲', label: 'BRIDGE FWD', activeBg: '#b45309', activeBorder: '#f59e0b' },
    { axis: 'z', dir: -1, key: 'rev', icon: '▼▼', label: 'BRIDGE REV', activeBg: '#b45309', activeBorder: '#f59e0b' },
  ];

  const btnHeight = isShortLandscape ? '36px' : '44px';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 'calc(92px + env(safe-area-inset-bottom, 0px))' : '24px',
        right: isMobile ? 'max(12px, env(safe-area-inset-right, 0px))' : '24px',
        zIndex: 80,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'flex',
        flexDirection: isShortLandscape ? 'row' : 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {/* Integrated Ladle Steering Wheel Control Deck & Camera Lock */}
      <div style={{ pointerEvents: 'auto' }}>
        <LadleSteeringHUD isMobile={isMobile} isShortLandscape={isShortLandscape} />
      </div>

      {/* Crane Remote Transmitter (Only rendered when user holds the crane remote) */}
      {isCraneRemoteHeld && (
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.65))',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isMobile && isMinimized ? (
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setIsMinimized(false);
              }}
              style={{
                minHeight: '44px',
                padding: '8px 14px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                border: '2px solid #fde047',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>REMOTE DEREK (BUKA)</span>
            </button>
          ) : (
            <>
              {/* Top Antenna Stub (hidden in cramped landscape phones to preserve headroom) */}
              {!isShortLandscape && (
                <div
                  style={{
                    width: '32px',
                    height: isMobile ? '12px' : '22px',
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '8px 8px 0 0',
                    border: '1px solid #334155',
                    borderBottom: 'none',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: isMobile ? '-9px' : '-16px',
                      width: '10px',
                      height: isMobile ? '10px' : '18px',
                      background: '#090d16',
                      borderRadius: '5px 5px 2px 2px',
                      border: '1px solid #334155',
                    }}
                  />
                </div>
              )}

              {/* Main Rugged Yellow Transmitter Enclosure */}
              <div
                style={{
                  width: isMobile ? '170px' : '180px',
                  background: 'linear-gradient(145deg, #facc15 0%, #eab308 45%, #ca8a04 100%)',
                  borderRadius: '14px',
                  padding: isShortLandscape ? '7px 7px' : '9px 8px',
                  border: '2px solid #fde047',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -4px 8px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isShortLandscape ? '5px' : '6px',
                  position: 'relative',
                }}
              >
                {/* Top Header Tag: Model & RF Status */}
                <div
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    borderRadius: '5px',
                    padding: '4px 6px',
                    border: '1px solid #475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                      TELECRANE F24-6D
                    </div>
                    <div style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 600 }}>
                      INDUSTRIAL TX
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          boxShadow: '0 0 6px #22c55e',
                        }}
                      />
                      <span style={{ fontSize: '7px', color: '#4ade80', fontWeight: 800 }}>TX</span>
                    </div>
                    {isMobile && (
                      <button
                        onClick={() => {
                          inductionAudio.resume();
                          inductionAudio.playClick();
                          setIsMinimized(true);
                        }}
                        title="Kecilkan Remote"
                        style={{
                          background: '#334155',
                          border: 'none',
                          borderRadius: '3px',
                          color: '#f8fafc',
                          fontSize: '9px',
                          fontWeight: 900,
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        _
                      </button>
                    )}
                  </div>
                </div>

                {/* Emergency Stop Button */}
                <button
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    useSimStore.getState().triggerEmergencyStop();
                  }}
                  title="Emergency Stop (Tekan untuk Memutus Seluruh Sirkuit Derek)"
                  style={{
                    width: '100%',
                    minHeight: isShortLandscape ? '30px' : '34px',
                    background: 'radial-gradient(circle, #dc2626 40%, #991b1b 100%)',
                    border: '2px solid #7f1d1d',
                    borderRadius: '7px',
                    padding: '4px 0',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#b91c1c',
                      border: '1.5px dashed #fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8.5px',
                      fontWeight: 900,
                    }}
                  >
                    ↻
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.06em' }}>
                    EMERGENCY STOP
                  </span>
                </button>

                {/* Live Crane Coordinates & Return-to-Standby Guidance */}
                <div
                  style={{
                    width: '100%',
                    background:
                      needReturnAfterPour && isAtStandby
                        ? 'rgba(16, 185, 129, 0.22)'
                        : needReturnAfterPour && singleMoldFillLevel >= 0.90
                        ? 'rgba(245, 158, 11, 0.22)'
                        : '#0f172a',
                    border: `1px solid ${
                      needReturnAfterPour && isAtStandby
                        ? '#22c55e'
                        : needReturnAfterPour && singleMoldFillLevel >= 0.90
                        ? '#facc15'
                        : '#334155'
                    }`,
                    borderRadius: '6px',
                    padding: '4px 6px',
                    boxSizing: 'border-box',
                    color: '#f8fafc',
                    fontSize: '7.5px',
                    lineHeight: 1.35,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#38bdf8' }}>
                    <span>POSISI CRANE:</span>
                    <span>
                      X:{cranePosition[0].toFixed(1)} Y:{cranePosition[1].toFixed(1)} Z:{cranePosition[2].toFixed(1)}
                    </span>
                  </div>
                  {singleMoldFillLevel >= 0.90 && (
                    <div
                      style={{
                        marginTop: '2px',
                        fontWeight: 800,
                        color: isAtStandby ? '#4ade80' : '#fde047',
                      }}
                    >
                      {isAtStandby
                        ? '✓ LADEL DI POSISI SEMULA (STANDBY)'
                        : `KEMBALIKAN KE X:4.0 Z:0.0 (${
                            cranePosition[0] > 4.6
                              ? 'Tekan ◀ TROLLEY L'
                              : cranePosition[0] < 3.4
                              ? 'Tekan ▶ TROLLEY R'
                              : cranePosition[2] > 0.6
                              ? 'Tekan ▼▼ BRIDGE REV'
                              : 'Tekan ▲▲ BRIDGE FWD'
                          })`}
                    </div>
                  )}
                </div>

                {/* 6 JOGGING DIRECTION PUSH BUTTONS (2x3 Grid, pointer-capture isolated) */}
                <div
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                  }}
                >
                  {dirButtons.map((btn) => {
                    const isPressed = !!activeButtons[btn.key];
                    return (
                      <button
                        key={btn.key}
                        onPointerDown={(e) => handlePressDir(e, btn.axis, btn.dir, btn.key)}
                        onPointerUp={(e) => handleReleaseDir(e, btn.axis, btn.key)}
                        onPointerCancel={(e) => handleReleaseDir(e, btn.axis, btn.key)}
                        onLostPointerCapture={(e) => handleReleaseDir(e, btn.axis, btn.key)}
                        style={{
                          minHeight: btnHeight,
                          background: isPressed ? btn.activeBg : '#1e293b',
                          border: `1.5px solid ${isPressed ? btn.activeBorder : '#475569'}`,
                          borderRadius: '7px',
                          padding: '4px 3px',
                          color: '#f8fafc',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
                          touchAction: 'none',
                        }}
                      >
                        <span style={{ fontSize: '12px', lineHeight: 1 }}>{btn.icon}</span>
                        <span style={{ fontSize: '7.5px', fontWeight: 800, marginTop: '2px' }}>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Return to Dock Holster Button */}
                <button
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    clearAllDirs();
                    setIsCraneRemoteHeld(false);
                  }}
                  style={{
                    width: '100%',
                    minHeight: isShortLandscape ? '32px' : '38px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '5px 0',
                    color: '#cbd5e1',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '1px',
                  }}
                >
                  KEMBALIKAN KE DUDUKAN
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
