import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
import os

# Konfigurasi style
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
np.random.seed(42)

df = pd.read_csv('defects_data.csv')
df['defect_date'] = pd.to_datetime(df['defect_date'])
df['month'] = df['defect_date'].dt.to_period('M')

monthly_defects = df.groupby('month').size().reset_index(name='defect_count')
monthly_defects['month_str'] = monthly_defects['month'].astype(str)

mu = monthly_defects['defect_count'].mean()
sigma = monthly_defects['defect_count'].std()
TOLERANCE = 200
N_SIM = 10000

# 1. Plot EDA Kategorikal
fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
fig.suptitle('Eksplorasi Data Cacat Produk (EDA)', fontsize=14, fontweight='bold')

defect_counts = df['defect_type'].value_counts()
axes[0].pie(defect_counts.values, labels=defect_counts.index, autopct='%1.1f%%', colors=['#4f46e5', '#06b6d4', '#10b981'], startangle=90)
axes[0].set_title('Distribusi Tipe Cacat')

sev_counts = df['severity'].value_counts()
axes[1].bar(sev_counts.index, sev_counts.values, color=['#10b981', '#f59e0b', '#ef4444'])
axes[1].set_title('Tingkat Keparahan (Severity)')
for i, v in enumerate(sev_counts.values):
    axes[1].text(i, v + 5, str(v), ha='center', fontweight='bold')

insp_counts = df['inspection_method'].value_counts()
axes[2].barh(insp_counts.index, insp_counts.values, color=['#6366f1', '#8b5cf6', '#ec4899'])
axes[2].set_title('Metode Inspeksi')
for i, v in enumerate(insp_counts.values):
    axes[2].text(v + 3, i, str(v), va='center', fontweight='bold')

plt.tight_layout()
plt.savefig('plot_eda_kategorikal.png', dpi=200, bbox_inches='tight')
plt.close()

# 2. Plot Distribusi Asli
fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle('Distribusi Jumlah Cacat Historis per Bulan', fontsize=14, fontweight='bold')

axes[0].bar(monthly_defects['month_str'], monthly_defects['defect_count'], color='#3b82f6', edgecolor='white', alpha=0.85)
axes[0].axhline(mu, color='#ef4444', linestyle='--', linewidth=2, label=f'Mean (μ={mu:.1f})')
axes[0].axhline(TOLERANCE, color='#f59e0b', linestyle=':', linewidth=2, label=f'Toleransi ({TOLERANCE})')
axes[0].set_title('Tren Bulanan')
axes[0].set_ylabel('Jumlah Cacat')
axes[0].legend()
for i, v in enumerate(monthly_defects['defect_count']):
    axes[0].text(i, v + 2, str(v), ha='center', fontweight='bold')

x_norm = np.linspace(120, 220, 200)
axes[1].hist(monthly_defects['defect_count'], bins=6, density=True, color='#10b981', alpha=0.7, edgecolor='white', label='Data Historis')
axes[1].plot(x_norm, stats.norm.pdf(x_norm, mu, sigma), 'r-', lw=2.5, label=f'Fit Normal(μ={mu:.1f}, σ={sigma:.1f})')
axes[1].axvline(TOLERANCE, color='#f59e0b', linestyle=':', lw=2, label=f'Batas={TOLERANCE}')
axes[1].set_title('Fitting Distribusi Normal')
axes[1].legend()

plt.tight_layout()
plt.savefig('plot_distribusi_asli.png', dpi=200, bbox_inches='tight')
plt.close()

# 3. Simulasi Monte Carlo
sim_results = np.random.normal(loc=mu, scale=sigma, size=N_SIM)
p_exceed = np.mean(sim_results > TOLERANCE)

fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
fig.suptitle(f'Hasil Simulasi Monte Carlo ({N_SIM:,} Iterasi)', fontsize=14, fontweight='bold')

n, bins, patches = axes[0].hist(sim_results, bins=50, density=True, color='#3b82f6', alpha=0.7, edgecolor='white')
for patch, edge in zip(patches, bins[:-1]):
    if edge >= TOLERANCE:
        patch.set_facecolor('#ef4444')
axes[0].axvline(TOLERANCE, color='#ef4444', linestyle='--', lw=2.5, label=f'Toleransi={TOLERANCE}')
axes[0].axvline(mu, color='#10b981', linestyle='-', lw=2, label=f'Mean={mu:.1f}')
axes[0].set_title('Histogram Simulasi & Area Risiko (Merah)')
axes[0].legend()
axes[0].text(TOLERANCE + 1, axes[0].get_ylim()[1]*0.8, f'P(X > {TOLERANCE}) = {p_exceed*100:.2f}%', color='#ef4444', fontweight='bold')

# CDF
sorted_res = np.sort(sim_results)
cdf = np.arange(1, N_SIM + 1) / N_SIM
axes[1].plot(sorted_res, cdf * 100, color='#6366f1', lw=2.5, label='Empirical CDF')
axes[1].axvline(TOLERANCE, color='#ef4444', linestyle='--', lw=2, label=f'Toleransi={TOLERANCE}')
axes[1].axhline((1 - p_exceed)*100, color='#10b981', linestyle=':', lw=2, label=f'Prob. Aman = {(1-p_exceed)*100:.1f}%')
axes[1].set_title('Cumulative Distribution Function (CDF)')
axes[1].set_ylabel('Probabilitas Kumulatif (%)')
axes[1].set_xlabel('Jumlah Produk Cacat')
axes[1].legend()

plt.tight_layout()
plt.savefig('plot_monte_carlo_results.png', dpi=200, bbox_inches='tight')
plt.close()

# 4. Plot Sensitivitas
thresholds = np.arange(140, 220, 5)
probs = [np.mean(sim_results > t) * 100 for t in thresholds]

plt.figure(figsize=(9, 4.5))
plt.plot(thresholds, probs, 'o-', color='#ef4444', lw=2.5, markerfacecolor='white', markeredgewidth=2)
plt.axvline(TOLERANCE, color='#f59e0b', linestyle='--', lw=2, label=f'Batas Toleransi Saat Ini ({TOLERANCE})')
plt.axhline(5, color='#10b981', linestyle=':', lw=2, label='Standar Batas Risiko Rendah (5%)')
plt.fill_between(thresholds, probs, color='#ef4444', alpha=0.15)
plt.title('Sensitivitas Probabilitas terhadap Batas Toleransi', fontweight='bold')
plt.xlabel('Batas Toleransi Cacat (Unit)')
plt.ylabel('Probabilitas Melebihi Toleransi (%)')
plt.legend()
plt.tight_layout()
plt.savefig('plot_sensitivitas.png', dpi=200, bbox_inches='tight')
plt.close()

print('Semua grafik berhasil dibuat!')
