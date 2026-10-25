# 🏭 Simulasi Monte Carlo: Estimasi Probabilitas Produk Cacat Melebihi Batas Toleransi Produksi

Repositori ini berisi pengerjaan Tugas Besar / Proyek Pemodelan & Simulasi (TA-03) mengenai **Analisis Risiko Mutu Manufaktur dengan Metode Simulasi Monte Carlo** menggunakan parameter empiris dari dataset riil Kaggle (*Product Defects Dataset*).

---

## 📌 Gambaran Proyek
- **Mata Kuliah**: Pemodelan & Simulasi (TA-03)
- **Topik Studi Kasus**: Simulasi Monte Carlo untuk Mengestimasi Probabilitas Jumlah Produk Cacat Melebihi Batas Toleransi Produksi
- **Dataset**: `defects_data.csv` (1.000 catatan cacat historis)
- **Metode**: Simulasi Monte Carlo (10.000 Iterasi)
- **Goal Bisnis**: Menentukan apakah laju cacat bulanan berisiko melampaui batas toleransi 200 unit produk cacat per batch 1.000 unit produksi.

---

## 📊 Hasil Utama & Evaluasi Risiko
- **Parameter Historis**:
  - Rata-rata ($\mu$): **166.67 unit/bulan**
  - Standar Deviasi ($\sigma$): **14.60 unit**
- **Distribusi Acak**: Normal ($\mathcal{N}(\mu, \sigma)$)
- **Batas Toleransi ($T$)**: **200 unit**
- **Hasil Simulasi (10.000 Jalur)**:
  - **Probabilitas Cacat > Toleransi $P(X > 200)$**: **$1.13\%$**
  - **Probabilitas Aman $P(X \le 200)$**: **$98.87\%$**
  - **Z-Score Ambang Batas**: $+2.28\,\sigma$
  - **Kategori Risiko**: 🟢 **Risiko Rendah (Terkendali)**
  - **Rekomendasi Ambang Waspada (EWS)**: **185 unit** (Persentil ke-90)

---

## 📁 Struktur Berkas

```text
TA03_PS/
├── index.html                 # Tampilan Web App Interaktif
├── style.css                  # Desain Modern Dark-Mode & Glassmorphism
├── app.js                     # Algoritma Monte Carlo & Chart.js Engine
├── monte_carlo_defects.ipynb  # Jupyter Notebook (EDA s/d Simulasi)
├── LAPORAN_PROYEK_TA03.md     # Dokumen Laporan Lengkap Step-by-Step
├── defects_data.csv           # Dataset Kaggle Produk Cacat
├── generate_charts.py         # Skrip Python Pembuat Grafik Resolusi Tinggi
├── plot_eda_kategorikal.png   # Visualisasi EDA Kategorikal
├── plot_distribusi_asli.png   # Fitting Kurva Normal Data Historis
├── plot_monte_carlo_results.png # Histogram Simulasi & Kurva CDF
└── plot_sensitivitas.png      # Analisis Sensitivitas Threshold
```

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Web Application (Dashboard Simulasi)
Cukup buka file `index.html` langsung di browser favorit Anda, atau jalankan local server:
```bash
python -m http.server 8000
```
Lalu akses `http://localhost:8000`.

### 2. Menjalankan Jupyter Notebook
```bash
jupyter notebook monte_carlo_defects.ipynb
```
atau buka di VS Code / Google Colab.

---

## 🛠️ Teknologi yang Digunakan
- **Python 3**: Pandas, NumPy, Matplotlib, SciPy
- **Web**: Vanilla HTML5, Modern CSS3, JavaScript (ES6+), Chart.js, FontAwesome
