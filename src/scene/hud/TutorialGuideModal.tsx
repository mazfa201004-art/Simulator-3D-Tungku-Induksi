import React, { useEffect, useState } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface GuideDetailItem {
  label: string;
  accentColor: string;
  description: string;
}

interface GuideSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  visualCaption: string;
  items: GuideDetailItem[];
}

const GUIDE_SLIDES: GuideSlide[] = [
  {
    id: 'analog',
    badge: 'Fitur 1 • Navigasi Berjalan',
    title: 'Fungsi & Letak Analog Virtual',
    subtitle: 'Kendali pergerakan operator menyusuri bengkel pengecoran logam.',
    image: '/guides/guide-analog.jpg',
    imageAlt: 'Peragaan penggunaan analog virtual lingkaran biru di pojok kiri bawah layar simulator',
    visualCaption: 'Ilustrasi peragaan: sentuh dan geser tombol analog di kiri bawah untuk berjalan.',
    items: [
      {
        label: 'Posisi Analog (HP / Layar Sentuh)',
        accentColor: '#38bdf8',
        description:
          'Berada di pojok kiri bawah layar agar mudah dijangkau ibu jari. Analog tetap bisa digerakkan dengan lancar meskipun jendela Panduan Praktikum sedang terbuka.',
      },
      {
        label: 'Cara Menggunakan',
        accentColor: '#34d399',
        description:
          'Dorong lingkaran biru ke atas untuk maju, ke bawah untuk mundur, atau ke kiri dan kanan untuk melangkah menyamping mengelilingi rak APD, bunker bahan, dan tungku induksi.',
      },
      {
        label: 'Kontrol Komputer (Desktop)',
        accentColor: '#facc15',
        description:
          'Gunakan tombol W A S D atau tombol panah keyboard untuk berjalan, dan tekan SPASI untuk melompat melewati rintangan rendah.',
      },
    ],
  },
  {
    id: 'swipe',
    badge: 'Fitur 2 • Kontrol Pandangan & Objek',
    title: 'Swipe Layar & Interaksi Objek 3D',
    subtitle: 'Menoleh ke sekeliling bengkel serta mengoperasikan peralatan kerja.',
    image: '/guides/guide-swipe.jpg',
    imageAlt: 'Peragaan gerakan jari mengusap layar untuk memutar kamera dan mengetuk panel 3D',
    visualCaption: 'Ilustrasi peragaan: usap area layar kanan/tengah untuk menoleh, lalu ketuk peralatan.',
    items: [
      {
        label: 'Swipe Layar (HP / Layar Sentuh)',
        accentColor: '#facc15',
        description:
          'Sentuh dan usap area layar di luar tombol analog ke kanan, kiri, atas, atau bawah untuk memutar pandangan kamera 360 derajat mengamati kondisi bengkel.',
      },
      {
        label: 'Ketuk / Tap Peralatan 3D',
        accentColor: '#34d399',
        description:
          'Dekati lalu ketuk langsung objek yang disorot seperti Rak APD, APAR, Lemari Panel Induksi, Krusibel, Bunker Bahan, Termometer, dan Cetakan Pasir untuk membuka aksi.',
      },
      {
        label: 'Kontrol Komputer (Mouse)',
        accentColor: '#38bdf8',
        description:
          'Tahan Klik Kanan sambil menggeser mouse untuk menoleh ke sekeliling, dan gunakan Klik Kiri untuk berinteraksi dengan objek maupun tombol panel.',
      },
    ],
  },
  {
    id: 'topbar',
    badge: 'Fitur 3 • Bar Kontrol Atas (HUD)',
    title: 'Fungsi Tombol-tombol di Atas Layar',
    subtitle: 'Akses cepat panduan praktikum, kualitas grafis, evaluasi nilai, dan telemetri.',
    image: '/guides/guide-topbar.jpg',
    imageAlt: 'Sorotan deretan tombol dan indikator status pada bar kontrol atas layar simulator',
    visualCaption: 'Ilustrasi peragaan: bar tombol kontrol utama di sisi paling atas layar simulasi.',
    items: [
      {
        label: 'TAHAP X/20 • Panduan Praktikum',
        accentColor: '#34d399',
        description:
          'Membuka atau menyembunyikan daftar 20 tahap praktikum SOP lengkap dengan status selesai dan petunjuk lokasi objek 3D.',
      },
      {
        label: 'GRAFIS (Ringan HP / Lengkap)',
        accentColor: '#38bdf8',
        description:
          'Mengalihkan mode Ringan agar berjalan halus di HP/laptop standar atau mode Lengkap untuk detail pabrik dan efek cahaya penuh.',
      },
      {
        label: 'RAPOR EVALUASI & ORDER',
        accentColor: '#7dd3fc',
        description:
          'RAPOR EVALUASI menampilkan rincian nilai praktikum (0-100 poin, KKM 75). ORDER menampilkan target material dan massa pesanan pengecoran.',
      },
      {
        label: 'Daya (kW), Air (Bar), Telemetri & Petunjuk',
        accentColor: '#fb923c',
        description:
          'Memantau daya listrik tungku dan tekanan air pendingin (minimal 2.5 Bar). Gunakan Tutup/Buka Telemetri untuk melihat grafik suhu serta tombol Petunjuk untuk membuka panduan ini lagi.',
      },
    ],
  },
  {
    id: 'crane-ladle',
    badge: 'Fitur 4 • Crane & Penuangan Logam Cair',
    title: 'Remot Overhead Crane & Kemudi Ladel',
    subtitle: 'Kontrol khusus pemindahan ladel dan pengaturan sudut penuangan.',
    image: '/guides/guide-crane-ladle.jpg',
    imageAlt: 'Peragaan remot pengendali crane oranye dan roda pengatur kemiringan ladel saat menuang',
    visualCaption: 'Ilustrasi peragaan: remot crane menggerakkan jembatan ladel, roda kemudi mengatur tuang.',
    items: [
      {
        label: 'Remot Overhead Crane (Terpisah dari Analog)',
        accentColor: '#fb923c',
        description:
          'Gunakan tombol pada remot oranye untuk menggerakkan crane ke kiri, kanan, maju, mundur, naik, atau turun. Analog kiri bawah tetap hanya untuk berjalan.',
      },
      {
        label: 'Roda Kemudi & Panel Ladel',
        accentColor: '#38bdf8',
        description:
          'Ketuk roda kemudi atau badan ladel kapan saja untuk membuka pengaturan Tuang (Pour) dan Tegak (Return), meskipun sedang tidak memegang remot crane.',
      },
      {
        label: 'Kunci Kamera & Parkir Kembali',
        accentColor: '#34d399',
        description:
          'Aktifkan opsi Kunci Kamera pada pop-up ladel agar layar HP tidak ikut bergerak saat menuang ke cetakan. Setelah selesai, kembalikan ladel ke dudukan awal.',
      },
    ],
  },
];

