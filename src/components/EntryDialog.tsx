import React, { useState } from 'react';
import type { FieldConfig } from './FrequencyTable';

interface EntryDialogProps {
  open: boolean;
  fields: FieldConfig[];
  initial?: Record<string, string>;
  onSave: (fields: Record<string, string>) => void;
  onClose: () => void;
}

const EntryDialog: React.FC<EntryDialogProps> = ({ open, fields, initial = {}, onSave, onClose }) => {
  const [values, setValues] = useState<Record<string, string>>(initial);

  React.useEffect(() => {
    setValues(initial);
  }, [initial, open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{initial ? 'Edit Entry' : 'New Entry'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave(values);
          }}
        >
          {fields.filter(f => f.visible).map(field => (
            <div key={field.key} className="form-row">
              <label>{field.label}</label>
              <input
                type="text"
                value={values[field.key] || ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryDialog;
