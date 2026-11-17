import React, { useEffect, useState } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

const CONTACT_EMAIL = 'mazfa201004@upi.edu';

export const AboutUsModal: React.FC = () => {
  const isAboutModalOpen = useSimStore((s) => s.isAboutModalOpen);
  const setAboutModalOpen = useSimStore((s) => s.setAboutModalOpen);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAboutModalOpen) {
      setCopied(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAboutModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAboutModalOpen, setAboutModalOpen]);

  if (!isAboutModalOpen) return null;

  const handleClose = () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    setAboutModalOpen(false);
  };

  const handleCopyEmail = async () => {
    inductionAudio.resume();
    inductionAudio.playClick();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-us-modal-title"
      onClick={handleClose}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10030,
        backgroundColor: 'rgba(4, 8, 17, 0.84)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) max(12px, env(safe-area-inset-right, 12px)) max(12px, env(safe-area-inset-bottom, 12px)) max(12px, env(safe-area-inset-left, 12px))',
        boxSizing: 'border-box',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '92dvh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1.5px solid #334155',
          borderRadius: '14px',
          padding: '20px',
          boxSizing: 'border-box',
          color: '#f8fafc',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid #334155',
            paddingBottom: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#7dd3fc',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Profil Akademik & Pengembangan Media
            </div>
            <h2
              id="about-us-modal-title"
              style={{
                margin: '4px 0 0',
                fontSize: '20px',
                fontWeight: 800,
                color: '#f8fafc',
                lineHeight: 1.25,
              }}
            >
              Tentang Kami
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup jendela Tentang Kami"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              padding: '0 14px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            Tutup
          </button>
        </div>

        {/* Developer Identity Card */}
        <section
          aria-label="Identitas Pengembang"
          style={{
            backgroundColor: '#162033',
            border: '1px solid #2b3c57',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#34d399',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Pengembang Media Pembelajaran
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
            M Azfa Dzaikra Zahi
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 20px',
              fontSize: '13.5px',
              color: '#cbd5e1',
              lineHeight: 1.5,
            }}
          >
            <span>
              <strong style={{ color: '#f8fafc' }}>NIM:</strong> 2204563
            </span>
            <span>
              <strong style={{ color: '#f8fafc' }}>Prodi:</strong> S1 - Pendidikan Teknik Mesin
            </span>
          </div>
        </section>

        {/* Academic Supervisors Grid */}
        <section
          aria-label="Identitas Dosen Pembimbing"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: '#162033',
              border: '1px solid #2b3c57',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#7dd3fc',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Pembimbing 1
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
              Prof. Dr. Amay Suherman, M.Pd.
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45 }}>
              <div>
                <strong style={{ color: '#f8fafc' }}>NIP:</strong> 195903251986011001
              </div>
              <div>
                <strong style={{ color: '#f8fafc' }}>Jabatan:</strong> Guru Besar
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#162033',
              border: '1px solid #2b3c57',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#7dd3fc',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Pembimbing 2
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
              Haipan Salam, M.Si., Ph.D.
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45 }}>
              <div>
                <strong style={{ color: '#f8fafc' }}>NIP:</strong> 198101102008011010
              </div>
              <div>
                <strong style={{ color: '#f8fafc' }}>Jabatan:</strong> Lektor Kepala
              </div>
            </div>
          </div>
        </section>

        {/* Institution & Feedback Footer Card */}
        <section
          aria-label="Institusi dan Kontak Kritik Saran"
          style={{
            backgroundColor: '#131d2f',
            border: '1px solid #2b3c57',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: '#ffffff' }}>
              Fakultas Pendidikan Teknik dan Industri
            </div>
            <div>Universitas Pendidikan Indonesia</div>
            <div style={{ color: '#cbd5e1', fontWeight: 700 }}>Tahun 2026</div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
              Kritik dan saran bisa disampaikan ke:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{
                  minHeight: '44px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  backgroundColor: '#0369a1',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #38bdf8',
                }}
              >
                {CONTACT_EMAIL}
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                style={{
                  minHeight: '44px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  backgroundColor: copied ? '#047857' : '#1e293b',
                  color: '#ffffff',
                  border: `1px solid ${copied ? '#34d399' : '#475569'}`,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {copied ? 'Tersalin' : 'Salin Email'}
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Close Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              minHeight: '44px',
              padding: '0 22px',
              borderRadius: '8px',
              backgroundColor: '#0369a1',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUsModal;
