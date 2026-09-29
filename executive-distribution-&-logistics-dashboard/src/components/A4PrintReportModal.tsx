import React, { useRef } from 'react';
import { ExpeditionItem } from '../types';

interface A4PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expedition: ExpeditionItem | null;
  logoSrc: string | null;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const A4PrintReportModal: React.FC<A4PrintReportModalProps> = ({
  isOpen,
  onClose,
  expedition,
  logoSrc,
  onShowToast
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !expedition) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const docNo = `SCR/${now.getFullYear()}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${expedition.name.toUpperCase()}-01`;

  const fulPct = expedition.kuota > 0 ? (expedition.realisasi / expedition.kuota) * 100 : 0;
  let grade = 'Grade A';
  let gradeBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-400';
  let auditSummary =
    'Mitra menunjukkan performa pemenuhan kuota yang sangat konsisten dengan tingkat cacat produk (NRFS) tergolong sangat aman di bawah ambang batas toleransi SLA.';
  let auditRec =
    'Direkomendasikan sebagai prioritas utama dalam alokasi penambahan volume rute distribusi kuartal berikutnya.';

  if (expedition.otd < 90 || fulPct < 90) {
    grade = 'Grade C';
    gradeBadgeClass = 'bg-rose-100 text-rose-800 border-rose-400';
    auditSummary =
      'Mitra mengalami deviasi ketepatan waktu pengiriman (OTD) di bawah batas toleransi minimum SLA, memerlukan audit rute dan evaluasi armada.';
    auditRec =
      'Pemberian surat peringatan SLA dan pembatasan alokasi kuota hingga rencana perbaikan (CAPA) diverifikasi.';
  } else if (expedition.otd < 94 || fulPct < 95) {
    grade = 'Grade B';
    gradeBadgeClass = 'bg-amber-100 text-amber-800 border-amber-400';
    auditSummary =
      'Performa pemenuhan berada pada batas moderat dengan kepatuhan standar mutu yang baik, namun SLA ketepatan waktu masih berfluktuasi.';
    auditRec =
      'Pengawasan ketat jadwal keberangkatan armada dan koordinasi logistik harian pada jam sibuk.';
  }

  const handleDownloadPdf = () => {
    if (typeof (window as any).html2pdf === 'function' && reportRef.current) {
      onShowToast(`Menyiapkan Dokumen PDF A4 untuk ${expedition.name}...`, 'success');
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Laporan_Performa_${expedition.name}_${now.toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      (window as any)
        .html2pdf()
        .set(opt)
        .from(reportRef.current)
        .save()
        .then(() => {
          onShowToast(`PDF Laporan ${expedition.name} berhasil diunduh!`, 'success');
        })
        .catch((err: any) => {
          console.error(err);
          window.print();
        });
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300">
        {/* Modal Action Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-file-pdf text-[#E0516D]"></i>
            <h3 className="font-poppins font-bold text-sm">
              Laporan Evaluasi Resmi: {expedition.name} Logistics
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="bg-[#00ABE7] hover:bg-[#00ABE7]/90 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <i className="fa-solid fa-download"></i> Unduh PDF (A4)
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        {/* Printable A4 Container (styled with clean printable white paper) */}
        <div
          ref={reportRef}
          className="p-8 sm:p-10 bg-white text-slate-900 font-sans text-xs space-y-6"
        >
          {/* Header & Letterhead */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00ABE7] to-[#35C4C3] flex items-center justify-center text-white font-black text-xl shrink-0 overflow-hidden shadow">
                {logoSrc ? (
                  <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-truck-ramp-box"></i>
                )}
              </div>
              <div>
                <h1 className="font-poppins font-extrabold text-base tracking-tight text-slate-900 uppercase">
                  LOGIX MATRIX SUPPLY CHAIN CORP
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  Divisi Manajemen Distribusi &amp; Evaluasi Mitra Transporter
                </p>
                <p className="text-[9px] text-slate-400">
                  Gedung Menara Logistik Nasional Lt. 12, Kawasan Industri Terpadu
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] space-y-0.5">
              <p className="font-bold text-slate-800">LEMBAR EVALUASI AUDIT</p>
              <p className="text-slate-500">
                No. Dok: <strong className="font-mono text-slate-900">{docNo}</strong>
              </p>
              <p className="text-slate-500">
                Tanggal: <strong className="text-slate-900">{dateStr}</strong>
              </p>
            </div>
          </div>

          {/* Subject Banner */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Nama Mitra Ekspedisi:
              </span>
              <h2 className="font-poppins font-bold text-base text-slate-900">
                {expedition.name} Logistics Partnership
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                Klasifikasi Mutu:
              </span>
              <span
                className={`font-bold text-xs px-2.5 py-1 rounded-full border ${gradeBadgeClass}`}
              >
                {grade}
              </span>
            </div>
          </div>

          {/* Performance Metrics Table */}
          <div className="space-y-2">
            <h3 className="font-poppins font-bold text-xs text-slate-900 uppercase tracking-wider">
              I. Ringkasan Realisasi &amp; Kepatuhan SLA
            </h3>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 border border-slate-300">Parameter Evaluasi</th>
                  <th className="p-2 border border-slate-300 text-center">Target Acuan</th>
                  <th className="p-2 border border-slate-300 text-center">Pencapaian Aktual</th>
                  <th className="p-2 border border-slate-300 text-center">Status Pemenuhan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Alokasi Volume Pengiriman</td>
                  <td className="p-2 border border-slate-300 text-center">{expedition.kuota.toLocaleString()} Unit</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">
                    {expedition.realisasi.toLocaleString()} Unit
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {fulPct.toFixed(1)}% ({fulPct >= 95 ? 'Tercapai' : 'Kurang'})
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">On-Time Delivery (OTD)</td>
                  <td className="p-2 border border-slate-300 text-center">&gt;= 95.0%</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">
                    {expedition.otd.toFixed(1)}%
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {expedition.otd >= 95 ? 'Memenuhi SLA' : 'Di Bawah Standar SLA'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Not Ready For Sale (NRFS Defect)</td>
                  <td className="p-2 border border-slate-300 text-center">&lt;= 0.035%</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-amber-700">
                    {expedition.nrfs.toFixed(3)}%
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {expedition.nrfs <= 0.035 ? 'Sangat Baik' : 'Melebihi Toleransi'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Audit Notes & Recommendation */}
          <div className="space-y-3">
            <h3 className="font-poppins font-bold text-xs text-slate-900 uppercase tracking-wider">
              II. Catatan Tim Auditor &amp; Rekomendasi Alokasi
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] leading-relaxed space-y-1.5">
              <p>
                <strong>Kesimpulan Evaluasi:</strong> {auditSummary}
              </p>
              <p>
                <strong>Rekomendasi Operasional:</strong> {auditRec}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[11px]">
            <div>
              <p className="font-semibold text-slate-700">Disiapkan Oleh:</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">Distribution Officer</p>
              <p className="text-[10px] text-slate-400">Departemen Logistik</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Diverifikasi Oleh:</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">Lead QA &amp; SLA Auditor</p>
              <p className="text-[10px] text-slate-400">Kontrol Mutu &amp; Kepatuhan</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Disetujui Oleh:</p>
              <div className="h-14"></div>
              <p className="font-bold underline text-slate-900">VP Supply Chain Director</p>
              <p className="text-[10px] text-slate-400">Manajemen Pusat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
