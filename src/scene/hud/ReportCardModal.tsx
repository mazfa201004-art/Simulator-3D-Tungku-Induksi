import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { calculateStudentScore } from '../../sim/storyboardData';
import { inductionAudio } from '../fx/InductionAudio';

export const ReportCardModal: React.FC = () => {
  const isReportCardOpen = useSimStore((s) => s.isReportCardOpen);
  const setReportCardOpen = useSimStore((s) => s.setReportCardOpen);
  const sopStepCompletedMap = useSimStore((s) => s.sopStepCompletedMap);
  const jobOrder = useSimStore((s) => s.jobOrder);
  const selectedFormula = useSimStore((s) => s.selectedFormula);
  const resetSimulation = useSimStore((s) => s.resetSimulation);

  if (!isReportCardOpen) return null;

  const penalties = {
    formulaMismatch: selectedFormula !== null && selectedFormula !== jobOrder,
  };

  const report = calculateStudentScore(sopStepCompletedMap, penalties);

  const handleRestart = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    resetSimulation();
    setReportCardOpen(false);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.90)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '2px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '720px',
          padding: '20px',
          boxSizing: 'border-box',
          color: '#f8fafc',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
          maxHeight: '92dvh',
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}
      >
        {/* Document Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px solid #334155',
            paddingBottom: '14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.1em' }}>
            SIMULATOR PELEBURAN LOGAM 3D • TANUR INDUKSI
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 6px' }}>
            Bidang Keahlian Teknik Pengecoran Logam / Teknik Mesin
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 900, margin: '0', color: '#f8fafc' }}>
            LEMBAR HASIL EVALUASI PRAKTIK OPERASI TUNGKU INDUKSI
          </h2>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
            Evaluasi Penguasaan Tahapan Keselamatan, Formulasi Muatan, Peleburan, dan Penuangan Logam
          </div>
        </div>

        {/* Student Score Summary Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: report.isPassed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `2px solid ${report.isPassed ? '#22c55e' : '#ef4444'}`,
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Keputusan Kelulusan Praktik
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: report.isPassed ? '#4ade80' : '#f87171',
                marginTop: '2px',
              }}
            >
              {report.isPassed ? 'KOMPETEN (LULUS)' : 'BELUM KOMPETEN'}
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
              Ambang Batas Kelulusan Minimal (KKM): <strong>75 Poin</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Nilai Akhir Siswa</div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: report.isPassed ? '#22c55e' : '#ef4444',
                lineHeight: 1,
              }}
            >
              {report.totalScore}
              <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 600 }}>/100</span>
            </div>
          </div>
        </div>

        {/* Competency Component Score Breakdown Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            color: '#cbd5e1',
            marginBottom: '20px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#0f172a', textAlign: 'left', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '9px 10px', color: '#94a3b8' }}>No</th>
              <th style={{ padding: '9px 10px', color: '#94a3b8' }}>Komponen Kompetensi Praktikum</th>
              <th style={{ padding: '9px 10px', textAlign: 'center', color: '#94a3b8' }}>Bobot Maks.</th>
              <th style={{ padding: '9px 10px', textAlign: 'right', color: '#94a3b8' }}>Skor Capaian</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <td style={{ padding: '8px 10px', fontWeight: 700 }}>1</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#f8fafc' }}>Persiapan K3, Analisis Job Order & Inspeksi</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  APD lengkap, tiket pesanan disematkan, inspeksi lining & cetakan, verifikasi E-Stop & APAR.
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>15 Poin</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {report.k3JobOrder} Poin
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <td style={{ padding: '8px 10px', fontWeight: 700 }}>2</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#f8fafc' }}>Sekuensial Utilitas Pendingin</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Listrik panel ON, Saklar Cooling Tower tuas ke atas, Pompa cooling tuas ke atas, tekanan air &gt;= 2,5 Bar.
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>15 Poin</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {report.coolingSequential} Poin
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <td style={{ padding: '8px 10px', fontWeight: 700 }}>3</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#f8fafc' }}>Pengoperasian Daya Tungku &amp; Pre-heating</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Control Power ke kanan, Tombol Hijau AC ON, Potensio 10 kW pre-heating aman.
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>15 Poin</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {report.powerPreheat} Poin
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <td style={{ padding: '8px 10px', fontWeight: 700 }}>4</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#f8fafc' }}>Input Komposisi Bahan Manual, Syarat Kering & Peleburan</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Kesesuaian input manual komposisi bahan dengan Job Order, sortir bebas air, pemuatan ke tanur, 150 kW pull power.
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>20 Poin</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {report.formulaMelting} Poin
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <td style={{ padding: '8px 10px', fontWeight: 700 }}>5</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#f8fafc' }}>Mutu, Suhu Target & Penuangan ke 1 Cetakan</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Deslagging & sampel lab, pirometer tepat sesuai Job Order, preheating ladel, penuangan kontinu 100%.
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>20 Poin</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {report.qualityPouring} Poin
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <td style={{ padding: '8px 10px', fontWeight: 700 }}>6</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#f8fafc' }}>Prosedur Mematikan Mesin &amp; Pendinginan ± 5 Jam</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Potensio 0 kW, tombol merah AC OFF, cooling tower OFF, pendinginan 5 jam hingga koil &lt; 45°C.
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>15 Poin</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {report.shutdownCooling} Poin
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#0f172a', fontWeight: 800 }}>
              <td style={{ padding: '10px', color: '#f8fafc' }} colSpan={2}>
                TOTAL SKOR KOMPETENSI SISWA
              </td>
              <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>100 Poin</td>
              <td
                style={{
                  padding: '10px',
                  textAlign: 'right',
                  color: report.isPassed ? '#22c55e' : '#ef4444',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              >
                {report.totalScore} Poin
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setReportCardOpen(false)}
            style={{
              minHeight: '44px',
              padding: '0 18px',
              backgroundColor: '#334155',
              border: 'none',
              borderRadius: '6px',
              color: '#f8fafc',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tutup Rapor
          </button>

          <button
            onClick={handleRestart}
            style={{
              minHeight: '44px',
              padding: '0 24px',
              backgroundColor: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🔄 ULANGI PRAKTIKUM DARI AWAL
          </button>
        </div>
      </div>
    </div>
  );
};
