import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

const LEARNING_OBJECTIVES = [
  {
    number: '01',
    title: 'Keselamatan Kerja (K3)',
    accentColor: '#34d399',
    description:
      'Menerapkan pemeriksaan dan penggunaan Alat Pelindung Diri (APD) lengkap, kesiapan APAR, serta inspeksi kondisi krusibel sebelum mengoperasikan tanur induksi.',
  },
  {
    number: '02',
    title: 'Pengoperasian Panel Induksi & Peleburan',
    accentColor: '#38bdf8',
    description:
      'Mengoperasikan pompa pendingin air, mengendalikan daya listrik bertahap (10-150 kW), menakar komposisi bahan baku, dan memantau peleburan logam sesuai SOP.',
  },
  {
    number: '03',
    title: 'Prosedur Penuangan Logam Cair',
    accentColor: '#facc15',
    description:
      'Mengukur temperatur lebur dengan termometer celup, memindahkan dan menuangkan logam cair memakai overhead crane serta ladel ke cetakan pasir dengan aman hingga tahap shutdown.',
  },
];

export const LauncherScreen: React.FC = () => {
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const setPerformanceProfile = useSimStore((s) => s.setPerformanceProfile);
  const setAboutModalOpen = useSimStore((s) => s.setAboutModalOpen);
  const setTutorialGuideOpen = useSimStore((s) => s.setTutorialGuideOpen);

  const handleOpenAbout = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setAboutModalOpen(true);
  };

  const handleContinueToGuide = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setTutorialGuideOpen(true);
  };

  const handleSelectProfile = (profile: 'lite' | 'ultra') => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setPerformanceProfile(profile);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(7, 11, 20, 0.74)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#f8fafc',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding:
          'max(14px, env(safe-area-inset-top, 14px)) max(14px, env(safe-area-inset-right, 14px)) max(14px, env(safe-area-inset-bottom, 14px)) max(14px, env(safe-area-inset-left, 14px))',
        boxSizing: 'border-box',
      }}
    >
      <main
        style={{
          width: 'min(880px, 100%)',
          margin: 'auto',
          backgroundColor: '#0f172a',
          border: '1.5px solid #334155',
          borderRadius: '14px',
          padding: 'clamp(16px, 3vw, 28px)',
          boxSizing: 'border-box',
          boxShadow: '0 22px 56px rgba(0, 0, 0, 0.72)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Welcome Header & Main Title */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderBottom: '1px solid #2b3c57',
            paddingBottom: '14px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#7dd3fc',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Unit Tanur Induksi Kapasitas 500 kg • Teknik Pengecoran Logam
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(19px, 2.7vw, 27px)',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
              color: '#ffffff',
            }}
          >
            Media Pembelajaran Animasi Interaktif Simulator 3D Tungku Induksi Peleburan Logam
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: '#cbd5e1',
              lineHeight: 1.5,
            }}
          >
            Fakultas Pendidikan Teknik dan Industri, Universitas Pendidikan Indonesia. Simulasi praktikum virtual berbasis 20 adegan SOP industri dan evaluasi nilai otomatis (KKM 75 poin).
          </p>
        </header>

        {/* Learning Objectives Section */}
        <section aria-labelledby="tujuan-pembelajaran-heading" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '6px',
            }}
          >
            <h2
              id="tujuan-pembelajaran-heading"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '0.01em',
              }}
            >
              Tujuan Pembelajaran
            </h2>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              3 Kompetensi Inti Praktikum
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '10px',
            }}
          >
            {LEARNING_OBJECTIVES.map((obj) => (
              <div
                key={obj.number}
                style={{
                  backgroundColor: '#162033',
                  border: '1px solid #2b3c57',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#0f172a',
                      backgroundColor: obj.accentColor,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  >
                    {obj.number}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#ffffff',
                      lineHeight: 1.3,
                    }}
                  >
                    {obj.title}
                  </h3>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12.5px',
                    color: '#cbd5e1',
                    lineHeight: 1.48,
                  }}
                >
                  {obj.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Graphics Performance Profile Selector */}
        <section
          aria-label="Pilihan Mode Grafis Simulator"
          style={{
            backgroundColor: '#131c2e',
            border: '1px solid #2b3c57',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
              Pengaturan Grafis Perangkat
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Dapat diubah kembali dari bar atas saat simulasi berjalan
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '10px',
            }}
          >
            <button
              type="button"
              aria-pressed={performanceProfile === 'lite'}
              onClick={() => handleSelectProfile('lite')}
              style={{
                minHeight: '52px',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: performanceProfile === 'lite' ? '#0c4a6e' : '#162033',
                border: performanceProfile === 'lite' ? '2px solid #38bdf8' : '1px solid #334155',
                color: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Mode Ringan (Direkomendasikan untuk HP)
              </span>
              <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.35 }}>
                Ringan, fokus peralatan peleburan inti dan 1 cetakan pasir agar stabil 60 FPS.
              </span>
            </button>

            <button
              type="button"
              aria-pressed={performanceProfile === 'ultra'}
              onClick={() => handleSelectProfile('ultra')}
              style={{
                minHeight: '52px',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: performanceProfile === 'ultra' ? '#1e3a8a' : '#162033',
                border: performanceProfile === 'ultra' ? '2px solid #60a5fa' : '1px solid #334155',
                color: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Mode Lengkap (Direkomendasikan untuk PC)
              </span>
              <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.35 }}>
                Gedung bengkel 24x24m lengkap dengan dinding, kipas ventilasi, dan efek pencahayaan.
              </span>
            </button>
          </div>
        </section>

        {/* Action Buttons Footer */}
        <footer
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            borderTop: '1px solid #2b3c57',
            paddingTop: '14px',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.45, flex: '1 1 240px' }}>
            Tekan <strong style={{ color: '#ffffff' }}>Lanjutkan</strong> untuk melihat petunjuk bergambar fitur simulator sebelum masuk ke area kerja.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleOpenAbout}
              style={{
                minHeight: '44px',
                padding: '0 18px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1.5px solid #64748b',
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tentang Kami
            </button>

            <button
              type="button"
              onClick={handleContinueToGuide}
              style={{
                minHeight: '44px',
                padding: '0 24px',
                borderRadius: '8px',
                backgroundColor: '#0369a1',
                border: '1.5px solid #38bdf8',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Lanjutkan
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LauncherScreen;
