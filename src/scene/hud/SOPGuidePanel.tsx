import React, { useState, useEffect } from 'react';
import { useSimStore, SOP_STEPS } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

function detectMobilePortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

function detectTouchPerformance(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 840 ||
    (window.innerHeight <= 520 && window.innerWidth <= 960) ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

export const SOPGuidePanel: React.FC = () => {
  const isSopMode = useSimStore((s) => s.isSopMode);
  const toggleSopMode = useSimStore((s) => s.toggleSopMode);
  const currentSopStepIndex = useSimStore((s) => s.currentSopStepIndex);
  const sopStepCompletedMap = useSimStore((s) => s.sopStepCompletedMap);
  const setSopStepIndex = useSimStore((s) => s.setSopStepIndex);
  const nextSopStep = useSimStore((s) => s.nextSopStep);
  const prevSopStep = useSimStore((s) => s.prevSopStep);
  const isSopPanelOpen = useSimStore((s) => s.isSopPanelOpen);
  const setIsSopPanelOpen = useSimStore((s) => s.setIsSopPanelOpen);

  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobilePortrait());
  const [isLiteBackdrop, setIsLiteBackdrop] = useState<boolean>(() => detectTouchPerformance());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(detectMobilePortrait());
      setIsLiteBackdrop(detectTouchPerformance());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only keep the two time-acceleration actions allowed by user:
  // 1. Scene 14: triggerQuickMelt60s (Akselerasi Peleburan 60 Detik)
  // 2. Scene 20: startTimeLapse5Hours (Time-Lapse Pompa Pendingin ± 5 Jam)
  const isMeltingFastForward = useSimStore((s) => s.isMeltingFastForward);
  const meltingCountdown = useSimStore((s) => s.meltingCountdown);
  const triggerQuickMelt60s = useSimStore((s) => s.triggerQuickMelt60s);

  // Scene 10 live 15-second pre-heating timer telemetry (read-only indicator)
  const preheatTimerRemaining = useSimStore((s) => s.preheatTimerRemaining);
  const isPreheatDone = useSimStore((s) => s.isPreheatDone);
  const potensioKw = useSimStore((s) => s.potensioKw);
  const coilOn = useSimStore((s) => s.coilOn);

  // Scene 18 live mold pouring & ladle return-to-standby telemetry (read-only indicator)
  const singleMoldFillLevel = useSimStore((s) => s.singleMoldFillLevel);
  const cranePosition = useSimStore((s) => s.cranePosition);
  const isLadlePouringToMold = useSimStore((s) => s.isLadlePouringToMold);

  const timeLapse5HoursActive = useSimStore((s) => s.timeLapse5HoursActive);
  const timeLapse5HoursDone = useSimStore((s) => s.timeLapse5HoursDone);
  const startTimeLapse5Hours = useSimStore((s) => s.startTimeLapse5Hours);
  const shutdownCoolingPumpOff = useSimStore((s) => s.shutdownCoolingPumpOff);
  const setReportCardOpen = useSimStore((s) => s.setReportCardOpen);

  const [showClue, setShowClue] = useState(false);

  // Keyboard shortcut: Escape to exit SOP mode
  useEffect(() => {
    if (!isSopMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleSopMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSopMode, toggleSopMode]);

  if (!isSopMode) return null;

  const currentStep = SOP_STEPS[currentSopStepIndex] || SOP_STEPS[0];
  const isCurrentCompleted = !!sopStepCompletedMap[currentStep.number];
  const totalCompleted = Object.values(sopStepCompletedMap).filter(Boolean).length;
  const progressPercent = Math.round((totalCompleted / SOP_STEPS.length) * 100);

  // On mobile when collapsed, render a minimal, thumb-friendly floating pill
  if (isMobile && !isSopPanelOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '58px',
          left: '12px',
          zIndex: 60,
          pointerEvents: 'auto',
          maxWidth: 'calc(100vw - 24px)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <button
          onClick={() => {
            inductionAudio.resume();
            inductionAudio.playClick();
            setIsSopPanelOpen(true);
          }}
          style={{
            height: '44px',
            minWidth: '44px',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: '22px',
            padding: '0 14px',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
          }}
          title="Buka Panduan SOP Praktikum"
        >
          <span style={{ fontSize: '10px', fontWeight: 800, background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
            SOP {currentStep.number}/{SOP_STEPS.length}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
            {currentStep.title}
          </span>
          <span style={{ color: '#38bdf8', fontSize: '12px' }}>▲ Buka</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={isMobile ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxHeight: '72dvh',
        zIndex: 90,
        pointerEvents: 'auto',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      } : {
        position: 'absolute',
        top: '76px',
        left: '16px',
        width: '420px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 60,
        pointerEvents: 'auto',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. COLLAPSIBLE FLOATING SOP PANEL CONTAINER */}
      <div
        style={{
          background: isLiteBackdrop ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: isLiteBackdrop ? 'none' : 'blur(16px)',
          border: '1px solid rgba(51, 65, 85, 0.8)',
          borderRadius: isMobile ? '16px 16px 0 0' : '12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 16px' : '10px 14px',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
              }}
            >
              PANDUAN
            </span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.01em' }}>
                PANDUAN PRAKTIKUM PELEBURAN
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Simulator Tanur Induksi • Adegan {currentStep.number} / {SOP_STEPS.length}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setIsSopPanelOpen(!isSopPanelOpen);
              }}
              style={{
                background: 'rgba(51, 65, 85, 0.6)',
                border: 'none',
                color: '#cbd5e1',
                padding: '0 12px',
                minHeight: '44px',
                minWidth: '44px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isSopPanelOpen ? 'Ciutkan Panel' : 'Buka Panel'}
            >
              {isSopPanelOpen ? '▲ Ciutkan' : '▼ Buka'}
            </button>

            <button
              onClick={toggleSopMode}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                padding: '0 12px',
                minHeight: '44px',
                minWidth: '44px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Keluar dari Panduan SOP"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div style={{ padding: '8px 14px', background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
            <span>Kemajuan Praktikum ({totalCompleted}/{SOP_STEPS.length} Adegan Terverifikasi)</span>
            <span style={{ fontWeight: 800, color: progressPercent >= 75 ? '#4ade80' : '#38bdf8' }}>{progressPercent}% (KKM 75%)</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(51, 65, 85, 0.6)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent >= 75
                  ? 'linear-gradient(90deg, #0284c7 0%, #10b981 100%)'
                  : 'linear-gradient(90deg, #f59e0b 0%, #0284c7 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Panel Body */}
        {isSopPanelOpen && (
          <div
            style={{
              padding: '14px',
              maxHeight: isMobile ? 'calc(72dvh - 120px)' : 'calc(100dvh - 195px)',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Act Banner */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '6px',
                padding: '6px 10px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#facc15' }}>
                BABAK {currentStep.act}: {currentStep.actTitle}
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                +{currentStep.points} POIN
              </span>
            </div>

            {/* Step Selector Badges Grid (1..20) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '12px',
              }}
            >
              {SOP_STEPS.map((s, idx) => {
                const isSelected = idx === currentSopStepIndex;
                const isDone = !!sopStepCompletedMap[s.number];
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      inductionAudio.resume();
                      inductionAudio.playClick();
                      setSopStepIndex(idx);
                    }}
                    style={{
                      background: isSelected
                        ? '#0284c7'
                        : isDone
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(30, 41, 59, 0.7)',
                      border: `1px solid ${
                        isSelected
                          ? '#38bdf8'
                          : isDone
                          ? 'rgba(16, 185, 129, 0.6)'
                          : 'rgba(51, 65, 85, 0.5)'
                      }`,
                      color: isSelected ? '#ffffff' : isDone ? '#4ade80' : '#94a3b8',
                      padding: '5px 0',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1px',
                      transition: 'all 0.15s ease',
                      minHeight: '34px',
                      justifyContent: 'center',
                    }}
                    title={`Adegan ${s.number}: ${s.title}`}
                  >
                    <span>{s.number}</span>
                    <span style={{ fontSize: '8px' }}>{isDone ? '✓' : '•'}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Scene Detail Card */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(51, 65, 85, 0.7)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#38bdf8',
                    background: 'rgba(2, 132, 199, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ADEGAN {currentStep.number} / {SOP_STEPS.length}
                </span>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isCurrentCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isCurrentCompleted ? '#4ade80' : '#fbbf24',
                    border: `1px solid ${isCurrentCompleted ? 'rgba(74, 222, 128, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isCurrentCompleted ? `✓ TERPENUHI (+${currentStep.points} Poin)` : 'BELUM TERPENUHI'}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#f8fafc',
                  margin: '0 0 8px 0',
                  lineHeight: '1.4',
                }}
              >
                {currentStep.title}
              </h2>

              {/* Procedure */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#e2e8f0',
                  lineHeight: '1.45',
                  marginBottom: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #0284c7',
                }}
              >
                {currentStep.instruction}
              </div>

              {/* Target Description */}
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, color: '#facc15', flexShrink: 0 }}>Kriteria:</span>
                <span>{currentStep.objective}</span>
              </div>

              {/* ADEGAN 10: LIVE 15-SECOND PRE-HEATING COUNTDOWN INDICATOR */}
              {currentStep.number === 10 && (() => {
                const isPreheatingActive = coilOn && potensioKw >= 10 && !isPreheatDone;
                const secondsLeft = Math.max(0, Math.ceil(preheatTimerRemaining));
                const elapsedFraction = Math.min(1, Math.max(0, (15 - preheatTimerRemaining) / 15));
                const elapsedPercent = Math.round(elapsedFraction * 100);

                return (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      borderRadius: '7px',
                      background: isPreheatDone
                        ? 'rgba(16, 185, 129, 0.14)'
                        : isPreheatingActive
                        ? 'rgba(245, 158, 11, 0.14)'
                        : 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${
                        isPreheatDone
                          ? 'rgba(74, 222, 128, 0.5)'
                          : isPreheatingActive
                          ? 'rgba(251, 191, 36, 0.55)'
                          : 'rgba(71, 85, 105, 0.6)'
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: isPreheatDone ? '#4ade80' : isPreheatingActive ? '#fde047' : '#cbd5e1',
                        }}
                      >
                        {isPreheatDone
                          ? '✓ Pemanasan Awal 15 Detik Selesai!'
                          : isPreheatingActive
                          ? `⏳ Waktu Tunggu Pre-heating: ${secondsLeft} detik lagi`
                          : `⏱️ Durasi Pre-heating: ${secondsLeft} detik (Menunggu Daya ≥ 10 kW)`}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: coilOn && potensioKw >= 10 ? 'rgba(234, 88, 12, 0.3)' : 'rgba(51, 65, 85, 0.6)',
                          color: coilOn && potensioKw >= 10 ? '#fdba74' : '#94a3b8',
                        }}
                      >
                        Daya: {potensioKw} kW
                      </span>
                    </div>

                    {/* Visual 15s Progress Bar */}
                    <div
                      style={{
                        height: '8px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid rgba(71, 85, 105, 0.5)',
                      }}
                    >
                      <div
                        style={{
                          width: `${isPreheatDone ? 100 : elapsedPercent}%`,
                          height: '100%',
                          background: isPreheatDone
                            ? 'linear-gradient(90deg, #10b981 0%, #4ade80 100%)'
                            : 'linear-gradient(90deg, #f59e0b 0%, #38bdf8 100%)',
                          transition: 'width 0.15s linear',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#94a3b8',
                        marginTop: '5px',
                      }}
                    >
                      <span>
                        {isPreheatDone
                          ? 'Dinding krusibel sudah hangat dan siap dimuati bahan.'
                          : isPreheatingActive
                          ? 'Pertahankan potensio pada ≥ 10 kW hingga hitung mundur mencapai 0 detik.'
                          : 'Buka lemari panel kontrol oranye lalu putar potensio ke minimal 10 kW.'}
                      </span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0', flexShrink: 0, marginLeft: '6px' }}>
                        {15 - secondsLeft} / 15 dtk
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ADEGAN 18: 2-STAGE CHECKLIST (POUR MOLD 100% + RETURN LADLE TO STANDBY POSITION) */}
              {currentStep.number === 18 && (() => {
                const isMoldFull = singleMoldFillLevel >= 0.90;
                const moldPct = Math.min(100, Math.round(singleMoldFillLevel * 100));
                const distToStandby = Math.hypot(cranePosition[0] - 4.0, cranePosition[2] - 0.0);
                const isLadleReturned = distToStandby <= 1.25 && !isLadlePouringToMold;

                return (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      borderRadius: '7px',
                      background: 'rgba(15, 23, 42, 0.78)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.03em' }}>
                      SYARAT PENYELESAIAN ADEGAN 18 (2 TAHAP WAJIB):
                    </div>

                    {/* Sub-step 1: Pouring into Single Sand Mold */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '5px 8px',
                        borderRadius: '5px',
                        background: isMoldFull ? 'rgba(16, 185, 129, 0.16)' : 'rgba(30, 41, 59, 0.7)',
                        border: `1px solid ${isMoldFull ? 'rgba(74, 222, 128, 0.45)' : 'rgba(71, 85, 105, 0.5)'}`,
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ color: isMoldFull ? '#4ade80' : '#e2e8f0', fontWeight: 700 }}>
                        {isMoldFull ? '✓ 1. Cetakan Pasir Terisi Penuh' : '1. Tuang ke Cetakan Pasir Tunggal'}
                      </span>
                      <span style={{ fontWeight: 800, color: isMoldFull ? '#4ade80' : '#fbbf24' }}>
                        {moldPct}%
                      </span>
                    </div>

                    {/* Sub-step 2: Return Ladle to Original Standby Position */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        padding: '6px 8px',
                        borderRadius: '5px',
                        background:
                          isMoldFull && isLadleReturned
                            ? 'rgba(16, 185, 129, 0.16)'
                            : isMoldFull
                            ? 'rgba(245, 158, 11, 0.16)'
                            : 'rgba(30, 41, 59, 0.7)',
                        border: `1px solid ${
                          isMoldFull && isLadleReturned
                            ? 'rgba(74, 222, 128, 0.45)'
                            : isMoldFull
                            ? 'rgba(251, 191, 36, 0.55)'
                            : 'rgba(71, 85, 105, 0.5)'
                        }`,
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            color: isMoldFull && isLadleReturned ? '#4ade80' : isMoldFull ? '#fde047' : '#cbd5e1',
                            fontWeight: 700,
                          }}
                        >
                          {isMoldFull && isLadleReturned
                            ? '✓ 2. Ladel Kembali di Posisi Semula'
                            : '2. Kembalikan Ladel ke Posisi Semula (Standby)'}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: isLadleReturned ? '#4ade80' : '#fbbf24',
                          }}
                        >
                          {isLadleReturned ? 'SIAP' : `Jarak: ${distToStandby.toFixed(1)}m`}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.35' }}>
                        {isMoldFull && !isLadleReturned
                          ? `Tegakkan roda ladel ke 0°, lalu gunakan 6 tombol arah Remot Crane (tekan ◀ TROLLEY L) hingga ladel berada di Area Parkir Semula (X: 4.0m, Z: 0.0m | Posisi saat ini X: ${cranePosition[0].toFixed(1)}m, Z: ${cranePosition[2].toFixed(1)}m).`
                          : 'Setelah penuangan selesai, geser kembali ladel ke titik parkir awal menggunakan tombol arah Remot Crane.'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ONLY 2 TIME-ACCELERATION SHORTCUTS ALLOWED: SCENE 14 (60s Melt) & SCENE 20 (5h Time-Lapse) */}
            {(currentStep.number === 14 || currentStep.number === 20) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {currentStep.number === 14 && (
                  <button
                    onClick={() => {
                      triggerQuickMelt60s();
                    }}
                    disabled={isMeltingFastForward}
                    style={{
                      background: isMeltingFastForward
                        ? 'rgba(234, 88, 12, 0.4)'
                        : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      border: `1px solid ${isMeltingFastForward ? '#fb923c' : '#f59e0b'}`,
                      color: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      cursor: isMeltingFastForward ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 800,
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {isMeltingFastForward
                      ? `⏳ Peleburan 60 Detik Berjalan: ${Math.ceil(meltingCountdown)}s`
                      : '⚡ Akselerasi Peleburan 60 Detik (Simulasi Cepat)'}
                  </button>
                )}

                {currentStep.number === 20 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => {
                        inductionAudio.resume();
                        inductionAudio.playClick();
                        startTimeLapse5Hours();
                      }}
                      disabled={timeLapse5HoursActive}
                      style={{
                        background: timeLapse5HoursDone
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        border: `1px solid ${timeLapse5HoursDone ? '#10b981' : '#38bdf8'}`,
                        color: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        cursor: timeLapse5HoursActive ? 'default' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        minHeight: '44px',
                      }}
                    >
                      {timeLapse5HoursDone
                        ? '✓ Time-Lapse ± 5 Jam Selesai (Sekarang Matikan Saklar Pompa di Dinding)'
                        : timeLapse5HoursActive
                        ? '⏳ Time-Lapse Pendinginan 5 Jam Berjalan...'
                        : '⏳ Mulai Time-Lapse Pompa Pendingin ± 5 Jam'}
                    </button>
                    {timeLapse5HoursDone && !shutdownCoolingPumpOff && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#fde047',
                          background: 'rgba(234, 179, 8, 0.14)',
                          border: '1px solid rgba(250, 204, 21, 0.4)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontWeight: 600,
                        }}
                      >
                        Langkah Terakhir: Berjalanlah ke Box Saklar Pompa Sistem Cooling di dinding belakang lalu klik tuasnya ke posisi OFF.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Expandable Clue / Catatan SOP */}
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => setShowClue(!showClue)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{showClue ? '▼ Sembunyikan Petunjuk Lokasi & Bahaya' : '▶ Buka Petunjuk Lokasi 3D & Penjelasan Teknis'}</span>
              </button>

              {showClue && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    lineHeight: '1.45',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '2px' }}>Petunjuk Interaksi Manual 3D:</div>
                    <div>{currentStep.clue}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(71, 85, 105, 0.35)', paddingTop: '5px' }}>
                    <div style={{ fontWeight: 700, color: '#facc15', marginBottom: '2px' }}>Catatan Teknis &amp; Keselamatan:</div>
                    <div>{currentStep.metallurgyNote}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Navigation Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(51, 65, 85, 0.5)', paddingTop: '12px' }}>
              <button
                onClick={() => {
                  inductionAudio.resume();
                  inductionAudio.playClick();
                  prevSopStep();
                }}
                disabled={currentSopStepIndex === 0}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(71, 85, 105, 0.6)',
                  color: currentSopStepIndex === 0 ? '#64748b' : '#cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: currentSopStepIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  minHeight: '44px',
                }}
              >
                ◀ Sebelumnya
              </button>

              <button
                onClick={() => {
                  inductionAudio.resume();
                  inductionAudio.playClick();
                  nextSopStep();
                }}
                disabled={currentSopStepIndex === SOP_STEPS.length - 1}
                style={{
                  background: isCurrentCompleted
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(30, 41, 59, 0.7)',
                  border: `1px solid ${isCurrentCompleted ? '#38bdf8' : 'rgba(71, 85, 105, 0.6)'}`,
                  color: isCurrentCompleted ? '#ffffff' : '#cbd5e1',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: currentSopStepIndex === SOP_STEPS.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  minHeight: '44px',
                }}
              >
                Selanjutnya ▶
              </button>
            </div>

            {/* Bottom Evaluation Shortcut */}
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  inductionAudio.resume();
                  inductionAudio.playClick();
                  setReportCardOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Lihat Kartu Hasil Evaluasi Siswa (Rapor)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
