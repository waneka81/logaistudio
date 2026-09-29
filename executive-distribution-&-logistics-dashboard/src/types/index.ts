export interface KpiData {
  qtyYtd: number;
  targetYtd: number;
  qtyMtd: number;
  targetMtd: number;
  qtyLastMonth: number;
  targetLastMonth: number;
  qtyN2: number;
  nrfsRate: number;
  targetNrfs: number;
  otdRate: number;
  targetOtd: number;
}

export interface MonthlyTrendItem {
  month: string;
  actual: number;
  target: number;
  nrfs: number;
  otd: number;
}

export interface ShareItem {
  name: string;
  volume: number;
  pct: number;
  color: string;
}

export interface ExpeditionItem {
  name: string;
  kuota: number;
  realisasi: number;
  otd: number;
  nrfs: number;
}

export interface DashboardData {
  kpi: KpiData;
  monthlyTrend: MonthlyTrendItem[];
  plantShare: ShareItem[];
  depoShare: ShareItem[];
  expeditions: ExpeditionItem[];
}

export interface DistributionRow {
  Month: string;
  Plant: string;
  Depo: string;
  Ekspedisi: string;
  Qty: number;
  Kuota: number;
  NRFS: number;
  OTD: number;
  Target_YTD?: number;
  Target_MTD?: number;
  [key: string]: any;
}

export interface RegisteredUser {
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheetName: string;
}

export type ThemeMode = 'dark' | 'light';

export type AppPage = 'home' | 'vendor' | 'reports' | 'ai';

export interface ActiveFilters {
  depo: string;
  plant: string;
  expedition: string;
  month: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  isRichHtml?: boolean;
}
