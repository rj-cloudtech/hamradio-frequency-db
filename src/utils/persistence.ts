import * as XLSX from 'xlsx';
import type { FieldConfig, FrequencyEntry } from '../components/FrequencyTable';

// Utility for persisting and loading app data using localStorage (for Electron, can be replaced with filesystem later)
export function saveData<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadData<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function exportData(data: object) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'frequency-db.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(): Promise<any> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      if (!input.files?.length) return reject('No file selected');
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function exportXLSX(fields: FieldConfig[], entries: FrequencyEntry[]) {
  const visibleFields = fields;
  const wsData = [
    visibleFields.map(f => f.label),
    ...entries.map(e => visibleFields.map(f => e.fields[f.key] || ''))
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Database');
  XLSX.writeFile(wb, 'frequency-db.xlsx');
}

export function importXLSX(): Promise<{fields: FieldConfig[], entries: FrequencyEntry[]}> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.onchange = () => {
      if (!input.files?.length) return reject('No file selected');
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const ws = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
          if (!rows.length) return reject('No data');
          const fieldLabels = rows[0];
          const fields: FieldConfig[] = fieldLabels.map((label, i) => ({
            key: `field${i + 1}`,
            label: label || `Field ${i + 1}`,
            visible: true
          }));
          const entries: FrequencyEntry[] = rows.slice(1).map((row, idx) => ({
            id: Date.now().toString() + '-' + idx,
            fields: Object.fromEntries(fields.map((f, i) => [f.key, row[i] || '']))
          }));
          resolve({ fields, entries });
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  });
}
