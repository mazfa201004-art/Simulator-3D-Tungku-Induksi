import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { JOB_ORDER_PRESETS } from '../../sim/storyboardData';
import { inductionAudio } from '../fx/InductionAudio';

export const JobOrderModal: React.FC = () => {
  const isJobOrderModalOpen = useSimStore((s) => s.isJobOrderModalOpen);
  const setJobOrderModalOpen = useSimStore((s) => s.setJobOrderModalOpen);
  const jobOrder = useSimStore((s) => s.jobOrder);
  const pinJobOrderToHud = useSimStore((s) => s.pinJobOrderToHud);
  const isJobOrderPinned = useSimStore((s) => s.isJobOrderPinned);

  if (!isJobOrderModalOpen) return null;

  const order = JOB_ORDER_PRESETS[jobOrder];

  const handlePin = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    inductionAudio.playSuccess();
    pinJobOrderToHud();
  };

  const handlePutBackOnDesk = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setJobOrderModalOpen(false);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '64px',
        right: '16px',
        width: 'min(410px, calc(100vw - 24px))',
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
              borderBottom: '2px solid #0f172a',
              paddingBottom: '10px',
              marginBottom: '12px',
              gap: '8px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#0369a1',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                LEMBAR KERJA OPERATOR • SEDANG DIPEGANG
              </div>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  margin: '2px 0 0',
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                KERTAS JOB ORDER (SPK)
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span
                style={{
                  backgroundColor: '#e0f2fe',
                  border: '1.5px solid #0284c7',
                  color: '#0369a1',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {order.code}
              </span>
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

          {/* Order Specifications Box on Paper */}
          <div
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                  Nama Produk Pesanan
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                  {order.productName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                  Target Suhu Tapping
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#dc2626',
                    fontFamily: 'monospace',
                    marginTop: '1px',
                  }}
                >
                  {order.targetTempC} °C (±{order.targetToleranceC}°C)
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                  Spesifikasi Material
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369a1', marginTop: '1px' }}>
                  {order.materialStandard}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                  Jumlah Produksi
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginTop: '1px' }}>
                  {order.quantity} Unit (Cetakan Pasir)
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#fef3c7',
                borderLeft: '3px solid #d97706',
                padding: '6px 8px',
                fontSize: '11px',
                color: '#78350f',
                lineHeight: 1.4,
              }}
            >
              <strong>Catatan Metalurgi:</strong> {order.superheatingNote}
            </div>
          </div>

          {/* 250 kg Formula Recipe Table on Paper */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Komposisi Bahan Muatan (Kapasitas 250 kg)
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11.5px',
                color: '#0f172a',
                border: '1px solid #94a3b8',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', textAlign: 'left', borderBottom: '1.5px solid #64748b' }}>
                  <th style={{ padding: '6px 8px', color: '#1e293b', fontWeight: 800 }}>Bahan Baku</th>
                  <th style={{ padding: '6px 8px', color: '#1e293b', fontWeight: 800 }}>Spesifikasi</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', color: '#1e293b', fontWeight: 800 }}>
                    Takaran (kg)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>Pig Iron</td>
                  <td style={{ padding: '5px 8px', color: '#334155' }}>{order.formula.pigIronType}</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {order.formula.pigIronKg} kg
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>Steel Scrap</td>
                  <td style={{ padding: '5px 8px', color: '#334155' }}>{order.formula.steelScrapType}</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {order.formula.steelScrapKg} kg
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>Return Scrap</td>
                  <td style={{ padding: '5px 8px', color: '#334155' }}>{order.formula.returnScrapType}</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {order.formula.returnScrapKg} kg
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>Carburizer</td>
                  <td style={{ padding: '5px 8px', color: '#334155' }}>Recarburizer C</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {order.formula.carburizerKg.toFixed(1)} kg
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>Ferrosilicon</td>
                  <td style={{ padding: '5px 8px', color: '#334155' }}>FeSi 75%</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {order.formula.feSiKg.toFixed(1)} kg
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>Ferromanganese</td>
                  <td style={{ padding: '5px 8px', color: '#334155' }}>FeMn</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {(order.formula.feMnKg ?? 0).toFixed(1)} kg
                  </td>
                </tr>
                <tr
                  style={{
                    borderBottom: '1px solid #cbd5e1',
                    backgroundColor: order.formula.feSiMgLadleKg ? '#e0f2fe' : 'transparent',
                  }}
                >
                  <td style={{ padding: '5px 8px', fontWeight: 800, color: '#0369a1' }}>Nodulariser FeSiMg</td>
                  <td style={{ padding: '5px 8px', color: '#0369a1' }}>Inokulan Ladel</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 900,
                      color: '#0369a1',
                      fontFamily: 'monospace',
                      fontSize: '12.5px',
                    }}
                  >
                    {(order.formula.feSiMgLadleKg ?? 0).toFixed(1)} kg
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#dcfce7', fontWeight: 900, borderTop: '1.5px solid #16a34a' }}>
                  <td style={{ padding: '6px 8px', color: '#14532d' }} colSpan={2}>
                    TOTAL MUATAN TANUR
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      textAlign: 'right',
                      color: '#15803d',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}
                  >
                    {order.formula.totalKg} kg
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Action Buttons on Held Paper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handlePin}
              style={{
                minHeight: '40px',
                padding: '8px 14px',
                backgroundColor: isJobOrderPinned ? '#16a34a' : '#0284c7',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span>
                {isJobOrderPinned
                  ? '✓ SPK TELAH DISEMATKAN KE HUD (TETAP PEGANG / BACA)'
                  : '📌 TERIMA & SEMATKAN SPK KE HUD'}
              </span>
            </button>

            <button
              onClick={handlePutBackOnDesk}
              style={{
                minHeight: '36px',
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
