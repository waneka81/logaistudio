import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { Sidebar } from './components/Sidebar';
import { HomeDashboardView } from './components/HomeDashboardView';
import { TransporterAnalysisView } from './components/TransporterAnalysisView';
import { LogisticsReportsView } from './components/LogisticsReportsView';
import { AiAnalystView } from './components/AiAnalystView';
import { UserRoleModal } from './components/UserRoleModal';
import { TargetKpiModal } from './components/TargetKpiModal';
import { A4PrintReportModal } from './components/A4PrintReportModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import {
  DashboardData,
  DistributionRow,
  AppPage,
  ThemeMode,
  ActiveFilters,
  SpreadsheetInfo,
  RegisteredUser,
  ExpeditionItem
} from './types';
import {
  defaultDashboardData,
  generateRowsFromDefaultData,
  cleanNumberInput,
  chartColorPalette,
  initialRegisteredUsers,
  defaultPasswords
} from './data/mockData';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  setAccessTokenInMemory
} from './services/auth';
import {
  createGoogleSpreadsheet,
  syncDistributionRowsToSheet,
  fetchDistributionRowsFromSheet
} from './services/googleSheets';

const STORAGE_KEY_DATA = 'logistics_dashboard_data_v2';
const STORAGE_KEY_ROWS = 'logistics_dashboard_rows_v2';
const STORAGE_KEY_THEME = 'logistics_theme_mode';
const STORAGE_KEY_PASSWORDS = 'logistics_passwords';
const STORAGE_KEY_LOGO = 'company_logo';
const STORAGE_KEY_SHEET = 'logistics_sheet_info';

