import { DashboardData, DistributionRow, RegisteredUser } from '../types';

export const chartColorPalette = [
  '#00ABE7',
  '#35C4C3',
  '#69DC9E',
  '#F59700',
  '#E0516D',
  '#7b68ee',
  '#20b2aa',
  '#ff69b4',
  '#87cefa'
];

export const defaultDashboardData: DashboardData = {
  kpi: {
    qtyYtd: 421300,
    targetYtd: 450000,
    qtyMtd: 39500,
    targetMtd: 42000,
    qtyLastMonth: 51000,
    targetLastMonth: 50000,
    qtyN2: 47800,
    nrfsRate: 0.025,
    targetNrfs: 0.035,
    otdRate: 93.5,
    targetOtd: 95.0
  },
  monthlyTrend: [
    { month: 'Jan', actual: 44600, target: 45000, nrfs: 0.022, otd: 93.5 },
    { month: 'Feb', actual: 47800, target: 45000, nrfs: 0.030, otd: 91.8 },
    { month: 'Mar', actual: 47800, target: 48000, nrfs: 0.028, otd: 92.4 },
    { month: 'Apr', actual: 47800, target: 48000, nrfs: 0.031, otd: 94.0 },
    { month: 'Mei', actual: 47800, target: 48000, nrfs: 0.027, otd: 91.5 },
    { month: 'Jun', actual: 47800, target: 48000, nrfs: 0.029, otd: 93.0 },
    { month: 'Jul', actual: 47800, target: 48000, nrfs: 0.026, otd: 90.8 },
    { month: 'Agu', actual: 51000, target: 50000, nrfs: 0.032, otd: 92.0 },
    { month: 'Sep', actual: 39500, target: 42000, nrfs: 0.025, otd: 93.5 }
  ],
  plantShare: [
    { name: 'Plant 1', volume: 252780, pct: 60.0, color: '#00ABE7' },
    { name: 'Plant 2', volume: 168520, pct: 40.0, color: '#35C4C3' }
  ],
  depoShare: [
    { name: 'Karawang', volume: 189585, pct: 45.0, color: '#00ABE7' },
    { name: 'Baros', volume: 158830, pct: 37.7, color: '#35C4C3' },
    { name: 'Cirebon', volume: 72885, pct: 17.3, color: '#69DC9E' }
  ],
  expeditions: [
    { name: 'TM', kuota: 135000, realisasi: 136000, otd: 94.0, nrfs: 0.022 },
    { name: 'RJTM', kuota: 110000, realisasi: 105000, otd: 89.0, nrfs: 0.031 },
    { name: 'PUN', kuota: 70000, realisasi: 68000, otd: 98.5, nrfs: 0.019 },
    { name: 'WSS', kuota: 60000, realisasi: 58000, otd: 92.0, nrfs: 0.028 },
    { name: 'LBK', kuota: 55000, realisasi: 54300, otd: 91.5, nrfs: 0.024 }
  ]
};

export function cleanNumberInput(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let s = String(val).trim().replace(/%/g, '');
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  } else if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

export function generateRowsFromDefaultData(): DistributionRow[] {
  const generated: DistributionRow[] = [];
  defaultDashboardData.monthlyTrend.forEach((m) => {
    defaultDashboardData.plantShare.forEach((p) => {
      defaultDashboardData.depoShare.forEach((d) => {
        defaultDashboardData.expeditions.forEach((e) => {
          const totalReal = defaultDashboardData.expeditions.reduce((acc, x) => acc + x.realisasi, 0);
          const weight = (p.pct / 100) * (d.pct / 100) * (e.realisasi / totalReal);
          const qty = Math.round(m.actual * weight * 2);
          if (qty > 0) {
            generated.push({
              Month: m.month,
              Plant: p.name,
              Depo: d.name,
              Ekspedisi: e.name,
              Qty: qty,
              Kuota: Math.round(e.kuota / 12),
              NRFS: Math.round(qty * (e.nrfs / 100)),
              OTD: e.otd,
              Target_YTD: defaultDashboardData.kpi.targetYtd,
              Target_MTD: defaultDashboardData.kpi.targetMtd
            });
          }
        });
      });
    });
  });
  return generated;
}

export const initialRegisteredUsers: RegisteredUser[] = [
  { username: 'Administrator', email: 'admin@logistics.com', role: 'admin' },
  { username: 'Staff Logistik', email: 'staff@logistics.com', role: 'user' },
  { username: 'Viewer Executive', email: 'executive@logistics.com', role: 'user' }
];

export const defaultPasswords = {
  admin: 'admin123',
  user: 'user123'
};
