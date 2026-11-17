import React, { useState, useEffect, useRef } from 'react';
import { useSimStore, SOP_STEPS, CameraPreset } from '../../store/useSimStore';
import { PHASE_CONTENT_ID } from '../../content/id';
import { METAL_PRESETS } from '../../sim/materials';
import { inductionAudio } from '../fx/InductionAudio';
import { HeldRemoteControl } from './HeldRemoteControl';
import { HeldCraneRemoteHUD } from './HeldCraneRemoteHUD';
import { VirtualJoystick } from './VirtualJoystick';
import { HeatChargeModal } from './HeatChargeModal';
import { SOPGuidePanel } from './SOPGuidePanel';
import { JobOrderModal } from './JobOrderModal';
import { PPEModal } from './PPEModal';
import { InspectionModal } from './InspectionModal';
import { MeltingJobSheetModal } from './MeltingJobSheetModal';
import { ReportCardModal } from './ReportCardModal';
import { CabinetControlModal } from './CabinetControlModal';
import { CoagulantDosingModal } from './CoagulantDosingModal';
import { AparInspectionModal } from './AparInspectionModal';
import { ScrapSortingModal } from './ScrapSortingModal';
import { SequentialChargingModal } from './SequentialChargingModal';
import { JOB_ORDER_PRESETS } from '../../sim/storyboardData';