export const TutorialGuideModal: React.FC = () => {
  const isTutorialGuideOpen = useSimStore((s) => s.isTutorialGuideOpen);
  const setTutorialGuideOpen = useSimStore((s) => s.setTutorialGuideOpen);
  const setAboutModalOpen = useSimStore((s) => s.setAboutModalOpen);
  const isAppLaunched = useSimStore((s) => s.isAppLaunched);
  const launchSimulation = useSimStore((s) => s.launchSimulation);
  const performanceProfile = useSimStore((s) => s.performanceProfile);

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (isTutorialGuideOpen) {
      setSlideIndex(0);
    }
  }, [isTutorialGuideOpen]);

  useEffect(() => {
    if (!isTutorialGuideOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTutorialGuideOpen(false);
      } else if (e.key === 'ArrowRight') {
        setSlideIndex((prev) => Math.min(GUIDE_SLIDES.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialGuideOpen, setTutorialGuideOpen]);

  if (!isTutorialGuideOpen) return null;

  const currentSlide = GUIDE_SLIDES[slideIndex] || GUIDE_SLIDES[0];
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === GUIDE_SLIDES.length - 1;

  const handleClose = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setTutorialGuideOpen(false);
  };

  const handlePrev = () => {
    if (isFirst) return;
    inductionAudio.resume();
    inductionAudio.playClick();
    setSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    if (!isLast) {
      setSlideIndex((prev) => Math.min(GUIDE_SLIDES.length - 1, prev + 1));
    } else if (!isAppLaunched) {
      launchSimulation(performanceProfile);
    } else {
      setTutorialGuideOpen(false);
    }
  };

  const handleOpenAbout = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setAboutModalOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-guide-title"
      onClick={handleClose}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10010,
        backgroundColor: 'rgba(4, 8, 17, 0.84)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'max(10px, env(safe-area-inset-top, 10px)) max(12px, env(safe-area-inset-right, 12px)) max(10px, env(safe-area-inset-bottom, 10px)) max(12px, env(safe-area-inset-left, 12px))',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(920px, 100%)',
          maxHeight: '92dvh',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          border: '1.5px solid #334155',
          borderRadius: '14px',
          padding: '14px 16px',
          boxSizing: 'border-box',
          color: '#f8fafc',
          boxShadow: '0 22px 54px rgba(0, 0, 0, 0.72)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Top Modal Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            borderBottom: '1px solid #334155',
            paddingBottom: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 240px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#0c4a6e',
                  color: '#e0f2fe',
                  border: '1px solid #38bdf8',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  letterSpacing: '0.03em',
                }}
              >
                Petunjuk {slideIndex + 1} / {GUIDE_SLIDES.length}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#7dd3fc',
                }}
              >
                {currentSlide.badge}
              </span>
            </div>
            <h2
              id="tutorial-guide-title"
              style={{
                margin: '4px 0 0',
                fontSize: 'clamp(17px, 2.4vw, 21px)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
              }}
            >
              {currentSlide.title}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
              {currentSlide.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleOpenAbout}
              style={{
                minHeight: '44px',
                padding: '0 12px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tentang Kami
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Tutup petunjuk penggunaan"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '0 14px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: '#f8fafc',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Responsive Content Grid: side-by-side on landscape/desktop, stacked on narrow portrait */}
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '14px',
            alignItems: 'start',
          }}
        >
          {/* Left: Illustrated Visual Guide Card */}
          <figure
            style={{
              margin: 0,
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <img
              src={currentSlide.image}
              alt={currentSlide.imageAlt}
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                borderRadius: '6px',
                display: 'block',
                backgroundColor: '#0b1120',
              }}
            />
            <figcaption
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: 1.4,
              }}
            >
              {currentSlide.visualCaption}
            </figcaption>
          </figure>

          {/* Right: Structured Feature Callouts */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {currentSlide.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#162033',
                  border: '1px solid #2b3c57',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: item.accentColor,
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    lineHeight: 1.45,
                  }}
                >
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Stepper & Navigation Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            borderTop: '1px solid #334155',
            paddingTop: '10px',
            flexShrink: 0,
          }}
        >
          {/* Numbered Step Jump Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Pilih slide petunjuk">
            {GUIDE_SLIDES.map((slide, idx) => {
              const active = idx === slideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    inductionAudio.resume();
                    inductionAudio.playClick();
                    setSlideIndex(idx);
                  }}
                  aria-label={`Petunjuk ${idx + 1}: ${slide.title}`}
                  aria-current={active ? 'step' : undefined}
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    backgroundColor: active ? '#0369a1' : '#1e293b',
                    border: active ? '1.5px solid #38bdf8' : '1px solid #475569',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Prev / Next or Start Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              style={{
                minHeight: '44px',
                padding: '0 16px',
                borderRadius: '8px',
                backgroundColor: isFirst ? '#111827' : '#1e293b',
                border: `1px solid ${isFirst ? '#334155' : '#475569'}`,
                color: isFirst ? '#94a3b8' : '#f8fafc',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: isFirst ? 'not-allowed' : 'pointer',
                opacity: isFirst ? 0.65 : 1,
              }}
            >
              Sebelumnya
            </button>

            <button
              type="button"
              onClick={handleNext}
              style={{
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '8px',
                backgroundColor: isLast && !isAppLaunched ? '#047857' : '#0369a1',
                border: isLast && !isAppLaunched ? '1.5px solid #34d399' : '1.5px solid #38bdf8',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isLast
                ? isAppLaunched
                  ? 'Kembali ke Simulasi'
                  : 'Mulai Simulasi (Menuju Rak APD)'
                : 'Berikutnya'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialGuideModal;
