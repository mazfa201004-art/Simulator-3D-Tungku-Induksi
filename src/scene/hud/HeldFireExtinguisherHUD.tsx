import React, { useEffect, useState } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * HeldFireExtinguisherHUD: Operator Handheld Fire Extinguisher (APAR) Control Console.
 * Displayed when the operator picks up an APAR from the factory wall.
 * Allows realistic high-pressure discharge spraying with audio and visual powder plume.
 */
export const HeldFireExtinguisherHUD: React.FC = () => {
  const isAparHeld = useSimStore((s) => s.isAparHeld);
  const setIsAparHeld = useSimStore((s) => s.setIsAparHeld);
  const isAparSpraying = useSimStore((s) => s.isAparSpraying);
  const setIsAparSpraying = useSimStore((s) => s.setIsAparSpraying);

  const [isPressing, setIsPressing] = useState(false);

  // Left-Click (pointerdown/up) or Spacebar to spray while holding APAR
  useEffect(() => {
    if (!isAparHeld) return;

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      // Left click only
      if (e.button !== 0) return;
      // If clicking interactive HUD buttons (e.g. Put back), don't trigger spray
      const target = e.target as HTMLElement | null;
      if (target?.closest('button')) return;

      setIsPressing(true);
      setIsAparSpraying(true);
      inductionAudio.startSpray();
    };

    const handlePointerUp = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        setIsPressing(false);
        setIsAparSpraying(false);
        inductionAudio.stopSpray();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsPressing(true);
        setIsAparSpraying(true);
        inductionAudio.startSpray();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPressing(false);
        setIsAparSpraying(false);
        inductionAudio.stopSpray();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isAparHeld, setIsAparSpraying]);

  if (!isAparHeld) return null;

  const handleStartSpray = () => {
    setIsPressing(true);
    setIsAparSpraying(true);
    inductionAudio.startSpray();
  };

  const handleStopSpray = () => {
    setIsPressing(false);
    setIsAparSpraying(false);
    inductionAudio.stopSpray();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        pointerEvents: 'auto',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.94)',
        border: '2px solid #ef4444',
        borderRadius: '14px',
        padding: '12px 20px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Title Header Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 900, color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', padding: '2px 6px', borderRadius: '4px' }}>APAR</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.05em' }}>
            APAR PORTABEL (DRY CHEMICAL POWDER 6 KG)
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            STATUS: SIAP DIGUNAKAN • KLIK KIRI TAHAN / [SPASI] UNTUK MENYEMPROT
          </span>
        </div>
      </div>

      {/* Button Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
        {/* Spray Button (Hold to Spray) */}
        <button
          onPointerDown={handleStartSpray}
          onPointerUp={handleStopSpray}
          onPointerLeave={handleStopSpray}
          style={{
            background: isPressing
              ? 'linear-gradient(180deg, #b91c1c 0%, #991b1b 100%)'
              : 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: '2px solid #fca5a5',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: isPressing
              ? 'inset 0 3px 6px rgba(0,0,0,0.6)'
              : '0 4px 12px rgba(220, 38, 38, 0.5)',
            transform: isPressing ? 'scale(0.97)' : 'scale(1.0)',
            transition: 'all 0.08s ease',
          }}
        >
          <span>{isPressing ? 'MENYEMPROTKAN KABUT POWDER...' : 'TAHAN UNTUK MENYEMPROT'}</span>
        </button>

        {/* Return Button */}
        <button
          onClick={() => {
            handleStopSpray();
            setIsAparHeld(false);
            inductionAudio.playClick();
          }}
          style={{
            background: '#1e293b',
            color: '#cbd5e1',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
        >
          KEMBALIKAN KE BRACKET
        </button>
      </div>

      {isAparSpraying && (
        <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 800, animation: 'pulse 1s infinite' }}>
          ⚠️ TEKANAN DISCHARGE AKTIF • MENYEMBURKAN SERBUK PEMADAM
        </div>
      )}
    </div>
  );
};
