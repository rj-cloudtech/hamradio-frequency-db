import React from 'react';
import type { FieldConfig } from './FrequencyTable';

interface SettingsProps {
  fields: FieldConfig[];
  onFieldChange: (key: string, changes: Partial<FieldConfig>) => void;
  onDeleteAllEntries?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ fields, onFieldChange, onDeleteAllEntries }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);
  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      {onDeleteAllEntries && (
        <div style={{ marginBottom: '1em' }}>
          <button style={{ background: '#e74c3c', color: '#fff' }} onClick={() => setShowConfirm(true)}>
            Delete All Entries
          </button>
          {showConfirm && (
            <div style={{ marginTop: '0.7em', background: '#23272f', color: '#fff', padding: '1em', borderRadius: 8, border: '1px solid #e74c3c' }}>
              <div style={{ marginBottom: '0.7em' }}>Are you sure you want to delete <b>all entries</b>?</div>
              <button style={{ background: '#e74c3c', color: '#fff', marginRight: 8 }} onClick={() => { onDeleteAllEntries(); setShowConfirm(false); }}>Yes, delete all</button>
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Label</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(field => (
            <tr key={field.key}>
              <td>{field.key}</td>
              <td>
                <input
                  type="text"
                  value={field.label}
                  onChange={e => onFieldChange(field.key, { label: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={field.visible}
                  onChange={e => onFieldChange(field.key, { visible: e.target.checked })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Settings;
