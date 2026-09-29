import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { DashboardData, ActiveFilters } from '../types';
import { chartColorPalette } from '../data/mockData';

Chart.register(...registerables);

interface HomeDashboardViewProps {
  data: DashboardData;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: Partial<ActiveFilters>) => void;
  onResetFilters: () => void;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onOpenTargetModal: () => void;
  isAdmin: boolean;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  data,
  activeFilters,
  onFilterChange,
  onResetFilters,
  onToggleSidebar,
  isDarkMode,
  onOpenTargetModal,
  isAdmin
}) => {
  // Clock state
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setClock(`${dateStr} ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Canvas refs
  const trendCanvasRef = useRef<HTMLCanvasElement>(null);
  const nrfsTrendCanvasRef = useRef<HTMLCanvasElement>(null);
  const otdTrendCanvasRef = useRef<HTMLCanvasElement>(null);
  const plantCanvasRef = useRef<HTMLCanvasElement>(null);
  const depoCanvasRef = useRef<HTMLCanvasElement>(null);
  const expCanvasRef = useRef<HTMLCanvasElement>(null);

  // Chart instances
  const trendChartInstance = useRef<Chart | null>(null);
  const nrfsTrendChartInstance = useRef<Chart | null>(null);
  const otdTrendChartInstance = useRef<Chart | null>(null);
  const plantChartInstance = useRef<Chart | null>(null);
  const depoChartInstance = useRef<Chart | null>(null);
  const expChartInstance = useRef<Chart | null>(null);

  // Filtered trend based on activeFilters.month
  const filteredTrend = activeFilters.month === 'ALL'
    ? data.monthlyTrend
    : data.monthlyTrend.filter((d) => d.month === activeFilters.month);

  const hasActiveFilters =
    activeFilters.depo !== 'ALL' ||
    activeFilters.plant !== 'ALL' ||
    activeFilters.expedition !== 'ALL' ||
    activeFilters.month !== 'ALL';

  // Build active filter label
  const activeFilterLabel = [
    activeFilters.depo !== 'ALL' ? `Depo: ${activeFilters.depo}` : null,
    activeFilters.plant !== 'ALL' ? `Plant: ${activeFilters.plant}` : null,
    activeFilters.expedition !== 'ALL' ? `Exp: ${activeFilters.expedition}` : null,
    activeFilters.month !== 'ALL' ? `Bulan: ${activeFilters.month}` : null
  ]
    .filter(Boolean)
    .join(' | ');

  // Initialize and update charts
  useEffect(() => {
    const textColor = isDarkMode ? '#94a3b8' : '#656d77';
    const gridColor = isDarkMode ? 'rgba(42, 59, 82, 0.25)' : 'rgba(203, 213, 225, 0.4)';

    // 1. Trend Distribusi
    if (trendCanvasRef.current) {
      if (trendChartInstance.current) trendChartInstance.current.destroy();
      trendChartInstance.current = new Chart(trendCanvasRef.current, {
        type: 'bar',
        data: {
          labels: filteredTrend.map((d) => d.month),
          datasets: [
            {
              type: 'line',
              label: 'Target (rb)',
              data: filteredTrend.map((d) => d.target / 1000),
              borderColor: '#F59700',
              borderWidth: 2,
              pointRadius: 3,
              fill: false,
              tension: 0.2
            },
            {
              type: 'bar',
              label: 'Realisasi (rb)',
              data: filteredTrend.map((d) => d.actual / 1000),
              backgroundColor: '#00ABE7',
              hoverBackgroundColor: '#35C4C3',
              borderRadius: 3,
              barPercentage: 0.55
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: textColor,
                boxWidth: 10,
                font: { size: 9 }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 9 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 9 },
                callback: (val) => `${val}k`
              }
            }
          },
          onClick: (_, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const m = chart.data.labels?.[idx] as string;
              onFilterChange({ month: activeFilters.month === m ? 'ALL' : m });
            }
          }
        }
      });
    }

    // 2. Trend NRFS YTD (%)
    if (nrfsTrendCanvasRef.current) {
      if (nrfsTrendChartInstance.current) nrfsTrendChartInstance.current.destroy();
      nrfsTrendChartInstance.current = new Chart(nrfsTrendCanvasRef.current, {
        type: 'line',
        data: {
          labels: filteredTrend.map((d) => d.month),
          datasets: [
            {
              label: 'Target Max (%)',
              data: filteredTrend.map(() => data.kpi.targetNrfs),
              borderColor: '#E0516D',
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false
            },
            {
              label: 'NRFS Rate (%)',
              data: filteredTrend.map((d) => d.nrfs || data.kpi.nrfsRate),
              borderColor: '#F59700',
              backgroundColor: 'rgba(245, 151, 0, 0.15)',
              hoverBorderColor: '#ffffff',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: textColor,
                boxWidth: 10,
                font: { size: 9 }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 9 } }
            },
            y: {
              min: 0,
              suggestedMax: 0.045,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 9 },
                callback: (val) => `${Number(val).toFixed(3)}%`
              }
            }
          },
          onClick: (_, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const m = chart.data.labels?.[idx] as string;
              onFilterChange({ month: activeFilters.month === m ? 'ALL' : m });
            }
          }
        }
      });
    }

    // 3. Trend OTD YTD (%)
    if (otdTrendCanvasRef.current) {
      if (otdTrendChartInstance.current) otdTrendChartInstance.current.destroy();
      otdTrendChartInstance.current = new Chart(otdTrendCanvasRef.current, {
        type: 'line',
        data: {
          labels: filteredTrend.map((d) => d.month),
          datasets: [
            {
              label: 'Target Min (%)',
              data: filteredTrend.map(() => data.kpi.targetOtd),
              borderColor: '#F59700',
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false
            },
            {
              label: 'OTD Rate (%)',
              data: filteredTrend.map((d) => d.otd || data.kpi.otdRate),
              borderColor: '#35C4C3',
              backgroundColor: 'rgba(53, 196, 195, 0.15)',
              hoverBorderColor: '#ffffff',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: textColor,
                boxWidth: 10,
                font: { size: 9 }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 9 } }
            },
            y: {
              suggestedMin: 80,
              suggestedMax: 100,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 9 },
                callback: (val) => `${Number(val).toFixed(1)}%`
              }
            }
          },
          onClick: (_, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const m = chart.data.labels?.[idx] as string;
              onFilterChange({ month: activeFilters.month === m ? 'ALL' : m });
            }
          }
        }
      });
    }

    // 4. Plant Doughnut
    if (plantCanvasRef.current) {
      if (plantChartInstance.current) plantChartInstance.current.destroy();
      plantChartInstance.current = new Chart(plantCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: data.plantShare.map((d) => d.name),
          datasets: [
            {
              data: data.plantShare.map((d) => d.pct),
              backgroundColor: data.plantShare.map((d) => d.color),
              hoverBackgroundColor: ['#35C4C3', '#00ABE7'],
              borderWidth: 2,
              borderColor: isDarkMode ? '#1e293b' : '#ffffff',
              hoverOffset: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { display: false } },
          onClick: (_, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const p = chart.data.labels?.[idx] as string;
              onFilterChange({ plant: activeFilters.plant === p ? 'ALL' : p });
            }
          }
        }
      });
    }

    // 5. Depo Doughnut
    if (depoCanvasRef.current) {
      if (depoChartInstance.current) depoChartInstance.current.destroy();
      depoChartInstance.current = new Chart(depoCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: data.depoShare.map((d) => d.name),
          datasets: [
            {
              data: data.depoShare.map((d) => d.pct),
              backgroundColor: data.depoShare.map((d) => d.color),
              hoverBackgroundColor: ['#69DC9E', '#00ABE7', '#35C4C3'],
              borderWidth: 2,
              borderColor: isDarkMode ? '#1e293b' : '#ffffff',
              hoverOffset: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { display: false } },
          onClick: (_, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const d = chart.data.labels?.[idx] as string;
              onFilterChange({ depo: activeFilters.depo === d ? 'ALL' : d });
            }
          }
        }
      });
    }

    // 6. Transporter Doughnut
    if (expCanvasRef.current) {
      if (expChartInstance.current) expChartInstance.current.destroy();
      const totalReal = data.expeditions.reduce((acc, x) => acc + x.realisasi, 0);
      expChartInstance.current = new Chart(expCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: data.expeditions.map((e) => e.name),
          datasets: [
            {
              data: data.expeditions.map((e) =>
                totalReal > 0 ? parseFloat(((e.realisasi / totalReal) * 100).toFixed(1)) : 0
              ),
              backgroundColor: chartColorPalette,
              borderWidth: 2,
              borderColor: isDarkMode ? '#1e293b' : '#ffffff',
              hoverOffset: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { display: false } },
          onClick: (_, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const expName = chart.data.labels?.[idx] as string;
              onFilterChange({ expedition: activeFilters.expedition === expName ? 'ALL' : expName });
            }
          }
        }
      });
    }

    return () => {
      trendChartInstance.current?.destroy();
      nrfsTrendChartInstance.current?.destroy();
      otdTrendChartInstance.current?.destroy();
      plantChartInstance.current?.destroy();
      depoChartInstance.current?.destroy();
      expChartInstance.current?.destroy();
    };
  }, [data, filteredTrend, isDarkMode, activeFilters]);

  // Calculations for KPI cards
  const ytdPct = data.kpi.targetYtd > 0 ? ((data.kpi.qtyYtd / data.kpi.targetYtd) * 100).toFixed(1) : '0';
  const mtdPct = data.kpi.targetMtd > 0 ? ((data.kpi.qtyMtd / data.kpi.targetMtd) * 100).toFixed(1) : '0';
  const lastMonthPct = data.kpi.targetLastMonth > 0 ? ((data.kpi.qtyLastMonth / data.kpi.targetLastMonth) * 100).toFixed(1) : '0';

  const nrfsSafe = data.kpi.nrfsRate <= data.kpi.targetNrfs;
  const otdSafe = data.kpi.otdRate >= data.kpi.targetOtd;

  const totalQuotaAll = data.expeditions.reduce((acc, e) => acc + e.kuota, 0);
  const totalRealAll = data.expeditions.reduce((acc, e) => acc + e.realisasi, 0);

  return (
    <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto pr-1">
      {/* Header bar */}
      <header className="card p-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-[#00ABE7]/20 text-subtext hover:text-[#00ABE7] transition-all border border-slate-700/60 flex items-center justify-center cursor-pointer"
            title="Buka / Tutup Sidebar"
          >
            <i className="fa-solid fa-bars text-sm"></i>
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#00ABE7]/15 border border-[#00ABE7]/30 text-[#00ABE7] flex items-center justify-center text-base shrink-0">
            <i className="fa-solid fa-house"></i>
          </div>
          <div>
            <h2 className="font-poppins text-sm font-bold tracking-tight flex items-center gap-1.5 leading-tight">
              Dashboard Utama
            </h2>
            <p className="text-[11px] text-subtext">Real-time KPI & Transporter Fulfillment Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 bg-[#00ABE7]/15 border border-[#00ABE7]/30 px-2.5 py-1 rounded-lg text-[11px] text-[#00ABE7] font-semibold">
              <i className="fa-solid fa-filter"></i>
              <span>{activeFilterLabel}</span>
              <button
                onClick={onResetFilters}
                className="ml-1 hover:text-white cursor-pointer"
                title="Reset Filter"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          {/* Depo Dropdown */}
          <div className="flex items-center gap-1 bg-transparent border-0 px-2.5 py-1 text-xs">
            <i className="fa-solid fa-location-dot text-[#00ABE7] text-[11px]"></i>
            <select
              value={activeFilters.depo}
              onChange={(e) => onFilterChange({ depo: e.target.value })}
              className="filter-depo-select bg-transparent font-medium outline-none cursor-pointer text-[11px]"
            >
              <option value="ALL" className="bg-slate-800 text-white">Semua Lokasi</option>
              {data.depoShare.map((d) => (
                <option key={d.name} value={d.name} className="bg-slate-800 text-white">{d.name}</option>
              ))}
            </select>
          </div>

          {/* Clock Display */}
          <div className="bg-transparent rounded-lg h-9 px-3 flex items-center justify-center gap-2 shrink-0 font-medium w-[175px] border-0 shadow-none">
            <i className="fa-solid fa-clock text-[#00ABE7] shrink-0 text-xs"></i>
            <span className="font-mono text-center text-[12px] h-[35px] flex items-center">
              {clock || '--/--/---- --:--:--'}
            </span>
          </div>
        </div>
      </header>

      {/* Row 1: KPI Summary Cards (5 cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 shrink-0">
        {/* Card 1: Volume YTD */}
        <div
          onClick={() => isAdmin && onOpenTargetModal()}
          className="card p-2 flex flex-col justify-between border-l-4 border-l-[#00ABE7] cursor-pointer hover:border-slate-500 transition-colors"
          title={isAdmin ? 'Klik untuk ubah Target YTD / MTD' : 'Volume YTD'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-subtext uppercase">Realisasi YTD (Unit)</span>
            <span className="text-[9px] font-bold text-[#00ABE7] bg-[#00ABE7]/10 px-1.5 py-0.5 rounded">
              {ytdPct}% Target
            </span>
          </div>
          <div className="my-1">
            <h3 className="font-poppins text-lg font-bold leading-none">
              {data.kpi.qtyYtd.toLocaleString()}
            </h3>
            <span className="text-[10px] text-subtext mt-1 block">
              Target: <strong className="text-slate-300 font-semibold">{data.kpi.targetYtd.toLocaleString()}</strong>
            </span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00ABE7] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Number(ytdPct), 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Realisasi MTD */}
        <div className="card p-2 flex flex-col justify-between border-l-4 border-l-[#35C4C3]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-subtext uppercase">Realisasi MTD (Unit)</span>
            <span className="text-[9px] font-bold text-[#35C4C3] bg-[#35C4C3]/10 px-1.5 py-0.5 rounded">
              {mtdPct}% Target
            </span>
          </div>
          <div className="my-1">
            <h3 className="font-poppins text-lg font-bold leading-none">
              {data.kpi.qtyMtd.toLocaleString()}
            </h3>
            <span className="text-[10px] text-subtext mt-1 block">
              Target: <strong className="text-slate-300 font-semibold">{data.kpi.targetMtd.toLocaleString()}</strong>
            </span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#35C4C3] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Number(mtdPct), 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Realisasi Bulan Lalu (M-1) */}
        <div className="card p-2 flex flex-col justify-between border-l-4 border-l-[#69DC9E]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-subtext uppercase">Bulan Lalu (M-1)</span>
            <span className="text-[9px] font-bold text-[#69DC9E] bg-[#69DC9E]/10 px-1.5 py-0.5 rounded">
              {lastMonthPct}% Target
            </span>
          </div>
          <div className="my-1">
            <h3 className="font-poppins text-lg font-bold leading-none">
              {data.kpi.qtyLastMonth.toLocaleString()}
            </h3>
            <span className="text-[10px] text-subtext mt-1 block">
              Target: <strong className="text-slate-300 font-semibold">{data.kpi.targetLastMonth.toLocaleString()}</strong>
            </span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#69DC9E] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Number(lastMonthPct), 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Pencapaian NRFS (%) */}
        <div className="card p-2 flex flex-col justify-between border-l-4 border-l-[#F59700]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-subtext uppercase">Pencapaian NRFS (%)</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                nrfsSafe
                  ? 'bg-[#69DC9E]/20 text-[#69DC9E]'
                  : 'bg-[#E0516D]/20 text-[#E0516D]'
              }`}
            >
              {nrfsSafe ? 'Aman' : 'Over'}
            </span>
          </div>
          <div className="my-1">
            <h3 className="font-poppins text-lg font-bold leading-none text-[#F59700]">
              {data.kpi.nrfsRate.toFixed(3)}%
            </h3>
            <span className="text-[10px] text-subtext mt-1 block">
              Target Max: <strong className="text-slate-300 font-semibold">{data.kpi.targetNrfs.toFixed(3)}%</strong>
            </span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#F59700] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((data.kpi.nrfsRate / data.kpi.targetNrfs) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 5: Pencapaian OTD (%) */}
        <div className="card p-2 flex flex-col justify-between border-l-4 border-l-[#E0516D]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-subtext uppercase">Pencapaian OTD (%)</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                otdSafe
                  ? 'bg-[#69DC9E]/20 text-[#69DC9E]'
                  : 'bg-[#E0516D]/20 text-[#E0516D]'
              }`}
            >
              {otdSafe ? 'SLA Met' : 'Under'}
            </span>
          </div>
          <div className="my-1">
            <h3 className="font-poppins text-lg font-bold leading-none text-[#35C4C3]">
              {data.kpi.otdRate.toFixed(1)}%
            </h3>
            <span className="text-[10px] text-subtext mt-1 block">
              Target Min: <strong className="text-slate-300 font-semibold">{data.kpi.targetOtd.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#35C4C3] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((data.kpi.otdRate / data.kpi.targetOtd) * 100, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Row 2: 3 Trend Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 shrink-0 min-h-[160px]">
        {/* 1. Trend Distribusi */}
        <div className="card p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-poppins font-bold text-[11px] flex items-center gap-1.5">
              <i className="fa-solid fa-chart-column text-[#00ABE7]"></i>
              Tren Distribusi (Unit) <span className="text-[9px] text-subtext font-normal">(Klik = Filter)</span>
            </h4>
          </div>
          <div className="relative flex-1 min-h-[125px] w-full">
            <canvas ref={trendCanvasRef} />
          </div>
        </div>

        {/* 2. Trend NRFS */}
        <div className="card p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-poppins font-bold text-[11px] flex items-center gap-1.5">
              <i className="fa-solid fa-triangle-exclamation text-[#F59700]"></i>
              Trend NRFS (%) <span className="text-[9px] text-subtext font-normal">(Klik = Filter)</span>
            </h4>
          </div>
          <div className="relative flex-1 min-h-[125px] w-full">
            <canvas ref={nrfsTrendCanvasRef} />
          </div>
        </div>

        {/* 3. Trend OTD */}
        <div className="card p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-poppins font-bold text-[11px] flex items-center gap-1.5">
              <i className="fa-solid fa-clock-rotate-left text-[#35C4C3]"></i>
              Trend OTD (%) <span className="text-[9px] text-subtext font-normal">(Klik = Filter)</span>
            </h4>
          </div>
          <div className="relative flex-1 min-h-[125px] w-full">
            <canvas ref={otdTrendCanvasRef} />
          </div>
        </div>
      </section>

      {/* Row 3: 3 Doughnut Contribution Charts with Interactive Legends */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 shrink-0 min-h-[140px]">
        {/* Plant Share */}
        <div className="card p-2 flex flex-col justify-between">
          <h4 className="font-poppins font-bold text-[11px] mb-1 flex items-center gap-1.5">
            <i className="fa-solid fa-industry text-[#00ABE7]"></i>
            Kontribusi per Plant (%)
          </h4>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-24 h-24 shrink-0">
              <canvas ref={plantCanvasRef} />
            </div>
            <div className="flex-1 space-y-1 text-[10px]">
              {data.plantShare.map((p) => (
                <div
                  key={p.name}
                  onClick={() => onFilterChange({ plant: activeFilters.plant === p.name ? 'ALL' : p.name })}
                  className="legend-box p-1.5 rounded-lg flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="font-bold">{p.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Depo Share */}
        <div className="card p-2 flex flex-col justify-between">
          <h4 className="font-poppins font-bold text-[11px] mb-1 flex items-center gap-1.5">
            <i className="fa-solid fa-warehouse text-[#35C4C3]"></i>
            Kontribusi per Depo (%)
          </h4>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-24 h-24 shrink-0">
              <canvas ref={depoCanvasRef} />
            </div>
            <div className="flex-1 space-y-1 text-[10px]">
              {data.depoShare.map((d) => (
                <div
                  key={d.name}
                  onClick={() => onFilterChange({ depo: activeFilters.depo === d.name ? 'ALL' : d.name })}
                  className="legend-box p-1 rounded-lg flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transporter Share */}
        <div className="card p-2 flex flex-col justify-between">
          <h4 className="font-poppins font-bold text-[11px] mb-1 flex items-center gap-1.5">
            <i className="fa-solid fa-truck-ramp-box text-[#69DC9E]"></i>
            Kontribusi per Transporter (%)
          </h4>
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-24 h-24 shrink-0">
              <canvas ref={expCanvasRef} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1 text-[9px] max-h-24 overflow-y-auto">
              {data.expeditions.map((e, idx) => {
                const color = chartColorPalette[idx % chartColorPalette.length];
                const pct = totalRealAll > 0 ? ((e.realisasi / totalRealAll) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={e.name}
                    onClick={() => onFilterChange({ expedition: activeFilters.expedition === e.name ? 'ALL' : e.name })}
                    className="legend-box p-1 rounded-md flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-medium truncate">{e.name}</span>
                    </div>
                    <span className="font-bold ml-1">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Row 4: 3 Target vs Actual Tables */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 shrink-0 min-h-[150px]">
        {/* Table 1: Target vs Aktual Distribusi */}
        <div className="card p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#2a3b52]">
            <h4 className="font-poppins font-bold text-[11px] flex items-center gap-1">
              <i className="fa-solid fa-list-check text-[#00ABE7]"></i>
              Target vs Aktual Distribusi (%)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="row4-header font-semibold text-subtext">
                  <th className="py-1 px-1">Mitra</th>
                  <th className="py-1 px-1 text-center">Target</th>
                  <th className="py-1 px-1 text-center">Aktual</th>
                  <th className="py-1 px-1 text-center">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data.expeditions.map((e) => {
                  const targetPct = totalQuotaAll > 0 ? (e.kuota / totalQuotaAll) * 100 : 0;
                  const aktualPct = totalRealAll > 0 ? (e.realisasi / totalRealAll) * 100 : 0;
                  const gap = aktualPct - targetPct;
                  return (
                    <tr
                      key={e.name}
                      onClick={() => onFilterChange({ expedition: activeFilters.expedition === e.name ? 'ALL' : e.name })}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="py-1 px-1 font-medium">{e.name}</td>
                      <td className="py-1 px-1 text-center text-subtext">{targetPct.toFixed(1)}%</td>
                      <td className="py-1 px-1 text-center font-semibold">{aktualPct.toFixed(1)}%</td>
                      <td className="py-1 px-1 text-center">
                        <span className={`font-bold ${gap >= 0 ? 'text-[#35C4C3]' : 'text-[#E0516D]'}`}>
                          {gap >= 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Target vs Aktual NRFS */}
        <div className="card p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#2a3b52]">
            <h4 className="font-poppins font-bold text-[11px] flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-[#F59700]"></i>
              Target vs Aktual NRFS (%)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="row4-header font-semibold text-subtext">
                  <th className="py-1 px-1">Mitra</th>
                  <th className="py-1 px-1 text-center">Target</th>
                  <th className="py-1 px-1 text-center">Aktual</th>
                  <th className="py-1 px-1 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data.expeditions.map((e) => {
                  const targetNrfs = data.kpi.targetNrfs;
                  const aktualNrfs = e.nrfs !== undefined ? e.nrfs : data.kpi.nrfsRate;
                  const isSafe = aktualNrfs <= targetNrfs;
                  return (
                    <tr
                      key={e.name}
                      onClick={() => onFilterChange({ expedition: activeFilters.expedition === e.name ? 'ALL' : e.name })}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="py-1 px-1 font-medium">{e.name}</td>
                      <td className="py-1 px-1 text-center text-subtext">&lt; {targetNrfs.toFixed(3)}%</td>
                      <td className="py-1 px-1 text-center font-semibold">{aktualNrfs.toFixed(3)}%</td>
                      <td className="py-1 px-1 text-center">
                        <span className={`font-bold ${isSafe ? 'text-[#35C4C3]' : 'text-[#E0516D]'}`}>
                          {isSafe ? 'Aman' : 'Melebihi'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Target vs Aktual OTD */}
        <div className="card p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#2a3b52]">
            <h4 className="font-poppins font-bold text-[11px] flex items-center gap-1">
              <i className="fa-solid fa-stopwatch-20 text-[#35C4C3]"></i>
              Target vs Aktual OTD (%)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="row4-header font-semibold text-subtext">
                  <th className="py-1 px-1">Mitra</th>
                  <th className="py-1 px-1 text-center">Target</th>
                  <th className="py-1 px-1 text-center">Aktual</th>
                  <th className="py-1 px-1 text-center">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data.expeditions.map((e) => {
                  const targetOtd = data.kpi.targetOtd;
                  const aktualOtd = e.otd;
                  const gap = aktualOtd - targetOtd;
                  return (
                    <tr
                      key={e.name}
                      onClick={() => onFilterChange({ expedition: activeFilters.expedition === e.name ? 'ALL' : e.name })}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="py-1 px-1 font-medium">{e.name}</td>
                      <td className="py-1 px-1 text-center text-subtext">&gt; {targetOtd.toFixed(1)}%</td>
                      <td className="py-1 px-1 text-center font-semibold">{aktualOtd.toFixed(1)}%</td>
                      <td className="py-1 px-1 text-center">
                        <span className={`font-bold ${gap >= 0 ? 'text-[#35C4C3]' : 'text-[#E0516D]'}`}>
                          {gap >= 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
