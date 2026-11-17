import React, { useState, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * HeldRemoteControl: Authentic Industrial COB-61 Remote Pendant held by the operator.
 * Displayed in the bottom-right corner of the screen in POV simulation mode.
 * Features realistic circular push buttons with ▼ (POUR) and ▲ (RETURN) icons,
 * physical tilt telemetry, and return-to-holster capability.
 * Zero emojis - 100% industrial design.
 */
export const HeldRemoteControl: React.FC = () => {
  const isRemoteHeld = useSimStore((s) => s.isRemoteHeld);
  const setIsRemoteHeld = useSimStore((s) => s.setIsRemoteHeld);
  const isTiltingForward = useSimStore((s) => s.isTiltingForward);
  const isTiltingBackward = useSimStore((s) => s.isTiltingBackward);
  const tiltPermit = useSimStore((s) => s.tiltPermit);
  const tiltPowerOn = useSimStore((s) => s.tiltPowerOn);
  const masterPowerOn = useSimStore((s) => s.masterPowerOn);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const isHpuRunning = useSimStore((s) => s.isHpuRunning);
  const transformerBreakerOn = useSimStore((s) => s.transformerBreakerOn);

  const startTiltingForward = useSimStore((s) => s.startTiltingForward);
  const stopTiltingForward = useSimStore((s) => s.stopTiltingForward);
  const startTiltingBackward = useSimStore((s) => s.startTiltingBackward);
  const stopTiltingBackward = useSimStore((s) => s.stopTiltingBackward);

  const [hoverPour, setHoverPour] = useState(false);
  const [hoverReturn, setHoverReturn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isRemoteHeld) return null;

  const canOperate = transformerBreakerOn && masterPowerOn && !emergencyTripped && tiltPowerOn && tiltPermit && isHpuRunning;

  if (isMobile && isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          right: '16px',
          bottom: '76px',
          zIndex: 75,
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
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
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: '2px solid #fdba74',
            color: '#ffffff',
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
          <span>PENGENDALI TILT (BUKA)</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '76px' : '24px',
        left: 'auto',
        right: isMobile ? '16px' : '24px',
        zIndex: 75,
        pointerEvents: 'auto',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.55))',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Top Rubber Strain Relief Boot */}
      <div
        style={{
          width: '30px',
          height: '24px',
          background: 'linear-gradient(180deg, #090d16 0%, #1e293b 100%)',
          borderRadius: '6px 6px 0 0',
          border: '1px solid #334155',
          borderBottom: 'none',
          position: 'relative',
        }}
      >
        {/* Cable entering top */}
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '8px',
            width: '14px',
            height: '18px',
            background: '#0a0f1d',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Main Molded Orange ABS Pendant Body */}
      <div
        style={{
          width: '140px',
          background: 'linear-gradient(145deg, #f97316 0%, #ea580c 45%, #c2410c 100%)',
          borderRadius: '16px',
          padding: '12px 10px',
          border: '2px solid #fdba74',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
        }}
      >
        {/* Pendant Model Nameplate */}
        <div
          style={{
            width: '100%',
            background: '#1e293b',
            borderRadius: '4px',
            padding: '4px 6px',
            border: '1px solid #475569',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.06em' }}>
              COB-61
            </div>
            <div style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
              TILT PENDANT CONTROL
            </div>
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
                width: '18px',
                height: '18px',
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

        {/* Electrical & Hydraulic Interlock LED Indicator */}
        <div
          style={{
            width: '100%',
            background: '#0f172a',
            borderRadius: '4px',
            padding: '4px 6px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>STATUS DAYA:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: canOperate ? '#22c55e' : '#ef4444',
                boxShadow: canOperate ? '0 0 6px #22c55e' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '8px',
                fontWeight: 800,
                color: canOperate ? '#4ade80' : '#f87171',
              }}
            >
              {canOperate ? 'READY' : 'INTERLOCK'}
            </span>
          </div>
        </div>

        {/* BUTTON 1: POUR (▼ Panah Bawah untuk Menuang Logam Cair) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inductionAudio.resume();
              inductionAudio.playClick();
              startTiltingForward();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              stopTiltingForward();
            }}
            onPointerLeave={() => {
              stopTiltingForward();
              setHoverPour(false);
            }}
            onPointerEnter={() => setHoverPour(true)}
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: isTiltingForward
                ? 'radial-gradient(circle, #fb923c 20%, #ea580c 100%)'
                : hoverPour
                ? 'radial-gradient(circle, #f97316 20%, #c2410c 100%)'
                : 'radial-gradient(circle, #ea580c 20%, #9a3412 100%)',
              border: '4px solid #0f172a',
              boxShadow: isTiltingForward
                ? '0 0 16px rgba(249, 115, 22, 0.9), inset 0 2px 5px rgba(0,0,0,0.6)'
                : '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.3)',
              cursor: canOperate ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: '2px solid transparent',
              outlineOffset: '2px',
              transform: isTiltingForward ? 'scale(0.94)' : 'scale(1)',
              transition: 'transform 0.08s, box-shadow 0.08s',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontSize: '22px',
                lineHeight: 1,
                fontWeight: 900,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                marginTop: '3px',
              }}
            >
              ▼
            </span>
          </button>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.06em',
              marginTop: '3px',
            }}
          >
            TUANG (POUR)
          </span>
        </div>

        {/* BUTTON 2: RETURN (▲ Panah Atas untuk Kembali Tegak) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inductionAudio.resume();
              inductionAudio.playClick();
              startTiltingBackward();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              stopTiltingBackward();
            }}
            onPointerLeave={() => {
              stopTiltingBackward();
              setHoverReturn(false);
            }}
            onPointerEnter={() => setHoverReturn(true)}
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: isTiltingBackward
                ? 'radial-gradient(circle, #38bdf8 20%, #0284c7 100%)'
                : hoverReturn
                ? 'radial-gradient(circle, #0ea5e9 20%, #0369a1 100%)'
                : 'radial-gradient(circle, #0284c7 20%, #075985 100%)',
              border: '4px solid #0f172a',
              boxShadow: isTiltingBackward
                ? '0 0 16px rgba(56, 189, 248, 0.9), inset 0 2px 5px rgba(0,0,0,0.6)'
                : '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,255,255,0.3)',
              cursor: canOperate ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: '2px solid transparent',
              outlineOffset: '2px',
              transform: isTiltingBackward ? 'scale(0.94)' : 'scale(1)',
              transition: 'transform 0.08s, box-shadow 0.08s',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontSize: '22px',
                lineHeight: 1,
                fontWeight: 900,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                marginBottom: '3px',
              }}
            >
              ▲
            </span>
          </button>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.06em',
              marginTop: '3px',
            }}
          >
            TEGAK (RETURN)
          </span>
        </div>

        {/* Holster / Put Down Button */}
        <button
          onClick={() => {
            inductionAudio.resume();
            inductionAudio.playClick();
            setIsRemoteHeld(false);
          }}
          style={{
            width: '100%',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#94a3b8',
            padding: '5px 4px',
            fontSize: '9px',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '4px',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#0f172a';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          KEMBALIKAN KE DUDUKAN
        </button>
      </div>
    </div>
  );
};
