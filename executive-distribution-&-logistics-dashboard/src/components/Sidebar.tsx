import React, { useRef } from 'react';
import { AppPage, ThemeMode } from '../types';

interface SidebarProps {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  currentUserRole: 'admin' | 'user';
  onOpenRoleModal: () => void;
  onOpenTargetModal: () => void;
  onSyncGoogleSheet: () => void;
  onOpenSheetModal: () => void;
  isSheetsLinked: boolean;
  isSyncing: boolean;
  onDownloadTemplate: () => void;
  onResetData: () => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  logoSrc: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  currentUserRole,
  onOpenRoleModal,
  onOpenTargetModal,
  onSyncGoogleSheet,
  onOpenSheetModal,
  isSheetsLinked,
  isSyncing,
  onDownloadTemplate,
  onResetData,
  onUploadFile,
  theme,
  onToggleTheme,
  collapsed,
  logoSrc,
  onLogoUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside
      className={`sidebar-fixed-dark shrink-0 flex flex-col justify-between transition-all duration-300 z-40 h-full border-r border-[#2a3b52] bg-[#1e293b] text-[#f8fafc] ${
        collapsed ? 'w-16 p-2' : 'w-64 p-3'
      }`}
    >
      <div className="space-y-4">
        {/* Brand / Logo Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#2a3b52]">
          <div
            onClick={() => logoInputRef.current?.click()}
            title="Klik untuk ganti logo perusahaan"
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00ABE7] to-[#35C4C3] flex items-center justify-center text-slate-950 font-black text-sm shrink-0 cursor-pointer overflow-hidden shadow-md shadow-[#00ABE7]/20 border border-white/20 hover:opacity-90 transition-opacity"
          >
            {logoSrc ? (
              <img src={logoSrc} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <i className="fa-solid fa-truck-ramp-box text-white text-base"></i>
            )}
          </div>
          <input
            type="file"
            ref={logoInputRef}
            className="hidden"
            accept="image/*"
            onChange={onLogoUpload}
          />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-poppins font-extrabold text-[13px] tracking-tight leading-tight flex items-center gap-1.5 text-white">
                LOGIX MATRIX
                <span className="bg-[#00ABE7]/20 text-[#00ABE7] text-[9px] font-bold px-1 py-0.5 rounded border border-[#00ABE7]/40">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] text-subtext truncate font-medium">
                Distribution & Logistics Hub
              </p>
            </div>
          )}
        </div>

        {/* Role Badge Button */}
        <div>
          <button
            onClick={onOpenRoleModal}
            className="w-full flex items-center justify-between bg-slate-900/40 hover:bg-slate-800/80 p-2 rounded-xl transition-all border border-slate-700/50 group cursor-pointer"
            title="Ganti Peran Akses"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#00ABE7]/20 text-[#00ABE7] flex items-center justify-center text-[11px] shrink-0">
                <i className="fa-solid fa-user-shield"></i>
              </div>
              {!collapsed && (
                <div className="text-left truncate">
                  <span className="text-[9px] text-subtext block leading-none">Status Peran</span>
                  <span className="font-bold text-[11px] text-white group-hover:text-[#00ABE7] transition-colors">
                    {currentUserRole === 'admin' ? 'Admin Mode' : 'User Mode (Viewer)'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <span className="bg-[#00ABE7]/20 text-[#00ABE7] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#00ABE7]/30">
                Ubah
              </span>
            )}
          </button>
        </div>

        {/* Navigation Menus */}
        <nav className="space-y-1 text-xs">
          {!collapsed && (
            <span className="text-[9px] font-bold text-subtext px-2 uppercase tracking-wider block mb-1">
              Menu Utama
            </span>
          )}

          {/* 1. Dashboard Utama */}
          <button
            onClick={() => setActivePage('home')}
            title="Dashboard Utama"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
              activePage === 'home'
                ? 'text-[#00ABE7] bg-gradient-to-r from-[#00ABE7]/20 to-[#35C4C3]/10 border border-[#00ABE7]/30 shadow-sm'
                : 'text-subtext hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-house text-xs w-4 text-center shrink-0"></i>
              {!collapsed && <span>Dashboard</span>}
            </div>
            {!collapsed && activePage === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ABE7] shadow-[0_0_8px_#00ABE7]"></span>
            )}
          </button>

