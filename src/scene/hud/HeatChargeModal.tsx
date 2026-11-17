import React, { useState, useMemo, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { JOB_ORDER_PRESETS } from '../../sim/storyboardData';
import { inductionAudio } from '../fx/InductionAudio';

type ChargeFieldKey = 'pig' | 'steel' | 'return' | 'carb' | 'fesi' | 'femn' | 'fesimg';

const INITIAL_RAW_INPUTS: Record<ChargeFieldKey, string> = {
  pig: '0',
  steel: '0',
  return: '0',
  carb: '0',
  fesi: '0',
  femn: '0',
  fesimg: '0',
};

function parseDecimalKg(raw: string, maxKg: number): number {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return 0;
  const val = parseFloat(normalized);
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(maxKg, val));
}

export const HeatChargeModal: React.FC = () => {
  const isHeatModalOpen = useSimStore((s) => s.isHeatModalOpen);
  const setHeatModalOpen = useSimStore((s) => s.setHeatModalOpen);
  const isMeltingJobSheetOpen = useSimStore((s) => s.isMeltingJobSheetOpen);
  const setMeltingJobSheetOpen = useSimStore((s) => s.setMeltingJobSheetOpen);
  const isJobOrderModalOpen = useSimStore((s) => s.isJobOrderModalOpen);
  const setJobOrderModalOpen = useSimStore((s) => s.setJobOrderModalOpen);

  const jobOrder = useSimStore((s) => s.jobOrder);
  const selectedFormula = useSimStore((s) => s.selectedFormula);
  const setSelectedFormula = useSimStore((s) => s.setSelectedFormula);
  const isAlloyVerified = useSimStore((s) => s.isAlloyVerified);
  const verifyAlloyDose = useSimStore((s) => s.verifyAlloyDose);
  const scrapSortedDry = useSimStore((s) => s.scrapSortedDry);
  const chargingStep = useSimStore((s) => s.chargingStep);
  const setScrapSortingModalOpen = useSimStore((s) => s.setScrapSortingModalOpen);
  const setSequentialChargingModalOpen = useSimStore((s) => s.setSequentialChargingModalOpen);
  const heatNumberCounter = useSimStore((s) => s.heatNumberCounter);
  const furnaceMetalMassKg = useSimStore((s) => s.furnaceMetalMassKg);
  const simTemp = useSimStore((s) => Math.round(s.sim.temperatureC));

  const isOpen = isHeatModalOpen || isMeltingJobSheetOpen;
  const isHotAlloying = furnaceMetalMassKg > 20 && simTemp > 300;
  const currentOrder = JOB_ORDER_PRESETS[jobOrder];

  const handleClose = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setHeatModalOpen(false);
    setMeltingJobSheetOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHeatModalOpen(false);
        setMeltingJobSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setHeatModalOpen, setMeltingJobSheetOpen]);

  // Manual composition inputs start at 0 kg so the user must read the active Job Order
  const defaultHeatNumber = useMemo(() => `25 E ${heatNumberCounter}`, [heatNumberCounter]);
  const [heatNumber, setHeatNumber] = useState(defaultHeatNumber);
  const [rawInputs, setRawInputs] = useState<Record<ChargeFieldKey, string>>(INITIAL_RAW_INPUTS);
  const [isWideDesktop, setIsWideDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1120 : true
  );

  useEffect(() => {
    const handleResize = () => setIsWideDesktop(window.innerWidth >= 1120);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pigIronKg = parseDecimalKg(rawInputs.pig, 250);
  const steelScrapKg = parseDecimalKg(rawInputs.steel, 250);
  const returnScrapKg = parseDecimalKg(rawInputs.return, 250);
  const carburizerKg = parseDecimalKg(rawInputs.carb, 20);
  const feSiKg = parseDecimalKg(rawInputs.fesi, 20);
  const feMnKg = parseDecimalKg(rawInputs.femn, 20);
  const feSiMgKg = parseDecimalKg(rawInputs.fesimg, 20);

  const handleFieldChange = (field: ChargeFieldKey, value: string) => {
    const sanitized = value.replace(/[^0-9.,]/g, '');
    setRawInputs((prev) => ({ ...prev, [field]: sanitized }));
    setStatusMessage(null);
  };

  const handleFieldFocus = (e: React.FocusEvent<HTMLInputElement>, field: ChargeFieldKey) => {
    if (rawInputs[field] === '0') {
      e.currentTarget.select();
    }
  };

  const handleFieldBlur = (field: ChargeFieldKey) => {
    setRawInputs((prev) => ({
      ...prev,
      [field]: prev[field].trim() === '' ? '0' : prev[field],
    }));
  };

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Reset manual inputs when the active random Job Order changes
  useEffect(() => {
    setRawInputs(INITIAL_RAW_INPUTS);
    setStatusMessage(null);
  }, [jobOrder]);

  const handleResetToZero = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setHeatNumber(defaultHeatNumber);
    setRawInputs(INITIAL_RAW_INPUTS);
    setStatusMessage(null);
  };

  // Calculations
  const totalBaseKg = pigIronKg + steelScrapKg + returnScrapKg;
  const totalAlloyKg = carburizerKg + feSiKg + feMnKg + feSiMgKg;
  const totalChargeKg = totalBaseKg + totalAlloyKg;
  const capacityPct = Math.round((totalChargeKg / 250.0) * 100);
  const isOverCapacity = totalChargeKg > 255.0;

  // Tolerance validation (±5% or ±0.3 kg for small alloy additions) against active Job Order
  const target = currentOrder.formula;
  const targetFeMn = target.feMnKg ?? 0;
  const targetFeSiMg = target.feSiMgLadleKg ?? 0;

  const isWithinTol = (actual: number, expected: number, minAbsTol: number) => {
    const tol = Math.max(minAbsTol, expected * 0.05);
    return Math.abs(actual - expected) <= tol;
  };

  const isPigOk = isWithinTol(pigIronKg, target.pigIronKg, 4.0);
  const isSteelOk = isWithinTol(steelScrapKg, target.steelScrapKg, 4.0);
  const isReturnOk = isWithinTol(returnScrapKg, target.returnScrapKg, 4.0);
  const isCarbOk = isWithinTol(carburizerKg, target.carburizerKg, 0.3);
  const isFeSiOk = isWithinTol(feSiKg, target.feSiKg, 0.3);
  const isFeMnOk = isWithinTol(feMnKg, targetFeMn, 0.25);
  const isFeSiMgOk = isWithinTol(feSiMgKg, targetFeSiMg, 0.3);

  const isBaseQualified = isPigOk && isSteelOk && isReturnOk;
  const isAlloyQualified = isCarbOk && isFeSiOk && isFeMnOk && isFeSiMgOk;
  const isFormulaQualified = isBaseQualified && isAlloyQualified && !isOverCapacity && totalChargeKg >= 235;

  const handleSortScrap = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setHeatModalOpen(false);
    setMeltingJobSheetOpen(false);
    setScrapSortingModalOpen(true);
  };

  const handleChargeToFurnace = () => {
    inductionAudio.resume();

    if (!isFormulaQualified) {
      inductionAudio.playClick();
      const mismatches: string[] = [];
      if (!isPigOk) mismatches.push('Pig Iron');
      if (!isSteelOk) mismatches.push('Steel Scrap');
      if (!isReturnOk) mismatches.push('Return Scrap');
      if (!isCarbOk) mismatches.push('Carburizer');
      if (!isFeSiOk) mismatches.push('FeSi 75');
      if (!isFeMnOk) mismatches.push('FeMn');
      if (!isFeSiMgOk) mismatches.push('FeSiMg');
      if (isOverCapacity) mismatches.push('Total > 255 kg');
      else if (totalChargeKg < 235) mismatches.push('Total < 235 kg');

      setStatusMessage(
        `⚠️ Komposisi belum sesuai Tiket Job Order (${mismatches.join(', ')}). Periksa takaran kg pada Kertas Job Order.`
      );
      return;
    }

    // Verify Scene 11 formula & alloy dose without skipping Scene 12 (Scrap Sorting) or Scene 13 (3-Stage Charging)
    setSelectedFormula(jobOrder);
    verifyAlloyDose();

    inductionAudio.playClank();
    inductionAudio.playSuccess();
    setStatusMessage(
      '✓ Komposisi 250 kg sesuai Job Order berhasil diverifikasi! SOP 11 terceklis selesai. Selanjutnya lakukan Sortir Skrap Bebas Air (Adegan 12).'
    );
  };

  if (!isOpen) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: 'rgba(3, 7, 18, 0.84)',
        backdropFilter: isWideDesktop ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: isWideDesktop ? 'blur(12px)' : 'none',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isJobOrderModalOpen && isWideDesktop ? 'flex-start' : 'center',
        padding: isJobOrderModalOpen && isWideDesktop ? '20px 440px 20px 24px' : '12px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#090d16',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                fontWeight: 900,
                fontSize: '15px',
                letterSpacing: '0.04em',
              }}
            >
              HEAT
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#fcd34d',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                  }}
                >
                  SIMULATOR PELEBURAN LOGAM • FORMULASI MUATAN
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                Laporan Formulasi Muatan Peleburan (Heat Formulation Sheet)
              </h2>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Standar Operasi Tanur Induksi • Kapasitas Krusibel 250 kg • Input Manual Sesuai Job Order
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                inductionAudio.resume();
                inductionAudio.playClick();
                setJobOrderModalOpen(!isJobOrderModalOpen);
              }}
              style={{
                background: isJobOrderModalOpen ? 'rgba(22, 163, 74, 0.25)' : 'rgba(2, 132, 199, 0.22)',
                border: `1px solid ${isJobOrderModalOpen ? '#22c55e' : '#38bdf8'}`,
                color: isJobOrderModalOpen ? '#4ade80' : '#38bdf8',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 800,
              }}
            >
              {isJobOrderModalOpen
                ? `📥 Letakkan Kertas Job Order (${currentOrder.id.replace('_', ' ')})`
                : `📋 Pegang Kertas Job Order di Kanan (${currentOrder.id.replace('_', ' ')})`}
            </button>

            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Tutup (ESC)
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              backgroundColor: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                No. Muatan (Heat ID)
              </span>
              <input
                type="text"
                value={heatNumber}
                onChange={(e) => setHeatNumber(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Target Grade Logam
              </span>
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fbbf24',
                  fontWeight: 700,
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`${currentOrder.id.replace('_', ' ')} - ${currentOrder.productName}`}
              >
                {currentOrder.id.replace('_', ' ')} ({currentOrder.productName})
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Kapasitas Tanur
              </span>
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                250 kg (Lining Netral)
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Target Tapping / Tuang
              </span>
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#f97316',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                {currentOrder.targetTempC} °C (±{currentOrder.targetToleranceC}°C)
              </div>
            </div>
          </div>

          {/* Section Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: '#e2e8f0' }}>
                  FORMULASI MUATAN PELEBURAN (CHARGE MIX) - INPUT MANUAL SATU PER SATU
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                Baca Tiket Job Order untuk menentukan berat (kg) tiap bahan
              </span>
            </div>

            {/* Two-Column Input Grid (Responsive on narrow phone viewports) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
              {/* COLUMN 1: 1. BAHAN DASAR (BASE CHARGE) */}
              <div
                style={{
                  backgroundColor: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    borderBottom: '1px solid #1e293b',
                    paddingBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>1. BAHAN DASAR (BASE CHARGE)</span>
                  <span style={{ fontFamily: 'monospace', color: isBaseQualified ? '#4ade80' : '#94a3b8' }}>
                    Subtotal: {totalBaseKg.toFixed(1)} kg
                  </span>
                </div>

                {/* Input 1A: Pig Iron */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Pig Iron (Besi Kasar)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'pig' ? null : 'pig')}
                        style={{
                          backgroundColor: activeTooltip === 'pig' ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
                          color: activeTooltip === 'pig' ? '#ffffff' : '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>{target.pigIronType}</span>
                  </div>

                  {activeTooltip === 'pig' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(2, 132, 199, 0.18)',
                        border: '1px solid #0284c7',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#e0f2fe',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>Pig Iron (Besi Kasar):</strong> Bahan baku utama hasil tanur tinggi dengan kadar karbon tinggi (3.5–4.2% C) dan pengotor rendah sebagai penyuplai karbon dasar coran.
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.pig}
                      onFocus={(e) => handleFieldFocus(e, 'pig')}
                      onBlur={() => handleFieldBlur('pig')}
                      onChange={(e) => handleFieldChange('pig', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${pigIronKg > 0 ? (isPigOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>

                {/* Input 1B: Steel Scrap */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Steel Scrap (Skrap Baja)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'steel' ? null : 'steel')}
                        style={{
                          backgroundColor: activeTooltip === 'steel' ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
                          color: activeTooltip === 'steel' ? '#ffffff' : '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>{target.steelScrapType}</span>
                  </div>

                  {activeTooltip === 'steel' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(2, 132, 199, 0.18)',
                        border: '1px solid #0284c7',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#e0f2fe',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>Steel Scrap:</strong> Potongan skrap baja karbon rendah pengencer kadar karbon dan silikon guna membentuk matriks perlitik/feritik yang kuat. Wajib kering bebas air.
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.steel}
                      onFocus={(e) => handleFieldFocus(e, 'steel')}
                      onBlur={() => handleFieldBlur('steel')}
                      onChange={(e) => handleFieldChange('steel', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${steelScrapKg > 0 ? (isSteelOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>

                {/* Input 1C: Return Scrap */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Return Scrap (Rt)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'return' ? null : 'return')}
                        style={{
                          backgroundColor: activeTooltip === 'return' ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
                          color: activeTooltip === 'return' ? '#ffffff' : '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>{target.returnScrapType}</span>
                  </div>

                  {activeTooltip === 'return' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(2, 132, 199, 0.18)',
                        border: '1px solid #0284c7',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#e0f2fe',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>Return Scrap (Sisa Coran Internal):</strong> Saluran turun (sprue), pengalir (runner), dan penambah (riser) dari pengecoran sebelumnya dengan komposisi kimia sejenis.
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.return}
                      onFocus={(e) => handleFieldFocus(e, 'return')}
                      onBlur={() => handleFieldBlur('return')}
                      onChange={(e) => handleFieldChange('return', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${returnScrapKg > 0 ? (isReturnOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>

                {/* Dry Scrap Verification Button inside Base Charge column */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: scrapSortedDry ? '#4ade80' : '#fbbf24' }}>
                    {scrapSortedDry ? '✓ Skrap Dasar Kering (Bebas Air)' : '⚠️ Wajib sortir skrap basah (Cegah Uap)'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSortScrap}
                    style={{
                      backgroundColor: scrapSortedDry ? 'rgba(34, 197, 94, 0.2)' : '#f59e0b',
                      border: `1px solid ${scrapSortedDry ? '#22c55e' : '#f59e0b'}`,
                      color: scrapSortedDry ? '#4ade80' : '#0f172a',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {scrapSortedDry ? '✓ Bebas Air' : 'Sortir Bebas Air'}
                  </button>
                </div>
              </div>

              {/* COLUMN 2: 2. BAHAN PADUAN & FLUKSI */}
              <div
                style={{
                  backgroundColor: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    borderBottom: '1px solid #1e293b',
                    paddingBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>2. BAHAN PADUAN & FLUKSI</span>
                  <span style={{ fontFamily: 'monospace', color: isAlloyQualified ? '#4ade80' : '#94a3b8' }}>
                    Subtotal: {totalAlloyKg.toFixed(2)} kg
                  </span>
                </div>

                {/* Input 2A: Carburizer / Recarburizer */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Carburizer / Recarburizer (C)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'carb' ? null : 'carb')}
                        style={{
                          backgroundColor: activeTooltip === 'carb' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                          color: activeTooltip === 'carb' ? '#ffffff' : '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Grafit Karbon Murni</span>
                  </div>

                  {activeTooltip === 'carb' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(180, 83, 9, 0.25)',
                        border: '1px solid #b45309',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#fef3c7',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>Carburizer (C):</strong> Penambah karbon aktif untuk menaikkan Carbon Equivalent (%CE) sesuai spesifikasi besi cor kelabu maupun nodular.
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.carb}
                      onFocus={(e) => handleFieldFocus(e, 'carb')}
                      onBlur={() => handleFieldBlur('carb')}
                      onChange={(e) => handleFieldChange('carb', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${carburizerKg > 0 ? (isCarbOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>

                {/* Input 2B: FeSi 75% */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>FeSi 75 (Ferro Silicon)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'fesi' ? null : 'fesi')}
                        style={{
                          backgroundColor: activeTooltip === 'fesi' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                          color: activeTooltip === 'fesi' ? '#ffffff' : '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Si ~75%</span>
                  </div>

                  {activeTooltip === 'fesi' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(180, 83, 9, 0.25)',
                        border: '1px solid #b45309',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#fef3c7',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>FeSi 75:</strong> Menyuplai unsur Silikon (Si) sebagai pendorong grafitisasi dan pengatur fluiditas cairan logam.
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.fesi}
                      onFocus={(e) => handleFieldFocus(e, 'fesi')}
                      onBlur={() => handleFieldBlur('fesi')}
                      onChange={(e) => handleFieldChange('fesi', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${feSiKg > 0 ? (isFeSiOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>

                {/* Input 2C: FeMn (Ferro Manganese) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>FeMn (Ferro Manganese)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'femn' ? null : 'femn')}
                        style={{
                          backgroundColor: activeTooltip === 'femn' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                          color: activeTooltip === 'femn' ? '#ffffff' : '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Pengikat Belerang / Perlit</span>
                  </div>

                  {activeTooltip === 'femn' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(180, 83, 9, 0.25)',
                        border: '1px solid #b45309',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#fef3c7',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>FeMn:</strong> Menstabilkan matriks perlitik pada besi cor kekuatan menengah-tinggi (FC 250 / FC 300). Isi 0 kg jika tidak diminta di Job Order.
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.femn}
                      onFocus={(e) => handleFieldFocus(e, 'femn')}
                      onBlur={() => handleFieldBlur('femn')}
                      onChange={(e) => handleFieldChange('femn', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${feMnKg > 0 ? (isFeMnOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>

                {/* Input 2D: FeSiMg (Nodulariser Ladel) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>FeSiMg (Inokulan Nodulariser Ladel)</span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'fesimg' ? null : 'fesimg')}
                        style={{
                          backgroundColor: activeTooltip === 'fesimg' ? '#d97706' : 'rgba(245, 158, 11, 0.15)',
                          color: activeTooltip === 'fesimg' ? '#ffffff' : '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        INFO
                      </button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>Khusus FCD (Nodular)</span>
                  </div>

                  {activeTooltip === 'fesimg' && (
                    <div
                      style={{
                        backgroundColor: 'rgba(180, 83, 9, 0.25)',
                        border: '1px solid #b45309',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#fef3c7',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>FeSiMg:</strong> Paduan Magnesium pembentuk grafit bulat (nodular) untuk FCD 450 & FCD 500. Isi 0 kg untuk pesanan FC (Besi Cor Kelabu).
                    </div>
                  )}

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawInputs.fesimg}
                      onFocus={(e) => handleFieldFocus(e, 'fesimg')}
                      onBlur={() => handleFieldBlur('fesimg')}
                      onChange={(e) => handleFieldChange('fesimg', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: `1px solid ${feSiMgKg > 0 ? (isFeSiMgOk ? '#22c55e' : '#f59e0b') : '#334155'}`,
                        borderRadius: '6px',
                        padding: '8px 36px 8px 12px',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8' }}>kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME QA TELEMETRY & CAPACITY METRICS */}
          <div
            style={{
              backgroundColor: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Metric 1: Total Weight & Capacity */}
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Total Bobot Muatan
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
                  {totalChargeKg.toFixed(1)}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 250 kg</span>
                <span
                  style={{
                    backgroundColor: isOverCapacity ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: isOverCapacity ? '#f87171' : '#38bdf8',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    marginLeft: 'auto',
                  }}
                >
                  {capacityPct}% Tanur
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, capacityPct)}%`,
                    height: '100%',
                    backgroundColor: isOverCapacity ? '#ef4444' : isFormulaQualified ? '#22c55e' : '#38bdf8',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            </div>

            {/* Metric 2: Base Charge Verification */}
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Status Bahan Dasar (Base Charge)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    backgroundColor: isBaseQualified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isBaseQualified ? '#4ade80' : '#fbbf24',
                    border: `1px solid ${isBaseQualified ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {isBaseQualified ? '✓ Sesuai Job Order (±5%)' : '⚠️ Belum Sesuai Job Order'}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Pig Iron + Steel Scrap + Return Scrap
              </div>
            </div>

            {/* Metric 3: Alloy & Inoculant Verification */}
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Status Bahan Paduan & Imbuh
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    backgroundColor: isAlloyQualified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isAlloyQualified ? '#4ade80' : '#fbbf24',
                    border: `1px solid ${isAlloyQualified ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {isAlloyQualified ? '✓ Sesuai Job Order (±5%)' : '⚠️ Belum Sesuai Job Order'}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Carburizer + FeSi 75 + FeMn + FeSiMg
              </div>
            </div>
          </div>

          {statusMessage && (
            <div
              style={{
                backgroundColor: isFormulaQualified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${isFormulaQualified ? '#22c55e' : '#f59e0b'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: isFormulaQualified ? '#4ade80' : '#fde68a',
                fontWeight: 600,
              }}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#090d16',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleResetToZero}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset ke 0 kg
            </button>

            <span
              style={{
                fontSize: '11px',
                color: statusMessage
                  ? (isFormulaQualified ? '#4ade80' : '#fca5a5')
                  : isHotAlloying
                  ? '#38bdf8'
                  : isFormulaQualified
                  ? '#4ade80'
                  : '#fbbf24',
                fontWeight: 600,
              }}
            >
              {statusMessage
                ? statusMessage
                : isFormulaQualified
                ? `● Komposisi ${currentOrder.id.replace('_', ' ')} tepat & siap diverifikasi`
                : '● Sesuaikan bobot bahan secara manual agar sesuai spesifikasi Tiket Job Order'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {selectedFormula === jobOrder && isAlloyVerified && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    setHeatModalOpen(false);
                    setMeltingJobSheetOpen(false);
                    setScrapSortingModalOpen(true);
                  }}
                  style={{
                    background: scrapSortedDry
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: scrapSortedDry ? '#4ade80' : '#ffffff',
                    border: `1px solid ${scrapSortedDry ? '#22c55e' : '#fbbf24'}`,
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {scrapSortedDry ? '✓ Skrap Bebas Air & Oli' : '🗑️ 2. Sortir Skrap Kering (Adegan 12)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    setHeatModalOpen(false);
                    setMeltingJobSheetOpen(false);
                    setSequentialChargingModalOpen(true);
                  }}
                  style={{
                    background: chargingStep >= 3
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: chargingStep >= 3 ? '#4ade80' : '#ffffff',
                    border: `1px solid ${chargingStep >= 3 ? '#22c55e' : '#38bdf8'}`,
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {chargingStep >= 3 ? '✓ Pemuatan 3 Tahap Selesai' : `⚡ 3. Pemuatan 3 Tahap (${chargingStep}/3)`}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleChargeToFurnace}
              style={{
                background: isFormulaQualified
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: isFormulaQualified ? '#0f172a' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: isFormulaQualified
                  ? '0 4px 15px rgba(34, 197, 94, 0.35)'
                  : '0 4px 15px rgba(234, 88, 12, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚖️</span>
              <span>
                {selectedFormula === jobOrder && isAlloyVerified
                  ? '✓ KOMPOSISI 250 KG TERVERIFIKASI'
                  : '1. TIMBANG & VERIFIKASI KOMPOSISI (250 KG)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
