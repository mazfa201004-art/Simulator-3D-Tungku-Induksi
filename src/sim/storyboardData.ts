import { CameraPreset } from '../store/useSimStore';

export type JobOrderType = 'FC_150' | 'FC_250' | 'FC_300' | 'FCD_450' | 'FCD_500';

export interface JobOrderDetails {
  id: JobOrderType;
  code: string;
  title: string;
  productName: string;
  quantity: number;
  materialStandard: string;
  targetTempC: number;
  targetToleranceC: number;
  superheatingNote: string;
  moldLabel: string;
  formula: {
    pigIronKg: number;
    pigIronType: string;
    steelScrapKg: number;
    steelScrapType: string;
    returnScrapKg: number;
    returnScrapType: string;
    carburizerKg: number;
    feSiKg: number;
    feMnKg?: number;
    feSiMgLadleKg?: number;
    totalKg: number;
  };
}

export const JOB_ORDER_PRESETS: Record<JobOrderType, JobOrderDetails> = {
  FC_150: {
    id: 'FC_150',
    code: 'JO-2026-FC150',
    title: 'Paket Order 1: Besi Cor Kelabu (FC 150)',
    productName: 'Piringan Pulley V-Belt',
    quantity: 60,
    materialStandard: 'JIS G5501 FC 150 (Grey Cast Iron)',
    targetTempC: 1390,
    targetToleranceC: 20,
    superheatingNote: 'Fluiditas sangat tinggi, pendinginan seragam untuk mencegah tegangan sisa.',
    moldLabel: 'CETAKAN PULLEY V-BELT - FC 150',
    formula: {
      pigIronKg: 80,
      pigIronType: 'Pig Iron Foundry',
      steelScrapKg: 80,
      steelScrapType: 'Steel Scrap (Skrap Baja Lunak)',
      returnScrapKg: 87,
      returnScrapType: 'Return Scrap FC',
      carburizerKg: 2.0,
      feSiKg: 1.0,
      totalKg: 250,
    },
  },
  FC_250: {
    id: 'FC_250',
    code: 'JO-2026-FC250',
    title: 'Paket Order 2: Besi Cor Kelabu (FC 250)',
    productName: 'Impeller Pompa Sentrifugal',
    quantity: 50,
    materialStandard: 'JIS G5501 FC 250 (Grey Cast Iron)',
    targetTempC: 1420,
    targetToleranceC: 20,
    superheatingNote: 'Fluiditas grafit lamelar tinggi, langsung siap tapping ke ladel penuang.',
    moldLabel: 'CETAKAN IMPELLER POMPA - FC 250',
    formula: {
      pigIronKg: 75,
      pigIronType: 'Pig Iron Foundry',
      steelScrapKg: 100,
      steelScrapType: 'Steel Scrap (Skrap Baja)',
      returnScrapKg: 70,
      returnScrapType: 'Return Scrap FC',
      carburizerKg: 3.0,
      feSiKg: 1.5,
      feMnKg: 0.5,
      totalKg: 250,
    },
  },
  FC_300: {
    id: 'FC_300',
    code: 'JO-2026-FC300',
    title: 'Paket Order 3: Besi Cor Kelabu Mutu Tinggi (FC 300)',
    productName: 'Tromol Rem Truk (Brake Drum)',
    quantity: 35,
    materialStandard: 'JIS G5501 FC 300 (Pearlitic Grey Iron)',
    targetTempC: 1450,
    targetToleranceC: 20,
    superheatingNote: 'Kekuatan tarik min 300 MPa & ketahanan aus termal tinggi, skrap baja dominan.',
    moldLabel: 'CETAKAN TROMOL REM - FC 300',
    formula: {
      pigIronKg: 65,
      pigIronType: 'Pig Iron Foundry',
      steelScrapKg: 120,
      steelScrapType: 'Steel Scrap (Baja Karbon Menengah)',
      returnScrapKg: 60,
      returnScrapType: 'Return Scrap FC',
      carburizerKg: 3.5,
      feSiKg: 1.0,
      feMnKg: 0.5,
      totalKg: 250,
    },
  },
  FCD_450: {
    id: 'FCD_450',
    code: 'JO-2026-FCD450',
    title: 'Paket Order 4: Besi Cor Ulet Ferritik (FCD 450)',
    productName: 'Bracket Suspensi Otomotif',
    quantity: 40,
    materialStandard: 'JIS G5502 FCD 450 (Ductile Iron)',
    targetTempC: 1510,
    targetToleranceC: 20,
    superheatingNote: 'Keuletan tinggi (elongasi min 10%), superheating untuk reaksi inokulan FeSiMg di ladel.',
    moldLabel: 'CETAKAN BRACKET SUSPENSI - FCD 450',
    formula: {
      pigIronKg: 95,
      pigIronType: 'Sorelmetal / High-Purity Pig Iron',
      steelScrapKg: 85,
      steelScrapType: 'Steel Scrap Rendah S/P',
      returnScrapKg: 65,
      returnScrapType: 'Return Scrap FCD',
      carburizerKg: 3.0,
      feSiKg: 1.0,
      feSiMgLadleKg: 2.2,
      totalKg: 250,
    },
  },
  FCD_500: {
    id: 'FCD_500',
    code: 'JO-2026-FCD500',
    title: 'Paket Order 5: Besi Cor Nodular (FCD 500)',
    productName: 'Roda Gigi Transmisi',
    quantity: 20,
    materialStandard: 'JIS G5502 FCD 500 (Ductile / Nodular Cast Iron)',
    targetTempC: 1520,
    targetToleranceC: 20,
    superheatingNote: 'Superheating +100°C wajib untuk kompensasi penurunan suhu saat reaksi nodularisasi FeSiMg di ladel.',
    moldLabel: 'CETAKAN RODA GIGI - FCD 500',
    formula: {
      pigIronKg: 90,
      pigIronType: 'Sorelmetal / High-Purity Pig Iron',
      steelScrapKg: 90,
      steelScrapType: 'Steel Scrap Rendah S/P',
      returnScrapKg: 63,
      returnScrapType: 'Return Scrap FCD',
      carburizerKg: 3.2,
      feSiKg: 1.3,
      feSiMgLadleKg: 2.5,
      totalKg: 250,
    },
  },
};

