import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';
import { JOB_ORDER_PRESETS } from '../../sim/storyboardData';

export const InspectionModal: React.FC = () => {
  const isInspectionModalOpen = useSimStore((s) => s.isInspectionModalOpen);
  const setInspectionModalOpen = useSimStore((s) => s.setInspectionModalOpen);
  const inspection = useSimStore((s) => s.inspection);
  const activeInspectionScanPoint = useSimStore((s) => s.activeInspectionScanPoint);
  const jobOrder = useSimStore((s) => s.jobOrder);

  if (!isInspectionModalOpen) return null;

  const currentOrder = JOB_ORDER_PRESETS[jobOrder];
  const moldName = currentOrder
    ? `${currentOrder.moldLabel} (${currentOrder.id})`
    : 'Cetakan Pasir Produksi Tunggal';

  const points: Array<{
    key: 'bottom' | 'wall' | 'lip' | 'mold';
    name: string;
    statusText: string;
    verified: boolean;
  }> = [
    {
      key: 'bottom',
      name: '1. Dasar Krusibel & Elektroda Ground Leakage',
      statusText: 'Ketebalan Dasar: 96% • Sensor Kebocoran Arus: Normal (Tidak ada retak)',
      verified: inspection.bottom,
    },
    {
      key: 'wall',
      name: '2. Dinding Samping Refraktori (Lining Silika/Alumina)',
      statusText: 'Ketebalan Refraktori: 94% (Aman > 75%) • Bebas Erosi Logam Beku',
      verified: inspection.wall,
    },
    {
      key: 'lip',
      name: '3. Bibir Moncong Tuang Tanur (Spout Refractory)',
      statusText: 'Moncong Tuang Mulus • Geometri Aliran Bersih dari Terak Mengeras',
      verified: inspection.lip,
    },
    {
      key: 'mold',
      name: `4. Kesiapan 1 Unit ${moldName}`,
      statusText: 'Rongga Cetakan Kering • Cawan Tuang & Riser Bersih • Siap Tuang',
      verified: inspection.mold,
    },
  ];

  const countVerified = Object.values(inspection).filter(Boolean).length;
  const isAllVerified = countVerified === 4;

  const handlePutBackOnDesk = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setInspectionModalOpen(false);
  };

  const handleFinish = () => {
    inductionAudio.resume();
    inductionAudio.playSuccess();
    inductionAudio.vibrate(50);
    setInspectionModalOpen(false);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '64px',
        right: '16px',
        width: 'min(420px, calc(100vw - 24px))',
        maxHeight: 'calc(100dvh - 82px)',
        zIndex: 10005,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'auto',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Metallic Spring Clip at Top of Clipboard */}
      <div
        style={{
          width: '128px',
          height: '22px',
          background: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)',
          border: '2px solid #475569',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          marginBottom: '-4px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#334155',
          }}
        />
      </div>

      {/* Wooden / Fiberboard Clipboard Backing Frame */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#78350f',
          backgroundImage: 'linear-gradient(145deg, #92400e 0%, #78350f 55%, #451a03 100%)',
          border: '3px solid #451a03',
          borderRadius: '14px',
          padding: '12px 10px 12px 10px',
          boxSizing: 'border-box',
          boxShadow: '-10px 18px 38px rgba(0, 0, 0, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 102px)',
        }}
      >
        {/* Top Metallic Clamp Plate Overlapping Paper */}
        <div
          style={{
            width: '160px',
            height: '12px',
            margin: '-6px auto 6px auto',
            background: 'linear-gradient(180deg, #cbd5e1 0%, #64748b 100%)',
            border: '1px solid #334155',
            borderRadius: '3px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
            zIndex: 3,
          }}
        />

        {/* Physical Paper Sheet */}
        <div
          style={{
            backgroundColor: '#fcfaf2',
            border: '1px solid #d6d3d1',
            borderRadius: '6px',
            padding: '14px 14px 16px 14px',
            boxSizing: 'border-box',
            color: '#0f172a',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Paper Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '10px',
              marginBottom: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#b45309',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                LEMBAR KERJA OPERATOR • SEDANG DIPEGANG
              </div>
              <h2
                style={{
                  fontSize: '14.5px',
                  fontWeight: 900,
                  margin: '2px 0 0',
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                LAPORAN INSPEKSI TANUR &amp; CETAKAN
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div
                style={{
                  backgroundColor: isAllVerified ? '#dcfce7' : '#fef3c7',
                  border: `1.5px solid ${isAllVerified ? '#16a34a' : '#d97706'}`,
                  color: isAllVerified ? '#15803d' : '#92400e',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                }}
              >
                [{countVerified}/4] LULUS
              </div>

              <button
                onClick={handlePutBackOnDesk}
                title="Letakkan Kembali Kertas di Meja"
                style={{
                  minWidth: '30px',
                  minHeight: '30px',
                  backgroundColor: '#fee2e2',
                  border: '1.5px solid #dc2626',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#e0f2fe',
              borderLeft: '3px solid #0284c7',
              padding: '7px 10px',
              marginBottom: '10px',
              fontSize: '11px',
              color: '#0c4a6e',
              lineHeight: 1.4,
            }}
          >
            Sambil memegang lembar laporan ini di sebelah kanan, Anda bebas berjalan (<strong>WASD</strong>) di bengkel dan{' '}
            <strong>mengklik langsung 4 titik reticle 3D pada bagian dalam Krusibel Tanur (dasar, dinding, bibir moncong) dan 1 unit Cetakan Pasir</strong>.
          </div>

          {/* 4 Points Checklist on Paper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {points.map((pt) => {
              const isScanning = activeInspectionScanPoint === pt.key;
              return (
                <div
                  key={pt.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '9px 10px',
                    backgroundColor: pt.verified
                      ? '#dcfce7'
                      : isScanning
                      ? '#e0f2fe'
                      : '#f8fafc',
                    border: `1.5px solid ${
                      pt.verified ? '#16a34a' : isScanning ? '#0284c7' : '#cbd5e1'
                    }`,
                    borderRadius: '6px',
                    color: '#0f172a',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: pt.verified ? '#14532d' : isScanning ? '#0369a1' : '#0f172a',
                      }}
                    >
                      {pt.name}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: pt.verified ? '#16a34a' : '#e2e8f0',
                        color: pt.verified ? '#ffffff' : '#475569',
                        flexShrink: 0,
                      }}
                    >
                      {pt.verified ? '✓ AMAN' : 'BELUM DICEK'}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: pt.verified ? '#166534' : '#475569',
                      lineHeight: 1.35,
                    }}
                  >
                    {isScanning ? 'Sedang memindai permukaan pada objek 3D...' : pt.statusText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paper Footer Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <button
              onClick={handleFinish}
              disabled={!isAllVerified}
              style={{
                minHeight: '38px',
                padding: '6px 14px',
                backgroundColor: isAllVerified ? '#16a34a' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isAllVerified ? 'pointer' : 'not-allowed',
              }}
            >
              {isAllVerified
                ? '✓ SELESAI INSPEKSI & LETAKKAN KEMBALI DI MEJA'
                : `PERIKSA SEMUA 4 TITIK UNTUK MENYELESAIKAN [${countVerified}/4]`}
            </button>

            <button
              onClick={handlePutBackOnDesk}
              style={{
                minHeight: '34px',
                padding: '6px 12px',
                backgroundColor: '#e2e8f0',
                border: '1.5px solid #64748b',
                borderRadius: '6px',
                color: '#1e293b',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              📥 Letakkan Kembali Kertas di Meja Samping APAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
