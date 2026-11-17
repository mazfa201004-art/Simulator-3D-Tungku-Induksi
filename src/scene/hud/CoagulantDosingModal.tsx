import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

export const CoagulantDosingModal: React.FC = () => {
  const isCoagulantModalOpen = useSimStore((s) => s.isCoagulantModalOpen);
  const setCoagulantModalOpen = useSimStore((s) => s.setCoagulantModalOpen);
  const coagulantDoseKg = useSimStore((s) => s.coagulantDoseKg);
  const setCoagulantDoseKg = useSimStore((s) => s.setCoagulantDoseKg);
  const setIsShovelFilled = useSimStore((s) => s.setIsShovelFilled);
  const setHeldTool = useSimStore((s) => s.setHeldTool);

  if (!isCoagulantModalOpen) return null;

  const quickDoseOptions = [
    { kg: 0.5, label: '0.5 kg', note: 'Dosis Minimal (Krusibel Bersih)' },
    { kg: 1.0, label: '1.0 kg ⭐', note: 'Rekomendasi Standar (0.4% dari 250 kg)' },
    { kg: 1.5, label: '1.5 kg', note: 'Dosis Berat (Skrap Berkarat)' },
    { kg: 2.0, label: '2.0 kg', note: 'Dosis Ekstra Maksimal' },
  ];

  const handleConfirm = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setIsShovelFilled(true);
    setHeldTool('shovel');
    setCoagulantModalOpen(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setCoagulantModalOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '2px solid #38bdf8',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 24px rgba(56, 189, 248, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          pointerEvents: 'auto',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🥄</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.04em' }}>
                DOSING SERBUK KOAGULAN (DROSAN)
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Parameter Takaran Pengikatan Terak (Adegan 15/20)
              </div>
            </div>
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setCoagulantModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              pointerEvents: 'auto',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', pointerEvents: 'auto' }}>
          {/* Dose Parameter Display */}
          <div
            style={{
              background: 'rgba(2, 6, 23, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Takaran Terpilih:
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#facc15', lineHeight: 1.2 }}>
                {coagulantDoseKg.toFixed(1)} <span style={{ fontSize: '16px', color: '#94a3b8' }}>KG</span>
              </div>
            </div>
            <div
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: coagulantDoseKg === 1.0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${coagulantDoseKg === 1.0 ? '#22c55e' : '#38bdf8'}`,
                color: coagulantDoseKg === 1.0 ? '#4ade80' : '#38bdf8',
                fontWeight: 700,
              }}
            >
              {coagulantDoseKg === 1.0 ? 'IDEAL K3' : 'DOSIS MANUAL'}
            </div>
          </div>

          {/* Quick Dose Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', pointerEvents: 'auto' }}>
            {quickDoseOptions.map((opt) => (
              <button
                key={`dose-btn-${opt.kg}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  inductionAudio.resume();
                  inductionAudio.playClick();
                  setCoagulantDoseKg(opt.kg);
                }}
                style={{
                  background:
                    Math.abs(coagulantDoseKg - opt.kg) < 0.05
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : 'rgba(30, 41, 59, 0.6)',
                  border: `1.5px solid ${Math.abs(coagulantDoseKg - opt.kg) < 0.05 ? '#38bdf8' : '#475569'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800 }}>{opt.label}</div>
                <div style={{ fontSize: '10px', color: '#cbd5e1' }}>{opt.note}</div>
              </button>
            ))}
          </div>

          {/* Fine Tuning Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
              <span>Atur Manual Slider (0.2 s/d 2.5 KG):</span>
              <strong style={{ color: '#38bdf8' }}>{coagulantDoseKg.toFixed(1)} KG</strong>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={coagulantDoseKg}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => setCoagulantDoseKg(parseFloat(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer',
                accentColor: '#38bdf8',
                pointerEvents: 'auto',
              }}
            />
          </div>

          {/* Educational Note */}
          <div
            style={{
              background: 'rgba(234, 88, 12, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#fed7aa',
              lineHeight: 1.45,
            }}
          >
            <strong>💡 Prinsip Metalurgi:</strong> Serbuk koagulan (Drosan/Perlite) ditaburkan di atas permukaan kolam
            lebur untuk mengikat terak oksida cair menjadi gumpalan kerak padat berserat (*viscous slag crust*) sehingga
            dapat diserok bersih dengan tongkat serok tanpa terbawa cairan besi.
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            pointerEvents: 'auto',
          }}
        >
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setCoagulantModalOpen(false)}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            Batal
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
              pointerEvents: 'auto',
            }}
          >
            <span>✓</span>
            <span>Ambil Takaran (Sekop Terisi Serbuk)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
