import React, { useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * AparInspectionModal: Pop-up kaca pembesar inspeksi Manometer Tekanan APAR (16.5 Bar Zona Hijau)
 * dan kesiapan tombol darurat E-Stop (Adegan 4).
 * Ditempatkan di sisi kanan layar seolah-olah operator sedang memeriksa manometer dan Kartu Inspeksi K3 dari dekat.
 */
export const AparInspectionModal: React.FC = () => {
  const isAparModalOpen = useSimStore((s) => s.isAparModalOpen);
  const setAparModalOpen = useSimStore((s) => s.setAparModalOpen);
  const aparVerified = useSimStore((s) => s.aparVerified);
  const emergencyVerified = useSimStore((s) => s.emergencyVerified);
  const emergencyTripped = useSimStore((s) => s.emergencyTripped);
  const resetEmergencyStop = useSimStore((s) => s.resetEmergencyStop);
  const verifyEstopAndApar = useSimStore((s) => s.verifyEstopAndApar);
  const isAparHeld = useSimStore((s) => s.isAparHeld);
  const setIsAparHeld = useSimStore((s) => s.setIsAparHeld);

  useEffect(() => {
    if (!isAparModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAparModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAparModalOpen, setAparModalOpen]);

  if (!isAparModalOpen) return null;

  const isBothVerified = !emergencyTripped && aparVerified && emergencyVerified;

  const handleVerifyReady = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    if (emergencyTripped) {
      resetEmergencyStop();
    }
    verifyEstopAndApar();
    inductionAudio.playSuccess();
  };

  const handleToggleHoldApar = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setIsAparHeld(!isAparHeld, 'apar-dock-1');
    setAparModalOpen(false);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '16px',
        width: '410px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 96px)',
        zIndex: 9998,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        border: '2px solid #22c55e',
        borderRadius: '14px',
        boxShadow: '0 22px 50px rgba(0, 0, 0, 0.85), 0 0 24px rgba(34, 197, 94, 0.25)',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#f8fafc',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #052e16 0%, #0f172a 100%)',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid #22c55e',
                color: '#4ade80',
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              INSPEKSI K3 • ADEGAN 4
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
              MANOMETER APAR &amp; E-STOP
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
            Pemeriksaan Tekanan APAR &amp; Sistem Darurat
          </div>
        </div>

        <button
          onClick={() => {
            inductionAudio.resume();
            inductionAudio.playClick();
            setAparModalOpen(false);
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#fca5a5',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ✕ Tutup
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Close-up Manometer Dial SVG Card */}
        <div
          style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>
            KACA PEMBESAR MANOMETER LEHER TABUNG APAR
          </div>

          {/* High-Clarity SVG Pressure Gauge */}
          <svg width="240" height="145" viewBox="0 0 240 145">
            {/* Outer Brass Ring */}
            <circle cx="120" cy="115" r="96" fill="#0f172a" stroke="#ca8a04" strokeWidth="8" />

            {/* Left Red Zone: 0 - 12 Bar (Kurang Tekanan / Recharge) */}
            <path
              d="M 42 115 A 78 78 0 0 1 82 47"
              fill="none"
              stroke="#dc2626"
              strokeWidth="18"
            />

            {/* Middle Green Zone: 12 - 18 Bar (Zona Hijau Normal Operasional) */}
            <path
              d="M 82 47 A 78 78 0 0 1 158 47"
              fill="none"
              stroke="#22c55e"
              strokeWidth="20"
            />

            {/* Right Red Zone: 18 - 25 Bar (Overcharge / Kelebihan Tekanan) */}
            <path
              d="M 158 47 A 78 78 0 0 1 198 115"
              fill="none"
              stroke="#dc2626"
              strokeWidth="18"
            />

            {/* Scale Labels */}
            <text x="28" y="112" fill="#f87171" fontSize="10" fontWeight="bold">0</text>
            <text x="64" y="42" fill="#fde047" fontSize="10" fontWeight="bold">12</text>
            <text x="120" y="26" fill="#4ade80" fontSize="11" fontWeight="900" textAnchor="middle">16.5 BAR</text>
            <text x="170" y="42" fill="#fde047" fontSize="10" fontWeight="bold">18</text>
            <text x="204" y="112" fill="#f87171" fontSize="10" fontWeight="bold">25</text>

            {/* Zone Text */}
            <text x="55" y="92" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">KURANG</text>
            <text x="120" y="68" fill="#86efac" fontSize="9.5" fontWeight="900" textAnchor="middle">ZONA HIJAU</text>
            <text x="185" y="92" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">LEBIH</text>

            {/* Pointer Needle pointing to 16.5 Bar (slightly right of top center in Green Zone) */}
            <g transform="rotate(8, 120, 115)">
              <polygon points="116,115 120,34 124,115" fill="#ffffff" />
              <polygon points="118,115 120,38 122,115" fill="#fef08a" />
            </g>

            {/* Center Brass Hub */}
            <circle cx="120" cy="115" r="11" fill="#eab308" stroke="#78350f" strokeWidth="3" />
          </svg>

          {/* Numeric Readout Pill */}
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.18)',
              border: '1.5px solid #22c55e',
              borderRadius: '8px',
              padding: '6px 14px',
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#4ade80', fontFamily: 'monospace' }}>
              TEKANAN AKTUAL: 16.5 BAR (240 PSI)
            </div>
            <div style={{ fontSize: '11px', color: '#bbf7d0', fontWeight: 600 }}>
              Berada di Zona Hijau Normal (Standar Operasional: 14.0 – 18.0 Bar)
            </div>
          </div>
        </div>

        {/* Checklist Data Teknis APAR & E-Stop */}
        <div
          style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '11.5px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '5px' }}>
            <span style={{ color: '#94a3b8' }}>Media &amp; Kapasitas Tabung:</span>
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>Dry Chemical Powder ABC • 6.0 kg</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '5px' }}>
            <span style={{ color: '#94a3b8' }}>Pin Pengunci &amp; Segel Katup:</span>
            <span style={{ fontWeight: 700, color: '#4ade80' }}>✓ Terpasang Utuh (Safety Pin OK)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '5px' }}>
            <span style={{ color: '#94a3b8' }}>Kondisi Selang &amp; Corong Nozzle:</span>
            <span style={{ fontWeight: 700, color: '#4ade80' }}>✓ Bebas Retak &amp; Tidak Tersumbat</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Status Tombol E-Stop Kabinet:</span>
            <span style={{ fontWeight: 800, color: emergencyTripped ? '#f87171' : '#4ade80' }}>
              {emergencyTripped ? '⚠️ TERKUNCI (Klik Verifikasi untuk Reset)' : '✓ BEBAS / UNLATCHED (SIAP)'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleVerifyReady}
            style={{
              minHeight: '44px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: isBothVerified
                ? 'rgba(22, 163, 74, 0.28)'
                : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: `1.5px solid ${isBothVerified ? '#4ade80' : '#86efac'}`,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>✓</span>
            <span>
              {isBothVerified
                ? 'Tekanan APAR (16.5 Bar) & E-Stop Terverifikasi Siap'
                : 'Catat & Verifikasi Tekanan APAR (16.5 Bar) & E-Stop'}
            </span>
          </button>

          <button
            onClick={handleToggleHoldApar}
            style={{
              minHeight: '40px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid #475569',
              color: '#e2e8f0',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isAparHeld ? '📥 Kembalikan Tabung APAR ke Dudukan Dinding' : '🧯 Ambil & Pegang Tabung APAR di Tangan'}
          </button>
        </div>
      </div>
    </div>
  );
};
