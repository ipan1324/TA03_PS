// Box-Muller Transform untuk membangkitkan angka acak berdistribusi Normal
function randomNormal(mean, stdDev) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

// Chart instances
let histogramChartInstance = null;
let cdfChartInstance = null;

// DOM Elements
const inputMu = document.getElementById('inputMu');
const inputSigma = document.getElementById('inputSigma');
const inputTolerance = document.getElementById('inputTolerance');
const inputIterations = document.getElementById('inputIterations');
const simForm = document.getElementById('simForm');
const resetBtn = document.getElementById('resetBtn');

const probVal = document.getElementById('probVal');
const probDesc = document.getElementById('probDesc');
const riskProgress = document.getElementById('riskProgress');
const riskBadge = document.getElementById('riskBadge');
const probSafeVal = document.getElementById('probSafeVal');
const zScoreVal = document.getElementById('zScoreVal');
const p95Val = document.getElementById('p95Val');
const maxVal = document.getElementById('maxVal');
const insightFinding = document.getElementById('insightFinding');

// Preset Buttons
document.querySelectorAll('.btn-chip').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    inputMu.value = btn.dataset.mu;
    inputSigma.value = btn.dataset.sigma;
    inputTolerance.value = btn.dataset.tol;
    runSimulation();
  });
});

// Reset
resetBtn.addEventListener('click', (e) => {
  e.preventDefault();
  inputMu.value = '166.7';
  inputSigma.value = '14.6';
  inputTolerance.value = '200';
  inputIterations.value = '10000';
  runSimulation();
});

// Tab Navigation
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add('active');
  });
});

// Run Simulation Engine
function runSimulation() {
  const mu = parseFloat(inputMu.value);
  const sigma = parseFloat(inputSigma.value);
  const tolerance = parseFloat(inputTolerance.value);
  const n = parseInt(inputIterations.value, 10);

  if (isNaN(mu) || isNaN(sigma) || isNaN(tolerance) || isNaN(n) || sigma <= 0 || n <= 0) {
    alert('Mohon masukkan nilai parameter yang valid.');
    return;
  }

  // 1. Generate Monte Carlo Paths
  const samples = new Float64Array(n);
  let exceedCount = 0;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    let val = Math.max(0, randomNormal(mu, sigma));
    samples[i] = val;
    sum += val;
    if (val > max) max = val;
    if (val < min) min = val;
    if (val > tolerance) exceedCount++;
  }

  // Hitung Probabilitas
  const probExceed = (exceedCount / n) * 100;
  const probSafe = 100 - probExceed;
  const zScore = (tolerance - mu) / sigma;

  // Sorting untuk persentil & CDF
  const sorted = Array.from(samples).sort((a, b) => a - b);
  const p95 = sorted[Math.floor(n * 0.95)];

  // Update UI KPI
  probVal.textContent = probExceed.toFixed(2) + '%';
  probDesc.textContent = `${exceedCount.toLocaleString('id-ID')} dari ${n.toLocaleString('id-ID')} skenario melanggar batas`;
  probSafeVal.textContent = probSafe.toFixed(2) + '%';
  zScoreVal.textContent = (zScore >= 0 ? '+' : '') + zScore.toFixed(2) + ' σ';
  p95Val.textContent = p95.toFixed(1) + ' unit';
  maxVal.textContent = max.toFixed(0) + ' unit';

  // Progress bar & Risk level badge
  riskProgress.style.width = Math.min(100, Math.max(2, probExceed)) + '%';
  
  if (probExceed < 5.0) {
    riskBadge.textContent = 'Risiko Rendah';
    riskBadge.className = 'badge-status badge-success';
    riskProgress.style.backgroundColor = '#10b981';
  } else if (probExceed < 20.0) {
    riskBadge.textContent = 'Risiko Waspada / Sedang';
    riskBadge.className = 'badge-status badge-warning';
    riskProgress.style.backgroundColor = '#f59e0b';
  } else {
    riskBadge.textContent = 'Risiko Kritis / Tinggi';
    riskBadge.className = 'badge-status badge-danger';
    riskProgress.style.backgroundColor = '#ef4444';
  }

  // Update Insight Text
  insightFinding.innerHTML = `Dengan parameter saat ini (μ = ${mu}, σ = ${sigma}), probabilitas terjadinya produk cacat melebihi ${tolerance} unit per bulan adalah <strong>${probExceed.toFixed(2)}%</strong> (${probExceed < 5 ? 'Kondisi Aman / Terkendali' : 'Perlu Intervensi Segera'}).`;

  // Render Visualisasi
  renderHistogram(sorted, tolerance, mu, min, max);
  renderCDF(sorted, tolerance, probSafe);
}