export const SimulationHUD: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'education' | 'materials'>('telemetry');

  // Comprehensive mobile viewport & orientation detection (Mobile portrait & landscape)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isNarrow = window.innerWidth <= 840;
    const isShortLandscape = window.innerHeight <= 520 && window.innerWidth <= 960;
    const isTouch = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isNarrow || isShortLandscape || isTouch;
  });

  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth <= 840;
      const isShortLandscape = window.innerHeight <= 520 && window.innerWidth <= 960;
      const isTouch = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(isNarrow || isShortLandscape || isTouch);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Store state
  const sim = useSimStore((s) => s.sim);
  const masterPowerOn = useSimStore((s) => s.masterPowerOn);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const coilOn = useSimStore((s) => s.coilOn);
  const tiltAngle = useSimStore((s) => s.tiltAngle);
  const isSopMode = useSimStore((s) => s.isSopMode);
  const toggleSopMode = useSimStore((s) => s.toggleSopMode);
  const currentSopStepIndex = useSimStore((s) => s.currentSopStepIndex);
  const isLanceHeld = useSimStore((s) => s.isLanceHeld);
  const setIsLanceHeld = useSimStore((s) => s.setIsLanceHeld);
  const heldTool = useSimStore((s) => s.heldTool);
  const setHeldTool = useSimStore((s) => s.setHeldTool);
  const isShovelFilled = useSimStore((s) => s.isShovelFilled);
  const setCoagulantModalOpen = useSimStore((s) => s.setCoagulantModalOpen);
  const coagulantDoseKg = useSimStore((s) => s.coagulantDoseKg);
  const throwCoagulantFromShovel = useSimStore((s) => s.throwCoagulantFromShovel);
  const skimSlagWithRake = useSimStore((s) => s.skimSlagWithRake);
  const slagCoagulantAdded = useSimStore((s) => s.slagCoagulantAdded);
  const isDeslagged = useSimStore((s) => s.isDeslagged);
  const isSlagSequenceActive = useSimStore((s) => s.isSlagSequenceActive);
  const isHoldingLanceDip = useSimStore((s) => s.isHoldingLanceDip);
  const setIsHoldingLanceDip = useSimStore((s) => s.setIsHoldingLanceDip);
  const isLanceDipping = useSimStore((s) => s.isLanceDipping);
  const triggerLanceDip = useSimStore((s) => s.triggerLanceDip);
  const isMeltingFastForward = useSimStore((s) => s.isMeltingFastForward);
  const meltingCountdown = useSimStore((s) => s.meltingCountdown);
  const immersionTempC = useSimStore((s) => s.immersionTempC);
  const ladleFilledFraction = useSimStore((s) => s.ladleFilledFraction);
  const isPouringStreamActive = useSimStore((s) => s.isPouringStreamActive);
  const cameraPreset = useSimStore((s) => s.cameraPreset);
  const cameraMode = useSimStore((s) => s.cameraMode);
  const materialKey = useSimStore((s) => s.materialKey);
  const selectedMaterial = useSimStore((s) => s.selectedMaterial);
  const audioEnabled = useSimStore((s) => s.audioEnabled);
  const pouringTarget = useSimStore((s) => s.pouringTarget);
  const xrayMode = useSimStore((s) => s.xrayMode);
  const activeHeat = useSimStore((s) => s.activeHeat);
  const furnaceChargedFraction = useSimStore((s) => s.furnaceChargedFraction);
  const setHeatModalOpen = useSimStore((s) => s.setHeatModalOpen);
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const setPerformanceProfile = useSimStore((s) => s.setPerformanceProfile);
  const setTutorialGuideOpen = useSimStore((s) => s.setTutorialGuideOpen);
  const setAboutModalOpen = useSimStore((s) => s.setAboutModalOpen);

  // Storyboard Practicum States & Actions
  const jobOrder = useSimStore((s) => s.jobOrder);
  const setJobOrderModalOpen = useSimStore((s) => s.setJobOrderModalOpen);
  const setReportCardOpen = useSimStore((s) => s.setReportCardOpen);
  const isSopPanelOpen = useSimStore((s) => s.isSopPanelOpen);
  const setIsSopPanelOpen = useSimStore((s) => s.setIsSopPanelOpen);
  const waterPressureBar = useSimStore((s) => s.waterPressureBar);
  const potensioKw = useSimStore((s) => s.potensioKw);
  const activeHoverObject = useSimStore((s) => s.activeHoverObject);
  const apdItems = useSimStore((s) => s.apdItems);

  const isAllApdEquipped =
    apdItems.helmet &&
    apdItems.mask &&
    apdItems.apron &&
    apdItems.gloves &&
    apdItems.boots;

  const equippedApdCount =
    (apdItems.helmet ? 1 : 0) +
    (apdItems.mask ? 1 : 0) +
    (apdItems.apron ? 1 : 0) +
    (apdItems.gloves ? 1 : 0) +
    (apdItems.boots ? 1 : 0);

  const missingApdList: string[] = [];
  if (!apdItems.helmet) missingApdList.push('Helm');
  if (!apdItems.mask) missingApdList.push('Masker');
  if (!apdItems.apron) missingApdList.push('Wearpack');
  if (!apdItems.gloves) missingApdList.push('Sarung Tangan');
  if (!apdItems.boots) missingApdList.push('Sepatu Boot');

  // APD wear/removal status toast feedback
  const [apdToast, setApdToast] = useState<string | null>(null);
  const prevApdRef = useRef(apdItems);
  useEffect(() => {
    const prev = prevApdRef.current;
    if (!prev) {
      prevApdRef.current = apdItems;
      return;
    }
    let changedMsg = '';
    if (apdItems.helmet !== prev.helmet) {
      changedMsg = apdItems.helmet ? 'Helm Proyek Kuning Dipakai' : 'Helm Kuning Dilepas & Disimpan ke Rak';
    } else if (apdItems.mask !== prev.mask) {
      changedMsg = apdItems.mask ? 'Masker Respirator & Kacamata Dipakai' : 'Masker & Kacamata Dilepas & Disimpan ke Rak';
    } else if (apdItems.apron !== prev.apron) {
      changedMsg = apdItems.apron ? 'Baju Coverall Putih Dipakai' : 'Baju Coverall Dilepas & Disimpan ke Rak';
    } else if (apdItems.gloves !== prev.gloves) {
      changedMsg = apdItems.gloves ? 'Sarung Tangan Abu-Abu Dipakai' : 'Sarung Tangan Dilepas & Disimpan ke Rak';
    } else if (apdItems.boots !== prev.boots) {
      changedMsg = apdItems.boots ? 'Sepatu Boot Kuning Dipakai' : 'Sepatu Boot Dilepas & Disimpan ke Rak';
    }
    prevApdRef.current = apdItems;

    if (changedMsg) {
      const isAll =
        apdItems.helmet &&
        apdItems.mask &&
        apdItems.apron &&
        apdItems.gloves &&
        apdItems.boots;
      setApdToast(isAll ? 'Semua APD Lengkap (5/5) - Memenuhi Standar K3 Tanur!' : changedMsg);
      const timer = setTimeout(() => setApdToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [apdItems]);

  // Actions
  const setCameraPreset = useSimStore((s) => s.setCameraPreset);

  // Cycle camera presets on mobile
  const handleCycleCameraPreset = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    const presets: CameraPreset[] = [
      'ppe-rack',
      'utility-panels',
      'overview',
      'furnace',
      'cabinet',
      'depot',
      'ladle',
      'mold-gear',
    ];
    const currIdx = presets.indexOf(cameraPreset);
    const nextPreset = presets[(currIdx + 1) % presets.length];
    setCameraPreset(nextPreset);
  };
  const setMaterial = useSimStore((s) => s.setMaterial);
  const resetSimulation = useSimStore((s) => s.resetSimulation);
  const resetLadle = useSimStore((s) => s.resetLadle);
  const enableAudio = useSimStore((s) => s.enableAudio);
  const resetEmergencyStop = useSimStore((s) => s.resetEmergencyStop);
  const setPouringTarget = useSimStore((s) => s.setPouringTarget);
  const toggleXrayMode = useSimStore((s) => s.toggleXrayMode);

  const transformerBreakerOn = useSimStore((s) => s.transformerBreakerOn);
  const toggleTransformerBreaker = useSimStore((s) => s.toggleTransformerBreaker);

  const phaseContent = PHASE_CONTENT_ID[sim.phase] || PHASE_CONTENT_ID.Idle;

  // Escape key handler to return thermometer lance to rack
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLanceHeld) {
        inductionAudio.resume();
        inductionAudio.playClick();
        setIsLanceHeld(false);
        setCameraPreset('overview');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLanceHeld, setIsLanceHeld, setCameraPreset]);

  // Temperature color styling
  const getTempColor = (temp: number, meltingPoint: number) => {
    if (temp < 200) return '#38bdf8'; // light blue
    if (temp < 450) return '#facc15'; // yellow
    if (temp < meltingPoint) return '#f97316'; // orange
    return '#ef4444'; // incandescent red
  };

  const tempColor = getTempColor(sim.temperatureC, selectedMaterial.meltingPointC);

  // Status badge config
  const getStatusBadge = () => {
    if (emergencyTripped) {
      return { text: 'E-STOP AKTIF', color: '#f87171', bg: '#450a0a' };
    }
    if (!masterPowerOn) {
      return { text: 'DAYA MATI', color: '#94a3b8', bg: '#1e293b' };
    }
    if (isPouringStreamActive) {
      return { text: 'PENUANGAN LOGAM', color: '#fb923c', bg: '#431407' };
    }
    if (coilOn) {
      return { text: 'PELEBURAN AKTIF', color: '#4ade80', bg: '#052e16' };
    }
    return { text: 'STANDBY SIAP', color: '#facc15', bg: '#422006' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isMobile
          ? 'max(6px, env(safe-area-inset-top, 0px)) max(8px, env(safe-area-inset-right, 0px)) 6px max(8px, env(safe-area-inset-left, 0px))'
          : '16px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 50,
      }}
    >
      {/* 1. TOP HUD STACK (Header Bar + Non-Overlapping Safety & Status Banners) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '6px' : '8px',
          width: '100%',
          pointerEvents: 'none',
          zIndex: 98,
        }}
      >
      <header
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '8px' : '12px',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: isMobile ? 'none' : 'blur(16px)',
          border: '1px solid rgba(51, 65, 85, 0.75)',
          borderRadius: '10px',
          padding: isMobile ? '8px 10px' : '6px 16px',
          color: '#f8fafc',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Top/Left Branding & Status Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: masterPowerOn ? '#10b981' : '#64748b',
                boxShadow: masterPowerOn ? '0 0 8px #10b981' : 'none',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: isMobile ? '11px' : '13px',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.15,
                }}
              >
                SIMULATOR TANUR INDUKSI • 500 KG
              </div>
              {!isMobile && (
                <div style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                  Simulator Peleburan Logam 3D
                </div>
              )}
            </div>
          </div>

          {/* Status Badge in Header */}
          <div
            style={{
              height: isMobile ? '28px' : '32px',
              boxSizing: 'border-box',
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
              border: `1px solid ${statusBadge.color}50`,
              padding: isMobile ? '0 8px' : '0 10px',
              borderRadius: '6px',
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 800,
              letterSpacing: '0.03em',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {statusBadge.text}
          </div>
        </div>

        {/* Action Buttons: Horizontal Scroll Touch Bar on Mobile, Wrapping Flex Row on Desktop */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            gap: isMobile ? '8px' : '6px',
            whiteSpace: 'nowrap',
            overflowX: isMobile ? 'auto' : 'visible',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: isMobile ? '2px' : '0',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {/* 1. Mode SOP Checklist Toggle Button */}
          <button
            onClick={() => {
              inductionAudio.resume();
              toggleSopMode();
            }}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: isSopMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(30, 41, 59, 0.85)',
              border: `1.5px solid ${isSopMode ? '#10b981' : 'rgba(71, 85, 105, 0.7)'}`,
              color: isSopMode ? '#4ade80' : '#f8fafc',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              boxShadow: isSopMode ? '0 0 10px rgba(16, 185, 129, 0.25)' : 'none',
            }}
            title="Buka / Tutup Panduan Praktikum Interaktif"
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#fff',
                background: '#059669',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              TAHAP {currentSopStepIndex + 1}/{SOP_STEPS.length}
            </span>
            <span>Panduan Praktikum</span>
          </button>

          {/* 2. Performance Profile Toggle: Mode Ringan vs Mode Lengkap */}
          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              const nextProfile = performanceProfile === 'lite' ? 'ultra' : 'lite';
              setPerformanceProfile(nextProfile);
            }}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: performanceProfile === 'lite' ? 'rgba(14, 116, 144, 0.45)' : 'rgba(30, 41, 59, 0.85)',
              border: `1.5px solid ${performanceProfile === 'lite' ? '#06b6d4' : 'rgba(71, 85, 105, 0.7)'}`,
              color: performanceProfile === 'lite' ? '#67e8f9' : '#f8fafc',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title={
              performanceProfile === 'lite'
                ? 'Sedang dalam Mode Ringan (Hemat GPU). Klik untuk beralih ke Mode Lengkap.'
                : 'Sedang dalam Mode Lengkap. Klik untuk beralih ke Mode Ringan.'
            }
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#fff',
                background: performanceProfile === 'lite' ? '#0891b2' : '#475569',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              GRAFIS
            </span>
            <span>{performanceProfile === 'lite' ? 'Ringan (HP)' : 'Lengkap'}</span>
          </button>

          {/* 3. Student Report Card Evaluation Button */}
          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setReportCardOpen(true);
            }}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.45) 100%)',
              border: '1.5px solid rgba(52, 211, 153, 0.7)',
              color: '#34d399',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Buka Kartu Hasil Evaluasi Praktikum Siswa (Rapor 100 Poin)"
          >
            <span>RAPOR EVALUASI</span>
          </button>

          {/* 4. Active Job Order Ticket Button */}
          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setJobOrderModalOpen(true);
            }}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: 'rgba(2, 132, 199, 0.35)',
              border: '1.5px solid rgba(56, 189, 248, 0.7)',
              color: '#38bdf8',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Buka Tiket Job Order Pemesan"
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                background: '#0284c7',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              ORDER
            </span>
            <span>{JOB_ORDER_PRESETS[jobOrder]?.productName || 'Job Order'}</span>
          </button>

          {/* 5. Read-Only Power Telemetry Indicator (Panel modal only opens from the 3D Cabinet buttons) */}
          <div
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: potensioKw > 0 ? 'rgba(234, 88, 12, 0.35)' : 'rgba(15, 23, 42, 0.85)',
              border: `1.5px solid ${potensioKw > 0 ? '#f97316' : 'rgba(71, 85, 105, 0.7)'}`,
              color: potensioKw > 0 ? '#fdba74' : '#cbd5e1',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Indikator Daya Tanur Aktif (Atur melalui tombol pada Lemari Panel Kontrol 3D)"
          >
            <span>Daya: {potensioKw} kW</span>
          </div>

          {/* 6. Quick Water Pressure Gauge */}
          <div
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: `1.5px solid ${waterPressureBar >= 2.5 ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
              color: waterPressureBar >= 2.5 ? '#4ade80' : '#f87171',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Tekanan Air Pendingin Pompa (Standar SOP >= 2.5 Bar)"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: waterPressureBar >= 2.5 ? '#10b981' : '#ef4444',
              }}
            />
            <span>Air: {waterPressureBar.toFixed(1)} Bar</span>
          </div>

          {/* 7. Telemetry / HUD Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: isCollapsed ? 'rgba(2, 132, 199, 0.35)' : 'rgba(30, 41, 59, 0.85)',
              border: '1.5px solid rgba(71, 85, 105, 0.7)',
              color: isCollapsed ? '#38bdf8' : '#cbd5e1',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {isCollapsed ? 'Buka Telemetri' : 'Tutup Telemetri'}
          </button>

          {/* 8. Reopen Illustrated Simulator Guide Button */}
          <button
            type="button"
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setTutorialGuideOpen(true);
            }}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid rgba(56, 189, 248, 0.65)',
              color: '#7dd3fc',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Buka kembali petunjuk penggunaan simulator"
          >
            ? Petunjuk
          </button>

          {/* 9. About Us / Developer Identity Button */}
          <button
            type="button"
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setAboutModalOpen(true);
            }}
            style={{
              height: isMobile ? '44px' : '32px',
              minHeight: isMobile ? '44px' : '32px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid rgba(148, 163, 184, 0.5)',
              color: '#e2e8f0',
              padding: isMobile ? '0 12px' : '0 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Tentang Pengembang dan Dosen Pembimbing"
          >
            Tentang Kami
          </button>
        </div>
      </header>

      {/* DANGER K3 Warning Banner stacked cleanly below Header without overlapping */}
      {!isAllApdEquipped && (
        <div
          style={{
            margin: '0 auto',
            pointerEvents: 'auto',
            width: isMobile ? '100%' : 'auto',
            maxWidth: '680px',
            background: 'linear-gradient(90deg, rgba(127, 29, 29, 0.96) 0%, rgba(185, 28, 28, 0.96) 50%, rgba(127, 29, 29, 0.96) 100%)',
            border: '2px solid #facc15',
            borderRadius: '10px',
            padding: isMobile ? '6px 10px' : '8px 16px',
            color: '#ffffff',
            boxShadow: '0 8px 28px rgba(220, 38, 38, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '8px' : '14px',
            boxSizing: 'border-box',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Left: High-Visibility Hazard Triangle SVG Logo + Danger Message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', minWidth: 0 }}>
            {/* Crisp Industrial K3 Hazard Triangle Logo */}
            <div
              style={{
                width: isMobile ? '34px' : '40px',
                height: isMobile ? '34px' : '40px',
                borderRadius: '8px',
                background: '#450a0a',
                border: '1.5px solid #facc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(250, 204, 21, 0.45)',
              }}
            >
              <svg width={isMobile ? '22' : '26'} height={isMobile ? '22' : '26'} viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L1 21H23L12 2Z"
                  fill="#facc15"
                  stroke="#090d16"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M12 9V14" stroke="#090d16" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="12" cy="17.5" r="1.3" fill="#090d16" />
              </svg>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    background: '#facc15',
                    color: '#090d16',
                    fontSize: isMobile ? '8.5px' : '10px',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    letterSpacing: '0.05em',
                  }}
                >
                  DANGER • PERINGATAN K3
                </span>
                <span
                  style={{
                    fontSize: isMobile ? '10.5px' : '12px',
                    fontWeight: 900,
                    color: '#fef08a',
                    letterSpacing: '0.02em',
                  }}
                >
                  APD BELUM LENGKAP ({equippedApdCount}/5 TERPAKAI)
                </span>
              </div>
              <div
                style={{
                  fontSize: isMobile ? '9.5px' : '11px',
                  color: '#fecaca',
                  fontWeight: 600,
                  marginTop: '2px',
                  whiteSpace: isMobile ? 'normal' : 'nowrap',
                  lineHeight: 1.25,
                }}
              >
                Klik item di Rak Pojok APD: <strong style={{ color: '#ffffff' }}>{missingApdList.join(', ')}</strong>
              </div>
            </div>
          </div>

          {/* Right Quick Action: Focus Camera to PPE Rack or Proceed */}
          {cameraPreset !== 'ppe-rack' && (
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setCameraPreset('ppe-rack');
              }}
              style={{
                minHeight: '34px',
                padding: isMobile ? '4px 8px' : '6px 12px',
                borderRadius: '6px',
                background: '#facc15',
                border: '1px solid #fef08a',
                color: '#090d16',
                fontSize: isMobile ? '9.5px' : '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Ke Pojok APD
            </button>
          )}
        </div>
      )}

      {/* Real-Time APD Wear Status Toast Banner (Zero Emojis) */}
      {apdToast && (
        <div
          style={{
            margin: '0 auto',
            background: apdToast.includes('Semua APD Lengkap')
              ? 'rgba(6, 95, 70, 0.96)'
              : 'rgba(15, 23, 42, 0.96)',
            border: `1px solid ${apdToast.includes('Semua APD Lengkap') ? '#10b981' : '#38bdf8'}`,
            borderRadius: '8px',
            padding: '6px 14px',
            color: '#f8fafc',
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              background: apdToast.includes('Semua APD Lengkap') ? '#10b981' : '#0284c7',
              color: '#ffffff',
              padding: '1px 5px',
              borderRadius: '3px',
            }}
          >
            K3
          </span>
          <span>{apdToast}</span>
        </div>
      )}

      {/* Emergency Stop Tripped Safety Warning Banner (Zero Emojis) */}
      {emergencyTripped && (
        <div
          style={{
            margin: '8px auto 0',
            maxWidth: '1200px',
            width: '100%',
            background: 'linear-gradient(90deg, #991b1b, #dc2626)',
            color: '#fff',
            borderRadius: '10px',
            padding: '10px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
            border: '1px solid #fca5a5',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: '#450a0a',
                border: '1px solid #fca5a5',
                color: '#fef2f2',
                padding: '4px 8px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.06em',
              }}
            >
              PERINGATAN BAHAYA
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em' }}>
                SAFETY INTERLOCK ENGAGED: EMERGENCY STOP AKTIF
              </div>
              <div style={{ fontSize: '11px', opacity: 0.92 }}>
                Sirkuit keselamatan terbuka. Daya koil pemanas dan motor hidrolik dimatikan seketika demi keselamatan kerja.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              resetEmergencyStop();
            }}
            style={{
              background: '#ffffff',
              color: '#991b1b',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            Reset Safety Interlock
          </button>
        </div>
      )}
      </div>

            {/* 2. MAIN FLOATING HUD PANELS (When expanded)                                */}
            {!isCollapsed && (
        <div
          style={isMobile ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            maxHeight: '68vh',
            zIndex: 85,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            borderBottom: 'none',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.7)',
            pointerEvents: 'auto',
          } : {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginTop: '12px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Telemetry and Controls Card / Mobile Bottom Sheet */}
          <div
            style={isMobile ? {
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            } : {
              width: '350px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              borderRadius: '12px',
              padding: '14px',
              color: '#f8fafc',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>TELEMETRI & KONTROL TANUR</span>
                <button
                  onClick={() => setIsCollapsed(true)}
                  style={{
                    background: '#334155',
                    border: 'none',
                    color: '#f8fafc',
                    padding: '0 14px',
                    minHeight: '44px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕ Tutup
                </button>
              </div>
            )}
            {/* Tabs Header */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              {(['telemetry', 'materials', 'education'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    background: activeTab === tab ? '#0284c7' : 'rgba(30, 41, 59, 0.6)',
                    border: 'none',
                    borderRadius: '6px',
                    color: activeTab === tab ? '#ffffff' : '#94a3b8',
                    padding: '0 6px',
                    minHeight: '44px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tab === 'telemetry' ? 'Telemetri' : tab === 'materials' ? 'Material' : 'Fisika'}
                </button>
              ))}
            </div>

            {/* TAB 1: TELEMETRY & LIVE READOUTS */}
            {activeTab === 'telemetry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Temperature Meter Box */}
                <div
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>SUHU MUATAN</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Titik Lebur: {selectedMaterial.meltingPointC}°C
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: tempColor }}>
                      {Math.round(sim.temperatureC)}
                    </span>
                    <span style={{ fontSize: '14px', color: tempColor, fontWeight: 700 }}>°C</span>
                  </div>
                </div>

                {/* Melt Progress Bar */}
                <div
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                    <span style={{ color: '#94a3b8' }}>PELEBURAN (MELT FRACTION)</span>
                    <span style={{ color: '#38bdf8' }}>{Math.round(sim.meltFraction * 100)}%</span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: '#1e293b',
                      borderRadius: '4px',
                      marginTop: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${sim.meltFraction * 100}%`,
                        background:
                          sim.meltFraction > 0.8
                            ? 'linear-gradient(90deg, #f97316, #ef4444)'
                            : 'linear-gradient(90deg, #0284c7, #f59e0b)',
                        borderRadius: '4px',
                        transition: 'width 0.2s linear',
                      }}
                    />
                  </div>
                </div>

                {/* Power & Frequency Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(2, 6, 23, 0.6)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>DAYA TERPAKAI</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e', marginTop: '2px' }}>
                      {Math.round(sim.powerActualW / 1000)} kW
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {Math.round(sim.powerFraction * 100)}% Max
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(2, 6, 23, 0.6)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>SUDUT TILTING</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                      {Math.round(tiltAngle)}°
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Batas: 90.0°</div>
                  </div>
                </div>

                {/* Receiving Fill & Mass Meter */}
                <div
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                    <span style={{ color: '#94a3b8' }}>
                      TERTUANG ({pouringTarget === 'ladle' ? 'LADLE' : 'INGOT'})
                    </span>
                    <span style={{ color: '#f59e0b' }}>{Math.round(ladleFilledFraction * 100)}%</span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: '#1e293b',
                      borderRadius: '4px',
                      marginTop: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${ladleFilledFraction * 100}%`,
                        background: 'linear-gradient(90deg, #ea580c, #fbbf24)',
                        borderRadius: '4px',
                        transition: 'width 0.15s ease',
                      }}
                    />
                  </div>
                  {/* Kilogram Mass Readout */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>
                      Tertuang: <strong style={{ color: '#38bdf8' }}>{Math.round(selectedMaterial.massKg * ladleFilledFraction)} kg</strong>
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      Sisa: <strong style={{ color: '#facc15' }}>{Math.round(selectedMaterial.massKg * (1 - ladleFilledFraction))} kg</strong>
                    </span>
                  </div>
                </div>

                {/* Target Receiving Vessel Toggle */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                    WADAH PENERIMA COR
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      onClick={() => {
                        inductionAudio.resume();
                        inductionAudio.playClick();
                        setPouringTarget('ladle');
                      }}
                      style={{
                        background: pouringTarget === 'ladle' ? '#0284c7' : '#1e293b',
                        border: `1px solid ${pouringTarget === 'ladle' ? '#38bdf8' : 'rgba(71, 85, 105, 0.6)'}`,
                        color: '#f8fafc',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      Ladle Transfer
                    </button>
                    <button
                      onClick={() => {
                        inductionAudio.resume();
                        inductionAudio.playClick();
                        setPouringTarget('mold');
                      }}
                      style={{
                        background: pouringTarget === 'mold' ? '#0284c7' : '#1e293b',
                        border: `1px solid ${pouringTarget === 'mold' ? '#38bdf8' : 'rgba(71, 85, 105, 0.6)'}`,
                        color: '#f8fafc',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      Cetakan Ingot
                    </button>
                  </div>
                </div>

                {/* Factory Utility Systems Controls */}
                {/* Factory Grid Substation Incomer Controls */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>JARINGAN LISTRIK UTAMA</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Interlocking</span>
                  </div>

                  {/* Transformer 20kV Grid Incomer Switch */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: 600 }}>Trafo Gardu 20kV / 380V</div>
                      <div style={{ fontSize: '9px', color: transformerBreakerOn ? '#4ade80' : '#ef4444' }}>
                        {transformerBreakerOn ? '● Grid PLN 20kV Aktif (380V Siap)' : '▲ TRAFO OFF (Pabrik Padam Total)'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        inductionAudio.resume();
                        inductionAudio.playClick();
                        toggleTransformerBreaker();
                      }}
                      style={{
                        background: transformerBreakerOn ? '#15803d' : '#991b1b',
                        border: `1px solid ${transformerBreakerOn ? '#4ade80' : '#f87171'}`,
                        color: '#f8fafc',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {transformerBreakerOn ? 'LIVE' : 'ISOLIR'}
                    </button>
                  </div>
                </div>

                {/* Camera View Presets */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                    SUDUT KAMERA
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {(
                      [
                        { key: 'overview', label: 'Ikhtisar Luas' },
                        { key: 'furnace', label: 'Tungku Induksi' },
                        { key: 'platform', label: 'Panggung Tungku' },
                        { key: 'cabinet', label: 'Kabinet Daya' },
                        { key: 'lance', label: 'Termometer CYY' },
                        { key: 'ladle', label: 'Ladle Penampung' },
                        { key: 'control-box', label: 'Konsol Tilting' },
                        { key: 'depot', label: 'Depo Bahan Baku' },
                        { key: 'mold-ingot', label: 'Mold 1 (Ingot)' },
                        { key: 'mold-valve', label: 'Mold 2 (Valve)' },
                        { key: 'mold-gear', label: 'Mold 3 (Gear)' },
                        { key: 'mold-propeller', label: 'Mold 4 (Propeller)' },
                      ] as const
                    ).map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => {
                          inductionAudio.resume();
                          inductionAudio.playClick();
                          setCameraPreset(btn.key);
                        }}
                        style={{
                          background: cameraPreset === btn.key ? '#0369a1' : '#1e293b',
                          border: '1px solid rgba(71, 85, 105, 0.6)',
                          color: '#f8fafc',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* X-Ray Cutaway Mode Button */}
                <button
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    toggleXrayMode();
                  }}
                  style={{
                    background: xrayMode ? 'rgba(14, 165, 233, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                    border: `1px solid ${xrayMode ? '#38bdf8' : 'rgba(71, 85, 105, 0.6)'}`,
                    color: xrayMode ? '#38bdf8' : '#cbd5e1',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  {xrayMode ? 'Mode X-Ray Aktif (Cangkang Transparan)' : 'Mode X-Ray Tungku'}
                </button>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      inductionAudio.resume();
                      inductionAudio.playClick();
                      resetSimulation();
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      color: '#fca5a5',
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Reset Simulasi
                  </button>

                  <button
                    onClick={() => {
                      inductionAudio.resume();
                      inductionAudio.playClick();
                      resetLadle();
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(234, 88, 12, 0.2)',
                      border: '1px solid rgba(234, 88, 12, 0.5)',
                      color: '#fdba74',
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Kosongkan Ladle
                  </button>

                  {!audioEnabled && (
                    <button
                      onClick={() => {
                        inductionAudio.resume();
                        inductionAudio.playClick();
                        enableAudio();
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid rgba(56, 189, 248, 0.5)',
                        color: '#7dd3fc',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Audio SFX
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MATERIAL PRESETS */}
            {activeTab === 'materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    setHeatModalOpen(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))',
                    border: '1px solid rgba(245, 158, 11, 0.6)',
                    color: '#fef3c7',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <span>Buka Lembar Kerja Formulasi Muatan</span>
                </button>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Preset Logam Muatan Tanur (Foundry Standards):
                </div>
                {Object.entries(METAL_PRESETS).map(([key, mat]) => {
                  const isSelected = materialKey === key;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        inductionAudio.resume();
                        inductionAudio.playClick();
                        setMaterial(key);
                      }}
                      style={{
                        background: isSelected ? 'rgba(2, 132, 199, 0.25)' : 'rgba(2, 6, 23, 0.6)',
                        border: `1px solid ${isSelected ? '#0284c7' : 'rgba(51, 65, 85, 0.5)'}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                          {mat.name} ({mat.symbol})
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            background: '#334155',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#cbd5e1',
                          }}
                        >
                          {mat.meltingPointC} °C
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                        Massa: {mat.massKg} kg • Kalor Laten: {Math.round(mat.latentHeatFusion / 1000)} kJ/kg
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: PHYSICAL PRINCIPLES & EDUCATIONAL GUIDE */}
            {activeTab === 'education' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>{phaseContent.title}</div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
                    {phaseContent.subtitle}
                  </div>
                  <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.45', margin: '6px 0 0' }}>
                    {phaseContent.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    KONSEP UTAMA:
                  </div>
                  {phaseContent.keyConcepts.map((concept, ci) => (
                    <div key={ci} style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>• {concept.title}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '10px' }}>{concept.detail}</div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    borderLeft: '3px solid #38bdf8',
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>INSTRUKSI OPERASIONAL:</div>
                  <div style={{ fontSize: '11px', color: '#f8fafc', marginTop: '2px' }}>{phaseContent.instruction}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


            {/* Real-Time Targeted Object Hover Badge */}
      {activeHoverObject && (
        <div
          style={{
            position: 'absolute',
            bottom: isMobile ? '82px' : '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '6px',
            padding: '4px 12px',
            color: '#38bdf8',
            fontSize: isMobile ? '10px' : '11px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 6px #38bdf8',
            }}
          />
          <span>{activeHoverObject}</span>
        </div>
      )}

      {/* 3. BOTTOM NOTIFICATION & MOBILE NAVIGATION BAR */}
      {isMobile ? (
        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '100%', marginTop: 'auto' }}>
          {/* Mobile status banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '10px',
              color: '#94a3b8',
            }}
          >
            <span>
              Muatan:{' '}
              <strong style={{ color: furnaceChargedFraction <= 0 ? '#fbbf24' : '#38bdf8' }}>
                {furnaceChargedFraction <= 0 ? 'KOSONG' : activeHeat ? activeHeat.targetGrade : selectedMaterial.name}
              </strong>
            </span>
            <span>
              Suhu: <strong style={{ color: '#fbbf24' }}>{Math.round(sim.temperatureC)}°C</strong> • {Math.round(sim.simTimeSeconds)}s
            </span>
          </div>

          {/* Ergonomic Mobile Thumb Navigation Bar */}
          <nav
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'none',
              border: '1px solid rgba(51, 65, 85, 0.7)',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* 1. SOP Toggle */}
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setIsSopPanelOpen(!isSopPanelOpen);
              }}
              style={{
                minHeight: '44px',
                background: isSopPanelOpen ? 'rgba(2, 132, 199, 0.35)' : 'rgba(30, 41, 59, 0.7)',
                border: `1px solid ${isSopPanelOpen ? '#38bdf8' : 'rgba(71, 85, 105, 0.5)'}`,
                color: isSopPanelOpen ? '#38bdf8' : '#f8fafc',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <span>SOP</span>
              <span style={{ fontSize: '9px', color: '#38bdf8' }}>{currentSopStepIndex + 1}/21</span>
            </button>

            {/* 2. Telemetry Toggle */}
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setIsCollapsed(!isCollapsed);
              }}
              style={{
                minHeight: '44px',
                background: !isCollapsed ? 'rgba(2, 132, 199, 0.35)' : 'rgba(30, 41, 59, 0.7)',
                border: `1px solid ${!isCollapsed ? '#38bdf8' : 'rgba(71, 85, 105, 0.5)'}`,
                color: !isCollapsed ? '#38bdf8' : '#f8fafc',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <span>DATA</span>
              <span style={{ fontSize: '9px', color: '#fbbf24' }}>{potensioKw} kW</span>
            </button>

            {/* 3. Camera Preset Cycle */}
            <button
              onClick={handleCycleCameraPreset}
              style={{
                minHeight: '44px',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <span>KAMERA</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                {cameraPreset === 'overview' ? 'Pabrik' : cameraPreset === 'furnace' ? 'Tanur' : cameraPreset === 'cabinet' ? 'Panel' : cameraPreset === 'ladle' ? 'Ladel' : cameraPreset === 'control-box' ? 'Kemiringan' : 'Cetakan'}
              </span>
            </button>

            {/* 4. APD Station Camera Zoom */}
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setCameraPreset('ppe-rack');
              }}
              style={{
                minHeight: '44px',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 700,
              }}
              title="Arahkan Kamera ke Stasiun APD K3"
            >
              <span>APD K3</span>
              <span
                style={{
                  fontSize: '9px',
                  color:
                    apdItems.helmet && apdItems.mask && apdItems.apron && apdItems.gloves && apdItems.boots
                      ? '#4ade80'
                      : '#f59e0b',
                }}
              >
                {apdItems.helmet && apdItems.mask && apdItems.apron && apdItems.gloves && apdItems.boots
                  ? '5/5 Pas'
                  : 'Stasiun'}
              </span>
            </button>

            {/* 5. Report Card */}
            <button
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setReportCardOpen(true);
              }}
              style={{
                minHeight: '44px',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <span>RAPOR</span>
              <span style={{ fontSize: '9px', color: '#38bdf8' }}>Skor</span>
            </button>
          </nav>
        </div>
      ) : (
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '8px',
            padding: '6px 14px',
            color: '#94a3b8',
            fontSize: '11px',
            pointerEvents: 'auto',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div>
            <span>Status Muatan: </span>
            <strong style={{ color: furnaceChargedFraction <= 0 ? '#fbbf24' : '#38bdf8' }}>
              {furnaceChargedFraction <= 0
                ? 'TANUR KOSONG (Belum Dimuati)'
                : activeHeat
                ? `${activeHeat.targetGrade} • Heat ${activeHeat.heatNumber} (${activeHeat.totalWeightKg?.toFixed(0) || 159} kg)`
                : `${selectedMaterial.name} (${selectedMaterial.massKg} kg)`}
            </strong>
            <span> • Waktu Sim: </span>
            <strong style={{ color: '#38bdf8' }}>{Math.round(sim.simTimeSeconds)} s</strong>
            {isMeltingFastForward && (
              <span
                style={{
                  marginLeft: '8px',
                  background: 'rgba(234, 88, 12, 0.3)',
                  border: '1px solid #f97316',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: '#fed7aa',
                  fontWeight: 800,
                  fontSize: '11px',
                }}
              >
                ⚡ Akselerasi 60s: {Math.ceil(meltingCountdown)}s
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isLanceHeld ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                <span>Termometer: <strong style={{ color: '#ef4444' }}>Klik Tombol Merah di Kanan</strong> untuk mencelupkan • <strong style={{ color: '#38bdf8' }}>Klik Hook 1</strong> untuk gantung</span>
                <span>•</span>
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    setIsHoldingLanceDip(false);
                    setIsLanceHeld(false);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    setIsHoldingLanceDip(false);
                    setIsLanceHeld(false);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '2px solid #facc15',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: '#facc15',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <span>[ESC]</span>
                  <span>Simpan di Lantai / Dek</span>
                </button>
              </div>
            ) : cameraMode === 'pov' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Jalan: <strong style={{ color: '#38bdf8' }}>W A S D</strong></span>
                <span>•</span>
                <span>Lompat: <strong style={{ color: '#38bdf8' }}>SPASI</strong></span>
                <span>•</span>
                <span>Menoleh: <strong style={{ color: '#facc15' }}>Klik Kanan Geser</strong></span>
                <span>•</span>
                <span>Interaksi: <strong style={{ color: '#4ade80' }}>Klik Kiri</strong></span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Orbit: <strong style={{ color: '#38bdf8' }}>Klik Kiri & Geser</strong></span>
                <span>•</span>
                <span>Geser Layar (Pan): <strong style={{ color: '#facc15' }}>Klik Kanan & Geser</strong></span>
                <span>•</span>
                <span>Zoom: <strong style={{ color: '#38bdf8' }}>Scroll</strong></span>
                <span>•</span>
                <span>Interaksi: <strong style={{ color: '#4ade80' }}>Klik Kiri</strong></span>
              </div>
            )}
          </div>
        </footer>
      )}

      {/* Virtual Analog Joystick for Mobile POV & Crane Navigation */}
      <VirtualJoystick />

      {/* Floating Pyrometer Immersion Action Controls (Crucial for Mobile Touch & Desktop) */}
      {isLanceHeld && (
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? '82px' : '44px',
            right: isMobile ? '12px' : '32px',
            zIndex: 110,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '2px solid #38bdf8',
            borderRadius: '14px',
            padding: isMobile ? '12px 12px' : '14px 16px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            touchAction: 'none',
            userSelect: 'none',
            width: isMobile ? '215px' : '245px',
            boxSizing: 'border-box',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(51, 65, 85, 0.7)',
              paddingBottom: '6px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
              TERMOMETER CELUP AKTIF
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                color: immersionTempC && immersionTempC > 0 ? '#4ade80' : '#facc15',
                background: '#020617',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #334155',
              }}
            >
              {immersionTempC && immersionTempC > 0
                ? `${immersionTempC.toFixed(1)} °C ✓`
                : `${Math.round(sim.temperatureC)} °C`}
            </span>
          </div>

          {/* Dip & Hold Button (Tap to auto-dip or hold to immerse) */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              inductionAudio.resume();
              inductionAudio.playClick();
              setIsHoldingLanceDip(true);
              useSimStore.getState().setLanceManualDepth(1.0);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsHoldingLanceDip(false);
              useSimStore.getState().setLanceManualDepth(0.0);
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              setIsHoldingLanceDip(false);
              useSimStore.getState().setLanceManualDepth(0.0);
            }}
            onPointerLeave={() => {
              if (isHoldingLanceDip) {
                setIsHoldingLanceDip(false);
                useSimStore.getState().setLanceManualDepth(0.0);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              inductionAudio.resume();
              inductionAudio.playClick();
              triggerLanceDip();
            }}
            style={{
              minHeight: '52px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              background: isHoldingLanceDip || isLanceDipping
                ? 'radial-gradient(circle, #b91c1c 0%, #7f1d1d 100%)'
                : 'radial-gradient(circle, #dc2626 0%, #991b1b 100%)',
              border: `2px solid ${isHoldingLanceDip || isLanceDipping ? '#fca5a5' : '#ef4444'}`,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isHoldingLanceDip || isLanceDipping
                ? '0 0 18px rgba(239, 68, 68, 0.8)'
                : '0 4px 14px rgba(220, 38, 38, 0.55)',
              transform: isHoldingLanceDip || isLanceDipping ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 0.1s ease',
            }}
          >
            <span>🔴</span>
            <span>{isHoldingLanceDip || isLanceDipping ? 'MENCELUPKAN DI LOGAM CAIR...' : 'CELUPKAN / TAHAN (2 DETIK)'}</span>
          </button>

          {/* Enlarged & Fixed Put Back on Floor Button */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              inductionAudio.resume();
              inductionAudio.playClick();
              setIsHoldingLanceDip(false);
              setIsLanceHeld(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              inductionAudio.resume();
              inductionAudio.playClick();
              setIsHoldingLanceDip(false);
              setIsLanceHeld(false);
            }}
            style={{
              minHeight: '50px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #facc15',
              color: '#facc15',
              fontSize: '12.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <span>💾</span>
            <span>SIMPAN ALAT DI LANTAI / DEK</span>
          </button>
        </div>
      )}

      {/* Floating Coagulant Shovel Action Controls */}
      {heldTool === 'shovel' && (
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? '82px' : '44px',
            right: isMobile ? '12px' : '32px',
            zIndex: 110,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '2px solid #f97316',
            borderRadius: '14px',
            padding: isMobile ? '12px 12px' : '14px 16px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            userSelect: 'none',
            width: isMobile ? '215px' : '245px',
            boxSizing: 'border-box',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(51, 65, 85, 0.7)',
              paddingBottom: '6px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f97316' }}>
              SKOP KOAGULAN
            </span>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#facc15' }}>
              {isShovelFilled ? `${coagulantDoseKg.toFixed(1)} KG` : 'KOSONG'}
            </span>
          </div>

          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setCoagulantModalOpen(true);
            }}
            style={{
              minHeight: '44px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🥄</span>
            <span>{isShovelFilled ? 'UBAH TAKARAN (KG)' : 'AMBIL KOAGULAN (KG)'}</span>
          </button>

          <button
            onClick={() => {
              if (isShovelFilled) {
                throwCoagulantFromShovel();
              }
            }}
            disabled={!isShovelFilled || isSlagSequenceActive}
            style={{
              minHeight: '46px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: isShovelFilled
                ? 'radial-gradient(circle, #ea580c 0%, #c2410c 100%)'
                : slagCoagulantAdded
                ? 'rgba(16, 185, 129, 0.25)'
                : 'rgba(30, 41, 59, 0.6)',
              border: `1.5px solid ${
                isShovelFilled ? '#fb923c' : slagCoagulantAdded ? '#10b981' : '#475569'
              }`,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: isShovelFilled ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>▼</span>
            <span>
              {isSlagSequenceActive
                ? 'MENABURKAN DARI SEKOP...'
                : slagCoagulantAdded && !isShovelFilled
                ? '✓ KOAGULAN DITABUR (GANTI SEROKAN)'
                : 'TABURKAN KE TANUR'}
            </span>
          </button>

          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setHeldTool('none');
            }}
            style={{
              minHeight: '44px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1.5px solid #facc15',
              color: '#facc15',
              fontSize: '11.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>💾</span>
            <span>SIMPAN SKOP</span>
          </button>
        </div>
      )}

      {/* Floating Deslagging Skimmer Action Controls */}
      {heldTool === 'skimmer' && (
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? '82px' : '44px',
            right: isMobile ? '12px' : '32px',
            zIndex: 110,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '2px solid #10b981',
            borderRadius: '14px',
            padding: isMobile ? '12px 12px' : '14px 16px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            userSelect: 'none',
            width: isMobile ? '215px' : '245px',
            boxSizing: 'border-box',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(51, 65, 85, 0.7)',
              paddingBottom: '6px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>
              SEROKAN TERAK
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
              STANDBY
            </span>
          </div>

          <button
            onClick={() => {
              if (!isSlagSequenceActive) {
                skimSlagWithRake();
              }
            }}
            disabled={isSlagSequenceActive}
            style={{
              minHeight: '48px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'radial-gradient(circle, #059669 0%, #047857 100%)',
              border: '2px solid #34d399',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🧹</span>
            <span>
              {isSlagSequenceActive
                ? 'MENYEROK TERAK KE POT...'
                : isDeslagged
                ? '✓ TERAK BERSIH (SEROK ULANG)'
                : 'SEROK TERAK KE POT'}
            </span>
          </button>

          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setHeldTool('none');
            }}
            style={{
              minHeight: '44px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1.5px solid #facc15',
              color: '#facc15',
              fontSize: '11.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>💾</span>
            <span>SIMPAN SEROKAN</span>
          </button>
        </div>
      )}

      {/* Held Remote Pendant Viewmodel (FPS Style Diegetic Overlay) */}
      <HeldRemoteControl />
      {/* Handheld Wireless Crane Remote Pendant Overlay */}
      <HeldCraneRemoteHUD />
      {/* Floating GW-IF Cabinet Control Niche Panel Modal */}
      <CabinetControlModal />
      {/* Heat Formulation & Charge Sheet Modal */}
      <HeatChargeModal />
      {/* Interactive SOP Guide & Mission Task Panel */}
      <SOPGuidePanel />

      {/* Storyboard 21-Scene Practicum Modals */}
      <JobOrderModal />
      <PPEModal />
      <InspectionModal />
      <AparInspectionModal />
      <ScrapSortingModal />
      <SequentialChargingModal />
      <MeltingJobSheetModal />
      <CoagulantDosingModal />
      <ReportCardModal />
    </div>
  );
};
