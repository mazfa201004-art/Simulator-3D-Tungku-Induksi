import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

export const PPEModal: React.FC = () => {
  const isPpeModalOpen = useSimStore((s) => s.isPpeModalOpen);
  const setPpeModalOpen = useSimStore((s) => s.setPpeModalOpen);
  const apdItems = useSimStore((s) => s.apdItems);
  const toggleApdItem = useSimStore((s) => s.toggleApdItem);

  if (!isPpeModalOpen) return null;

  const countEquipped = Object.values(apdItems).filter(Boolean).length;
  const isAllEquipped = countEquipped === 5;

  const ppeList = [
    {
      key: 'helmet' as const,
      name: 'Helm Proyek Safety Kuning',
      desc: 'Melindungi kepala dari benturan dan jatuhan material.',
      equipped: apdItems.helmet,
      icon: '🪖',
    },
    {
      key: 'mask' as const,
      name: 'Masker Respirator Cartridge & Kacamata Safety',
      desc: 'Melindungi mata dan saluran pernapasan dari debu silika serta uap peleburan.',
      equipped: apdItems.mask,
      icon: '😷',
    },
    {
      key: 'apron' as const,
      name: 'Baju Coverall / Wearpack Pelindung Putih Bertudung',
      desc: 'Melindungi seluruh tubuh operator dari paparan debu pengecoran dan percikan.',
      equipped: apdItems.apron,
      icon: '🦺',
    },
    {
      key: 'gloves' as const,
      name: 'Sarung Tangan Kerja Abu-Abu Gelap',
      desc: 'Melindungi telapak dan jari tangan saat mengoperasikan peralatan tanur.',
      equipped: apdItems.gloves,
      icon: '🧤',
    },
    {
      key: 'boots' as const,
      name: 'Sepatu Boot Safety Kuning Bersol Hitam',
      desc: 'Melindungi kaki dan betis operator di area lantai kerja pengecoran.',
      equipped: apdItems.boots,
      icon: '👢',
    },
  ];

  const handleToggle = (key: keyof typeof apdItems) => {
    inductionAudio.resume();
    inductionAudio.playClick();
    inductionAudio.vibrate(30);
    toggleApdItem(key);
  };

  const handleFinish = () => {
    inductionAudio.resume();
    inductionAudio.playSuccess();
    inductionAudio.vibrate(50);
    setPpeModalOpen(false);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
      onClick={() => setPpeModalOpen(false)}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '2px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          padding: '20px',
          boxSizing: 'border-box',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #334155',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em' }}>
              SCENE 1.1 • KESELAMATAN & KESEHATAN KERJA (K3)
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '2px 0 0' }}>
              LOCKER APD PELEBURAN LOGAM SUHU TINGGI
            </h2>
          </div>
          <div
            style={{
              backgroundColor: isAllEquipped ? '#052e16' : '#451a03',
              border: `1px solid ${isAllEquipped ? '#22c55e' : '#f59e0b'}`,
              color: isAllEquipped ? '#4ade80' : '#fbbf24',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            STATUS: [{countEquipped}/4]
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.4 }}>
          Demi keselamatan kerja pada peleburan suhu tinggi, operator wajib
          mengenakan seluruh APD tahan panas sebelum melangkah ke area tungku peleburan:
        </p>

        {/* 4 Interactive APD Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {ppeList.map((item) => (
            <button
              key={item.key}
              onClick={() => handleToggle(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                backgroundColor: item.equipped ? 'rgba(34, 197, 94, 0.12)' : '#0f172a',
                border: `1.5px solid ${item.equipped ? '#22c55e' : '#334155'}`,
                borderRadius: '8px',
                color: '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '44px',
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: item.equipped ? '#4ade80' : '#f8fafc' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{item.desc}</div>
              </div>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: item.equipped ? '#22c55e' : '#334155',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                }}
              >
                {item.equipped ? '✓' : ''}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: isAllEquipped ? '#4ade80' : '#f59e0b' }}>
            {isAllEquipped
              ? '✓ 4 APD lengkap terpasang. Siap memasuki area tanur.'
              : '⚠️ Pasang semua 4 APD untuk melanjutkan praktikum.'}
          </div>
          <button
            onClick={handleFinish}
            disabled={!isAllEquipped}
            style={{
              minHeight: '44px',
              padding: '0 20px',
              backgroundColor: isAllEquipped ? '#22c55e' : '#475569',
              border: 'none',
              borderRadius: '6px',
              color: isAllEquipped ? '#0f172a' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isAllEquipped ? 'pointer' : 'not-allowed',
            }}
          >
            SELESAI & PAKAI APD
          </button>
        </div>
      </div>
    </div>
  );
};