          {/* 2. Analisis Transporter */}
          <button
            onClick={() => setActivePage('vendor')}
            title="Analisis Transporter"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
              activePage === 'vendor'
                ? 'text-[#00ABE7] bg-gradient-to-r from-[#00ABE7]/20 to-[#35C4C3]/10 border border-[#00ABE7]/30 shadow-sm'
                : 'text-subtext hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-truck-fast text-xs w-4 text-center shrink-0"></i>
              {!collapsed && <span>Analisis Transporter</span>}
            </div>
            {!collapsed && activePage === 'vendor' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ABE7] shadow-[0_0_8px_#00ABE7]"></span>
            )}
          </button>

          {/* 3. Laporan & Tabel */}
          <button
            onClick={() => setActivePage('reports')}
            title="Laporan & Tabel"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
              activePage === 'reports'
                ? 'text-[#00ABE7] bg-gradient-to-r from-[#00ABE7]/20 to-[#35C4C3]/10 border border-[#00ABE7]/30 shadow-sm'
                : 'text-subtext hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-file-lines text-xs w-4 text-center shrink-0"></i>
              {!collapsed && <span>Laporan & Tabel</span>}
            </div>
            {!collapsed && activePage === 'reports' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ABE7] shadow-[0_0_8px_#00ABE7]"></span>
            )}
          </button>

          {/* 4. AI Analyst Page */}
          <button
            onClick={() => setActivePage('ai')}
            title="AI Analyst Page"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
              activePage === 'ai'
                ? 'text-[#00ABE7] bg-gradient-to-r from-[#00ABE7]/20 to-[#35C4C3]/10 border border-[#00ABE7]/30 shadow-sm'
                : 'text-subtext hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-robot text-xs w-4 text-center text-[#00ABE7] shrink-0"></i>
              {!collapsed && <span className="font-bold text-slate-100">AI Analyst Page</span>}
            </div>
            {!collapsed && (
              <i className="fa-solid fa-sparkles text-xs text-[#35C4C3]"></i>
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Controls / System Settings */}
      <div className="pt-2 border-t border-[#2a3b52] space-y-1.5 shrink-0">
        {!collapsed && (
          <span className="text-[9px] font-bold text-subtext px-2 uppercase tracking-wider block">
            Sistem & Pengaturan
          </span>
        )}

        {/* Admin only Buttons */}
        {currentUserRole === 'admin' && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onOpenTargetModal}
              title="Edit Target KPI"
              className="flex items-center justify-center gap-1.5 bg-[#F59700] hover:bg-[#F59700]/90 text-slate-950 font-bold text-[10px] px-2 py-1.5 rounded-xl transition-all shadow cursor-pointer"
            >
              <i className="fa-solid fa-bullseye text-[10px] shrink-0"></i>
              {!collapsed && <span>Target KPI</span>}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload File CSV / Excel"
              className="flex items-center justify-center gap-1.5 bg-[#00ABE7]/10 hover:bg-[#00ABE7]/20 text-[#00ABE7] border border-[#00ABE7]/30 font-semibold text-[10px] px-2 py-1.5 rounded-xl transition-all shadow cursor-pointer"
            >
              <i className="fa-solid fa-cloud-arrow-up text-[10px] shrink-0"></i>
              {!collapsed && <span>Upload</span>}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.xls,.json"
              onChange={onUploadFile}
            />
          </div>
        )}

        {/* Google Sheets Storage Link & Manage */}
        <button
          onClick={onOpenSheetModal}
          title="Buka / Tautkan Link Google Sheets"
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-xs border border-slate-700/60 transition cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#35C4C3]/20 text-[#35C4C3] flex items-center justify-center text-[11px] shrink-0">
              <i className="fa-solid fa-file-excel"></i>
            </div>
            {!collapsed && (
              <div className="text-left truncate">
                <span className="text-[9px] text-subtext block leading-none">Penyimpanan File</span>
                <span className="font-bold text-[11px] text-white group-hover:text-[#35C4C3] transition-colors">
                  Google Sheets
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                isSheetsLinked
                  ? 'bg-[#35C4C3]/20 text-[#35C4C3] border-[#35C4C3]/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {isSheetsLinked ? 'Link Aktif' : 'Setup'}
            </span>
          )}
        </button>

        {/* Sync, Template, Reset row */}
        <div className={`grid ${currentUserRole === 'admin' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 pt-0.5`}>
          <button
            onClick={onSyncGoogleSheet}
            disabled={isSyncing}
            title="Sinkronisasi Data Google Sheets"
            className="flex items-center justify-center gap-1 bg-[#35C4C3]/10 hover:bg-[#35C4C3]/20 text-[#35C4C3] border border-[#35C4C3]/30 font-semibold text-[10px] px-1.5 py-1.5 rounded-xl transition-all shadow disabled:opacity-50 cursor-pointer"
          >
            <i className={`fa-solid fa-arrows-rotate text-[10px] shrink-0 ${isSyncing ? 'fa-spin' : ''}`}></i>
            {!collapsed && <span>Sync</span>}
          </button>
          <button
            onClick={onDownloadTemplate}
            title="Unduh Template CSV Laporan"
            className="flex items-center justify-center gap-1 bg-slate-800/40 hover:bg-slate-700 text-subtext border-0 font-semibold text-[10px] px-1.5 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <i className="fa-solid fa-download text-[#35C4C3] text-[10px] shrink-0"></i>
            {!collapsed && <span>Template</span>}
          </button>
          {currentUserRole === 'admin' && (
            <button
              onClick={onResetData}
              title="Reset ke Data Bawaan"
              className="flex items-center justify-center gap-1 bg-slate-800/40 hover:bg-slate-700 text-[#E0516D] border-0 font-semibold text-[10px] px-1.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <i className="fa-solid fa-rotate-left text-[10px] shrink-0"></i>
              {!collapsed && <span>Reset</span>}
            </button>
          )}
        </div>

        {/* Dark / Light Mode Switch */}
        <div className="pt-1.5 px-0.5">
          <div
            onClick={onToggleTheme}
            title="Ganti Mode Tampilan (Dark/Light)"
            className="flex items-center justify-between bg-slate-900/40 hover:bg-slate-800/60 p-2 rounded-xl shadow-inner border-0 text-slate-100 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#F59700]/20 flex items-center justify-center text-[11px] shrink-0">
                <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} text-[#F59700]`}></i>
              </div>
              {!collapsed && (
                <div className="text-left">
                  <span className="text-[9px] text-subtext block leading-none">Tampilan</span>
                  <span className="font-bold text-[11px] text-[#F59700]">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTheme();
                }}
                className="w-10 h-5 bg-slate-700 rounded-full relative transition-colors duration-300 focus:outline-none p-0.5 border-0 cursor-pointer shrink-0"
              >
                <div
                  className={`w-4 h-4 bg-[#00ABE7] rounded-full shadow-md transform transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