export interface StoryboardScene {
  id: string;
  number: number;
  act: number;
  actTitle: string;
  sceneCode: string;
  title: string;
  sopReference: string;
  instruction: string;
  objective: string;
  clue: string;
  metallurgyNote: string;
  targetPreset: CameraPreset;
  actionKey: string;
  scoreCategory: 'k3JobOrder' | 'coolingSequential' | 'powerPreheat' | 'formulaMelting' | 'qualityPouring' | 'shutdownCooling';
  points: number;
}

export const STORYBOARD_SCENES: StoryboardScene[] = [
  // ACT 01: PERSIAPAN K3, ANALISIS JOB ORDER CUSTOMER & INSPEKSI TANUR
  {
    id: 'sc-1.1',
    number: 1,
    act: 1,
    actTitle: 'ACT 01: K3, JOB ORDER & INSPEKSI',
    sceneCode: 'SCENE 1.1',
    title: 'Pemilihan & Penggunaan 5 APD Peleburan Logam',
    sopReference: 'Keselamatan & Kesehatan Kerja (K3) Pengecoran Logam',
    instruction: 'Kenakan 5 APD wajib di Pojok Penyimpanan APD: Helm safety kuning, Masker respirator + kacamata, Wearpack tahan panas, Sarung tangan, dan Sepatu safety.',
    objective: 'Seluruh 5 APD keselamatan peleburan terpasang lengkap [5/5] dan peringatan DANGER K3 hilang.',
    clue: 'Klik langsung setiap item APD pada Rak Pojok APD di sudut bengkel hingga lengkap 5/5.',
    metallurgyNote: 'Perlindungan diri mutlak dari radiasi panas inframerah, debu silika, dan bahaya percikan logam cair hingga 1550°C.',
    targetPreset: 'ppe-rack',
    actionKey: 'action_ppe',
    scoreCategory: 'k3JobOrder',
    points: 4,
  },
  {
    id: 'sc-1.2',
    number: 2,
    act: 1,
    actTitle: 'ACT 01: K3, JOB ORDER & INSPEKSI',
    sceneCode: 'SCENE 1.2',
    title: 'Analisis & Penyematan Tiket Pesanan Customer',
    sopReference: 'Identifikasi Spesifikasi Job Order & Target Komposisi',
    instruction: 'Ambil Kertas Job Order di meja samping APAR, pelajari spesifikasi dan komposisi bahan di sebelah kanan layar, lalu sematkan ke HUD.',
    objective: 'Tiket Pesanan Customer aktif dan disematkan ke bilah HUD.',
    clue: 'Klik Kertas Job Order di atas meja samping APAR (Pojok APD/K3) atau tombol ORDER di Header, lalu tekan Sematkan ke HUD.',
    metallurgyNote: 'Job Order menentukan formula bahan muatan 250 kg serta target suhu tapping (FC: 1390-1450°C / FCD: 1510-1520°C).',
    targetPreset: 'ppe-rack',
    actionKey: 'action_job_order',
    scoreCategory: 'k3JobOrder',
    points: 4,
  },
  {
    id: 'sc-1.3',
    number: 3,
    act: 1,
    actTitle: 'ACT 01: K3, JOB ORDER & INSPEKSI',
    sceneCode: 'SCENE 1.3',
    title: 'Inspeksi Krusibel, Grounding & 1 Cetakan Pasir',
    sopReference: 'Pemeriksaan Integritas Refraktori Krusibel & Cetakan Pasir',
    instruction: 'Ambil Kertas Laporan Inspeksi di meja samping APAR, lalu periksa 3 titik krusibel (dasar, dinding, bibir) serta 1 unit cetakan pasir tunggal.',
    objective: 'Lining krusibel aman (94%), grounding normal, cetakan pasir siap tuang.',
    clue: 'Ambil Kertas Laporan Inspeksi di meja samping APAR sehingga kertas dipegang di kanan layar, lalu pindai 4 titik krusibel & cetakan pasir.',
    metallurgyNote: 'Pemeriksaan integritas refraktori mencegah logam cair menembus ke kumparan tembaga primer.',
    targetPreset: 'furnace',
    actionKey: 'action_inspection',
    scoreCategory: 'k3JobOrder',
    points: 4,
  },
  {
    id: 'sc-1.4',
    number: 4,
    act: 1,
    actTitle: 'ACT 01: K3, JOB ORDER & INSPEKSI',
    sceneCode: 'SCENE 1.4',
    title: 'Verifikasi Emergency Stop & Kesiapan APAR',
    sopReference: 'Pemeriksaan Sistem Proteksi Darurat & APAR',
    instruction: 'Periksa tabung APAR di dinding (manometer di Zona Hijau 16.5 Bar) serta pastikan tombol E-Stop pada kabinet dalam kondisi bebas (unlatched).',
    objective: 'Tekanan APAR terverifikasi 16.5 Bar (Zona Hijau) dan sistem darurat siap operasi.',
    clue: 'Klik tabung APAR di dinding untuk membuka Kaca Pembesar Manometer APAR (16.5 Bar) dan klik tombol Verifikasi.',
    metallurgyNote: 'Interlock keselamatan wajib aktif sebelum tegangan listrik utama disalurkan ke sistem.',
    targetPreset: 'cabinet',
    actionKey: 'action_estop_apar',
    scoreCategory: 'k3JobOrder',
    points: 3,
  },

  // ACT 02: START-UP UTILITAS & SISTEM PENDINGIN
  {
    id: 'sc-2.1',
    number: 5,
    act: 2,
    actTitle: 'ACT 02: START-UP UTILITAS & COOLING',
    sceneCode: 'SCENE 2.1',
    title: 'Menyalakan Listrik Utama pada Panel Breaker',
    sopReference: 'Tahap 2.1 • Aktivasi Suplai Listrik Panel Utama',
    instruction: 'Naikkan tuas handle MCCB utama pada Box Panel Breaker Listrik Utama di dinding dekat Pojok APD.',
    objective: 'Listrik panel utama menyala (380V), lampu 3 fasa R-S-T aktif.',
    clue: 'Klik tuas pada Box Panel Breaker Listrik Utama di dinding belakang untuk menaikkan tuas ke posisi ON.',
    metallurgyNote: 'Menyalurkan suplai tegangan primer gardu industri ke kabinet konversi frekuensi tanur.',
    targetPreset: 'utility-panels',
    actionKey: 'action_panel_breaker',
    scoreCategory: 'coolingSequential',
    points: 4,
  },
  {
    id: 'sc-2.2',
    number: 6,
    act: 2,
    actTitle: 'ACT 02: START-UP UTILITAS & COOLING',
    sceneCode: 'SCENE 2.2',
    title: 'Menghidupkan Cooling Tower (Naikkan Tuas ke Atas)',
    sopReference: 'Tahap 2.2 • Pengoperasian Menara Pendingin (Cooling Tower)',
    instruction: 'Naikkan tuas ke atas pada Box Saklar Cooling Tower yang berada di sebelah kanan Rak APD.',
    objective: 'Tuas Box Cooling Tower berada di posisi ON, cooling tower beroperasi.',
    clue: 'Klik Box Tuas Saklar Cooling Tower di sebelah Rak APD untuk menaikkan tuasnya ke posisi ON.',
    metallurgyNote: 'Menjamin pelepasan kalor pendinginan air sirkulasi koil ke atmosfer terbuka.',
    targetPreset: 'utility-panels',
    actionKey: 'action_cooling_tower',
    scoreCategory: 'coolingSequential',
    points: 4,
  },
  {
    id: 'sc-2.3',
    number: 7,
    act: 2,
    actTitle: 'ACT 02: START-UP UTILITAS & COOLING',
    sceneCode: 'SCENE 2.3',
    title: 'Menghidupkan Pompa Cooling & Verifikasi Tekanan Air',
    sopReference: 'Tahap 2.3 • Sirkulasi Pompa Pendingin & Tekanan Air',
    instruction: 'Naikkan tuas pada Box Saklar Pompa Sistem Cooling di dinding dan pastikan manometer air >= 2,5 Bar.',
    objective: 'Pompa sirkulasi air aktif, jarum manometer di samping box stabil di 3,2 Bar (Aman).',
    clue: 'Klik Box Tuas Saklar Pompa Sistem Cooling di sebelah kanan Box Cooling Tower dan amati Manometer Air.',
    metallurgyNote: 'INTERLOCK KRITIS: Tekanan air pendingin < 2,5 Bar akan memicu trip proteksi agar koil tembaga tidak leleh.',
    targetPreset: 'utility-panels',
    actionKey: 'action_cooling_pump',
    scoreCategory: 'coolingSequential',
    points: 7,
  },

  // ACT 03: AKTIVASI DAYA TUNGKU INDUKSI & PRE-HEATING
  {
    id: 'sc-3.1',
    number: 8,
    act: 3,
    actTitle: 'ACT 03: AKTIVASI DAYA & PRE-HEATING',
    sceneCode: 'SCENE 3.1',
    title: 'Memutar Saklar Selektor Control Power ke Kanan',
    sopReference: 'Tahap 3.1 • Aktivasi Sirkuit Kendali Kabinet',
    instruction: 'Putar kenop saklar Control Power ke arah kanan (searah jarum jam 90°).',
    objective: 'Sirkuit kendali kontrol aktif (voltmeter 380V ON).',
    clue: 'Putar switch selektor Control Power di panel kendali ke posisi ON.',
    metallurgyNote: 'Mengalirkan daya listrik kendali ke sistem relay proteksi dan inverter SCR.',
    targetPreset: 'cabinet',
    actionKey: 'action_control_power',
    scoreCategory: 'powerPreheat',
    points: 6,
  },
  {
    id: 'sc-3.2',
    number: 9,
    act: 3,
    actTitle: 'ACT 03: AKTIVASI DAYA & PRE-HEATING',
    sceneCode: 'SCENE 3.2',
    title: 'Menyalakan Inverter via Tombol Hijau AC ON',
    sopReference: 'Tahap 3.2 • Penyalaan Inverter Frekuensi Menengah',
    instruction: 'Tekan push-button hijau AC ON (Sirkuit AC No. 1) untuk menyalakan osilasi inverter.',
    objective: 'Tombol AC ON hijau menyala, inverter berosilasi RUN / OSCILLATING.',
    clue: 'Tekan tombol hijau AC ON pada konsol kontrol operator tanur.',
    metallurgyNote: 'Rangkaian thyristor mulai mengonversi DC ke frekuensi menengah 1000 Hz.',
    targetPreset: 'cabinet',
    actionKey: 'action_ac_on',
    scoreCategory: 'powerPreheat',
    points: 5,
  },
  {
    id: 'sc-3.3',
    number: 10,
    act: 3,
    actTitle: 'ACT 03: AKTIVASI DAYA & PRE-HEATING',
    sceneCode: 'SCENE 3.3',
    title: 'Pemanasan Awal (Pre-heating) Potensio Mulai dari 10 kW',
    sopReference: 'Tahap 3.3 • Pemanasan Awal Refraktori (Pre-heating)',
    instruction: 'Atur potensio kW tepat ke 10 kW untuk pemanasan awal dinding krusibel (15 detik).',
    objective: 'Pre-heating 10 kW selesai tanpa memicu thermal shock pada refraktori.',
    clue: 'Geser slider daya potensiometer ke 10 kW dan tunggu timer hitung mundur selesai.',
    metallurgyNote: 'Pemanasan bertahap mencegah keretakan akibat kejutan termal (thermal shock) pada lining baru/dingin.',
    targetPreset: 'cabinet',
    actionKey: 'action_preheat_potensio',
    scoreCategory: 'powerPreheat',
    points: 4,
  },

  // ACT 04: FORMULA BAHAN, CHARGING & PELEBURAN
  {
    id: 'sc-4.1',
    number: 11,
    act: 4,
    actTitle: 'ACT 04: FORMULA, CHARGING & PELEBURAN',
    sceneCode: 'SCENE 4.1',
    title: 'Input Komposisi Bahan Manual Sesuai Tiket Job Order',
    sopReference: 'Tahap 4.1 • Perhitungan & Input Komposisi Muatan (250 kg)',
    instruction: 'Berjalan ke Depo Bahan Baku, klik boks bahan atau timbangan lantai, baca Tiket Job Order aktif Anda, lalu ketikkan berat (kg) tiap bahan dasar dan paduan satu per satu.',
    objective: 'Komposisi bahan dasar dan bahan paduan terverifikasi sesuai spesifikasi Job Order aktif.',
    clue: 'Klik Boks Bahan Baku atau Timbangan Lantai di Depo Bahan Baku untuk membuka Lembar Formulasi Muatan, ketikkan berat kg masing-masing bahan sesuai Job Order, lalu klik Verifikasi & Siapkan Bahan.',
    metallurgyNote: 'Ketepatan proporsi Pig Iron, Skrap Baja, dan Return Scrap menentukan struktur grafit dan kontrol kadar pengotor.',
    targetPreset: 'depot',
    actionKey: 'action_select_formula',
    scoreCategory: 'formulaMelting',
    points: 6,
  },
  {
    id: 'sc-4.2',
    number: 12,
    act: 4,
    actTitle: 'ACT 04: FORMULA, CHARGING & PELEBURAN',
    sceneCode: 'SCENE 4.2',
    title: 'Penyortiran Muatan Logam Bebas Air & Pelumas (Anti Steam Explosion)',
    sopReference: 'Tahap 4.2 • Penyortiran Kontaminan Air, Oli & Wadah Tertutup',
    instruction: 'Klik Kotak Karantina (Drying Bin) di Depo Bahan Baku, lalu periksa dan singkirkan 3 potongan skrap berbahaya (basah berair, berlumur oli/pelumas, dan kaleng tertutup) dari meja sortir.',
    objective: 'Seluruh 3 kontaminan berbahaya disingkirkan ke Drying Bin hingga muatan 100% kering dan bebas pelumas.',
    clue: 'Klik Drying Bin (Kotak Karantina Skrap) di Depo Bahan Baku untuk membuka Meja Inspeksi Visual Skrap dan pindahkan 3 sampel terkontaminasi.',
    metallurgyNote: 'BAHAYA FATAL: Air memuai 1.600x seketika memicu Steam Explosion; oli/pelumas melepaskan gas Hidrogen penyebab porositas lubang jarum (pinhole) dan semburan api!',
    targetPreset: 'depot',
    actionKey: 'action_sort_scrap',
    scoreCategory: 'formulaMelting',
    points: 5,
  },
  {
    id: 'sc-4.3',
    number: 13,
    act: 4,
    actTitle: 'ACT 04: FORMULA, CHARGING & PELEBURAN',
    sceneCode: 'SCENE 4.3',
    title: 'Pemuatan Bahan Bertahap 3 Lapis (Sequential Charging) ke Dalam Tanur',
    sopReference: 'Tahap 4.3 • Urutan Pelapisan Muatan Krusibel 3 Tahap',
    instruction: 'Masukkan muatan 250 kg ke dalam krusibel secara berurutan dalam 3 tahap: (1) Pig Iron di dasar, (2) Steel & Return Scrap di tengah, dan (3) Carburizer & Ferroalloy di atas.',
    objective: 'Ketiga tahap pemuatan (Tahap 1 -> Tahap 2 -> Tahap 3) selesai dan krusibel terisi 250 kg.',
    clue: 'Klik Keranjang Muat (Skip Bucket) di Depo atau klik mulut Krusibel Tanur Induksi untuk membuka Simulasi Pemuatan 3 Tahap.',
    metallurgyNote: 'Tahap 1 (Pig Iron) memaksimalkan kopling fluks magnetik dasar; Tahap 2 (Skrap) mencegah fenomena Bridging; Tahap 3 (Paduan) mencegah oksidasi unsur dan diaduk Gaya Lorentz.',
    targetPreset: 'furnace',
    actionKey: 'action_charging_seq',
    scoreCategory: 'formulaMelting',
    points: 4,
  },
  {
    id: 'sc-4.4',
    number: 14,
    act: 4,
    actTitle: 'ACT 04: FORMULA, CHARGING & PELEBURAN',
    sceneCode: 'SCENE 4.4',
    title: 'Penaikan Daya Bertahap ke 150 kW (Pull Power)',
    sopReference: 'Tahap 4.4 • Peleburan Daya Penuh (Full Melting Power)',
    instruction: 'Naikkan potensio bertahap dari 10 kW -> 50 kW -> 100 kW hingga 150 kW (pull power) hingga logam mencair.',
    objective: 'Daya 150 kW aktif, logam mencair sempurna (~1200°C) dengan adukan Lorentz.',
    clue: 'Geser slider potensio naik bertahap hingga menyentuh 150 kW.',
    metallurgyNote: 'Gaya Lorentz menghasilkan kubah cembung (meniscus) yang mengaduk homogen karbon dan ferosilicon.',
    targetPreset: 'furnace',
    actionKey: 'action_pull_power',
    scoreCategory: 'formulaMelting',
    points: 5,
  },

  // ACT 05: MUTU, SUHU TARGET & PENUANGAN 1 CETAKAN
  {
    id: 'sc-5.1',
    number: 15,
    act: 5,
    actTitle: 'ACT 05: MUTU, SUHU & PENUANGAN',
    sceneCode: 'SCENE 5.1',
    title: 'Penaburan Koagulan, Deslagging & Sampel Komposisi',
    sopReference: 'Tahap 5.1 • Pengikatan Terak (Deslagging) & Uji Komposisi',
    instruction: 'Tabur bubuk pengikat terak (coagulant), serok lapisan terak ke slag pot, dan ambil sampel uji komposisi.',
    objective: 'Terak bersih 100% dan komposisi kimia terverifikasi memenuhi standar order.',
    clue: 'Gunakan sekop koagulan dan serokan terak dari pegboard, atau tombol bantuan pada panel panduan.',
    metallurgyNote: 'Pembersihan terak tuntas mencegah cacat inklusi non-logam pada coran.',
    targetPreset: 'furnace',
    actionKey: 'action_deslag_sample',
    scoreCategory: 'qualityPouring',
    points: 4,
  },
  {
    id: 'sc-5.2',
    number: 16,
    act: 5,
    actTitle: 'ACT 05: MUTU, SUHU & PENUANGAN',
    sceneCode: 'SCENE 5.2',
    title: 'Pengukuran Suhu Cairan Sesuai Target Job Order',
    sopReference: 'Tahap 5.2 • Verifikasi Suhu Tapping dengan Termokopel Celup',
    instruction: 'Celupkan sensor pirometer selama 2 detik ke cairan logam hingga terkunci pada target suhu spesifikasi Job Order.',
    objective: 'Suhu terverifikasi tepat sesuai toleransi target spesifikasi Job Order aktif.',
    clue: 'Ambil pirometer celup dari pegboard lalu tekan tombol Celupkan di kanan bawah hingga sinyal BEEP berbunyi.',
    metallurgyNote: 'Suhu tapping harus tepat: FC berkisar 1390-1450°C, sedangkan FCD berkisar 1510-1520°C untuk kompensasi panas reaksi nodularisasi.',
    targetPreset: 'lance',
    actionKey: 'action_dip_pyrometer',
    scoreCategory: 'qualityPouring',
    points: 6,
  },
  {
    id: 'sc-5.3',
    number: 17,
    act: 5,
    actTitle: 'ACT 05: MUTU, SUHU & PENUANGAN',
    sceneCode: 'SCENE 5.3',
    title: 'Preheating Ladel & Tapping Hidrolik (Reaksi FeSiMg)',
    sopReference: 'Tahap 5.3 • Penuangan Logam Cair dari Tungku ke Ladel (Tapping)',
    instruction: 'Posisikan ladel preheated di depan moncong tanur, lalu miringkan tanur untuk menuang logam cair ke dalam ladel.',
    objective: 'Ladel terisi >= 60% dan logam cair di dalam tanur berpindah ke ladel.',
    clue: 'Gunakan remot memiringkan tungku (COB-61) di sebelah kanan atau tekan tombol Tapping di panel panduan.',
    metallurgyNote: 'Ladel harus membara merah (>600°C) agar cairan tidak beku dan refraktori ladel bebas lembab.',
    targetPreset: 'ladle',
    actionKey: 'action_tapping_ladle',
    scoreCategory: 'qualityPouring',
    points: 5,
  },
  {
    id: 'sc-5.4',
    number: 18,
    act: 5,
    actTitle: 'ACT 05: MUTU, SUHU & PENUANGAN',
    sceneCode: 'SCENE 5.4',
    title: 'Penuangan Kontinu dari Ladel ke 1 Cetakan Pasir & Kembalikan Ladel ke Posisi Semula',
    sopReference: 'Tahap 5.4 • Penuangan Logam Cair dari Ladel ke Cetakan Pasir & Parkir Kembali Ladel',
    instruction: 'Bawa ladel ke area cetakan, tuang kontinu ke 1 cetakan pasir tunggal hingga penuh (100%), tegakkan kembali ladel, lalu wajib kembalikan ladel ke posisi semula (Area Standby [X: 4.0m, Z: 0.0m]) menggunakan 6 tombol arah pada Remot Crane.',
    objective: 'Cetakan pasir tunggal terisi 100% kontinu dan ladel telah dikembalikan ke posisi semula (Area Standby).',
    clue: 'Posisikan crane di atas cetakan tunggal, putar roda kemudi (handwheel) ladel untuk menuang hingga 100%, tegakkan ladel ke 0°, lalu tekan 6 tombol arah pada Remot Crane F24-6D (TROLLEY L ◀ / BRIDGE) untuk menggeser ladel kembali ke posisi semula di Area Standby (X: 4.0m, Z: 0.0m).',
    metallurgyNote: 'Penuangan wajib kontinu tanpa henti untuk mencegah cacat sambungan dingin (cold shut) dan misrun, lalu ladel wajib diparkir kembali ke area aman agar jalur kerja bebas bahaya.',
    targetPreset: 'mold-gear',
    actionKey: 'action_pour_mold',
    scoreCategory: 'qualityPouring',
    points: 5,
  },

  // ACT 06: MEMATIKAN MESIN & PENDINGINAN PASCA-OPERASI
  {
    id: 'sc-6.1',
    number: 19,
    act: 6,
    actTitle: 'ACT 06: PROSEDUR MEMATIKAN & PENDINGINAN',
    sceneCode: 'SCENE 6.1-6.4',
    title: 'Prosedur Mematikan Mesin (Potensio 0, AC OFF, Cooling Tower, Breaker Utama)',
    sopReference: 'Tahap 6.1 • Pemadaman Berurutan Sistem Daya Tanur',
    instruction: 'Turunkan potensio ke 0 kW -> tekan tombol merah AC OFF -> matikan Box Tuas Cooling Tower & Box Panel Breaker Utama (Biarkan Pompa Cooling tetap ON!).',
    objective: 'Daya tanur mati berurutan tanpa beban, jalur pompa pendingin koil tetap terjaga aktif.',
    clue: 'Ikuti urutan pemadaman di panel oranye & box dinding: Potensio 0 kW, tombol AC OFF, Tuas Cooling Tower OFF, Breaker Utama OFF.',
    metallurgyNote: 'Mematikan inverter pada zero-load melindungi modul switching IGBT dari kelebihan tegangan transien.',
    targetPreset: 'utility-panels',
    actionKey: 'action_shutdown_seq',
    scoreCategory: 'shutdownCooling',
    points: 8,
  },
  {
    id: 'sc-6.2',
    number: 20,
    act: 6,
    actTitle: 'ACT 06: PROSEDUR MEMATIKAN & PENDINGINAN',
    sceneCode: 'SCENE 6.5',
    title: 'Sirkulasi Pompa Cooling Pasca-Peleburan ± 5 Jam (Time-Lapse)',
    sopReference: 'Tahap 6.2 • Pendinginan Akhir Koil & Pemadaman Pompa',
    instruction: 'Jalankan time-lapse sirkulasi pompa pendingin selama ± 5 jam hingga suhu koil < 45°C, lalu turunkan tuas Box Saklar Pompa Cooling ke OFF.',
    objective: 'Pendinginan refraktori dan koil selesai aman, tuas pompa dimatikan, modul selesai.',
    clue: 'Klik opsi Pertahankan Pompa Pendingin ± 5 Jam (Time-Lapse), lalu klik Box Tuas Saklar Pompa Cooling di dinding untuk mematikannya.',
    metallurgyNote: 'BAHAYA KOIL: Menghentikan pompa saat dinding masih panas membara akan melelehkan koil tembaga akibat radiasi sisa.',
    targetPreset: 'utility-panels',
    actionKey: 'action_timelapse_cooling',
    scoreCategory: 'shutdownCooling',
    points: 7,
  },
];

