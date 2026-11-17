import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSimStore } from '../../store/useSimStore';

interface VirtualJoystickProps {
  className?: string;
}

function detectTouchOrMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth <= 840 ||
    (window.innerHeight <= 520 && window.innerWidth <= 960) ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

/**
 * Permanent semi-transparent mobile analog pad at bottom-left.
 * Sits above floating HUD panels (such as SOPGuidePanel) with touchAction: 'none'
 * and direct DOM transforms so walking POV remains buttery-smooth without scroll stutters.
 */
export const VirtualJoystick: React.FC<VirtualJoystickProps> = () => {
  const setJoystickVector = useSimStore((s) => s.setJoystickVector);

  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isActive, setIsActive] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => detectTouchOrMobile());

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(detectTouchOrMobile());
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const PAD_SIZE = 112; // 112px comfortable thumb diameter
  const MAX_DISTANCE = 38; // Max knob displacement from center
  const DEADZONE = 0.06;

  const applyKnobTransform = useCallback((x: number, y: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);

  const updateFromClientPos = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const distance = Math.hypot(dx, dy);

      let clampedX = dx;
      let clampedY = dy;
      if (distance > MAX_DISTANCE && distance > 0) {
        clampedX = (dx / distance) * MAX_DISTANCE;
        clampedY = (dy / distance) * MAX_DISTANCE;
      }

      applyKnobTransform(clampedX, clampedY);

      // Screen Y goes down (+), so forward (+1) is negative dy
      let normX = clampedX / MAX_DISTANCE;
      let normY = -clampedY / MAX_DISTANCE;

      if (Math.abs(normX) < DEADZONE) normX = 0;
      if (Math.abs(normY) < DEADZONE) normY = 0;

      setJoystickVector({ x: normX, y: normY });
    },
    [applyKnobTransform, setJoystickVector]
  );

  const resetStick = useCallback(() => {
    pointerIdRef.current = null;
    setIsActive(false);
    applyKnobTransform(0, 0);
    setJoystickVector({ x: 0, y: 0 });
  }, [applyKnobTransform, setJoystickVector]);

  useEffect(() => {
    const handleBlur = () => {
      if (pointerIdRef.current !== null) {
        resetStick();
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [resetStick]);

  if (!isTouchDevice) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (pointerIdRef.current !== null) return;

    const el = padRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    pointerIdRef.current = e.pointerId;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }

    setIsActive(true);
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    const el = padRef.current;
    if (el) {
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors
      }
    }
    resetStick();
  };

  return (
    <div
      ref={padRef}
      role="slider"
      aria-label="Analog Gerak Operator"
      aria-valuetext={isActive ? 'Aktif' : 'Siaga'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      style={{
        position: 'fixed',
        left: 'calc(clamp(38px, 6.5vw, 62px) + env(safe-area-inset-left, 0px))',
        bottom: 'calc(104px + env(safe-area-inset-bottom, 0px))',
        width: `${PAD_SIZE}px`,
        height: `${PAD_SIZE}px`,
        borderRadius: '50%',
        zIndex: 115, // Above SOPGuidePanel (90) & CraneRemoteHUD (80), below full modals (120+)
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: 'auto',
        opacity: isActive ? 0.96 : 0.65,
        transition: 'opacity 0.14s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
      }}
    >
      {/* Mode Label Above Pad */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8.5px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: '#38bdf8',
          background: 'rgba(15, 23, 42, 0.88)',
          padding: '2px 7px',
          borderRadius: '8px',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        POV GERAK
      </div>

      {/* Outer Ring (Solid-translucent, no backdropFilter blur for maximum mobile FPS) */}
      <div
        style={{
          width: `${PAD_SIZE}px`,
          height: `${PAD_SIZE}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.78) 100%)',
          border: `2px solid ${isActive ? '#38bdf8' : 'rgba(148, 163, 184, 0.55)'}`,
          boxShadow: isActive
            ? '0 0 14px rgba(56, 189, 248, 0.4), inset 0 2px 6px rgba(0, 0, 0, 0.45)'
            : '0 4px 12px rgba(0, 0, 0, 0.35), inset 0 2px 6px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Directional Crosshair Guides */}
        <div
          style={{
            position: 'absolute',
            width: '1px',
            height: '68%',
            background: 'rgba(148, 163, 184, 0.3)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: '1px',
            width: '68%',
            background: 'rgba(148, 163, 184, 0.3)',
            pointerEvents: 'none',
          }}
        />

        {/* Thumb Puck (Transformed directly via DOM ref) */}
        <div
          ref={knobRef}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #38bdf8 10%, #0284c7 90%)',
            border: '2px solid rgba(255, 255, 255, 0.92)',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.55)',
            transform: 'translate3d(0px, 0px, 0)',
            willChange: 'transform',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '1.5px solid rgba(255, 255, 255, 0.75)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
