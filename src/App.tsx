import React, { useState, useEffect } from 'react';
import FrequencyTable from './components/FrequencyTable';
import type { FrequencyEntry, FieldConfig } from './components/FrequencyTable';
import Settings from './components/Settings';
import { saveData, loadData, exportXLSX, importXLSX } from './utils/persistence';
import './App.css';

const defaultFields: FieldConfig[] = Array.from({ length: 20 }, (_, i) => ({
  key: `field${i + 1}`,
  label: `Field ${i + 1}`,
  visible: true
}));

const FIELDS_KEY = 'frequency-fields';
const ENTRIES_KEY = 'frequency-entries';

function mergeFields(saved: FieldConfig[], defaults: FieldConfig[]): FieldConfig[] {
  const map = new Map(saved.map(f => [f.key, f]));
  return defaults.map(def => map.get(def.key) || def);
}

function App() {
  const [fields, setFields] = useState<FieldConfig[]>(() => {
    const saved = loadData(FIELDS_KEY, []);
    return mergeFields(saved, defaultFields);
  });
  const [entries, setEntries] = useState<FrequencyEntry[]>(() => loadData(ENTRIES_KEY, []));
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [tableVersion, setTableVersion] = useState(0);
  const [autoEditId, setAutoEditId] = useState<string | null>(null);

  const handleFieldChange = (key: string, changes: Partial<FieldConfig>) => {
    setFields(fields => fields.map(f => f.key === key ? { ...f, ...changes } : f));
  };

  const handleAdd = () => {
    const newId = Date.now().toString();
    const newEntry: FrequencyEntry = {
      id: newId,
      fields: Object.fromEntries(fields.map(f => [f.key, '']))
    };
    setEntries(entries => [...entries, newEntry]);
    setAutoEditId(newId);
    setTableVersion(v => v + 1);
  };

  const handleDelete = (id: string) => {
    setEntries(entries => entries.filter(e => e.id !== id));
    setTableVersion(v => v + 1);
  };

  const filteredEntries = entries.filter(entry =>
    fields.some(f => {
      const value = entry.fields[f.key];
      if (typeof value !== 'string') return false;
      return value.toLowerCase().includes(search.toLowerCase());
    })
  );

  useEffect(() => { saveData(FIELDS_KEY, fields); }, [fields]);
  useEffect(() => { saveData(ENTRIES_KEY, entries); }, [entries]);
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="app-container">
      <header>
        <h1>Ham Radio Frequency Database</h1>
        <div className="header-actions">
          <div className="theme-switch">
            <div
              className={`theme-slider${theme === 'light' ? ' light' : ''}`}
              onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="slider-thumb" />
              <span className="slider-icon">{theme === 'dark' ? '🌙' : '☀'}</span>
            </div>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(s => !s)}>
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>
        </div>
      </header>

      {showSettings ? (
        <>
          <div className="settings-export-import-row" style={{ display: 'flex', gap: '1em', marginBottom: '1em' }}>
            <button onClick={() => exportXLSX(fields, entries)}>Export</button>
            <button onClick={async () => {
              try {
                const { fields: newFields, entries: newEntries } = await importXLSX();
                setFields(newFields);
                setEntries(newEntries);
                setTableVersion(v => v + 1);
              } catch (e) {
                alert('Import failed: ' + e);
              }
            }}>Import</button>
          </div>
          <Settings
            fields={fields}
            onFieldChange={handleFieldChange}
            onDeleteAllEntries={() => setEntries([])}
          />
        </>
      ) : (
        <>
          <div className="search-bar-row">
            <input
              className="search-bar"
              type="text"
              placeholder="Search all fields..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={handleAdd}>New Entry</button>
          </div>
          <FrequencyTable
            entries={filteredEntries}
            fields={fields}
            onDelete={handleDelete}
            onSaveEdit={(id, newFields) => {
              setEntries(entries =>
                entries.map(e => e.id === id ? { ...e, fields: newFields } : e)
              );
              setTableVersion(v => v + 1);
            }}
            onFieldsReorder={setFields}
            tableVersion={tableVersion}
            autoEditId={autoEditId}
            onAutoEditDone={() => setAutoEditId(null)}
          />
        </>
      )}
    </div>
  );
}

export default App;