export default function App() {
  // Theme mode: dark or light
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
    } else {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active page
  const [activePage, setActivePage] = useState<AppPage>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Logo
  const [logoSrc, setLogoSrc] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LOGO) || null;
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoSrc(base64);
        try {
          localStorage.setItem(STORAGE_KEY_LOGO, base64);
          showToast('Logo berhasil disimpan permanen!', 'success');
        } catch {
          showToast('Ukuran file logo terlalu besar untuk penyimpanan browser.', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Role & Users
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>('admin');
  const [userPasswords, setUserPasswords] = useState(defaultPasswords);
  const [registeredUsers] = useState<RegisteredUser[]>(initialRegisteredUsers);

  // Master Rows & Dashboard Data
  const [data, setData] = useState<DashboardData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) return JSON.parse(saved);
    } catch {}
    return JSON.parse(JSON.stringify(defaultDashboardData));
  });

  const [masterRows, setMasterRows] = useState<DistributionRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROWS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return generateRowsFromDefaultData();
  });

  // Active filters for Home Dashboard
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    depo: 'ALL',
    plant: 'ALL',
    expedition: 'ALL',
    month: 'ALL'
  });

  // Google Sheets integration state
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHEET);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [pdfCandidate, setPdfCandidate] = useState<ExpeditionItem | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Persist data & rows
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(masterRows));
  }, [masterRows]);

  useEffect(() => {
    if (spreadsheet) {
      localStorage.setItem(STORAGE_KEY_SHEET, JSON.stringify(spreadsheet));
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEET);
    }
  }, [spreadsheet]);

  // Auth listener
  useEffect(() => {
    const unsub = initAuth(
      (_, token) => setAccessTokenInMemory(token),
      () => setAccessTokenInMemory(null)
    );
    return () => unsub();
  }, []);

  // Process rows and recalculate dashboard metrics (exact match to target app)
  const processFlatRowData = (
    rows: DistributionRow[],
    isFilteredOrSync = false,
    showNotification = true
  ) => {
    if (!rows || rows.length === 0) return;

    if (!isFilteredOrSync) {
      setMasterRows(rows);
    }

    let ytdSum = 0;
    let nrfsUnitsSum = 0;
    let otdSum = 0;
    let validOtdCount = 0;
    let fileTargetYtd = 0;
    let fileTargetMtd = 0;

    const monthMap: Record<
      string,
      { actual: number; target: number; targetMtdCol: number; nrfsUnits: number; otdSum: number; otdCount: number }
    > = {};
    const plantMap: Record<string, number> = {};
    const depoMap: Record<string, number> = {};
    const expMap: Record<
      string,
      { kuota: number; realisasi: number; otdSum: number; count: number; nrfsUnits: number }
    > = {};

    rows.forEach((r) => {
      const ekspedisiName = String(r.Ekspedisi || r.Vendor || r.Mitra || '').trim();
      if (!ekspedisiName || ekspedisiName.toLowerCase() === 'nan' || ekspedisiName === 'undefined')
        return;

      const qty = cleanNumberInput(r.Qty || r.qty || r.Volume || r.volume);
      const nrfsUnits = cleanNumberInput(r.NRFS || r.nrfs || r.Cacat);
      const rawOtdVal = cleanNumberInput(r.OTD || r.otd || r.OnTime);

      const tYtd = cleanNumberInput(
        r.Target_YTD || r.TargetYTD || r.TargetYtd || r['Target YTD'] || r.target_ytd
      );
      if (tYtd > 0 && (fileTargetYtd === 0 || tYtd > fileTargetYtd)) fileTargetYtd = tYtd;

      const tMtd = cleanNumberInput(
        r.Target_MTD || r.TargetMTD || r.TargetMtd || r['Target MTD'] || r.target_mtd
      );
      if (tMtd > 0 && (fileTargetMtd === 0 || tMtd > fileTargetMtd)) fileTargetMtd = tMtd;

      let otdPct = 0;
      if (!isNaN(rawOtdVal) && rawOtdVal > 0) {
        otdPct = rawOtdVal <= 1.0 ? rawOtdVal * 100.0 : rawOtdVal;
        otdSum += otdPct;
        validOtdCount++;
      }

      ytdSum += qty;
      nrfsUnitsSum += nrfsUnits;

      const m = String(r.Month || r.Bulan || 'Sep').trim();
      if (!monthMap[m]) {
        monthMap[m] = { actual: 0, target: 0, targetMtdCol: 0, nrfsUnits: 0, otdSum: 0, otdCount: 0 };
      }
      monthMap[m].actual += qty;
      monthMap[m].nrfsUnits += nrfsUnits;
      if (otdPct > 0) {
        monthMap[m].otdSum += otdPct;
        monthMap[m].otdCount++;
      }
      if (tMtd > 0) monthMap[m].targetMtdCol = Math.max(monthMap[m].targetMtdCol, tMtd);

      const kuotaVal = cleanNumberInput(r.Kuota || r.Target || r.Target_Bulan) || qty * 1.05;
      monthMap[m].target += kuotaVal;

      const p = String(r.Plant || r.plant || r.Pabrik || 'Plant 1').trim();
      plantMap[p] = (plantMap[p] || 0) + qty;

      const d = String(r.Depo || r.Warehouse || r.Lokasi || 'Utama').trim();
      depoMap[d] = (depoMap[d] || 0) + qty;

      const e = ekspedisiName;
      if (!expMap[e]) expMap[e] = { kuota: 0, realisasi: 0, otdSum: 0, count: 0, nrfsUnits: 0 };
      expMap[e].realisasi += qty;
      expMap[e].kuota += kuotaVal;
      expMap[e].otdSum += otdPct;
      expMap[e].count++;
      expMap[e].nrfsUnits += nrfsUnits;
    });

    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as DashboardData;

      if (ytdSum > 0) {
        next.kpi.qtyYtd = ytdSum;
        next.kpi.qtyMtd = monthMap['Sep'] ? monthMap['Sep'].actual : Math.round(ytdSum * 0.1);
        next.kpi.qtyLastMonth = monthMap['Agu'] ? monthMap['Agu'].actual : Math.round(ytdSum * 0.09);
        next.kpi.nrfsRate = (nrfsUnitsSum / ytdSum) * 100;
        next.kpi.otdRate = validOtdCount > 0 ? otdSum / validOtdCount : 0;
      }
      if (fileTargetYtd > 0) next.kpi.targetYtd = fileTargetYtd;
      if (fileTargetMtd > 0) next.kpi.targetMtd = fileTargetMtd;

      if (Object.keys(monthMap).length > 0) {
        next.monthlyTrend = Object.keys(monthMap).map((m) => {
          const act = monthMap[m].actual;
          const nrfsPct = act > 0 ? (monthMap[m].nrfsUnits / act) * 100 : 0;
          const avgOtd = monthMap[m].otdCount > 0 ? monthMap[m].otdSum / monthMap[m].otdCount : 0;
          return {
            month: m,
            actual: Math.round(act),
            target: Math.round(monthMap[m].targetMtdCol || monthMap[m].target),
            nrfs: parseFloat(nrfsPct.toFixed(3)),
            otd: parseFloat(avgOtd.toFixed(1))
          };
        });
      }

      let plantColorIdx = 0;
      next.plantShare = Object.keys(plantMap).map((p) => {
        const pct = ytdSum > 0 ? parseFloat(((plantMap[p] / ytdSum) * 100).toFixed(1)) : 0;
        const color = chartColorPalette[plantColorIdx++ % chartColorPalette.length];
        return { name: p, volume: plantMap[p], pct, color };
      });

      let colorIdx = 0;
      next.depoShare = Object.keys(depoMap).map((d) => {
        const pct = ytdSum > 0 ? parseFloat(((depoMap[d] / ytdSum) * 100).toFixed(1)) : 0;
        const color = chartColorPalette[(colorIdx++ + 3) % chartColorPalette.length];
        return { name: d, volume: depoMap[d], pct, color };
      });

      next.expeditions = Object.keys(expMap).map((e) => ({
        name: e,
        kuota: Math.round(expMap[e].kuota),
        realisasi: Math.round(expMap[e].realisasi),
        otd: parseFloat((expMap[e].count > 0 ? expMap[e].otdSum / expMap[e].count : 0).toFixed(1)),
        nrfs:
          expMap[e].realisasi > 0
            ? parseFloat(((expMap[e].nrfsUnits / expMap[e].realisasi) * 100).toFixed(3))
            : 0.025
      }));

      return next;
    });

    if (showNotification) {
      showToast('Data berhasil diperbarui.', 'success');
    }
  };

  // Filter application on masterRows
  const applyFilterToDashboard = (filters: Partial<ActiveFilters>) => {
    const updated = { ...activeFilters, ...filters };
    setActiveFilters(updated);

    let filtered = [...masterRows];
    if (updated.depo !== 'ALL') {
      filtered = filtered.filter(
        (r) => String(r.Depo || r.Warehouse || '').toLowerCase() === updated.depo.toLowerCase()
      );
    }
    if (updated.plant !== 'ALL') {
      filtered = filtered.filter(
        (r) => String(r.Plant || '').toLowerCase() === updated.plant.toLowerCase()
      );
    }
    if (updated.expedition !== 'ALL') {
      filtered = filtered.filter(
        (r) => String(r.Ekspedisi || r.Vendor || '').toLowerCase() === updated.expedition.toLowerCase()
      );
    }
    if (updated.month !== 'ALL') {
      filtered = filtered.filter(
        (r) => String(r.Month || r.Bulan || '').toLowerCase() === updated.month.toLowerCase()
      );
    }

    if (filtered.length > 0) {
      processFlatRowData(filtered, true, false);
    }
  };

  const handleResetFilters = () => {
    setActiveFilters({ depo: 'ALL', plant: 'ALL', expedition: 'ALL', month: 'ALL' });
    processFlatRowData(masterRows, false, false);
  };

  // Google Sheets sync actions
  const requireAccessToken = async (): Promise<string> => {
    let token = await getAccessToken();
    if (!token) {
      const res = await googleSignIn();
      if (!res?.accessToken) {
        throw new Error('Diperlukan izin Google Workspace. Silakan masuk akun Google.');
      }
      token = res.accessToken;
    }
    return token;
  };

  const handleSyncGoogleSheet = async () => {
    try {
      setIsSyncing(true);
      const token = await requireAccessToken();

      let targetSheet = spreadsheet;
      if (!targetSheet) {
        showToast('Membuat spreadsheet baru di Google Drive...');
        const created = await createGoogleSpreadsheet(token, 'Database Distribusi & Logistik');
        targetSheet = {
          id: created.spreadsheetId,
          name: 'Database Distribusi & Logistik',
          url: created.spreadsheetUrl,
          sheetName: created.sheetTitle
        };
        setSpreadsheet(targetSheet);
      }

      await syncDistributionRowsToSheet(token, targetSheet.id, targetSheet.sheetName, masterRows);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      showToast('Sinkronisasi data Google Sheet berhasil!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal sinkronisasi ke Google Sheet', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull data from Google Sheet if connected
  const handleLoadFromGoogleSheet = async () => {
    if (!spreadsheet) {
      await handleSyncGoogleSheet();
      return;
    }
    try {
      setIsSyncing(true);
      const token = await requireAccessToken();
      const res = await fetchDistributionRowsFromSheet(token, spreadsheet.id, spreadsheet.sheetName);
      if (res.rows && res.rows.length > 0) {
        processFlatRowData(res.rows, false, true);
        showToast('Data berhasil dimuat dari Google Sheet!', 'success');
      } else {
        showToast('Spreadsheet kosong atau belum memiliki baris data.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error sinkronisasi', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectCustomSheet = async (sheetId: string) => {
    const token = await requireAccessToken();
    const res = await fetchDistributionRowsFromSheet(token, sheetId);
    const newSheet: SpreadsheetInfo = {
      id: sheetId,
      name: `Spreadsheet (${sheetId.slice(0, 8)}...)`,
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      sheetName: res.resolvedSheetTitle
    };
    setSpreadsheet(newSheet);
    if (res.rows && res.rows.length > 0) {
      processFlatRowData(res.rows, false, true);
    }
  };

  const handleCreateNewSheetExplicit = async (title: string) => {
    const token = await requireAccessToken();
    const created = await createGoogleSpreadsheet(token, title);
    const newSheet: SpreadsheetInfo = {
      id: created.spreadsheetId,
      name: title,
      url: created.spreadsheetUrl,
      sheetName: created.sheetTitle
    };
    setSpreadsheet(newSheet);
    await syncDistributionRowsToSheet(token, newSheet.id, newSheet.sheetName, masterRows);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // File upload handler (CSV, Excel, JSON)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              processFlatRowData(results.data as any, false, true);
            }
          }
        });
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = (event) => {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        if (rows && rows.length > 0) {
          processFlatRowData(rows as any, false, true);
        }
      };
      reader.readAsBinaryString(file);
    } else if (ext === 'json') {
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            processFlatRowData(json, false, true);
          }
        } catch {
          showToast('Format JSON tidak valid.', 'error');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      'Month;Plant;Depo;Ekspedisi;Qty;Kuota;NRFS;OTD;Target_YTD;Target_MTD;Target_NRFS;Target_OTD\n' +
      'Jan;Plant 1;Baros;TM;5000;4500;1;0,93;450000;42000;0,035%;95,0\n' +
      'Jan;Plant 2;Karawang;PUN;4200;4000;0;0,98;450000;42000;0,035%;95,0\n' +
      'Feb;Plant 1;Cirebon;RJTM;4800;4600;2;0,91;450000;42000;0,035%;95,0';

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const a = document.createElement('a');
    a.setAttribute('href', encodedUri);
    a.setAttribute('download', 'template_laporan_distribusi.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Template laporan CSV berhasil diunduh!', 'success');
  };

  // Reset default data
  const handleResetData = () => {
    const defaultDataCopy = JSON.parse(JSON.stringify(defaultDashboardData));
    const defaultRows = generateRowsFromDefaultData();
    setData(defaultDataCopy);
    setMasterRows(defaultRows);
    setActiveFilters({ depo: 'ALL', plant: 'ALL', expedition: 'ALL', month: 'ALL' });
    showToast('Data berhasil direset ke pengaturan default.', 'success');
  };

  // Switch role handler
  const handleSwitchRole = (role: 'admin' | 'user', pass: string): boolean => {
    if (pass === userPasswords[role]) {
      setCurrentUserRole(role);
      return true;
    }
    return false;
  };

  const handleChangePassword = (
    role: 'admin' | 'user',
    oldPass: string,
    newPass: string
  ): boolean => {
    if (oldPass === userPasswords[role] && newPass) {
      setUserPasswords((prev) => {
        const updated = { ...prev, [role]: newPass };
        localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(updated));
        return updated;
      });
      return true;
    }
    return false;
  };

  // Save custom targets from modal
  const handleSaveCustomTargets = (newYtd: number, newMtd: number) => {
    setData((prev) => ({
      ...prev,
      kpi: {
        ...prev.kpi,
        targetYtd: newYtd,
        targetMtd: newMtd
      }
    }));
    showToast('Target KPI berhasil diperbarui.', 'success');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-sm">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl border bg-slate-900 border-slate-700 text-slate-100 text-xs animate-in slide-in-from-bottom-5">
          <i
            className={`fa-solid ${
              toast.type === 'success'
                ? 'fa-circle-check text-[#35C4C3]'
                : 'fa-circle-exclamation text-[#E0516D]'
            }`}
          ></i>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-subtext hover:text-white cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUserRole={currentUserRole}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenTargetModal={() => setIsTargetModalOpen(true)}
        onSyncGoogleSheet={handleSyncGoogleSheet}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        isSheetsLinked={!!spreadsheet}
        isSyncing={isSyncing}
        onDownloadTemplate={handleDownloadTemplate}
        onResetData={handleResetData}
        onUploadFile={handleFileUpload}
        theme={theme}
        onToggleTheme={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        logoSrc={logoSrc}
        onLogoUpload={handleLogoUpload}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 p-1.5 h-full overflow-hidden">
        {activePage === 'home' && (
          <HomeDashboardView
            data={data}
            activeFilters={activeFilters}
            onFilterChange={applyFilterToDashboard}
            onResetFilters={handleResetFilters}
            onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
            isDarkMode={theme === 'dark'}
            onOpenTargetModal={() => setIsTargetModalOpen(true)}
            isAdmin={currentUserRole === 'admin'}
          />
        )}

        {activePage === 'vendor' && (
          <TransporterAnalysisView
            data={data}
            onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
            onDownloadPdfReport={(expName) => {
              const item = data.expeditions.find(
                (e) => e.name.toLowerCase() === expName.toLowerCase()
              );
              if (item) setPdfCandidate(item);
            }}
            isDarkMode={theme === 'dark'}
          />
        )}

        {activePage === 'reports' && (
          <LogisticsReportsView
            rows={masterRows}
            onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
            onSyncGoogleSheet={handleSyncGoogleSheet}
            isSyncing={isSyncing}
            onShowToast={showToast}
          />
        )}

        {activePage === 'ai' && (
          <AiAnalystView
            data={data}
            rows={masterRows}
            onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
          />
        )}
      </main>

      {/* User Role Modal */}
      <UserRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUserRole={currentUserRole}
        onSwitchRole={handleSwitchRole}
        onChangePassword={handleChangePassword}
        registeredUsers={registeredUsers}
        onShowToast={showToast}
      />

      {/* Target KPI Modal */}
      <TargetKpiModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        currentTargetYtd={data.kpi.targetYtd}
        currentTargetMtd={data.kpi.targetMtd}
        onSaveTargets={handleSaveCustomTargets}
      />

      {/* A4 Printable PDF Report Modal */}
      <A4PrintReportModal
        isOpen={!!pdfCandidate}
        onClose={() => setPdfCandidate(null)}
        expedition={pdfCandidate}
        logoSrc={logoSrc}
        onShowToast={showToast}
      />

      {/* Google Sheet Storage & Link Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        spreadsheet={spreadsheet}
        onSyncPush={handleSyncGoogleSheet}
        onSyncPull={handleLoadFromGoogleSheet}
        onConnectCustomSheet={handleConnectCustomSheet}
        onCreateNewSheet={handleCreateNewSheetExplicit}
        isSyncing={isSyncing}
        totalRows={masterRows.length}
        onShowToast={showToast}
      />
    </div>
  );
}
