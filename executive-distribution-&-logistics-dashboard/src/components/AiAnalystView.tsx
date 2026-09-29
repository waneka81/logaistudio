import React, { useState, useRef, useEffect } from 'react';
import { DashboardData, DistributionRow, ChatMessage } from '../types';
import { askLogisticsAI } from '../services/ai';

interface AiAnalystViewProps {
  data: DashboardData;
  rows: DistributionRow[];
  onToggleSidebar: () => void;
}

export const AiAnalystView: React.FC<AiAnalystViewProps> = ({
  data,
  rows,
  onToggleSidebar
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo! Saya adalah **Executive Logistics AI Analyst**. Saya siap membantu menganalisis data operasional distribusi Anda, membedah performa transporter (OTD, NRFS defect), serta memberikan rekomendasi alokasi kuota berbasis data riil spreadsheet.

Silakan pilih salah satu pertanyaan cepat di atas atau ajukan pertanyaan spesifik Anda di bawah ini!`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isRichHtml: false
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'Analisis performa transporter dengan OTD terendah dan rekomendasinya',
    'Ringkasan pencapaian volume YTD vs target tahun berjalan',
    'Rekomendasi optimasi alokasi kuota depo Karawang vs Baros',
    'Evaluasi kepatuhan kualitas NRFS armada distribusi'
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await askLogisticsAI(query, data, rows);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        isRichHtml: true
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Maaf, terjadi kesalahan saat memproses prompt: ${err.message || 'Error analitik'}`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Convert simple markdown tables, bold, bullets to HTML
  const formatMarkdown = (content: string): string => {
    let out = content;

    // Process tables
    const tableRegex = /\|(.+)\|\n\|(?:\s*[-:]+[-| :]*)\|\n((?:\|.*\|\n?)+)/g;
    out = out.replace(tableRegex, (match, headerLine, bodyLines) => {
      const headers = headerLine.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyLines.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );

      const thead = `<thead class="bg-slate-900/80 text-subtext font-semibold text-[11px]"><tr>${headers
        .map((h: string) => `<th class="p-2 border border-slate-700/60">${h}</th>`)
        .join('')}</tr></thead>`;

      const tbody = `<tbody class="divide-y divide-slate-800 text-[11px]">${rows
        .map(
          (r: string[]) =>
            `<tr class="hover:bg-slate-800/40">${r
              .map((c: string) => `<td class="p-2 border border-slate-800/60">${c}</td>`)
              .join('')}</tr>`
        )
        .join('')}</tbody>`;

      return `<div class="overflow-x-auto my-2.5 rounded-xl border border-slate-700/60"><table class="w-full text-left border-collapse">${thead}${tbody}</table></div>`;
    });

    // Replace bold
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace status badges
    out = out.replace(/Grade A/g, '<span class="bg-[#69DC9E]/20 text-[#69DC9E] font-bold px-1.5 py-0.5 rounded text-[10px]">Grade A</span>');
    out = out.replace(/Grade B/g, '<span class="bg-[#F59700]/20 text-[#F59700] font-bold px-1.5 py-0.5 rounded text-[10px]">Grade B</span>');
    out = out.replace(/Grade C/g, '<span class="bg-[#E0516D]/20 text-[#E0516D] font-bold px-1.5 py-0.5 rounded text-[10px]">Grade C</span>');
    out = out.replace(/\bAman\b/g, '<span class="text-[#35C4C3] font-bold">Aman</span>');
    out = out.replace(/\bTerlambat\b/g, '<span class="text-[#E0516D] font-bold">Terlambat</span>');
    out = out.replace(/\bWarning\b/g, '<span class="text-[#F59700] font-bold">Warning</span>');

    // Bullet points
    out = out.replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc text-slate-200 my-0.5">$1</li>');

    // Line breaks
    out = out.replace(/\n\n/g, '<br/><br/>');

    return out;
  };

  return (
    <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
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
          <div className="w-9 h-9 rounded-xl bg-[#00ABE7]/15 border border-[#00ABE7]/30 text-[#00ABE7] flex items-center justify-center text-base shrink-0">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div>
            <h2 className="font-poppins text-sm font-bold tracking-tight flex items-center gap-1.5 leading-tight">
              AI Analyst Page
              <span className="text-[10px] text-[#35C4C3] font-semibold bg-[#35C4C3]/15 px-1.5 py-0.5 rounded border border-[#35C4C3]/30">
                Logistics Intelligence
              </span>
            </h2>
            <p className="text-[11px] text-subtext">Asisten Analisis Prediktif &amp; Optimasi Armada Logistik</p>
          </div>
        </div>
      </header>

      {/* Quick Prompts Bar */}
      <section className="card p-2 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs">
        <span className="text-[10px] text-subtext uppercase font-bold shrink-0 flex items-center gap-1">
          <i className="fa-solid fa-bolt text-[#F59700]"></i> Cepat:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="whitespace-nowrap bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-subtext hover:text-white px-2.5 py-1 rounded-xl text-[11px] transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </section>

      {/* Chat Messages Container */}
      <section className="card p-3 flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-subtext">
                <i className={`fa-solid ${m.sender === 'user' ? 'fa-user text-[#00ABE7]' : 'fa-robot text-[#35C4C3]'}`}></i>
                <span>{m.sender === 'user' ? 'Anda' : 'Logistics AI'}</span>
                <span>&bull;</span>
                <span>{m.time}</span>
              </div>
              <div
                className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#00ABE7] text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-none shadow-sm'
                }`}
              >
                {m.isRichHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(m.text) }}
                    className="prose prose-invert prose-xs max-w-none"
                  />
                ) : (
                  <p className="whitespace-pre-line">{m.text}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex flex-col items-start">
              <div className="bg-slate-800 border border-slate-700 text-slate-200 p-3 rounded-2xl rounded-tl-none mr-auto max-w-[85%] text-xs flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin text-[#00ABE7]"></i>
                <span>AI sedang menganalisis data spreadsheet dengan format visual rich...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-[#2a3b52] flex items-center gap-2 mt-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanyakan analisis SLA, rekomendasi kuota ekspedisi, atau audit NRFS..."
            disabled={loading}
            className="flex-1 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-subtext outline-none focus:border-[#00ABE7] transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputPrompt.trim()}
            className="bg-[#00ABE7] hover:bg-[#00ABE7]/90 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow"
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span>Kirim</span>
          </button>
        </div>
      </section>
    </div>
  );
};
