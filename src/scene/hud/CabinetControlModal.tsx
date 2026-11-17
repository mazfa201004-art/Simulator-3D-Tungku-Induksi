import React, { useState, useRef, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * CabinetControlModal: Layar Mengambang (Floating Control Panel) yang mereplikasi
 * ceruk panel tombol kabinet oranye GW-IF (PowerCabinet) secara presisi.
 * - Baris Atas: 5 Lampu Indikator Pilot (POWER, FAULT, WATER, IF RUN, O-TEMP)
 * - Baris Bawah: Tombol START/POWER, STOP/OFF, RESET, Knob Putar POWER SET (%), dan EMERGENCY STOP
 * - Kontrol Tegangan/Daya Presisi Anti-Licin:
 *   - Knob putar dengan Damped Linear Drag (snap per 5%)
 *   - Tombol [- 5%] / [+ 5%] & [- 1 kW] / [+ 1 kW]
 *   - Slider halus 0% - 100% (0 - 150 kW)
 *   - Tombol Preset Cepat: 0% (OFF), 10 kW (Preheat), 50% (75 kW), 100% (150 kW)
 */
export const CabinetControlModal: React.FC = () => {
  const isCabinetPanelModalOpen = useSimStore((s) => s.isCabinetPanelModalOpen);
  const setCabinetPanelModalOpen = useSimStore((s) => s.setCabinetPanelModalOpen);

  const sim = useSimStore((s) => s.sim);
  const transformerBreakerOn = useSimStore((s) => s.transformerBreakerOn);
  const masterPowerOn = useSimStore((s) => s.masterPowerOn);
  const setMasterPower = useSimStore((s) => s.setMasterPower);
  const controlPowerKeyOn = useSimStore((s) => s.controlPowerKeyOn);
  const setControlPowerKey = useSimStore((s) => s.setControlPowerKey);
  const ac1On = useSimStore((s) => s.ac1On);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const emergencyVerified = useSimStore((s) => s.emergencyVerified);
  const verifyEmergencyStopOnly = useSimStore((s) => s.verifyEmergencyStopOnly);
  const triggerEmergencyStop = useSimStore((s) => s.triggerEmergencyStop);
  const resetEmergencyStop = useSimStore((s) => s.resetEmergencyStop);
  const coilOn = useSimStore((s) => s.coilOn);
  const startFurnace = useSimStore((s) => s.startFurnace);
  const stopFurnace = useSimStore((s) => s.stopFurnace);
  const setAc1 = useSimStore((s) => s.setAc1);
  const pressAc2 = useSimStore((s) => s.pressAc2);
  const powerSetpoint = useSimStore((s) => s.powerSetpoint);
  const potensioKw = useSimStore((s) => s.potensioKw);
  const setPotensioKw = useSimStore((s) => s.setPotensioKw);
  const preheatTimerRemaining = useSimStore((s) => s.preheatTimerRemaining);
  const isPreheatDone = useSimStore((s) => s.isPreheatDone);
  const isWaterPumpRunning = useSimStore((s) => s.isWaterPumpRunning);
  const waterPressureBar = useSimStore((s) => s.waterPressureBar);
  const interlockFaultReason = useSimStore((s) => s.interlockFaultReason);

  const [isDraggingKnob, setIsDraggingKnob] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startKw: number }>({ x: 0, y: 0, startKw: 0 });
  const lastStepKwRef = useRef<number>(potensioKw);

  // E-Stop Twist-to-Release states
  const [isEStopReleasing, setIsEStopReleasing] = useState(false);
  const dragEStopStartRef = useRef<number | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Anti-slip Damped Linear Drag for the 2D Rotary Knob
  useEffect(() => {
    if (!isDraggingKnob) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = dragStartRef.current.y - e.clientY; // Dragging UP or RIGHT increases power
      const combinedDelta = dx * 0.7 + dy * 0.9;

      // 180px of movement corresponds to full 150 kW range -> smooth, non-slippery control!
      const rawKw = dragStartRef.current.startKw + (combinedDelta / 180) * 150;
      // Snap to 5 kW steps during knob drag for crisp industrial feel
      const snappedKw = Math.round(Math.max(0, Math.min(150, rawKw)) / 5) * 5;

      if (snappedKw !== lastStepKwRef.current) {
        lastStepKwRef.current = snappedKw;
        inductionAudio.playDetent();
        setPotensioKw(snappedKw);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingKnob(false);
      document.body.style.cursor = 'auto';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDraggingKnob, setPotensioKw]);

  // Auto-verify emergency stop readiness if user inspects the cabinet while E-Stop is unlatched
  useEffect(() => {
    if (isCabinetPanelModalOpen && !emergencyTripped && !emergencyVerified) {
      verifyEmergencyStopOnly();
    }
  }, [isCabinetPanelModalOpen, emergencyTripped, emergencyVerified, verifyEmergencyStopOnly]);

  if (!isCabinetPanelModalOpen) return null;

  const isCabinetEnergized = transformerBreakerOn && masterPowerOn;
  const isFault = emergencyTripped || sim.waterTripFault || (isCabinetEnergized && sim.coilWaterTempC > 55);
  const isWaterOk = isWaterPumpRunning && !sim.waterTripFault && waterPressureBar >= 2.5;
  const isIfRun = isCabinetEnergized && coilOn && powerSetpoint > 0;
  const isOverTemp = isCabinetEnergized && (sim.coilWaterTempC > 50 || sim.temperatureC > 1680);

  const percentValue = Math.round((potensioKw / 150) * 100);
  // Knob angle from -135 deg (0%) to +135 deg (100%)
  const knobAngleDeg = -135 + (potensioKw / 150) * 270;

  const handleSetKw = (newKw: number) => {
    const clamped = Math.max(0, Math.min(150, Math.round(newKw)));
    inductionAudio.resume();
    inductionAudio.playDetent();
    setPotensioKw(clamped);
  };

  const handleStartButton = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setAc1(true);
    startFurnace();
  };

  const handleStopButton = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    pressAc2();
    stopFurnace();
  };

  const handleResetButton = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    resetEmergencyStop();
  };

  const handleEStopButton = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    triggerEmergencyStop();
  };

  const handleEStopRelease = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setIsEStopReleasing(true);
    setTimeout(() => {
      resetEmergencyStop();
      setIsEStopReleasing(false);
    }, 240);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '8px' : '16px',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          setCabinetPanelModalOpen(false);
        }
      }}
    >
      {/* Main Outer Orange Industrial Cabinet Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: isMobile ? '520px' : '640px',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)',
          border: '3px solid #fb923c',
          borderRadius: '14px',
          padding: isMobile ? '10px' : '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
          color: '#f8fafc',
          boxSizing: 'border-box',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: isMobile ? '6px 10px' : '8px 14px',
            marginBottom: isMobile ? '8px' : '12px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isCabinetEnergized ? '#22c55e' : '#ef4444',
                boxShadow: isCabinetEnergized ? '0 0 8px #22c55e' : 'none',
              }}
            />
            <div>
              <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                PANEL KONTROL UTAMA TANUR (GW-IF CONTROL NICHE)
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                Klik tombol atau atur potensiometer daya listrik tanur induksi
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Quick Master Power Toggle */}
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                if (transformerBreakerOn) {
                  const next = !masterPowerOn;
                  setMasterPower(next);
                  setControlPowerKey(next);
                }
              }}
              style={{
                minHeight: '34px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: masterPowerOn ? 'rgba(22, 163, 74, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                border: `1.5px solid ${masterPowerOn ? '#4ade80' : '#f87171'}`,
                color: masterPowerOn ? '#4ade80' : '#fca5a5',
                fontSize: '10px',
                fontWeight: 800,
                cursor: transformerBreakerOn ? 'pointer' : 'not-allowed',
              }}
              title="Saklar Kunci Daya Kontrol Kabinet (Control Power)"
            >
              CONTROL POWER: {masterPowerOn ? 'ON (380V)' : 'OFF'}
            </button>

            {/* Close Floating Panel Button */}
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setCabinetPanelModalOpen(false);
              }}
              style={{
                minHeight: '34px',
                padding: '4px 12px',
                borderRadius: '6px',
                background: '#1e293b',
                border: '1.5px solid #64748b',
                color: '#f8fafc',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ✕ TUTUP
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BARIS URUTAN KONTROL KABINET (CONTROL POWER & TOMBOL AC ON / AC OFF)   */}
        {/* ===================================================================== */}
        <div
          style={{
            background: '#0f172a',
            border: '1.5px solid #334155',
            borderRadius: '8px',
            padding: isMobile ? '8px 10px' : '10px 14px',
            marginBottom: isMobile ? '8px' : '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#facc15', letterSpacing: '0.04em' }}>
              PANEL KENDALI DAYA INVERTER (ADEGAN 8 - 9 &amp; SHUTDOWN 19)
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 700, color: controlPowerKeyOn ? '#4ade80' : '#94a3b8' }}>
              Voltmeter Kontrol: {controlPowerKeyOn ? '380 V (ON)' : '0 V (OFF)'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(3, 1fr)',
              gap: '6px',
            }}
          >
            {/* 1. KUNCI CONTROL POWER */}
            <button
              onClick={() => {
                inductionAudio.resume();
                const next = !controlPowerKeyOn;
                setControlPowerKey(next);
                setMasterPower(next);
              }}
              style={{
                minHeight: '44px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: controlPowerKeyOn ? 'rgba(2, 132, 199, 0.32)' : '#1e293b',
                border: `1.5px solid ${controlPowerKeyOn ? '#38bdf8' : '#475569'}`,
                color: controlPowerKeyOn ? '#38bdf8' : '#e2e8f0',
                fontSize: '10.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <span>1. CONTROL POWER</span>
              <span style={{ fontSize: '8.5px', color: controlPowerKeyOn ? '#4ade80' : '#94a3b8' }}>
                {controlPowerKeyOn ? '380V (ON)' : 'Kunci (OFF)'}
              </span>
            </button>

            {/* 2. TOMBOL HIJAU AC ON (Sirkuit AC No. 1) */}
            <button
              onClick={handleStartButton}
              style={{
                minHeight: '44px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: ac1On || coilOn ? '#15803d' : 'rgba(21, 128, 61, 0.25)',
                border: `1.5px solid ${ac1On || coilOn ? '#4ade80' : '#22c55e'}`,
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
              title="Tombol Hijau AC ON"
            >
              <span>2. AC ON (HIJAU)</span>
              <span style={{ fontSize: '8.5px', color: '#bbf7d0' }}>
                {ac1On || coilOn ? 'OSCILLATING' : 'Mulai Inverter'}
              </span>
            </button>

            {/* 3. TOMBOL MERAH AC OFF (Sirkuit AC No. 2) */}
            <button
              onClick={handleStopButton}
              style={{
                minHeight: '44px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: !coilOn ? '#991b1b' : 'rgba(185, 28, 28, 0.25)',
                border: '1.5px solid #f87171',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
              title="Tombol Merah AC OFF"
            >
              <span>3. AC OFF (MERAH)</span>
              <span style={{ fontSize: '8.5px', color: '#fecaca' }}>
                {!coilOn ? 'STANDBY OFF' : 'Stop Inverter'}
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* AUTHENTIC RECESSED CONTROL NICHE (REPLIKA PERSIS GAMBAR REFERENSI)     */}
        {/* ===================================================================== */}
        <div
          style={{
            background: '#7c2d12', // Deep recessed dark red-orange niche interior
            border: '4px solid #9a3412',
            borderRadius: '10px',
            boxShadow: 'inset 0 8px 20px rgba(0, 0, 0, 0.65)',
            overflow: 'hidden',
            marginBottom: isMobile ? '10px' : '14px',
          }}
        >
          {/* Top Bright Orange Bevel Strip (Persis bagian atas gambar referensi) */}
          <div
            style={{
              height: isMobile ? '16px' : '22px',
              background: 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)',
              borderBottom: '2px solid #431407',
              margin: '6px 8px 10px 8px',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          />

          {/* ROW 1: 5 INDUSTRIAL PILOT INDICATOR LAMPS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: isMobile ? '6px' : '12px',
              padding: isMobile ? '6px 10px 14px' : '8px 20px 18px',
              justifyItems: 'center',
            }}
          >
            {[
              {
                label: 'POWER',
                isOn: isCabinetEnergized,
                activeColor: '#22c55e',
                offColor: '#14532d',
                glow: '0 0 14px #22c55e, inset 0 2px 4px rgba(255,255,255,0.6)',
              },
              {
                label: 'FAULT',
                isOn: isFault,
                activeColor: '#ef4444',
                offColor: '#7f1d1d',
                glow: '0 0 14px #ef4444, inset 0 2px 4px rgba(255,255,255,0.6)',
              },
              {
                label: 'WATER',
                isOn: isCabinetEnergized,
                activeColor: isWaterOk ? '#22c55e' : '#ef4444',
                offColor: '#14532d',
                glow: isWaterOk
                  ? '0 0 14px #22c55e, inset 0 2px 4px rgba(255,255,255,0.6)'
                  : '0 0 14px #ef4444, inset 0 2px 4px rgba(255,255,255,0.6)',
              },
              {
                label: 'IF RUN',
                isOn: isIfRun,
                activeColor: '#22c55e',
                offColor: '#14532d',
                glow: '0 0 14px #22c55e, inset 0 2px 4px rgba(255,255,255,0.6)',
              },
              {
                label: 'O-TEMP',
                isOn: isOverTemp,
                activeColor: '#ef4444',
                offColor: '#7f1d1d',
                glow: '0 0 14px #ef4444, inset 0 2px 4px rgba(255,255,255,0.6)',
              },
            ].map((lamp) => (
              <div
                key={lamp.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {/* Chrome Bezel Ring */}
                <div
                  style={{
                    width: isMobile ? '32px' : '38px',
                    height: isMobile ? '32px' : '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #64748b 50%, #0f172a 100%)',
                    padding: '4px',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Jewel Lens */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: lamp.isOn ? lamp.activeColor : lamp.offColor,
                      boxShadow: lamp.isOn ? lamp.glow : 'inset 0 2px 5px rgba(0,0,0,0.7)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: isMobile ? '9px' : '10.5px',
                    fontWeight: 900,
                    color: '#090d16',
                    letterSpacing: '0.04em',
                    textShadow: '0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  {lamp.label}
                </span>
              </div>
            ))}
          </div>

          {/* ROW 2: 5 INTERACTIVE CONTROLS (START, STOP, RESET, POWER SET KNOB, E-STOP) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: isMobile ? '6px' : '12px',
              padding: isMobile ? '8px 10px 18px' : '10px 20px 24px',
              alignItems: 'center',
              justifyItems: 'center',
            }}
          >
            {/* 1. START / POWER BUTTON */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={handleStartButton}
                title="Nyalakan Pemanasan Induksi (START / POWER)"
                style={{
                  background: '#090d16',
                  border: '1.5px solid #334155',
                  borderRadius: '6px',
                  padding: isMobile ? '6px 8px 8px' : '8px 12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                }}
              >
                {/* Chrome Bezel + Flush Pushbutton Cap */}
                <div
                  style={{
                    width: isMobile ? '36px' : '44px',
                    height: isMobile ? '36px' : '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #cbd5e1 0%, #475569 100%)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: coilOn ? '0 0 12px #22c55e' : '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: coilOn
                        ? 'radial-gradient(circle, #22c55e 0%, #15803d 100%)'
                        : 'radial-gradient(circle, #334155 0%, #0f172a 100%)',
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <div style={{ fontSize: isMobile ? '9px' : '10px', fontWeight: 900, color: '#f8fafc' }}>START</div>
                  <div style={{ fontSize: isMobile ? '7.5px' : '8.5px', fontWeight: 700, color: '#94a3b8' }}>POWER</div>
                </div>
              </button>
            </div>

            {/* 2. STOP / OFF BUTTON */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={handleStopButton}
                title="Matikan Pemanasan Induksi (STOP / OFF)"
                style={{
                  background: '#090d16',
                  border: '1.5px solid #334155',
                  borderRadius: '6px',
                  padding: isMobile ? '6px 8px 8px' : '8px 12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  style={{
                    width: isMobile ? '36px' : '44px',
                    height: isMobile ? '36px' : '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #cbd5e1 0%, #475569 100%)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: !coilOn ? '0 0 10px rgba(239,68,68,0.6)' : '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: !coilOn
                        ? 'radial-gradient(circle, #dc2626 0%, #7f1d1d 100%)'
                        : 'radial-gradient(circle, #334155 0%, #0f172a 100%)',
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25)',
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                  <div style={{ fontSize: isMobile ? '9px' : '10px', fontWeight: 900, color: '#f8fafc' }}>STOP</div>
                  <div style={{ fontSize: isMobile ? '7.5px' : '8.5px', fontWeight: 700, color: '#94a3b8' }}>OFF</div>
                </div>
              </button>
            </div>

            {/* 3. RESET PUSHBUTTON */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleResetButton}
                title="Reset Fault / Lepas Kunci Emergency Stop"
                style={{
                  width: isMobile ? '42px' : '50px',
                  height: isMobile ? '42px' : '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #475569 100%)',
                  padding: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #1e293b 0%, #020617 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)',
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: isMobile ? '9.5px' : '11px',
                  fontWeight: 900,
                  color: '#090d16',
                  letterSpacing: '0.04em',
                }}
              >
                RESET
              </span>
            </div>

            {/* 4. POWER SET (%) ROTARY POTENTIOMETER KNOB */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              {/* Black Legend Header Plate */}
              <div
                style={{
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: isMobile ? '8px' : '9px',
                  fontWeight: 900,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.03em',
                }}
              >
                POWER SET (%)
              </div>

              {/* Graduated Dial & Rotary Knob */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  inductionAudio.resume();
                  setIsDraggingKnob(true);
                  dragStartRef.current = { x: e.clientX, y: e.clientY, startKw: potensioKw };
                  lastStepKwRef.current = potensioKw;
                  document.body.style.cursor = 'grabbing';
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  const deltaKw = e.deltaY < 0 ? 5 : -5;
                  handleSetKw(potensioKw + deltaKw);
                }}
                title="Geser ke Atas/Kanan untuk Menaikkan Daya, atau gunakan tombol & slider di bawah"
                style={{
                  width: isMobile ? '64px' : '76px',
                  height: isMobile ? '64px' : '76px',
                  borderRadius: '50%',
                  background: '#090d16',
                  border: '2px solid #475569',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDraggingKnob ? 'grabbing' : 'grab',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.7)',
                  touchAction: 'none',
                }}
              >
                {/* Scale Numbers Around Dial (0, 20, 40, 60, 80, 100) */}
                {[0, 20, 40, 60, 80, 100].map((val) => {
                  const rad = ((-135 + (val / 100) * 270 - 90) * Math.PI) / 180;
                  const r = isMobile ? 24 : 29;
                  const tx = Math.cos(rad) * r;
                  const ty = Math.sin(rad) * r;
                  return (
                    <span
                      key={val}
                      style={{
                        position: 'absolute',
                        transform: `translate(${tx}px, ${ty}px)`,
                        fontSize: isMobile ? '7px' : '8px',
                        fontWeight: 800,
                        color: '#cbd5e1',
                        pointerEvents: 'none',
                      }}
                    >
                      {val}
                    </span>
                  );
                })}

                {/* Inner Rotating Knob Cap */}
                <div
                  style={{
                    width: isMobile ? '36px' : '44px',
                    height: isMobile ? '36px' : '44px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #334155 0%, #0f172a 75%, #020617 100%)',
                    border: '2px solid #64748b',
                    boxShadow: isDraggingKnob ? '0 0 12px #38bdf8' : '0 3px 6px rgba(0,0,0,0.8)',
                    transform: `rotate(${knobAngleDeg}deg)`,
                    transition: isDraggingKnob ? 'none' : 'transform 0.12s ease-out',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {/* Glowing Cyan Pointer Line */}
                  <div
                    style={{
                      width: '3px',
                      height: isMobile ? '11px' : '14px',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8',
                      borderRadius: '2px',
                      marginTop: '3px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 5. EMERGENCY STOP MUSHROOM BUTTON (Twist-to-Release) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => {
                  if (emergencyTripped) {
                    handleEStopRelease();
                  } else {
                    handleEStopButton();
                  }
                }}
                onPointerDown={(e) => {
                  if (emergencyTripped) {
                    dragEStopStartRef.current = e.clientX;
                  }
                }}
                onPointerMove={(e) => {
                  if (emergencyTripped && dragEStopStartRef.current !== null) {
                    const dx = e.clientX - dragEStopStartRef.current;
                    if (dx < -16) {
                      dragEStopStartRef.current = null;
                      handleEStopRelease();
                    }
                  }
                }}
                onPointerUp={() => {
                  dragEStopStartRef.current = null;
                }}
                title={
                  emergencyTripped
                    ? 'Emergency Stop Terkunci! Klik atau Putar ke Kiri untuk Membuka Kunci (Twist to Release)'
                    : 'Tekan untuk Memutus Darurat Seluruh Daya Tanur (EMERGENCY STOP)'
                }
                style={{
                  width: isMobile ? '68px' : '82px',
                  height: isMobile ? '68px' : '82px',
                  borderRadius: '50%',
                  background: emergencyTripped
                    ? 'radial-gradient(circle, #facc15 45%, #b45309 100%)'
                    : 'radial-gradient(circle, #facc15 55%, #ca8a04 100%)',
                  border: `2px solid ${emergencyTripped ? '#f59e0b' : '#fef08a'}`,
                  boxShadow: emergencyTripped
                    ? '0 0 16px rgba(239, 68, 68, 0.6), inset 0 2px 4px rgba(0,0,0,0.5)'
                    : '0 6px 14px rgba(0,0,0,0.65)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? '6.5px' : '7.5px',
                    fontWeight: 900,
                    color: '#090d16',
                    letterSpacing: '0.03em',
                  }}
                >
                  EMERGENCY
                </span>

                {/* Red Mushroom Head with Twist-to-Release Indicator */}
                <div
                  style={{
                    width: isMobile ? '38px' : '46px',
                    height: isMobile ? '38px' : '46px',
                    borderRadius: '50%',
                    background: emergencyTripped
                      ? 'radial-gradient(circle, #ef4444 0%, #7f1d1d 100%)'
                      : 'radial-gradient(circle, #f87171 0%, #dc2626 45%, #991b1b 100%)',
                    border: '2px solid #7f1d1d',
                    boxShadow: emergencyTripped
                      ? 'inset 0 3px 6px rgba(0,0,0,0.7), 0 0 14px #ef4444'
                      : '0 5px 10px rgba(0,0,0,0.65), inset 0 2px 4px rgba(255,255,255,0.4)',
                    transform: isEStopReleasing
                      ? 'rotate(-45deg) scale(1.05)'
                      : emergencyTripped
                        ? 'rotate(0deg) scale(0.92)'
                        : 'rotate(0deg) scale(1)',
                    transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  {emergencyTripped && (
                    <span
                      style={{
                        fontSize: isMobile ? '18px' : '22px',
                        fontWeight: 900,
                        lineHeight: 1,
                        color: '#fef08a',
                        textShadow: '0 0 6px rgba(0,0,0,0.9)',
                        transform: isEStopReleasing ? 'rotate(-60deg)' : 'rotate(0deg)',
                        transition: 'transform 0.22s ease',
                      }}
                    >
                      ⟲
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: isMobile ? '7px' : '8px',
                    fontWeight: 900,
                    color: '#090d16',
                    letterSpacing: '0.05em',
                  }}
                >
                  STOP
                </span>
              </button>

              {emergencyTripped && (
                <div
                  onClick={handleEStopRelease}
                  style={{
                    marginTop: '5px',
                    fontSize: isMobile ? '8px' : '9px',
                    fontWeight: 800,
                    color: '#fef08a',
                    background: 'rgba(185, 28, 28, 0.85)',
                    border: '1px solid #f87171',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span>⟲</span>
                  <span>Putar Kiri Buka Kunci</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interlock / Fault Banner if present */}
        {(emergencyTripped || interlockFaultReason) && (
          <div
            style={{
              background: 'rgba(127, 29, 29, 0.92)',
              border: '1.5px solid #f87171',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#fecaca',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>
              {emergencyTripped
                ? 'STATUS DARURAT: Tombol EMERGENCY STOP sedang aktif/terkunci! Tekan tombol RESET untuk menormalkan.'
                : interlockFaultReason}
            </span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ANTI-SLIP PRECISION VOLTAGE / POWER REGULATOR DECK                     */}
        {/* ===================================================================== */}
        <div
          style={{
            background: '#0f172a',
            border: '1.5px solid #334155',
            borderRadius: '10px',
            padding: isMobile ? '10px 12px' : '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Top Digital Readout & Step Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>
                PENGATUR PRESISI TEGANGAN & DAYA INDUKSI (ANTI-LICIN)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: '#38bdf8' }}>
                  {potensioKw} kW
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#facc15' }}>
                  ({percentValue}%)
                </span>
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  • Tegangan IF: <strong style={{ color: '#4ade80' }}>{Math.round(sim.ifVolts)} V</strong>
                </span>
              </div>
            </div>

            {/* Fine & Coarse Step Adjustment Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handleSetKw(potensioKw - 15)}
                style={{
                  minHeight: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                -10%
              </button>
              <button
                onClick={() => handleSetKw(potensioKw - 5)}
                style={{
                  minHeight: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                -5 kW
              </button>
              <button
                onClick={() => handleSetKw(potensioKw + 5)}
                style={{
                  minHeight: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                +5 kW
              </button>
              <button
                onClick={() => handleSetKw(potensioKw + 15)}
                style={{
                  minHeight: '38px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                +10%
              </button>
            </div>
          </div>

          {/* Smooth Precision Range Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', width: '28px' }}>0%</span>
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={potensioKw}
              onChange={(e) => handleSetKw(Number(e.target.value))}
              style={{
                flex: 1,
                height: '10px',
                accentColor: '#38bdf8',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', width: '36px', textAlign: 'right' }}>
              100%
            </span>
          </div>

          {/* 4 One-Tap Power Preset Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '6px',
            }}
          >
            {[
              { label: '0% • MATI (0 kW)', kw: 0, desc: 'Shutdown' },
              { label: '7% • PREHEAT (10 kW)', kw: 10, desc: 'Pemanasan Krusibel' },
              { label: '50% • MENENGAH (75 kW)', kw: 75, desc: 'Pemanasan Awal' },
              { label: '100% • PENUH (150 kW)', kw: 150, desc: 'Peleburan Penuh' },
            ].map((preset) => {
              const isSelected = potensioKw === preset.kw;
              return (
                <button
                  key={preset.kw}
                  onClick={() => handleSetKw(preset.kw)}
                  style={{
                    minHeight: '40px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(2, 132, 199, 0.35)' : '#1e293b',
                    border: `1.5px solid ${isSelected ? '#38bdf8' : '#334155'}`,
                    color: isSelected ? '#38bdf8' : '#e2e8f0',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{preset.label}</span>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 600 }}>{preset.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Real-Time Pre-Heating Timer Indicator (Adegan 3.4 Storyboard) */}
          <div
            style={{
              background: isPreheatDone
                ? 'rgba(22, 163, 74, 0.2)'
                : coilOn && potensioKw >= 10
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${
                isPreheatDone ? '#4ade80' : coilOn && potensioKw >= 10 ? '#facc15' : '#334155'
              }`,
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: isPreheatDone ? '#4ade80' : coilOn && potensioKw >= 10 ? '#fde047' : '#94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>STATUS PRE-HEATING KRUSIBEL (ADEGAN 3.4):</span>
            <span>
              {isPreheatDone
                ? '✓ PRE-HEATING 15 DETIK SELESAI (SIAP CHARGING / PULL POWER)'
                : coilOn && potensioKw >= 10
                ? `BERJALAN... SISA ${Math.ceil(preheatTimerRemaining)} DETIK`
                : 'Atur Daya >= 10 kW & Tekan AC No. 1 untuk Memulai (15s)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
