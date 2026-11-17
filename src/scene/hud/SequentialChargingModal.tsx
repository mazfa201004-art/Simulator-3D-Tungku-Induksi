import React, { useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { JOB_ORDER_PRESETS } from '../../sim/storyboardData';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * SequentialChargingModal (Adegan 13):
 * Simulasi Interaktif Pemuatan Bahan 3 Tahap ke Dalam Krusibel Tanur Induksi.
 * Dilengkapi Diagram Penampang Krusibel + Kumparan Tembaga secara real-time dan
 * penjelasan ilmiah fisika induksi elektromagnetik & metalurgi mengapa wajib dilakukan 3 tahap.
 */
export const SequentialChargingModal: React.FC = () => {
  const isSequentialChargingModalOpen = useSimStore((s) => s.isSequentialChargingModalOpen);
  const setSequentialChargingModalOpen = useSimStore((s) => s.setSequentialChargingModalOpen);
  const jobOrder = useSimStore((s) => s.jobOrder);
  const selectedFormula = useSimStore((s) => s.selectedFormula);
  const isAlloyVerified = useSimStore((s) => s.isAlloyVerified);
  const scrapSortedDry = useSimStore((s) => s.scrapSortedDry);
  const chargingStep = useSimStore((s) => s.chargingStep);
  const advanceChargingStep = useSimStore((s) => s.advanceChargingStep);
  const setMeltingJobSheetOpen = useSimStore((s) => s.setMeltingJobSheetOpen);
  const setScrapSortingModalOpen = useSimStore((s) => s.setScrapSortingModalOpen);

  useEffect(() => {
    if (!isSequentialChargingModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSequentialChargingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSequentialChargingModalOpen, setSequentialChargingModalOpen]);

  if (!isSequentialChargingModalOpen) return null;

  const currentOrder = JOB_ORDER_PRESETS[jobOrder];
  const f = currentOrder.formula;
  const isFormulaReady = selectedFormula === jobOrder && isAlloyVerified;

  const stages = [
    {
      step: 1,
      title: 'TAHAP 1 — Lapisan Dasar Krusibel (0% -> 55%): Balok Pig Iron (Starting Block)',
      massText: `Pig Iron Padat: ${f.pigIronKg} kg (${f.pigIronType})`,
      badgeColor: '#38bdf8',
      buttonLabel: '1. Masukkan Tahap 1: Pig Iron (Starting Block) ke Dasar Krusibel',
      whyTitle: 'Mengapa Pig Iron Padat Wajib Dimasukkan Paling Dasar (Tahap 1)?',
      whyPoints: [
        'Kopling Fluks Elektromagnetik Maksimal: Kumparan tembaga induksi menghasilkan rapat fluks magnetik (B) terkuat di bagian bawah-tengah krusibel. Menempatkan balok Pig Iron yang padat dan rapat di dasar memastikan arus pusar (Eddy Current I²R) langsung terbangkitkan secara optimal untuk membentuk kolam lelehan awal (molten heel).',
        'Titik Lebur Lebih Rendah (~1.150°C): Pig Iron memiliki kadar karbon tinggi (~4% C) sehingga mencair paling cepat di dasar krusibel dan mempercepat peleburan lapisan di atasnya.',
        'Perlindungan Lantai Refraktori: Menyusun balok rata di dasar mencegah benturan tajam potongan skrap yang dapat meretakkan lantai refraktori silika/alumina dan merusak sensor Ground Leakage.',
      ],
    },
    {
      step: 2,
      title: 'TAHAP 2 — Lapisan Tengah Krusibel (55% -> 95%): Steel Scrap & Return Scrap',
      massText: `Steel Scrap: ${f.steelScrapKg} kg + Return Scrap: ${f.returnScrapKg} kg`,
      badgeColor: '#f59e0b',
      buttonLabel: '2. Masukkan Tahap 2: Steel Scrap & Return Scrap di Atas Starting Block',
      whyTitle: 'Mengapa Steel Scrap & Return Scrap Dimasukkan pada Tahap Ke-2?',
      whyPoints: [
        'Mencegah Bahaya Fatal "Scrap Bridging" (Jembatan Skrap Menggantung): Potongan skrap baja dan saluran balik memiliki bentuk bercabang tidak beraturan. Jika dimasukkan paling bawah tanpa kolam dasar Pig Iron, potongan skrap mudah tersangkut dan mengelas satu sama lain membentuk jembatan menggantung.',
        'Mencegah Superheating & Jebolnya Dinding Krusibel: Saat terjadi bridging, bagian atas terlihat masih padat padahal cairan di bawah jembatan terperangkap dan mengalami panas berlebih (>1.750°C) yang dapat mengerosi dinding refraktori hingga bocor ke koil air pendingin!',
        'Pencairan Kontinu dari Bawah: Dengan berada di atas Pig Iron yang mulai mencair, bagian bawah skrap baja langsung terendam lelehan panas dan runtuh turun secara stabil.',
      ],
    },
    {
      step: 3,
      title: 'TAHAP 3 — Lapisan Atas / Kolam Panas (95% -> 100%): Carburizer & Ferroalloy',
      massText: `Carburizer: ${f.carburizerKg} kg • FeSi 75: ${f.feSiKg} kg${f.feMnKg ? ` • FeMn: ${f.feMnKg} kg` : ''}`,
      badgeColor: '#22c55e',
      buttonLabel: '3. Masukkan Tahap 3: Carburizer & Ferroalloy (FeSi, FeMn) ke Kolam Panas',
      whyTitle: 'Mengapa Carburizer & Ferroalloy Wajib Dimasukkan Terakhir (Tahap 3)?',
      whyPoints: [
        'Mencegah Oksidasi & Burn-Off Loss: Butiran grafit (Carburizer), Ferro-Silicon (FeSi 75), dan Ferro-Manganese (FeMn) berukuran kecil dan sangat reaktif terhadap oksigen. Jika ditaruh di dasar sejak awal, unsur-unsur mahal ini akan habis terbakar menjadi terak/abu sebelum besi mencair.',
        'Homogenisasi Cepat oleh Gaya Lorentz: Memasukkan bahan pemadu pada tahap ke-3 saat muatan utama mulai meleleh memungkinkan butiran langsung larut dan diaduk merata oleh gaya elektromagnetik Lorentz, sehingga efisiensi perolehan unsur (alloy recovery) > 90% akurat sesuai Job Order!',
      ],
    },
  ];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setSequentialChargingModalOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
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
          maxWidth: '980px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '2px solid #38bdf8',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.92)',
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
            background: 'linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)',
            borderBottom: '1px solid #1e293b',
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
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  color: '#7dd3fc',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.06em',
                }}
              >
                ADEGAN 13 • SIMULASI PELAPISAN MUATAN KRUSIBEL 3 TAHAP
              </span>
              <span
                style={{
                  backgroundColor: chargingStep >= 3 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  border: `1px solid ${chargingStep >= 3 ? '#22c55e' : '#f59e0b'}`,
                  color: chargingStep >= 3 ? '#4ade80' : '#fcd34d',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                PROGRES TAHAP: {chargingStep} / 3 ({chargingStep === 0 ? '0 kg' : chargingStep === 1 ? '138 kg' : chargingStep === 2 ? '238 kg' : '250 kg'})
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
              Urutan Pemuatan Bahan 3 Tahap ke Dalam Tanur Induksi ({currentOrder.id.replace('_', ' ')})
            </h2>
            <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>
              Pelajari alasan ilmiah fisika induksi dan masukkan setiap lapisan bahan secara berurutan dari <strong>Tahap 1 (Dasar)</strong> hingga <strong>Tahap 3 (Atas)</strong>.
            </div>
          </div>

          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setSequentialChargingModalOpen(false);
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

        {/* Prerequisite Warning if Scene 11 or 12 not done yet */}
        {(!isFormulaReady || !scrapSortedDry) && (
          <div
            style={{
              margin: '14px 22px 0 22px',
              padding: '10px 14px',
              background: 'rgba(245, 158, 11, 0.16)',
              border: '1.5px solid #f59e0b',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#fef08a', fontWeight: 700 }}>
              {!isFormulaReady
                ? '⚠️ Komposisi bahan (Adegan 11) belum ditimbang sesuai Job Order!'
                : '⚠️ Skrap belum disortir bebas air & pelumas di Drying Bin (Adegan 12)!'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isFormulaReady && (
                <button
                  onClick={() => {
                    setSequentialChargingModalOpen(false);
                    setMeltingJobSheetOpen(true);
                  }}
                  style={{
                    background: '#0284c7',
                    border: '1px solid #38bdf8',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Buka Timbangan Formulasi (Adegan 11)
                </button>
              )}
              {!scrapSortedDry && (
                <button
                  onClick={() => {
                    setSequentialChargingModalOpen(false);
                    setScrapSortingModalOpen(true);
                  }}
                  style={{
                    background: '#d97706',
                    border: '1px solid #fbbf24',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Buka Meja Sortir Skrap Kering (Adegan 12)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body: Left Interactive Crucible Cross-Section Diagram + Right 3 Stages Cards */}
        <div
          style={{
            padding: '16px 22px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          {/* LEFT: 2D Interactive Crucible Cross-Section & Induction Coil Flux Diagram */}
          <div
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em', textAlign: 'center' }}>
              PENAMPANG MELINTANG KRUSIBEL &amp; KOIL INDUKSI
            </div>

            <svg width="290" height="310" viewBox="0 0 290 310">
              {/* Outer Furnace Steel Shell */}
              <rect x="35" y="20" width="220" height="265" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="3" />

              {/* Copper Induction Coil Turns on Left & Right Walls */}
              {[48, 78, 108, 138, 168, 198, 228].map((cy, idx) => (
                <g key={`coil-${idx}`}>
                  {/* Left Copper Coil Turn */}
                  <circle cx="52" cy={cy} r="10" fill="#ea580c" stroke="#fdba74" strokeWidth="2" />
                  <circle cx="52" cy={cy} r="4" fill="#38bdf8" />
                  {/* Right Copper Coil Turn */}
                  <circle cx="238" cy={cy} r="10" fill="#ea580c" stroke="#fdba74" strokeWidth="2" />
                  <circle cx="238" cy={cy} r="4" fill="#38bdf8" />
                </g>
              ))}

              {/* Silica/Alumina Refractory Crucible Wall (Trapezoidal U-Shape) */}
              <polygon
                points="68,25 222,25 208,268 82,268"
                fill="#334155"
                stroke="#94a3b8"
                strokeWidth="3"
              />
              {/* Inner Crucible Cavity */}
              <polygon
                points="82,25 208,25 196,252 94,252"
                fill="#090d16"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* LAYER 1: BOTTOM — PIG IRON STARTING BLOCK (chargingStep >= 1) */}
              {chargingStep >= 1 ? (
                <g>
                  <polygon
                    points="89,155 201,155 196,251 94,251"
                    fill="rgba(2, 132, 199, 0.38)"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Solid Pig Iron Blocks */}
                  <rect x="98" y="218" width="44" height="26" rx="3" fill="#94a3b8" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="148" y="218" width="44" height="26" rx="3" fill="#94a3b8" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="102" y="188" width="40" height="25" rx="3" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.5" />
                  <rect x="146" y="188" width="42" height="25" rx="3" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.5" />
                  <text x="145" y="174" fill="#7dd3fc" fontSize="9.5" fontWeight="900" textAnchor="middle">
                    TAHAP 1: PIG IRON ({f.pigIronKg} KG)
                  </text>
                </g>
              ) : (
                <text x="145" y="210" fill="#475569" fontSize="9.5" fontWeight="700" textAnchor="middle">
                  [ Zona Dasar: Kosong ]
                </text>
              )}

              {/* LAYER 2: MIDDLE — STEEL SCRAP & RETURN SCRAP (chargingStep >= 2) */}
              {chargingStep >= 2 ? (
                <g>
                  <polygon
                    points="85,82 205,82 201,155 89,155"
                    fill="rgba(245, 158, 11, 0.32)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  {/* Irregular Scrap Shapes */}
                  <polygon points="96,146 135,134 128,118 94,126" fill="#d97706" stroke="#fde68a" strokeWidth="1.2" />
                  <polygon points="142,148 192,138 186,120 148,124" fill="#b45309" stroke="#fde68a" strokeWidth="1.2" />
                  <rect x="105" y="102" width="78" height="14" rx="2" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.2" />
                  <text x="145" y="96" fill="#fde047" fontSize="9.5" fontWeight="900" textAnchor="middle">
                    TAHAP 2: SKRAP ({f.steelScrapKg + f.returnScrapKg} KG)
                  </text>
                </g>
              ) : (
                <text x="145" y="122" fill="#475569" fontSize="9.5" fontWeight="700" textAnchor="middle">
                  [ Zona Tengah: Kosong ]
                </text>
              )}

              {/* LAYER 3: TOP — CARBURIZER & FERROALLOY (chargingStep >= 3) */}
              {chargingStep >= 3 ? (
                <g>
                  <polygon
                    points="83,42 207,42 205,82 85,82"
                    fill="rgba(34, 197, 94, 0.34)"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  {/* Alloy & Carbon Granules */}
                  {[98, 114, 130, 146, 162, 178, 192].map((gx, gi) => (
                    <circle
                      key={`gran-${gi}`}
                      cx={gx}
                      cy={66 + (gi % 2) * 6}
                      r="5"
                      fill={gi % 2 === 0 ? '#18181b' : '#4ade80'}
                      stroke="#bbf7d0"
                      strokeWidth="1"
                    />
                  ))}
                  <text x="145" y="56" fill="#86efac" fontSize="9" fontWeight="900" textAnchor="middle">
                    TAHAP 3: KARBON &amp; FERROALLOY
                  </text>
                </g>
              ) : (
                <text x="145" y="65" fill="#475569" fontSize="9.5" fontWeight="700" textAnchor="middle">
                  [ Zona Atas: Kosong ]
                </text>
              )}

              {/* Bottom Ground Leakage Sensor Probe */}
              <line x1="145" y1="252" x2="145" y2="282" stroke="#22c55e" strokeWidth="3" />
              <text x="145" y="298" fill="#4ade80" fontSize="9" fontWeight="bold" textAnchor="middle">
                ELEKTRODA GROUND LEAKAGE &amp; KOIL PENDINGIN AIR
              </text>
            </svg>

            <div
              style={{
                fontSize: '11px',
                color: '#cbd5e1',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '8px 10px',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: '#facc15' }}>Prinsip Inti Tanur Induksi:</strong> Berbeda dengan tanur kupola, tanur induksi memanaskan logam melalui <strong>induksi fluks magnetik</strong> dari dinding koil tembaga. Urutan kepadatan muatan dari bawah ke atas menentukan efisiensi peleburan dan keselamatan dinding krusibel.
            </div>
          </div>

          {/* RIGHT: 3 Interactive Sequential Stages with Scientific Explanations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stages.map((st) => {
              const isCompleted = chargingStep >= st.step;
              const isUnlocked = st.step === 1 || chargingStep >= st.step - 1;

              return (
                <div
                  key={st.step}
                  style={{
                    background: isCompleted
                      ? 'rgba(22, 163, 74, 0.12)'
                      : isUnlocked
                      ? 'rgba(15, 23, 42, 0.95)'
                      : 'rgba(9, 13, 22, 0.7)',
                    border: `1.5px solid ${
                      isCompleted ? '#22c55e' : isUnlocked ? st.badgeColor : '#334155'
                    }`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    opacity: isUnlocked ? 1 : 0.68,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
                      {st.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: isCompleted ? '#4ade80' : st.badgeColor,
                        background: 'rgba(15, 23, 42, 0.8)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${isCompleted ? '#22c55e' : st.badgeColor}`,
                      }}
                    >
                      {st.massText}
                    </span>
                  </div>

                  {/* Scientific Explanation Box */}
                  <div
                    style={{
                      background: '#090d16',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#fde047', marginBottom: '4px' }}>
                      🔬 {st.whyTitle}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.42 }}>
                      {st.whyPoints.map((pt, idx) => (
                        <li key={idx} style={{ marginBottom: '3px' }}>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stage Execution Button */}
                  <button
                    disabled={!isUnlocked || isCompleted}
                    onClick={() => advanceChargingStep(st.step)}
                    style={{
                      minHeight: '40px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: isCompleted
                        ? 'rgba(22, 163, 74, 0.28)'
                        : isUnlocked
                        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                        : '#1e293b',
                      border: `1.5px solid ${
                        isCompleted ? '#4ade80' : isUnlocked ? '#38bdf8' : '#475569'
                      }`,
                      color: isCompleted ? '#4ade80' : isUnlocked ? '#ffffff' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: isUnlocked && !isCompleted ? 'pointer' : 'default',
                    }}
                  >
                    {isCompleted
                      ? `✓ TAHAP ${st.step} TELAH DIMASUKKAN KE KRUSIBEL`
                      : isUnlocked
                      ? `⚡ ${st.buttonLabel}`
                      : `🔒 Selesaikan Tahap ${st.step - 1} Terlebih Dahulu`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            backgroundColor: '#090d16',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: chargingStep >= 3 ? '#4ade80' : '#fbbf24' }}>
            {chargingStep >= 3
              ? '✓ Seluruh 3 tahap pemuatan (250 kg) telah masuk ke dalam krusibel! Sekarang naikkan daya ke 150 kW di Kabinet Inverter (Adegan 14).'
              : `Lakukan pemuatan berurutan Tahap 1 -> Tahap 2 -> Tahap 3 hingga krusibel terisi 250 kg.`}
          </div>

          <button
            onClick={() => {
              inductionAudio.resume();
              inductionAudio.playClick();
              setSequentialChargingModalOpen(false);
            }}
            style={{
              background: chargingStep >= 3
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : '#1e293b',
              border: `1.5px solid ${chargingStep >= 3 ? '#4ade80' : '#475569'}`,
              color: chargingStep >= 3 ? '#052e16' : '#e2e8f0',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {chargingStep >= 3 ? '✓ SELESAI & MENUJU PELEBURAN 150 KW' : 'Tutup Jendela'}
          </button>
        </div>
      </div>
    </div>
  );
};
