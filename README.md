# Simulator 3D Tungku Induksi Peleburan Logam (GW-Series IF)

Media pembelajaran interaktif berbasis 3D WebGL untuk simulasi pengoperasian **Tungku Induksi Peleburan Logam (*Coreless Induction Furnace*) Frekuensi Menengah**. 

Aplikasi ini dirancang sebagai sarana pelatihan vokasi dan praktikum virtual bagi peserta didik kejuruan **Teknik Pengecoran Logam** dan **Teknik Mesin**, dengan standar acuan operasional **SOP PT. Coppal Utama Indomelt (No. ST/M/ENG/09/00)** dan **SKKNI No. 109 Tahun 2018**.

---

## ✨ Fitur Utama

### 1. ⚙️ Simulasi Fisika Termal & Metalurgi Realistis
- **Prinsip Induksi Elektromagnetik:** Pemodelan arus eddy (*eddy current*), efek Joule ($P = I^2 R$), dan *skin effect* pada kumparan tembaga berpendingin air.
- **Transisi Fase & Kalor Laten:** Simulasi perubahan wujud padat ke cair dengan *thermal plateau* (penyerapan kalor laten peleburan tanpa kenaikan suhu sesaat).
- **Emisi Pijar Radiasi Benda Hitam (*Blackbody Radiation*):** Perubahan warna dan visual glow logam cair dinamis berdasarkan temperatur aktual (merah kusam $\rightarrow$ oranye $\rightarrow$ kuning menyilaukan).
- **Perhitungan Muatan (*Charge Calculation*):** Presisi komposisi bahan baku (Pig Iron, Steel Scrap, Return Scrap, Karburiser, FeSi, FeMn, dan inokulan FeSiMg).

### 2. 🦺 Kepatuhan K3 & Prosedur Operasional Standar (SOP)
- **Inspeksi Kelayakan APAR:** Verifikasi tekanan manometer, selang, nozzle, dan segel sebelum memulai peleburan.
- **Pemeriksaan APD/PPE Lengkap:** Helm safety dengan face shield kobalt, kacamata pelindung, jaket dan apron kulit tahan panas, sarung tangan khusus pengecoran (*aluminized leather*), serta safety boots.
- **Inspeksi Muatan Bebas Bahaya:** Pemilahan material scrap basah, berkarat tebal, atau berongga tertutup guna mencegah ledakan uap air (*steam explosion* / *water hazard*).
- **Pengkondisian & Pembersihan Terak (*Deslagging*):** Penaburan bubuk koagulan terak (*slag coagulant* / perlit) dan pengangkatan terak cair menggunakan sendok skimmer.

### 3. 🏭 Kontrol Mesin & Penanganan Logam Cair
- **Kabinet Daya Listrik Industri:** Panel kontrol kontaktor busbar ganda, pemutus sirkuit MCCB 380V, inverter frekuensi menengah, dan tombol kendali bertahap (10 kW s.d. 150 kW).
- **Sistem Hidrolik Tungku (*Tilting Mechanism*):** Pengaturan sudut kemiringan tanur secara presisi saat menuangkan logam cair ke dalam ladle.
- **Ladle Preheating Station:** Pemanasan awal ladle untuk mencegah retak termal (*thermal shock*) dan pembekuan dini (*premature chilling*).
- **Overhead Factory Crane:** Pengendalian derek gantung via remote nirkabel untuk memindahkan ladle dari tanur ke area penuangan.
- **Penuangan (*Pouring*) ke Cetakan:** Pilihan penuangan ke cetakan pasir tunggal (*sand casting mold*) maupun cetakan balok ingot (*ingot mold*).

### 4. 🎮 Kontrol Dual-Touch & Antarmuka Ergonomis (SCADA/HMI)
- **Responsif Multi-Platform:** Optimal untuk Desktop (Keyboard + Mouse) maupun Mobile Android Touchscreen (Landscape 16:9).
- **Dual-Touch Navigation:** Virtual analog joystick untuk pergerakan operator dan swipe-to-look untuk rotasi kamera 3D.
- **Zero-Slop Design:** Desain visual bergaya panel SCADA/HMI industri otentik dengan kontras teruji standar WCAG AA/AAA (tanpa efek blur dekoratif yang memberatkan performa).

### 5. 🔊 Audio Synthesizer Dinamis
- Sintesis audio Web Audio API interaktif tanpa bergantung pada file audio eksternal besar.
- Menghasilkan suara dengung elektromagnetik frekuensi menengah (berubah sesuai daya kW), desis uap pendingin, benturan mekanis, dan sirine peringatan suhu kritis.

---

## 🛠️ Tumpukan Teknologi (*Tech Stack*)

