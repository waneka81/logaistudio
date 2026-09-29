import { GoogleGenAI } from '@google/genai';
import { DashboardData, DistributionRow } from '../types';

export async function askLogisticsAI(
  prompt: string,
  dashboardData: DashboardData,
  rows: DistributionRow[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  // Extract compact context from dashboardData
  const contextSummary = {
    kpi: dashboardData.kpi,
    expeditions: dashboardData.expeditions,
    depoShare: dashboardData.depoShare,
    plantShare: dashboardData.plantShare,
    monthlyTrend: dashboardData.monthlyTrend.slice(-4),
    totalRows: rows.length
  };

  if (!apiKey) {
    // Intelligent offline rule-based fallback if API key is not yet set
    return generateOfflineAnalysis(prompt, dashboardData);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Anda adalah Executive AI Logistics & Supply Chain Analyst profesional untuk Executive Distribution & Logistics Dashboard.
Tugas Anda adalah menganalisis data logistik, performa transporter (OTD, NRFS defect, kuota vs realisasi), dan tren distribusi secara presisi.

Petunjuk format WAJIB:
1. Gunakan tabel Markdown jika menyajikan angka, metrik, atau perbandingan antar vendor/depo.
2. Berikan status yang jelas seperti **Aman**, **Terlambat**, **Perlu Perbaikan**, **Grade A**, **Warning**.
3. Berikan rekomendasi operasional konkret dalam bentuk poin-poin singkat.
4. Gunakan bahasa Indonesia bisnis yang formal, jelas, dan lugas.`;

    const contentPrompt = `Data Dashboard Terkini:
${JSON.stringify(contextSummary, null, 2)}

Pertanyaan Pengguna:
${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [contentPrompt],
      config: {
        systemInstruction
      }
    });

    return response.text || 'Maaf, sistem tidak menghasilkan respon analisis.';
  } catch (err: any) {
    console.warn('AI call error, falling back to local analytics engine:', err);
    return generateOfflineAnalysis(prompt, dashboardData);
  }
}

function generateOfflineAnalysis(prompt: string, data: DashboardData): string {
  const p = prompt.toLowerCase();
  const kpi = data.kpi;
  const exps = data.expeditions;

  if (p.includes('otd') || p.includes('transporter') || p.includes('mitra')) {
    const sortedOtd = [...exps].sort((a, b) => a.otd - b.otd);
    const worst = sortedOtd[0];
    const best = sortedOtd[sortedOtd.length - 1];

    return `### Analisis Kinerja Transporter & OTD (On-Time Delivery)

Berdasarkan evaluasi terhadap **${exps.length} mitra ekspedisi**:

| Ekspedisi | Alokasi Kuota | Realisasi | % OTD | Defect NRFS | Predikat | Rekomendasi |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
${exps
  .map(
    (e) =>
      `| **${e.name}** | ${e.kuota.toLocaleString()} | ${e.realisasi.toLocaleString()} | **${e.otd.toFixed(1)}%** | ${e.nrfs.toFixed(3)}% | ${e.otd >= 95 ? '**Grade A**' : e.otd >= 90 ? '**Grade B**' : '**Grade C**'} | ${e.otd >= 95 ? 'Prioritas Alokasi' : e.otd >= 90 ? 'Monitor SLA' : 'Perlu Evaluasi Kontrak'} |`
  )
  .join('\n')}

#### Temuan Utama:
* **Performa Terbaik**: **${best.name}** mencatat OTD tertinggi sebesar **${best.otd.toFixed(1)}%** dengan defect rate **${best.nrfs.toFixed(3)}%** (**Aman**).
* **Perlu Perhatian Khusus**: **${worst.name}** memiliki OTD terendah sebesar **${worst.otd.toFixed(1)}%** (**Terlambat** / di bawah target SLA ${kpi.targetOtd}%).

#### Tindak Lanjut:
1. Alihkan sebagian kuota rute berisiko tinggi dari **${worst.name}** ke **${best.name}**.
2. Jadwalkan rapat evaluasi SLA mingguan dengan manajemen operasional **${worst.name}**.`;
  }

  if (p.includes('ytd') || p.includes('mtd') || p.includes('volume') || p.includes('target')) {
    const ytdPct = ((kpi.qtyYtd / kpi.targetYtd) * 100).toFixed(1);
    const mtdPct = ((kpi.qtyMtd / kpi.targetMtd) * 100).toFixed(1);

    return `### Ringkasan Pencapaian Volume Distribusi (YTD & MTD)

| Metrik Distribusi | Target | Realisasi Aktual | % Pencapaian | Status Kinerja |
| :--- | :---: | :---: | :---: | :--- |
| **Volume YTD** | ${kpi.targetYtd.toLocaleString()} Unit | ${kpi.qtyYtd.toLocaleString()} Unit | **${ytdPct}%** | ${Number(ytdPct) >= 100 ? '**Grade A (Melampaui)**' : Number(ytdPct) >= 90 ? '**Aman (On-Track)**' : '**Perlu Perbaikan**'} |
| **Volume MTD (Bulan Berjalan)** | ${kpi.targetMtd.toLocaleString()} Unit | ${kpi.qtyMtd.toLocaleString()} Unit | **${mtdPct}%** | ${Number(mtdPct) >= 100 ? '**Grade A**' : '**Warning (Pengerjaan)**'} |
| **Bulan Lalu (M-1)** | ${kpi.targetLastMonth.toLocaleString()} Unit | ${kpi.qtyLastMonth.toLocaleString()} Unit | **${((kpi.qtyLastMonth / kpi.targetLastMonth) * 100).toFixed(1)}%** | **Selesai** |

#### Catatan Eksekutif:
* Akumulasi volume YTD mencapai **${kpi.qtyYtd.toLocaleString()} Unit** dari target tahunan **${kpi.targetYtd.toLocaleString()} Unit**.
* Untuk mengejar target kuartal, pastikan utilisasi armada ekspedisi berjalan optimal tanpa penumpukan di depo utama.`;
  }

  // General overview
  return `### Analisis Komprehensif Eksekutif Logistik

| Indikator Kunci (KPI) | Nilai Aktual | Target Acuan | Status |
| :--- | :---: | :---: | :--- |
| **Realisasi Volume YTD** | ${kpi.qtyYtd.toLocaleString()} Unit | ${kpi.targetYtd.toLocaleString()} Unit | **${((kpi.qtyYtd / kpi.targetYtd) * 100).toFixed(1)}%** |
| **Rata-rata OTD** | ${kpi.otdRate.toFixed(1)}% | ${kpi.targetOtd.toFixed(1)}% | ${kpi.otdRate >= kpi.targetOtd ? '**Aman**' : '**Perlu Perbaikan**'} |
| **NRFS (Cacat Mutu)** | ${kpi.nrfsRate.toFixed(3)}% | ${kpi.targetNrfs.toFixed(3)}% | ${kpi.nrfsRate <= kpi.targetNrfs ? '**Aman (Di Bawah Toleransi)**' : '**Warning**'} |

#### Rekomendasi Alokasi:
* Pertahankan distribusi dominan di Depo **${data.depoShare[0]?.name || 'Karawang'}** (${data.depoShare[0]?.pct || 45}% pangsa).
* Tingkatkan monitoring mutu penanganan barang pada saat transit guna menjaga NRFS tetap di bawah toleransi 0.035%.`;
}
