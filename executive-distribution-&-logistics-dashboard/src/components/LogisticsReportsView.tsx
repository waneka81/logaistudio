import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DistributionRow } from '../types';
import { cleanNumberInput } from '../data/mockData';

interface LogisticsReportsViewProps {
  rows: DistributionRow[];
  onToggleSidebar: () => void;
  onSyncGoogleSheet: () => void;
  isSyncing: boolean;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const LogisticsReportsView: React.FC<LogisticsReportsViewProps> = ({
  rows,
  onToggleSidebar,
  onSyncGoogleSheet,
  isSyncing,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedExp, setSelectedExp] = useState('ALL');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique months and transporters
  const months = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const m = String(r.Month || r.Bulan || '').trim();
      if (m) set.add(m);
    });
    return Array.from(set);
  }, [rows]);

  const expeditions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const e = String(r.Ekspedisi || r.Vendor || '').trim();
      if (e) set.add(e);
    });
    return Array.from(set);
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        !s ||
        String(r.Plant || '').toLowerCase().includes(s) ||
        String(r.Depo || '').toLowerCase().includes(s) ||
        String(r.Ekspedisi || '').toLowerCase().includes(s) ||
        String(r.Month || '').toLowerCase().includes(s);

      const matchMonth =
        selectedMonth === 'ALL' ||
        String(r.Month || r.Bulan || '').toLowerCase() === selectedMonth.toLowerCase();

      const matchExp =
        selectedExp === 'ALL' ||
        String(r.Ekspedisi || r.Vendor || '').toLowerCase() === selectedExp.toLowerCase();

      return matchSearch && matchMonth && matchExp;
    });
  }, [rows, searchTerm, selectedMonth, selectedExp]);

  // Aggregate stats
  const totalQty = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + cleanNumberInput(r.Qty || r.volume), 0);
  }, [filteredRows]);

  const avgOtd = useMemo(() => {
    if (filteredRows.length === 0) return 0;
    const totalOtd = filteredRows.reduce((acc, r) => acc + cleanNumberInput(r.OTD || r.otd), 0);
    return totalOtd / filteredRows.length;
  }, [filteredRows]);

  const totalNrfs = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + cleanNumberInput(r.NRFS || r.nrfs), 0);
  }, [filteredRows]);

  // Pagination calculation
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedRows = filteredRows.slice(startIndex, endIndex);

  // Export handlers
  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const csvData = Papa.unparse(rows);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Distribusi_Logistik_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onShowToast('Laporan berhasil diekspor ke CSV!', 'success');
  };

  const handleExportExcel = () => {
    if (rows.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Distribusi');
    XLSX.writeFile(
      workbook,
      `Laporan_Distribusi_Logistik_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    onShowToast('Laporan berhasil diekspor ke Excel!', 'success');
  };

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
          <div className="w-9 h-9 rounded-xl bg-[#F59700]/15 border border-[#F59700]/30 text-[#F59700] flex items-center justify-center text-base shrink-0">
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div>
            <h2 className="font-poppins text-sm font-bold tracking-tight flex items-center gap-1.5 leading-tight">
              Laporan &amp; Tabel Data Distribusi
            </h2>
            <p className="text-[11px] text-subtext">Master Dataset Tabular &amp; Export Center</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="bg-slate-800/60 hover:bg-slate-700 text-subtext hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <i className="fa-solid fa-file-csv text-[#35C4C3]"></i> Ekspor CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-slate-800/60 hover:bg-slate-700 text-subtext hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <i className="fa-solid fa-file-excel text-[#69DC9E]"></i> Ekspor Excel
          </button>
          <button
            onClick={onSyncGoogleSheet}
            disabled={isSyncing}
            className="bg-[#00ABE7] hover:bg-[#00ABE7]/90 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow disabled:opacity-50 cursor-pointer"
          >
            <i className={`fa-solid fa-cloud-arrow-up ${isSyncing ? 'fa-spin' : ''}`}></i>
            <span>{isSyncing ? 'Menyimpan...' : 'Simpan ke Google Sheet'}</span>
          </button>
        </div>
      </header>

      {/* Filter and Stats Bar */}
      <section className="card p-2.5 space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs flex-1 min-w-[200px] max-w-sm">
            <i className="fa-solid fa-magnifying-glass text-subtext"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari plant, depo, ekspedisi..."
              className="bg-transparent outline-none w-full text-slate-100 placeholder:text-subtext"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-subtext hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Month & Exp Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-700/60 rounded-xl px-2 py-1 text-xs">
              <span className="text-[10px] text-subtext uppercase font-semibold">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none cursor-pointer text-slate-200"
              >
                <option value="ALL" className="bg-slate-800 text-white">Semua Bulan</option>
                {months.map((m) => (
                  <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-700/60 rounded-xl px-2 py-1 text-xs">
              <span className="text-[10px] text-subtext uppercase font-semibold">Transporter:</span>
              <select
                value={selectedExp}
                onChange={(e) => {
                  setSelectedExp(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none cursor-pointer text-slate-200"
              >
                <option value="ALL" className="bg-slate-800 text-white">Semua Transporter</option>
                {expeditions.map((e) => (
                  <option key={e} value={e} className="bg-slate-800 text-white">{e}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-700/60 rounded-xl px-2 py-1 text-xs">
              <span className="text-[10px] text-subtext uppercase font-semibold">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none cursor-pointer text-slate-200"
              >
                <option value={10} className="bg-slate-800 text-white">10</option>
                <option value={25} className="bg-slate-800 text-white">25</option>
                <option value={50} className="bg-slate-800 text-white">50</option>
                <option value={100} className="bg-slate-800 text-white">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#2a3b52] text-xs">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/30">
            <span className="text-subtext text-[11px]">Total Baris:</span>
            <strong className="text-white font-bold">{filteredRows.length.toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/30">
            <span className="text-subtext text-[11px]">Total Qty:</span>
            <strong className="text-[#00ABE7] font-bold">{totalQty.toLocaleString()} Unit</strong>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/30">
            <span className="text-subtext text-[11px]">Rata-rata OTD:</span>
            <strong className="text-[#35C4C3] font-bold">{avgOtd.toFixed(1)}%</strong>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/30">
            <span className="text-subtext text-[11px]">Total NRFS Cacat:</span>
            <strong className="text-[#E0516D] font-bold">{totalNrfs.toLocaleString()} Unit</strong>
          </div>
        </div>
      </section>

      {/* Main Table */}
      <section className="card p-2.5 flex-1 flex flex-col justify-between shrink-0 min-h-[300px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="row4-header font-semibold text-subtext">
                <th className="p-2 w-12 text-center">No</th>
                <th className="p-2">Bulan</th>
                <th className="p-2">Plant</th>
                <th className="p-2">Depo / Lokasi</th>
                <th className="p-2">Transporter</th>
                <th className="p-2 text-right">Qty Realisasi</th>
                <th className="p-2 text-right">Kuota Target</th>
                <th className="p-2 text-right">NRFS (Cacat)</th>
                <th className="p-2 text-center">OTD (%)</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-subtext">
                    Tidak ada data yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                pagedRows.map((r, idx) => {
                  const qtyVal = cleanNumberInput(r.Qty || r.volume);
                  const kuotaVal = cleanNumberInput(r.Kuota || r.Target);
                  const nrfsVal = cleanNumberInput(r.NRFS || r.nrfs);
                  const otdVal = cleanNumberInput(r.OTD || r.otd);
                  const isOntime = otdVal >= 95;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 text-center text-subtext text-[11px]">
                        {startIndex + idx + 1}
                      </td>
                      <td className="p-2 font-medium">{r.Month || r.Bulan || '-'}</td>
                      <td className="p-2">{r.Plant || '-'}</td>
                      <td className="p-2">{r.Depo || r.Warehouse || '-'}</td>
                      <td className="p-2 font-bold">{r.Ekspedisi || r.Vendor || '-'}</td>
                      <td className="p-2 text-right font-semibold">{qtyVal.toLocaleString()}</td>
                      <td className="p-2 text-right text-subtext">{kuotaVal.toLocaleString()}</td>
                      <td className="p-2 text-right text-[#E0516D] font-medium">
                        {nrfsVal.toLocaleString()}
                      </td>
                      <td className="p-2 text-center font-bold text-[#00ABE7]">
                        {otdVal.toFixed(1)}%
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            isOntime
                              ? 'bg-[#35C4C3]/15 text-[#35C4C3] border-[#35C4C3]/30'
                              : 'bg-[#E0516D]/15 text-[#E0516D] border-[#E0516D]/30'
                          }`}
                        >
                          {isOntime ? 'On-Time' : 'Terlambat'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2a3b52] text-xs text-subtext">
          <span>
            Menampilkan{' '}
            <strong className="text-white">
              {totalItems > 0 ? startIndex + 1 : 0} - {endIndex}
            </strong>{' '}
            dari <strong className="text-white">{totalItems}</strong> baris
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={activePage <= 1}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition cursor-pointer"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="font-semibold text-slate-200">
              Hal {activePage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={activePage >= totalPages}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition cursor-pointer"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