// Histogram Renderer
function renderHistogram(sortedSamples, tolerance, mu, min, max) {
  const binCount = 40;
  const binWidth = (max - min) / binCount;
  const bins = new Array(binCount).fill(0);
  const labels = [];
  const bgColors = [];
  const borderColors = [];

  for (let b = 0; b < binCount; b++) {
    const binStart = min + b * binWidth;
    const binEnd = binStart + binWidth;
    const binMid = (binStart + binEnd) / 2;
    labels.push(binMid.toFixed(0));

    // Warnai merah jika di atas batas toleransi
    if (binMid >= tolerance) {
      bgColors.push('rgba(239, 68, 68, 0.8)');
      borderColors.push('#ef4444');
    } else {
      bgColors.push('rgba(59, 130, 246, 0.7)');
      borderColors.push('#3b82f6');
    }
  }

  // Count items per bin
  for (let i = 0; i < sortedSamples.length; i++) {
    const val = sortedSamples[i];
    let binIdx = Math.floor((val - min) / binWidth);
    if (binIdx >= binCount) binIdx = binCount - 1;
    if (binIdx >= 0) bins[binIdx]++;
  }

  const ctx = document.getElementById('histogramChart').getContext('2d');
  if (histogramChartInstance) histogramChartInstance.destroy();

  histogramChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Frekuensi Simulasi',
        data: bins,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Rentang Cacat: ~${items[0].label} unit`,
            label: (item) => `Jumlah Skenario: ${item.raw.toLocaleString('id-ID')}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', maxTicksLimit: 12 },
          title: { display: true, text: 'Jumlah Produk Cacat (Unit)', color: '#9ca3af' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' },
          title: { display: true, text: 'Frekuensi Skenario', color: '#9ca3af' }
        }
      }
    }
  });
}

// CDF Renderer
function renderCDF(sortedSamples, tolerance, probSafe) {
  const step = Math.floor(sortedSamples.length / 80);
  const cdfLabels = [];
  const cdfData = [];

  for (let i = 0; i < sortedSamples.length; i += step) {
    cdfLabels.push(sortedSamples[i].toFixed(1));
    cdfData.push(((i + 1) / sortedSamples.length) * 100);
  }

  const ctx = document.getElementById('cdfChart').getContext('2d');
  if (cdfChartInstance) cdfChartInstance.destroy();

  cdfChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cdfLabels,
      datasets: [{
        label: 'Probabilitas Kumulatif (%)',
        data: cdfData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Cacat: ${items[0].label} unit`,
            label: (item) => `Probabilitas Kumulatif: ${item.raw.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', maxTicksLimit: 10 },
          title: { display: true, text: 'Jumlah Produk Cacat (Unit)', color: '#9ca3af' }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { 
            color: '#9ca3af',
            callback: (val) => val + '%'
          },
          title: { display: true, text: 'Probabilitas Kumulatif (%)', color: '#9ca3af' }
        }
      }
    }
  });
}

// Form submit event
simForm.addEventListener('submit', (e) => {
  e.preventDefault();
  runSimulation();
});

// Run Initial Simulation on Load
document.addEventListener('DOMContentLoaded', () => {
  runSimulation();
});
