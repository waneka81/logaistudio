import React, { useState } from 'react';
import { SpreadsheetInfo } from '../types';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheet: SpreadsheetInfo | null;
  onSyncPush: () => Promise<void>;
  onSyncPull: () => Promise<void>;
  onConnectCustomSheet: (sheetId: string) => Promise<void>;
  onCreateNewSheet: (title: string) => Promise<void>;
  isSyncing: boolean;
  totalRows: number;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  spreadsheet,
  onSyncPush,
  onSyncPull,
  onConnectCustomSheet,
  onCreateNewSheet,
  isSyncing,
  totalRows,
  onShowToast
}) => {
  const [customInput, setCustomInput] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('Executive Distribution & Logistics Data');
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (spreadsheet?.url) {
      navigator.clipboard.writeText(spreadsheet.url);
      onShowToast('Link Google Sheet berhasil disalin ke clipboard!', 'success');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    let cleanId = customInput.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    setActionLoading(true);
    try {
      await onConnectCustomSheet(cleanId);
      setCustomInput('');
      onShowToast('Spreadsheet berhasil ditautkan!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menautkan Google Sheet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;
    setActionLoading(true);
    try {
      await onCreateNewSheet(newSheetTitle.trim());
      onShowToast('Google Spreadsheet baru berhasil dibuat di Drive Anda!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal membuat Google Spreadsheet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="card w-full max-w-lg p-5 rounded-2xl border border-slate-700 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-file-excel text-[#35C4C3] text-base"></i>
            <div>
              <h3 className="font-poppins font-bold text-sm text-white">
                Penyimpanan Data Google Sheets
              </h3>
              <p className="text-[10px] text-subtext">Google Drive &amp; Workspace Cloud Storage</p>
            </div>
          </div>
          <button onClick={onClose} className="text-subtext hover:text-white cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Current Linked Sheet Status */}
        {spreadsheet ? (
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#35C4C3] animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#35C4C3]">
                    Spreadsheet Terhubung
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs truncate">{spreadsheet.name}</h4>
                <p className="text-[10px] text-subtext truncate">Tab Sheet: {spreadsheet.sheetName}</p>
              </div>

              <span className="text-[10px] font-semibold bg-[#00ABE7]/20 text-[#00ABE7] px-2 py-0.5 rounded border border-[#00ABE7]/30 shrink-0">
                {totalRows} Baris Data
              </span>
            </div>

            {/* Direct Link box */}
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-slate-300 truncate select-all">
                {spreadsheet.url}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopyLink}
                  title="Salin Link"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-subtext hover:text-white transition cursor-pointer"
                >
                  <i className="fa-regular fa-copy text-xs"></i>
                </button>
                <a
                  href={spreadsheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-[#00ABE7]/20 hover:bg-[#00ABE7]/30 text-[#00ABE7] rounded-md transition cursor-pointer"
                  title="Buka di Google Sheets"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                </a>
              </div>
            </div>

            {/* Sync push and pull buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onSyncPush}
                disabled={isSyncing}
                className="py-2 px-3 rounded-xl bg-[#00ABE7] hover:bg-[#00ABE7]/90 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow disabled:opacity-50 cursor-pointer"
              >
                <i className={`fa-solid fa-cloud-arrow-up ${isSyncing ? 'fa-spin' : ''}`}></i>
                <span>Simpan ke Sheets</span>
              </button>
              <button
                onClick={onSyncPull}
                disabled={isSyncing}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <i className={`fa-solid fa-cloud-arrow-down ${isSyncing ? 'fa-spin' : ''}`}></i>
                <span>Tarik dari Sheets</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center space-y-2">
            <i className="fa-solid fa-cloud-slash text-2xl text-subtext"></i>
            <p className="text-xs font-semibold text-slate-300">Belum Ada Spreadsheet Terhubung</p>
            <p className="text-[11px] text-subtext">
              Klik tombol di bawah untuk membuat Google Spreadsheet baru otomatis di Drive Anda, atau tautkan spreadsheet yang sudah ada.
            </p>
          </div>
        )}

        {/* Section A: Create New Sheet */}
        <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#00ABE7] block">
            Opsi 1: Buat Spreadsheet Baru di Google Drive
          </span>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newSheetTitle}
              onChange={(e) => setNewSheetTitle(e.target.value)}
              placeholder="Judul file..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#00ABE7]"
            />
            <button
              type="submit"
              disabled={actionLoading || !newSheetTitle.trim()}
              className="px-3 py-1.5 rounded-xl bg-[#35C4C3] hover:bg-[#35C4C3]/90 text-slate-950 font-bold text-xs shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Membuat...' : 'Buat Baru'}
            </button>
          </form>
        </div>

        {/* Section B: Connect Existing Sheet */}
        <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#F59700] block">
            Opsi 2: Tautkan Google Sheet yang Sudah Ada
          </span>
          <form onSubmit={handleConnect} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste URL Google Sheets atau Spreadsheet ID..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#F59700]"
            />
            <button
              type="submit"
              disabled={actionLoading || !customInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shrink-0 disabled:opacity-50 cursor-pointer"
            >
              Tautkan
            </button>
          </form>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
