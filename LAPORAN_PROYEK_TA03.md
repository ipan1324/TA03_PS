# LAPORAN TUGAS BESAR / PROYEK TA-03
## PEMODELAN DAN SIMULASI
**Topik:** Simulasi Monte Carlo untuk Mengestimasi Probabilitas Jumlah Produk Cacat Melebihi Batas Toleransi Produksi  
**Dataset:** Product Defects Historical Dataset (Kaggle)  
**Peran:** Risk & Quality Assurance Analyst  

---

### DAFTAR ISI
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Pertanyaan Bisnis](#2-latar-belakang--pertanyaan-bisnis)
3. [Langkah 1: Eksplorasi Data Kaggle (EDA)](#3-langkah-1-eksplorasi-data-kaggle-eda)
4. [Langkah 2: Ekstraksi Parameter & Uji Distribusi](#4-langkah-2-ekstraksi-parameter--uji-distribusi)
5. [Langkah 3: Pembangunan Model Simulasi Monte Carlo](#5-langkah-3-pembangunan-model-simulasi-monte-carlo)
6. [Langkah 4: Analisis Risiko & Evaluasi Hasil](#6-langkah-4-analisis-risiko--evaluasi-hasil)
7. [Kesimpulan & Rekomendasi Bisnis](#7-kesimpulan--rekomendasi-bisnis)
8. [Dokumentasi Deployment Web & File Proyek](#8-dokumentasi-deployment-web--file-proyek)

---

## 1. RINGKASAN EKSEKUTIF
Dalam industri manufaktur modern, menjaga tingkat kecacatan produk dalam batas toleransi yang ditetapkan sangat krusial untuk mencegah kerugian finansial, kegagalan audit mutu ISO, dan reputasi merek yang buruk. Proyek ini memodelkan risiko kualitas manufaktur menggunakan metode **Simulasi Monte Carlo** yang didasarkan pada parameter statistik empiris dari data riil Kaggle (`defects_data.csv`).

Dengan mengekstraksi parameter rata-rata historis cacat ($\mu = 166.67$ unit/bulan) dan standar deviasi ($\sigma = 14.60$), simulasi dijalankan sebanyak **10.000 iterasi/skenario masa depan**. Hasil simulasi menunjukkan bahwa:
- **Probabilitas produk cacat melebihi batas toleransi 200 unit adalah $1.13\%$** ($Z = +2.28$).
- Probabilitas sistem produksi beroperasi dalam batas aman adalah **$98.87\%$**.
- Berdasarkan matriks evaluasi risiko manufaktur, kondisi ini masuk dalam kategori **Risiko Rendah (Terkendali)**. Namun, direkomendasikan batas peringatan dini (*early warning threshold*) diatur pada **185 unit** (Persentil ke-90) agar intervensi dapat dilakukan sebelum pelanggaran ambang batas toleransi terjadi.

---

## 2. LATAR BELAKANG & PERTANYAAN BISNIS
### 2.1 Latar Belakang
Simulasi deterministik konvensional sering kali gagal memperhitungkan volatilitas dan keacakan dalam lini perakitan (misalnya fluktuasi keausan alat, variasi bahan baku, atau kelelahan operator). Dengan mengadopsi pendekatan stokastik melalui **Simulasi Monte Carlo**, tim analis risiko dapat mengeksplorasi ribuan kemungkinan masa depan dan mengukur probabilitas terjadinya *tail-risk* (kejadian ekstrem).

### 2.2 Pertanyaan Bisnis (Goal)
> *"Jika dalam satu bulan produksi terdapat rata-rata 1.000 unit produk yang diproduksi, berapa probabilitas jumlah produk cacat melebihi batas toleransi kritis manajemen sebesar 200 unit?"*

---

## 3. LANGKAH 1: EKSPLORASI DATA KAGGLE (EDA)
Dataset yang digunakan mencakup catatan historis cacat produk dengan atribut:
- `defect_id`: Identifikasi unik kejadian cacat
- `product_id`: ID produk terkait (1 s/d 100)
- `defect_type`: Kategori cacat (Structural, Functional, Cosmetic)
- `defect_date`: Tanggal insiden
- `defect_location`: Lokasi cacat (Component, Internal, Surface)
- `severity`: Tingkat keparahan (Minor, Moderate, Critical)
- `inspection_method`: Metode inspeksi (Visual Inspection, Automated Testing, Manual Testing)
- `repair_cost`: Biaya perbaikan per unit cacat

### 3.1 Data Cleaning & Integritas Data
1. **Missing Values**: Pemeriksaan data menunjukkan **0 missing values** pada seluruh kolom.
2. **Outlier Filtering**: Menggunakan metode *Interquartile Range* (IQR) pada kolom biaya perbaikan (`repair_cost`), tidak ditemukan outlier ekstrem yang merusak representasi data.

### 3.2 Statistik Deskriptif Historis Bulanan
Data dikelompokkan berdasarkan bulan transaksi:
| Periode Bulan | Jumlah Cacat (Unit) | Severity Dominan | Rata-rata Biaya Perbaikan |
|---|---|---|---|
| Januari 2024 | 191 | Moderate | Rp 512.400 |
| Februari 2024 | 160 | Minor | Rp 498.200 |
| Maret 2024 | 175 | Critical | Rp 530.100 |
| April 2024 | 156 | Minor | Rp 487.600 |
| Mei 2024 | 167 | Moderate | Rp 505.300 |
| Juni 2024 | 151 | Minor | Rp 512.100 |

---

## 4. LANGKAH 2: EKSTRAKSI PARAMETER & UJI DISTRIBUSI
### 4.1 Penentuan Variabel Acak
Variabel acak yang dimodelkan adalah:
$$X = \text{Jumlah Produk Cacat per Bulan (Monthly Defect Count)}$$

### 4.2 Parameter Statistik Empiris
Dari data historis 6 bulan, dihitung:
- **Rata-rata ($\mu$)**: $166.67$ unit
- **Standar Deviasi ($\sigma$)**: $14.60$ unit
- **Nilai Minimum**: $151$ unit
- **Nilai Maksimum**: $191$ unit
- **Koefisien Variasi ($CV$)**: $8.76\%$

### 4.3 Uji Distribusi
Histogram data historis menunjukkan kurva lonceng simetris yang cocok dengan **Distribusi Normal (Gaussian Distribution)**:
$$X \sim \mathcal{N}(\mu = 166.67, \sigma = 14.60)$$
Hal ini sejalan dengan *Central Limit Theorem (CLT)* di mana jumlah akumulatif cacat harian dalam periode 30 hari konvergen ke distribusi normal.

---

## 5. LANGKAH 3: PEMBANGUNAN MODEL SIMULASI MONTE CARLO
### 5.1 Spesifikasi Model Simulasi
- **Jumlah Iterasi ($N$)**: $10.000$ skenario (melampaui syarat minimal 5.000 iterasi).
- **Pembangkitan Angka Acak**:
  Menggunakan transformasi acak normal:
  $$X_i = \max(0, \text{np.random.normal}(\mu = 166.67, \sigma = 14.60))$$
- **Batas Toleransi Kritis ($T$)**: $200$ unit

### 5.2 Algoritma Pengerjaan
1. Inisialisasi seed generator bilangan acak (`seed = 42`) untuk keterulangan riset.
2. Bangkitkan array berukuran 10.000 elemen dari distribusi normal $\mathcal{N}(166.67, 14.60)$.
3. Lakukan filter ambang batas: hitung frekuensi skenario di mana $X_i > 200$.
4. Hitung probabilitas empiris:
   $$P(X > 200) = \frac{\sum_{i=1}^N \mathbb{I}(X_i > 200)}{N}$$

---

## 6. LANGKAH 4: ANALISIS RISIKO & EVALUASI HASIL
### 6.1 Hasil Perhitungan Probabilitas
- **Jumlah Skenario Melanggar Batas**: 113 skenario dari 10.000
- **Probabilitas Risiko $P(X > 200)$**: **$1.13\%$**
- **Probabilitas Kondisi Aman $P(X \le 200)$**: **$98.87\%$**
- **Nilai Z-Score**:
  $$Z = \frac{T - \mu}{\sigma} = \frac{200 - 166.67}{14.60} = +2.28$$
- **Probabilitas Teoritis Kurva Normal**:
  $$P(Z > 2.28) = 1 - \Phi(2.28) \approx 1.13\%$$

### 6.2 Statistik Hasil Simulasi
- Mean Hasil Simulasi: $166.66$ unit
- Standar Deviasi Simulasi: $14.59$ unit
- Nilai Terendah yang Muncul: $112$ unit
- Nilai Tertinggi yang Muncul: $224$ unit
- Persentil ke-90 ($P_{90}$): $185.3$ unit
- Persentil ke-95 ($P_{95}$): $190.7$ unit
- Persentil ke-99 ($P_{99}$): $200.6$ unit

---

## 7. KESIMPULAN & REKOMENDASI BISNIS
### 7.1 Kesimpulan
1. **Risiko Sangat Rendah**: Dengan probabilitas pelanggaran hanya sebesar **$1.13\%$**, pabrik memiliki probabilitas keberhasilan sebesar **$98.87\%$** untuk menjaga mutu sesuai standar toleransi.
2. **Kapasitas Proses Memadai**: Jarak antara rata-rata ($166.67$) dan batas toleransi ($200$) adalah sebesar $2.28$ deviasi standar, menandakan buffer keamanan yang cukup.

### 7.2 Rekomendasi Aksi Manajerial
1. **Penerapan Early Warning System (EWS)**:  
   Pasang alarm peringatan jika pada minggu ketiga produksi berjalan cacat telah menembus **185 unit** ($P_{90}$).
2. **Penganggaran Dana Cadangan Perbaikan**:  
   Dengan biaya rata-rata perbaikan per cacat sebesar $\$507$, alokasikan anggaran darurat bulanan sebesar:
   $$\text{Budget} = 166.67 \times \$507 \approx \$84.500/\text{bulan}$$
3. **Fokus pada Severity Kritis**:  
   Sebanyak $33.3\%$ cacat berkategori *Critical*. Inspeksi otomatis (*Automated Testing*) perlu difokuskan pada pengujian komponen internal sebelum tahap perakitan akhir.

---

## 8. DOKUMENTASI DEPLOYMENT WEB & FILE PROYEK
Proyek ini dilengkapi dengan artefak lengkap:
1. `monte_carlo_defects.ipynb`: Notebook Jupyter lengkap dengan penjelasan Markdown, visualisasi grafik, dan kode siap pakai.
2. `defects_data.csv`: Dataset Kaggle yang digunakan.
3. `generate_charts.py`: Skrip penghasil visualisasi grafik resolusi tinggi (`.png`).
4. **Web App Deployment**:
   - `index.html`: Dashboard interaktif simulasi Monte Carlo.
   - `style.css`: Antarmuka modern, dark-mode glassmorphism responsif.
   - `app.js`: Engine Monte Carlo real-time di browser dengan Chart.js.
5. Gambar Plot Hasil:
   - `plot_eda_kategorikal.png`
   - `plot_distribusi_asli.png`
   - `plot_monte_carlo_results.png`
   - `plot_sensitivitas.png`

---
*Laporan ini disusun sebagai pemenuhan Tugas Proyek Simulasi Monte Carlo (TA-03).*
