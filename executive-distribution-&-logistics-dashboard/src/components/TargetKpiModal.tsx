import React, { useState } from 'react';

interface TargetKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargetYtd: number;
  currentTargetMtd: number;
  onSaveTargets: (targetYtd: number, targetMtd: number) => void;
}

export const TargetKpiModal: React.FC<TargetKpiModalProps> = ({
  isOpen,
  onClose,
  currentTargetYtd,
  currentTargetMtd,
  onSaveTargets
}) => {
  const [targetYtd, setTargetYtd] = useState(currentTargetYtd);
  const [targetMtd, setTargetMtd] = useState(currentTargetMtd);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTargets(Number(targetYtd), Number(targetMtd));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="card w-full max-w-sm p-5 rounded-2xl border border-slate-700 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bullseye text-[#F59700]"></i>
            <h3 className="font-poppins font-bold text-sm text-white">Sesuaikan Target KPI</h3>
          </div>
          <button onClick={onClose} className="text-subtext hover:text-white cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] text-subtext block mb-1">Target Volume YTD (Unit):</label>
            <input
              type="number"
              required
              min="1"
              value={targetYtd}
              onChange={(e) => setTargetYtd(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#F59700]"
            />
          </div>

          <div>
            <label className="text-[11px] text-subtext block mb-1">Target Volume MTD (Unit):</label>
            <input
              type="number"
              required
              min="1"
              value={targetMtd}
              onChange={(e) => setTargetMtd(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#F59700]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-subtext hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#F59700] hover:bg-[#F59700]/90 text-slate-950 font-bold text-xs cursor-pointer shadow"
            >
              Simpan Target
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
