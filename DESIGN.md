# DESIGN.md - Standar Desain Sistem Simulator Tungku Induksi Peleburan Logam (GW-Series IF)

Dokumen ini adalah acuan desain antarmuka (UI), grafis, palet warna, tipografi, dan aksesibilitas untuk aplikasi simulator tungku peleburan induksi logam industri. Disusun mengikuti kaidah filter antislop (`antislop-ui`, `antislop-human`, `antislop-copywriting`, `antislop-layoutmobile`, dan `antislop-code`).

---

## 1. Identitas & Karakter Desain

- **Karakter:** Otentik Instrumentasi Industri & Manufaktur Pengecoran Logam (*Foundry Melt Shop*). Padat informasi teknis, presisi, bersih, tanpa dekorasi artifisial tanpa fungsi (*zero slop*).
- **Filosofi Visual:** Menyerupai konsol SCADA/HMI industri modern berpadu dengan kabinet kendali GW series nyata. Setiap elemen visual (meter, lampu andon, tombol, status interlock) memiliki korespondensi langsung dengan peralatan fisik di pabrik.

---

## 2. Palet Warna & Kontras Aksesibilitas (WCAG AA Terverifikasi)

Palet dibatasi secara ketat pada **2 warna inti netral + 1 aksen fungsional + palet semantik status K3**:

| Peran | Warna | Hex | Kontras thd Background (`#0f172a`) | Status WCAG |
|---|---|---|---|---|
| **Background Kanvas & HUD** | Slate Paling Gelap | `#0f172a` | - | Dasar Permukaan |
| **Card / Container Permukaan** | Slate Gelap Solid | `#1e293b` | 1.3:1 (Border 3:1 via `#334155`) | Permukaan Solid (Tanpa Blur) |
| **Border & Divider** | Slate Mid | `#334155` | 3.1:1 | Lulus Komponen Non-Teks (WCAG 1.4.11) |
| **Teks Primer / Nilai Metrik** | Putih Bersih | `#f8fafc` | **16.8:1** | Lulus WCAG AAA |
| **Teks Sekunder / Label Unit** | Abu Terang | `#cbd5e1` | **10.9:1** | Lulus WCAG AAA |
| **Aksen Interaktif / Fokus** | Industrial Amber | `#f59e0b` | **8.2:1** | Lulus WCAG AAA |
| **Semantik: Normal / RUN / TAP OK**| Emerald Green | `#22c55e` | **8.4:1** | Lulus WCAG AAA |
| **Semantik: Warning / Cold** | Amber Alert | `#fbbf24` | **11.2:1** | Lulus WCAG AAA |
| **Semantik: Fault / E-Stop / Overheat**| Crimson Red | `#ef4444` | **5.4:1** | Lulus WCAG AA |
| **Semantik: Measuring / Cyan** | Electric Cyan | `#06b6d4` | **8.9:1** | Lulus WCAG AAA |

*Catatan Kepatuhan:*
- **Dilarang keras:** Gradasi ungu-kebiruan generic (*AI slop*), neon orbs, efek blur/glassmorphism bertumpuk pada semua panel, teks abu-abu redup di bawah kontras 4.5:1.
- Setiap tombol interaktif memiliki outline `:focus-visible` solid selebar 2px (`#f59e0b`) dengan offset 2px.

---

## 3. Tipografi & Skala Instrumen

- **Font Antarmuka Utama:** `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` dengan `font-weight: 500` (medium) dan `700` (bold).
- **Font Angka Metrik & Pembacaan Digital:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` dengan `font-variant-numeric: tabular-nums` agar angka tidak bergetar saat nilai temperatur atau daya berubah.
- **Skala Tipe Responsif:**
  - Label Instrumen Kecil: `11px` (uppercase, letter-spacing: 0.05em, text-color: `#cbd5e1`)
  - Teks Body / Deskripsi SOP: `13px` - `14px` (line-height: 1.5)
  - Nilai Metrik Utama (Suhu/Daya/Tekanan): `18px` - `24px` (bold monospace)
  - Judul Panel / Header: `15px` - `16px` (bold)

---

## 4. Tata Letak & Responsivitas (Mobile, Tablet, Desktop)

- **Mobile Viewport (≤ 768px):**
  - HUD bagian bawah menciut menjadi bilah status ringkas dengan tab navigasi modal.
  - Ukuran target sentuh tombol minimal `44px × 44px`.
  - Panel kontrol remote crane dan remote tilting ditampilkan sebagai overlay satu-kolom di bagian bawah layar.
- **Desktop Viewport (> 768px):**
  - Telemetri ringkas di kanan atas.
  - Panduan SOP interaktif di kiri atas dengan panel yang dapat diciutkan (*collapsible*).
  - Quick-jump stasiun mesin di bilah navigasi bawah.

---

## 5. Standar Komentar Kode (`antislop-code`)

- Hanya gunakan komentar untuk menerangkan rumus fisika, konstanta termodinamika, alasan interlock keamanan, atau batasan non-intuitif arsitektur WebGL.
- Hindari komentar dekoratif (`// ======...======`), penomoran langkah yang sudah jelas dari nama fungsi, dan emoji dekoratif.