- **Framework Inti:** [React 19](https://react.dev/)
- **Mesin Grafis 3D:** [Three.js](https://threejs.org/) & [@react-three/fiber (R3F)](https://docs.pmnd.rs/react-three-fiber)
- **Komponen 3D Tambahan:** [@react-three/drei](https://github.com/pmndrs/drei)
- **Post-Processing:** [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) (Heat Haze, Tone Mapping, Bloom)
- **Manajemen State Global:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Build Tool & Bundler:** [Vite 6](https://vitejs.dev/)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Testing:** [Vitest](https://vitest.dev/)
- **PWA Support:** `vite-plugin-pwa`

---

## 🚀 Petunjuk Menjalankan Proyek

### 1. Klon Repositori
```bash
git clone https://github.com/mazfa201004-art/Simulator-3D-Tungku-Induksi.git
cd Simulator-3D-Tungku-Induksi
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Jalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui peramban di `http://localhost:5173`.

### 4. Jalankan Pengujian
```bash
npm run test
```

### 5. Bangun Berkas Produksi
```bash
npm run build
```
Hasil kompilasi siap rilis akan disimpan di dalam direktori `dist/`.

---

## 🧭 Navigasi & Kontrol Pengguna

| Input (Desktop) | Input (Mobile Touchscreen) | Aksi / Fungsi |
|---|---|---|
| **W, A, S, D / Panah** | Virtual Analog Joystick (Kiri Bawah) | Bergerak maju, mundur, menyamping |
| **Klik Kiri + Geser Mouse** | Area Usap / Swipe (Kanan) | Memutar sudut pandang kamera 3D |
| **Klik Objek Mesin** | Tap Objek Mesin 3D | Membuka modal inspeksi / interaksi panel |
| **Tombol HUD Atas** | Tombol HUD Atas | Mengubah preset kamera (Overview, Platform, Ladle, Bay) |
| **Bilah Navigasi Bawah** | Tab Bar Bawah | Membuka panduan SOP, Job Sheet, dan Panel Kontrol |

---

## 📂 Struktur Direktori Proyek

```text
TungkuPeleburanLogam/
├── public/                    # Aset statis, ikon PWA, dan gambar panduan
├── src/
│   ├── content/               # Teks instruksi multibahasa & konten edukasi
│   ├── scene/                 # Komponen Three.js / React Three Fiber
│   │   ├── camera/            # Camera Rig & penanganan preset sudut pandang
│   │   ├── fx/                # Efek visual partikel panas, heat haze, dan Web Audio
│   │   ├── hud/               # Antarmuka 2D (Modal SOP, Job Sheet, APAR, PPE, Joystick)
│   │   ├── machine/           # Model 3D tanur induksi, trafo, cooling tower, crane, ladle
│   │   ├── metal/             # Shader & mesh leburan logam padat ke cair
│   │   ├── panel/             # Tombol interaktif 3D, saklar, dan potensiometer daya
│   │   └── props/             # Properti bengkel (APAR, rak APD, balok scrap, workbench)
│   ├── sim/                   # Mesin logika termal, rumus kalor laten, dan data job order
│   ├── store/                 # State store Zustand (useSimStore)
│   ├── App.tsx                # Komponen akar aplikasi
│   ├── main.tsx               # Titik masuk React
│   └── index.css              # Gaya dasar Tailwind / CSS antarmuka
├── package.json               # Konfigurasi dependensi dan skrip
├── tsconfig.json              # Konfigurasi TypeScript
├── vite.config.ts             # Konfigurasi Vite & PWA
├── .gitignore                 # Filter berkas Git
└── README.md                  # Dokumentasi teknis proyek
```

---

## 📑 Paket Pesanan Kerja (*Job Order Presets*)

Simulator menyediakan skenario pesanan industri cor logam (*cast iron*):
1. **JO-2026-FC150:** Besi Cor Kelabu JIS G5501 FC 150 (Piringan Pulley V-Belt, target $1390 \pm 20^\circ\text{C}$)
2. **JO-2026-FC250:** Besi Cor Kelabu JIS G5501 FC 250 (Rumah Gearbox, target $1420 \pm 15^\circ\text{C}$)
3. **JO-2026-FC300:** Besi Cor Kelabu Mutu Tinggi FC 300 (Rotor Piringan Rem, target $1440 \pm 10^\circ\text{C}$)
4. **JO-2026-FCD450:** Besi Cor Nodular JIS G5502 FCD 450 (Komponen Hidrolik Berkekuatan Tinggi)
5. **JO-2026-FCD500:** Besi Cor Nodular JIS G5502 FCD 500 (Komponen Otomotif)

---

## 📜 Lisensi & Hak Cipta

Dikembangkan oleh **Azfa** (`mazfa201004-art`) untuk keperluan riset skripsi di **Universitas Pendidikan Indonesia (UPI)** bekerjasama dengan **SMKS Industri Logam Situraja** dan **PT. Coppal Utama Indomelt**.
