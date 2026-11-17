import React, { useState, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface ScrapSampleItem {
  id: string;
  name: string;
  category: string;
  weightKg: string;
  isHazardous: boolean;
  hazardTag?: string;
  visualBadge: string;
  conditionSummary: string;
  scientificExplanation: string;
}

const SCRAP_SAMPLES: ScrapSampleItem[] = [
  {
    id: 'clean-pig-iron',
    name: 'Balok Ingot Pig Iron Bersih',
    category: 'Bahan Dasar (Starting Block)',
    weightKg: '42.0 kg',
    isHazardous: false,
    visualBadge: '🧱 INGOT PADAT KERING',
    conditionSummary: 'Permukaan metalik kering, disimpan di dalam gudang tertutup, bebas air dan bebas pelumas.',
    scientificExplanation:
      '✓ AMAN DIMUAT: Ingot Pig Iron ini 100% kering dan padat sehingga aman dimasukkan langsung ke dasar krusibel sebagai Starting Block.',
  },
  {
    id: 'wet-pipe-scrap',
    name: 'Potongan Pipa Baja Lembab & Berair (Tetesan Hujan)',
    category: 'Skrap Baja Terkontaminasi Air',
    weightKg: '18.5 kg',
    isHazardous: true,
    hazardTag: '💧 BAHAYA AIR / EMBUN (STEAM EXPLOSION)',
    visualBadge: '💧 PIPA BASAH BERAIR',
    conditionSummary: 'Terdapat genangan air hujan di dalam rongga pipa dan karat basah lembab di permukaan luar.',
    scientificExplanation:
      '⚠️ MENGAPA WAJIB DISINGKIRKAN KE DRYING BIN: Air (H₂O) yang terbawa masuk ke bawah permukaan logam cair bersuhu 1.500°C akan berubah fase menjadi uap superpanas secara instan dengan EKSPANSI VOLUME 1.600 KALI LIPAT dalam hitungan milidetik! Lonjakan tekanan uap ini memicu LEDAKAN UAP AIR (Steam Explosion) dahsyat yang melontarkan ratusan kilogram logam cair pijar keluar dari tanur.',
  },
  {
    id: 'clean-return-scrap',
    name: 'Saluran Tuang Return Scrap FCD/FC',
    category: 'Return Scrap Internal',
    weightKg: '31.0 kg',
    isHazardous: false,
    visualBadge: '🔩 RETURN SCRAP KERING',
    conditionSummary: 'Telah dibersihkan dengan shot-blasting, kering mutlak pada suhu ruang bengkel.',
    scientificExplanation:
      '✓ AMAN DIMUAT: Saluran balik (return scrap) hasil pengecoran sebelumnya ini sudah bersih dari pasir lembab maupun cairan pendingin.',
  },
  {
    id: 'oily-gearbox-scrap',
    name: 'Bongkahan Mesin Berlumur Oli & Gemuk Pelumas',
    category: 'Skrap Baja Terkontaminasi Pelumas',
    weightKg: '24.0 kg',
    isHazardous: true,
    hazardTag: '🛢️ BAHAYA OLI & PELUMAS (GAS HIDROGEN & API)',
    visualBadge: '🛢️ SKRAP BERLUMUR OLI',
    conditionSummary: 'Permukaan logam tertutup lapisan oli mesin hitam pekat dan sisa gemuk (grease) hidrokarbon.',
    scientificExplanation:
      '⚠️ MENGAPA WAJIB DISINGKIRKAN: Oli dan pelumas adalah senyawa hidrokarbon (CₓHᵧ). Saat masuk ke tanur pijar, pelumas langsung menyala hebat menimbulkan SEMBURAN API (Flash Fire) dan asap hitam pekat beracun (CO & PAH). Secara metalurgi, penguraian hidrokarbon melepaskan GAS HIDROGEN (H₂) terlarut ke dalam besi cair yang menyebabkan cacat POROSITAS LUBANG JARUM (Pinhole Porosity) di seluruh benda coran!',
  },
  {
    id: 'clean-plate-scrap',
    name: 'Potongan Plat Baja Struktur Kering',
    category: 'Steel Scrap (Skrap Baja)',
    weightKg: '28.5 kg',
    isHazardous: false,
    visualBadge: '🛡️ PLAT BAJA KERING',
    conditionSummary: 'Potongan plat baja karbon rendah yang bersih, kering, dan bebas cat/oli.',
    scientificExplanation:
      '✓ AMAN DIMUAT: Potongan plat baja ini kering dan memiliki ukuran seragam sehingga ideal untuk lapisan tengah krusibel.',
  },
  {
    id: 'sealed-hollow-can',
    name: 'Tabung Silinder Hidrolik Tertutup Rapat',
    category: 'Skrap Berongga Tertutup',
    weightKg: '15.0 kg',
    isHazardous: true,
    hazardTag: '💥 BAHAYA RONGGA TERTUTUP (LEDAKAN TEKANAN)',
    visualBadge: '🥫 TABUNG TERTUTUP RAPAT',
    conditionSummary: 'Kedua ujung tabung masih tertutup las rapat dan menyimpan udara serta sisa cairan hidrolik di dalamnya.',
    scientificExplanation:
      '⚠️ MENGAPA WAJIB DISINGKIRKAN: Sesuai hukum gas ideal (PV = nRT), udara dan sisa cairan yang terjebak di dalam wadah tertutup rapat akan mengalami kenaikan tekanan ribuan atmosfer saat dipanaskan hingga 1.500°C. Tabung tertutup ini akan MELEDAK SEPERTI BOM di dalam krusibel dan menghancurkan dinding refraktori serta koil tembaga berpendingin air!',
  },
];

export const ScrapSortingModal: React.FC = () => {
  const isScrapSortingModalOpen = useSimStore((s) => s.isScrapSortingModalOpen);
  const setScrapSortingModalOpen = useSimStore((s) => s.setScrapSortingModalOpen);
  const scrapSortedDry = useSimStore((s) => s.scrapSortedDry);
  const setScrapSortedDry = useSimStore((s) => s.setScrapSortedDry);
  const setSequentialChargingModalOpen = useSimStore((s) => s.setSequentialChargingModalOpen);

  const [quarantinedIds, setQuarantinedIds] = useState<string[]>([]);
  const [selectedExplanation, setSelectedExplanation] = useState<{
    title: string;
    isHazard: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isScrapSortingModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setScrapSortingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScrapSortingModalOpen, setScrapSortingModalOpen]);

  // Sync if already verified
  useEffect(() => {
    if (scrapSortedDry && quarantinedIds.length < 3) {
      setQuarantinedIds(['wet-pipe-scrap', 'oily-gearbox-scrap', 'sealed-hollow-can']);
    }
  }, [scrapSortedDry, quarantinedIds.length]);

  if (!isScrapSortingModalOpen) return null;

  const hazardousItems = SCRAP_SAMPLES.filter((item) => item.isHazardous);
  const removedHazardCount = hazardousItems.filter((h) => quarantinedIds.includes(h.id)).length;
  const isAllHazardsRemoved = removedHazardCount === hazardousItems.length;

  const handleInspectSample = (sample: ScrapSampleItem) => {
    inductionAudio.resume();
    if (sample.isHazardous) {
      inductionAudio.playClank();
      if (!quarantinedIds.includes(sample.id)) {
        const nextIds = [...quarantinedIds, sample.id];
        setQuarantinedIds(nextIds);
        if (nextIds.length === hazardousItems.length) {
          setScrapSortedDry(true);
          inductionAudio.playSuccess();
        }
      }
      setSelectedExplanation({
        title: `${sample.name} — Disingkirkan ke Drying Bin`,
        isHazard: true,
        text: sample.scientificExplanation,
      });
    } else {
      inductionAudio.playClick();
      setSelectedExplanation({
        title: `${sample.name} — Material Bersih & Kering`,
        isHazard: false,
        text: sample.scientificExplanation,
      });
    }
  };

  const handleCompleteAndProceed = () => {
    inductionAudio.resume();
    inductionAudio.playSuccess();
    setScrapSortedDry(true);
    setScrapSortingModalOpen(false);
    setSequentialChargingModalOpen(true);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setScrapSortingModalOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.84)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 22px',
            background: 'linear-gradient(135deg, #451a03 0%, #0f172a 100%)',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  color: '#fcd34d',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.06em',
                }}
              >
                ADEGAN 12 • MEJA INSPEKSI &amp; SORTIR SKRAP K3
              </span>
              <span
                style={{
                  backgroundColor: isAllHazardsRemoved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${isAllHazardsRemoved ? '#22c55e' : '#ef4444'}`,
                  color: isAllHazardsRemoved ? '#4ade80' : '#fca5a5',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                KONTAMINAN DISINGKIRKAN: {removedHazardCount} / 3
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
              Penyortiran Bahan Baku Bebas Air, Oli Pelumas &amp; Rongga Tertutup
            </h2>
            <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>
              Klik dan singkirkan <strong>3 potongan skrap berbahaya (berair, beroli, atau tertutup rapat)</strong> ke Drying Bin sebelum muatan dimasukkan ke tanur!
            </div>
          </div>

          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setScrapSortingModalOpen(false);
            }}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              color: '#e2e8f0',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕ Tutup (ESC)
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Why Must Scrap Be Free of Water & Lubricant Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '12px 14px',
            }}
          >
            <div style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                💧 Mengapa Wajib Bebas Air / Embun?
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>
                1 liter air yang tenggelam di dalam besi cair 1.500°C langsung menguap dan memuai <strong>1.600× lipat</strong> seketika, memicu <strong>Ledakan Uap Air (Steam Explosion)</strong>.
              </div>
            </div>

            <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>
                🛢️ Mengapa Wajib Bebas Oli &amp; Pelumas?
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>
                Oli hidrokarbon memicu semburan api dan terurai menjadi <strong>gas Hidrogen (H₂)</strong> terlarut yang menciptakan cacat <strong>porositas lubang jarum (pinhole)</strong> pada coran.
              </div>
            </div>

            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>
                🥫 Mengapa Wadah Tertutup Dilarang?
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>
                Udara/cairan yang terjebak di dalam pipa atau kaleng tertutup rapat akan bertekanan sangat tinggi saat dipanaskan hingga <strong>meledak seperti bom</strong> di dalam krusibel.
              </div>
            </div>
          </div>

          {/* 6 Scrap Samples Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '12px',
            }}
          >
            {SCRAP_SAMPLES.map((sample) => {
              const isQuarantined = quarantinedIds.includes(sample.id);
              return (
                <div
                  key={sample.id}
                  onClick={() => handleInspectSample(sample)}
                  style={{
                    background: isQuarantined
                      ? 'rgba(22, 163, 74, 0.14)'
                      : sample.isHazardous
                      ? 'rgba(127, 29, 29, 0.28)'
                      : 'rgba(15, 23, 42, 0.9)',
                    border: `1.5px solid ${
                      isQuarantined
                        ? '#22c55e'
                        : sample.isHazardous
                        ? '#ef4444'
                        : '#334155'
                    }`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: sample.isHazardous ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.18)',
                          color: sample.isHazardous ? '#fca5a5' : '#38bdf8',
                        }}
                      >
                        {sample.visualBadge}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700 }}>
                        {sample.weightKg}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                      {sample.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {sample.conditionSummary}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '4px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textAlign: 'center',
                      background: isQuarantined
                        ? '#15803d'
                        : sample.isHazardous
                        ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                        : 'rgba(30, 41, 59, 0.8)',
                      color: '#ffffff',
                      border: `1px solid ${
                        isQuarantined ? '#4ade80' : sample.isHazardous ? '#f87171' : '#475569'
                      }`,
                    }}
                  >
                    {isQuarantined
                      ? '✓ TELAH DIPINDAHKAN KE DRYING BIN'
                      : sample.isHazardous
                      ? '🗑️ KLIK: SINGKIRKAN KE DRYING BIN'
                      : '✓ SKRAP KERING & AMAN (SIAP PAKAI)'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Scientific Feedback Box */}
          {selectedExplanation && (
            <div
              style={{
                background: selectedExplanation.isHazard
                  ? 'rgba(245, 158, 11, 0.14)'
                  : 'rgba(34, 197, 94, 0.14)',
                border: `1.5px solid ${selectedExplanation.isHazard ? '#f59e0b' : '#22c55e'}`,
                borderRadius: '10px',
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: selectedExplanation.isHazard ? '#fde047' : '#4ade80',
                  marginBottom: '4px',
                }}
              >
                {selectedExplanation.title}
              </div>
              <div style={{ fontSize: '11.5px', color: '#f8fafc', lineHeight: 1.5 }}>
                {selectedExplanation.text}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#090d16',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: isAllHazardsRemoved ? '#4ade80' : '#fbbf24' }}>
            {isAllHazardsRemoved
              ? '✓ Seluruh 3 kontaminan berbahaya (air, oli pelumas, tabung tertutup) telah dipisahkan ke Drying Bin!'
              : `⚠️ Masih ada ${3 - removedHazardCount} skrap terkontaminasi di atas meja yang wajib disingkirkan.`}
          </div>

          <button
            disabled={!isAllHazardsRemoved}
            onClick={handleCompleteAndProceed}
            style={{
              background: isAllHazardsRemoved
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : '#1e293b',
              border: `1.5px solid ${isAllHazardsRemoved ? '#4ade80' : '#475569'}`,
              color: isAllHazardsRemoved ? '#052e16' : '#64748b',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '12.5px',
              fontWeight: 900,
              cursor: isAllHazardsRemoved ? 'pointer' : 'not-allowed',
            }}
          >
            {isAllHazardsRemoved
              ? '✓ NYATAKAN SKRAP 100% KERING & LANJUT KE PEMUATAN 3 TAHAP ▶'
              : 'SINGKIRKAN 3 KONTAMINAN TERLEBIH DAHULU'}
          </button>
        </div>
      </div>
    </div>
  );
};