export interface StudentScoreRubric {
  k3JobOrder: number;        // Max 15
  coolingSequential: number; // Max 15
  powerPreheat: number;      // Max 15
  formulaMelting: number;    // Max 20
  qualityPouring: number;    // Max 20
  shutdownCooling: number;   // Max 15
  totalScore: number;        // Max 100
  isPassed: boolean;         // KKM 75
}

export const calculateStudentScore = (
  completedSteps: Record<number, boolean>,
  penalties: { formulaMismatch?: boolean; thermalShock?: boolean; coldShut?: boolean } = {}
): StudentScoreRubric => {
  let k3JobOrder = 0;
  let coolingSequential = 0;
  let powerPreheat = 0;
  let formulaMelting = 0;
  let qualityPouring = 0;
  let shutdownCooling = 0;

  STORYBOARD_SCENES.forEach((scene) => {
    if (completedSteps[scene.number]) {
      switch (scene.scoreCategory) {
        case 'k3JobOrder':
          k3JobOrder += scene.points;
          break;
        case 'coolingSequential':
          coolingSequential += scene.points;
          break;
        case 'powerPreheat':
          powerPreheat += scene.points;
          break;
        case 'formulaMelting':
          formulaMelting += scene.points;
          break;
        case 'qualityPouring':
          qualityPouring += scene.points;
          break;
        case 'shutdownCooling':
          shutdownCooling += scene.points;
          break;
      }
    }
  });

  // Apply penalties if any
  if (penalties.formulaMismatch) formulaMelting = Math.max(0, formulaMelting - 6);
  if (penalties.thermalShock) powerPreheat = Math.max(0, powerPreheat - 4);
  if (penalties.coldShut) qualityPouring = Math.max(0, qualityPouring - 5);

  const totalScore = k3JobOrder + coolingSequential + powerPreheat + formulaMelting + qualityPouring + shutdownCooling;
  const isPassed = totalScore >= 75;

  return {
    k3JobOrder,
    coolingSequential,
    powerPreheat,
    formulaMelting,
    qualityPouring,
    shutdownCooling,
    totalScore,
    isPassed,
  };
};
