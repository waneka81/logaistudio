import { DistributionRow } from '../types';
import { cleanNumberInput } from '../data/mockData';

export const SHEET_HEADERS = [
  'Month',
  'Plant',
  'Depo',
  'Ekspedisi',
  'Qty',
  'Kuota',
  'NRFS',
  'OTD',
  'Target_YTD',
  'Target_MTD'
];

export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string = 'Executive Distribution & Logistics Data'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetTitle: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: `${title} - ${new Date().toLocaleDateString('id-ID')}`
      },
      sheets: [
        {
          properties: {
            title: 'Data Logistik',
            gridProperties: {
              frozenRowCount: 1
            }
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: SHEET_HEADERS.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                      backgroundColor: { red: 0, green: 0.67, blue: 0.9 }, // #00ABE7 brand blue
                      horizontalAlignment: 'CENTER'
                    }
                  }))
                }
              ]
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Gagal membuat Google Spreadsheet (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const sheetTitle = data.sheets?.[0]?.properties?.title || 'Data Logistik';

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTitle
  };
}

export async function syncDistributionRowsToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rows: DistributionRow[]
): Promise<void> {
  // Clear sheet content first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z10000:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const allValues = [
    SHEET_HEADERS,
    ...rows.map((r) => [
      r.Month || r.Bulan || '',
      r.Plant || '',
      r.Depo || r.Warehouse || '',
      r.Ekspedisi || r.Vendor || r.Mitra || '',
      r.Qty || 0,
      r.Kuota || 0,
      r.NRFS || 0,
      r.OTD || 0,
      r.Target_YTD || '',
      r.Target_MTD || ''
    ])
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1?valueInputOption=USER_ENTERED`;
  const res = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: allValues
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal menyimpan data ke Google Sheet');
  }
}

export async function fetchDistributionRowsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle?: string
): Promise<{ rows: DistributionRow[]; resolvedSheetTitle: string }> {
  let actualTitle: string = sheetTitle || '';
  if (!actualTitle) {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!metaRes.ok) {
      throw new Error(`Tidak dapat membuka spreadsheet (${metaRes.status})`);
    }
    const metaData = await metaRes.json();
    actualTitle = metaData.sheets?.[0]?.properties?.title || 'Data Logistik';
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(actualTitle)}!A1:Z5000`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengambil data dari Google Sheet (${response.status})`);
  }

  const data = await response.json();
  const rawRows: any[][] = data.values || [];

  if (rawRows.length <= 1) {
    return { rows: [], resolvedSheetTitle: actualTitle };
  }

  const headerRow = rawRows[0].map((h: any) => String(h || '').trim());
  const colIndex = (name: string) => headerRow.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const idxMonth = colIndex('month') !== -1 ? colIndex('month') : colIndex('bulan');
  const idxPlant = colIndex('plant') !== -1 ? colIndex('plant') : colIndex('pabrik');
  const idxDepo = colIndex('depo') !== -1 ? colIndex('depo') : colIndex('warehouse');
  const idxExp = colIndex('ekspedisi') !== -1 ? colIndex('ekspedisi') : colIndex('vendor');
  const idxQty = colIndex('qty') !== -1 ? colIndex('qty') : colIndex('volume');
  const idxKuota = colIndex('kuota') !== -1 ? colIndex('kuota') : colIndex('target');
  const idxNrfs = colIndex('nrfs') !== -1 ? colIndex('nrfs') : colIndex('cacat');
  const idxOtd = colIndex('otd') !== -1 ? colIndex('otd') : colIndex('ontime');
  const idxTYtd = colIndex('target_ytd') !== -1 ? colIndex('target_ytd') : colIndex('targetytd');
  const idxTMtd = colIndex('target_mtd') !== -1 ? colIndex('target_mtd') : colIndex('targetmtd');

  const rows: DistributionRow[] = rawRows.slice(1).map((r, index) => {
    return {
      Month: (idxMonth !== -1 ? r[idxMonth] : r[0]) || 'Sep',
      Plant: (idxPlant !== -1 ? r[idxPlant] : r[1]) || 'Plant 1',
      Depo: (idxDepo !== -1 ? r[idxDepo] : r[2]) || 'Utama',
      Ekspedisi: (idxExp !== -1 ? r[idxExp] : r[3]) || `Vendor ${index + 1}`,
      Qty: cleanNumberInput(idxQty !== -1 ? r[idxQty] : r[4]),
      Kuota: cleanNumberInput(idxKuota !== -1 ? r[idxKuota] : r[5]),
      NRFS: cleanNumberInput(idxNrfs !== -1 ? r[idxNrfs] : r[6]),
      OTD: cleanNumberInput(idxOtd !== -1 ? r[idxOtd] : r[7]),
      Target_YTD: idxTYtd !== -1 ? cleanNumberInput(r[idxTYtd]) : undefined,
      Target_MTD: idxTMtd !== -1 ? cleanNumberInput(r[idxTMtd]) : undefined
    };
  });

  return { rows, resolvedSheetTitle: actualTitle };
}
