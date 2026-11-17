import { SimulationPhase } from '../sim/phase';

export interface PhaseInfoContent {
  title: string;
  subtitle: string;
  description: string;
  keyConcepts: { title: string; detail: string }[];
  instruction: string;
}

export const PHASE_CONTENT_ID: Record<SimulationPhase, PhaseInfoContent> = {
  Idle: {
    title: 'Fase Siaga (Idle / Suhu Ruang)',
    subtitle: 'Tungku Induksi Siap Beroperasi',
    description:
      'Tungku peleburan induksi memanfaatkan induksi elektromagnetik untuk memanaskan dan meleburkan logam tanpa kontak nyala api langsung.',
    keyConcepts: [
      {
        title: 'Hukum Faraday',
        detail: 'Perubahan medan magnet menghasilkan gaya gerak listrik (GGL) pada konduktor.',
      },
      {
        title: 'Bebas Kontaminasi',
        detail: 'Peleburan induksi tidak menghasilkan gas buang hasil pembakaran di dalam logam.',
      },
      {
        title: 'Suhu Awal',
        detail: 'Muatan aluminium 500 kg berada pada suhu ruang 25 °C.',
      },
    ],
    instruction: 'Putar Kenop Daya (Power) di panel mesin, lalu tekan Tombol Mulai (Start) 3D.',
  },

  Heating: {
    title: 'Fase Pemanasan (Heating)',
    subtitle: 'Arus Eddy & Efek Joule',
    description:
      'Arus bolak-balik frekuensi tinggi mengalir melalui kumparan tembaga, menciptakan medan magnetik berosilasi cepat yang menembus krusibel.',
    keyConcepts: [
      {
        title: 'Arus Eddy (Eddy Currents)',
        detail: 'Medan magnet menginduksi arus pusar melingkar di dalam bongkahan logam padat.',
      },
      {
        title: 'Efek Joule (Joule Heating)',
        detail: 'Energi listrik diubah menjadi panas akibat hambatan dalam logam (P = I²R).',
      },
      {
        title: 'Efek Kulit (Skin Effect)',
        detail: 'Arus frekuensi tinggi terkonsentrasi di lapisan luar logam, memanaskan dengan cepat.',
      },
    ],
    instruction: 'Amati kumparan mulai berpijar dan suhu muatan logam meningkat pesat menuju 660 °C.',
  },

  Melting: {
    title: 'Fase Peleburan (Melting)',
    subtitle: 'Plateau Termal & Kalor Laten Peleburan',
    description:
      'Ketika suhu mencapai 660 °C (titik lebur aluminium), terjadi fenomena fisika krusial: kenaikan suhu terhenti sementara (plateau).',
    keyConcepts: [
      {
        title: 'Kalor Laten (L = 397 kJ/kg)',
        detail: 'Seluruh energi panas diserap untuk memutus ikatan kisi kristal tanpa menaikkan suhu.',
      },
      {
        title: 'Perubahan Wujud',
        detail: 'Bongkahan padat menyusut dan meleleh menjadi cairan logam pijar.',
      },
      {
        title: 'Pengadukan Elektromagnetik',
        detail: 'Gaya Lorentz mengaduk logam cair secara alami sehingga homogenitas sangat merata.',
      },
    ],
    instruction: 'Perhatikan grafik T-t: kurva mendatar sempurna selama proses peleburan berlangsung!',
  },

  Liquid: {
    title: 'Fase Cair Penuh / Superheating (Liquid)',
    subtitle: 'Logam Cair Homogen & Kesiapan Tuang',
    description:
      'Seluruh muatan padat telah mencair sempurna. Pemanasan lanjutan menaikkan suhu di atas titik lebur (superheating) untuk persiapan penuangan.',
    keyConcepts: [
      {
        title: 'Superheating',
        detail: 'Peningkatan suhu di atas titik cair untuk menjaga fluiditas saat transfer ke ladle.',
      },
      {
        title: 'Pengadukan Lorentz',
        detail: 'Medan magnetik frekuensi menengah mempertahankan sirkulasi adukan alami.',
      },
      {
        title: 'Kesiapan Tapping',
        detail: 'Logam cair siap dituang (tapping) ke ladle atau cetakan coran.',
      },
    ],
    instruction: 'Pantau suhu pengetapan dengan pirometer celup sebelum memiringkan tanur untuk penuangan.',
  },

  Cooling: {
    title: 'Fase Pendinginan (Cooling)',
    subtitle: 'Disipasi Panas & Pembekuan Reversibel',
    description:
      'Daya kumparan dimatikan. Logam melepaskan kalor ke lingkungan melalui konveksi udara dan radiasi termal radiatif (Stefan-Boltzmann).',
    keyConcepts: [
      {
        title: 'Radiasi Termal (T⁴)',
        detail: 'Pada suhu tinggi, laju pendinginan sangat cepat akibat radiasi radiatif q ∝ (T⁴ - Tamb⁴).',
      },
      {
        title: 'Plateau Pembekuan',
        detail: 'Saat membeku di 660 °C, pelepasan kalor laten kembali menahan suhu sementara waktu.',
      },
      {
        title: 'Sifat Reversibel',
        detail: 'Anda dapat menaikkan daya dan menekan Mulai kapan saja untuk memanaskan kembali.',
      },
    ],
    instruction: 'Pijar logam meredup seiring suhu turun kembali menuju suhu lingkungan.',
  },
};
