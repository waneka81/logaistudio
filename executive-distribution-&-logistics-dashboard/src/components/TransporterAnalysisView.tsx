import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { DashboardData, ExpeditionItem } from '../types';

Chart.register(...registerables);

interface TransporterAnalysisViewProps {
  data: DashboardData;
  onToggleSidebar: () => void;
  onDownloadPdfReport: (expeditionName: string) => void;
  isDarkMode: boolean;
}

export const TransporterAnalysisView: React.FC<TransporterAnalysisViewProps> = ({
  data,
  onToggleSidebar,
  onDownloadPdfReport,
  isDarkMode
}) => {
  const quotaChartRef = useRef<HTMLCanvasElement>(null);
  const radarChartRef = useRef<HTMLCanvasElement>(null);

  const quotaChartInstance = useRef<Chart | null>(null);
  const radarChartInstance = useRef<Chart | null>(null);

  const exps = data.expeditions;

  // KPI Calculations
  let topOtdExp = exps[0] || { name: '-', otd: 0 };
  let bestNrfsExp = exps[0] || { name: '-', nrfs: 0 };
  let totalQuota = 0;
  let totalReal = 0;

  exps.forEach((e) => {
    if (e.otd > topOtdExp.otd) topOtdExp = e;
    if (e.nrfs < bestNrfsExp.nrfs) bestNrfsExp = e;
    totalQuota += e.kuota;
    totalReal += e.realisasi;
  });

  const avgQuotaPct = totalQuota > 0 ? ((totalReal / totalQuota) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    const textColor = isDarkMode ? '#94a3b8' : '#656d77';
    const gridColor = isDarkMode ? 'rgba(42, 59, 82, 0.25)' : 'rgba(203, 213, 225, 0.4)';

    // 1. Quota vs Realisasi Bar Chart
    if (quotaChartRef.current) {
      if (quotaChartInstance.current) quotaChartInstance.current.destroy();
      quotaChartInstance.current = new Chart(quotaChartRef.current, {
        type: 'bar',
        data: {
          labels: exps.map((e) => e.name),
          datasets: [
            {
              label: 'Alokasi Kuota',
              data: exps.map((e) => e.kuota),
              backgroundColor: isDarkMode ? '#334155' : '#cbd5e1',
              borderRadius: 4
            },
            {
              label: 'Realisasi Volume',
              data: exps.map((e) => e.realisasi),
              backgroundColor: '#00ABE7',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor, font: { size: 10 } }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 10 } }
            }
          }
        }
      });
    }

    // 2. Benchmark Performa Radar/Multi-bar Chart
    if (radarChartRef.current) {
      if (radarChartInstance.current) radarChartInstance.current.destroy();
      radarChartInstance.current = new Chart(radarChartRef.current, {
        type: 'bar',
        data: {
          labels: exps.map((e) => e.name),
          datasets: [
            {
              label: '% OTD',
              data: exps.map((e) => e.otd),
              backgroundColor: '#35C4C3',
              borderRadius: 3
            },
            {
              label: '% Pemenuhan Kuota',
              data: exps.map((e) =>
                e.kuota > 0 ? parseFloat(((e.realisasi / e.kuota) * 100).toFixed(1)) : 0
              ),
              backgroundColor: '#F59700',
              borderRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor, font: { size: 10 } }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10 } }
            },
            y: {
              min: 80,
              max: 110,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 10 },
                callback: (v) => `${v}%`
              }
            }
          }
        }
      });
    }

    return () => {
      quotaChartInstance.current?.destroy();
      radarChartInstance.current?.destroy();
    };
  }, [exps, isDarkMode]);

  return (
    <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto pr-1">
      {/* Header */}
      <header className="card p-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-[#00ABE7]/20 text-subtext hover:text-[#00ABE7] transition-all border border-slate-700/60 flex items-center justify-center cursor-pointer"
            title="Buka / Tutup Sidebar"
          >
            <i className="fa-solid fa-bars text-sm"></i>
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#35C4C3]/15 border border-[#35C4C3]/30 text-[#35C4C3] flex items-center justify-center text-base shrink-0">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <div>
            <h2 className="font-poppins text-sm font-bold tracking-tight flex items-center gap-1.5 leading-tight">
              Analisis Transporter &amp; Rekanan
            </h2>
            <p className="text-[11px] text-subtext">Evaluasi &amp; Komparasi Kinerja Multi-Metrik Ekspedisi</p>
          </div>
        </div>
      </header>

      {/* KPI 4 Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 shrink-0">
        <div className="card p-2.5 flex items-center justify-between border-l-4 border-l-[#00ABE7]">
          <div>
            <span className="text-[9px] font-semibold text-subtext uppercase">Total Mitra Aktif</span>
            <h3 className="font-poppins text-lg font-bold">{exps.length} Mitra</h3>
            <span className="text-[9px] text-[#00ABE7]">Terdaftar dalam sistem</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00ABE7]/10 flex items-center justify-center text-[#00ABE7] text-lg">
            <i className="fa-solid fa-truck-moving"></i>
          </div>
        </div>

        <div className="card p-2.5 flex items-center justify-between border-l-4 border-l-[#69DC9E]">
          <div>
            <span className="text-[9px] font-semibold text-subtext uppercase">Top Performer OTD</span>
            <h3 className="font-poppins text-lg font-bold">{topOtdExp.name} ({topOtdExp.otd.toFixed(1)}%)</h3>
            <span className="text-[9px] text-[#69DC9E]">Ketepatan waktu tertinggi</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#69DC9E]/10 flex items-center justify-center text-[#69DC9E] text-lg">
            <i className="fa-solid fa-award"></i>
          </div>
        </div>

        <div className="card p-2.5 flex items-center justify-between border-l-4 border-l-[#35C4C3]">
          <div>
            <span className="text-[9px] font-semibold text-subtext uppercase">Best Quality (Lowest Defect)</span>
            <h3 className="font-poppins text-lg font-bold">{bestNrfsExp.name} ({bestNrfsExp.nrfs.toFixed(3)}%)</h3>
            <span className="text-[9px] text-[#35C4C3]">Tingkat cacat terkecil</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#35C4C3]/10 flex items-center justify-center text-[#35C4C3] text-lg">
            <i className="fa-solid fa-shield-check"></i>
          </div>
        </div>

        <div className="card p-2.5 flex items-center justify-between border-l-4 border-l-[#F59700]">
          <div>
            <span className="text-[9px] font-semibold text-subtext uppercase">Rata-rata Pemenuhan Kuota</span>
            <h3 className="font-poppins text-lg font-bold">{avgQuotaPct}%</h3>
            <span className="text-[9px] text-[#F59700]">Sesuai target alokasi</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F59700]/10 flex items-center justify-center text-[#F59700] text-lg">
            <i className="fa-solid fa-chart-pie"></i>
          </div>
        </div>
      </section>

      {/* 2 Vendor Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 shrink-0 min-h-[200px]">
        <div className="card p-2.5 lg:col-span-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-poppins font-bold text-xs flex items-center gap-1.5">
              <i className="fa-solid fa-chart-bar text-[#00ABE7]"></i>
              Alokasi Kuota vs Realisasi Pengiriman (Unit)
            </h4>
          </div>
          <div className="relative flex-1 min-h-[170px] w-full">
            <canvas ref={quotaChartRef} />
          </div>
        </div>

        <div className="card p-2.5 lg:col-span-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-poppins font-bold text-xs flex items-center gap-1.5">
              <i className="fa-solid fa-sliders text-[#35C4C3]"></i>
              Benchmark Performa Multi-Metrik (%)
            </h4>
          </div>
          <div className="relative flex-1 min-h-[170px] w-full">
            <canvas ref={radarChartRef} />
          </div>
        </div>
      </section>

      {/* Scorecard Table */}
      <section className="card p-3 shrink-0">
        <div className="flex items-center justify-between mb-2 border-b border-[#2a3b52] pb-1.5">
          <h4 className="font-poppins font-bold text-xs flex items-center gap-1.5">
            <i className="fa-solid fa-table-list text-[#F59700]"></i>
            Scorecard &amp; Peringkat Evaluasi Transporter
          </h4>
          <span className="text-[10px] text-subtext">
            Klik tombol "PDF Report" untuk mengunduh dokumen laporan A4 resmi
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="row4-header font-semibold text-subtext">
                <th className="p-2">Mitra Ekspedisi</th>
                <th className="p-2 text-center">Kuota</th>
                <th className="p-2 text-center">Realisasi</th>
                <th className="p-2 text-center">% Pemenuhan</th>
                <th className="p-2 text-center">% OTD</th>
                <th className="p-2 text-center">NRFS Defect</th>
                <th className="p-2 text-center">Predikat</th>
                <th className="p-2 text-center">Rekomendasi Operasional</th>
                <th className="p-2 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {exps.map((e) => {
                const fulPct = e.kuota > 0 ? (e.realisasi / e.kuota) * 100 : 0;
                let gradeBadge = (
                  <span className="bg-[#69DC9E]/20 text-[#69DC9E] font-bold px-2 py-0.5 rounded border border-[#69DC9E]/30">
                    Grade A
                  </span>
                );
                let recommendation = 'Prioritas Alokasi Volume';

                if (e.otd < 90 || fulPct < 90) {
                  gradeBadge = (
                    <span className="bg-[#E0516D]/20 text-[#E0516D] font-bold px-2 py-0.5 rounded border border-[#E0516D]/30">
                      Grade C
                    </span>
                  );
                  recommendation = 'Evaluasi Keterlambatan SLA';
                } else if (e.otd < 94 || fulPct < 95) {
                  gradeBadge = (
                    <span className="bg-[#F59700]/20 text-[#F59700] font-bold px-2 py-0.5 rounded border border-[#F59700]/30">
                      Grade B
                    </span>
                  );
                  recommendation = 'Perketat QC & Monitor Armada';
                }

                return (
                  <tr key={e.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2 font-bold">{e.name}</td>
                    <td className="p-2 text-center text-subtext">{e.kuota.toLocaleString()}</td>
                    <td className="p-2 text-center font-semibold">{e.realisasi.toLocaleString()}</td>
                    <td className="p-2 text-center font-bold text-[#00ABE7]">{fulPct.toFixed(1)}%</td>
                    <td className="p-2 text-center font-bold text-[#35C4C3]">{e.otd.toFixed(1)}%</td>
                    <td className="p-2 text-center font-medium">{e.nrfs.toFixed(3)}%</td>
                    <td className="p-2 text-center">{gradeBadge}</td>
                    <td className="p-2 text-center text-subtext text-[11px]">{recommendation}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => onDownloadPdfReport(e.name)}
                        className="bg-[#00ABE7]/15 hover:bg-[#00ABE7]/30 text-[#00ABE7] border border-[#00ABE7]/40 px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Unduh Laporan A4 Resmi"
                      >
                        <i className="fa-solid fa-file-pdf text-[#E0516D]"></i> PDF Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
