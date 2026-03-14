import React, { useState, useEffect } from 'react';

export interface FrequencyEntry {
  id: string;
  fields: Record<string, string>;
}

export interface FieldConfig {
  key: string;
  label: string;
  visible: boolean;
}

interface FrequencyTableProps {
  entries: FrequencyEntry[];
  fields: FieldConfig[];
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, fields: Record<string, string>) => void;
  onFieldsReorder?: (fields: FieldConfig[]) => void;
  tableVersion?: number;
  autoEditId?: string | null;
  onAutoEditDone?: () => void;
}

const FrequencyTable: React.FC<FrequencyTableProps> = ({
  entries,
  fields,
  onDelete,
  onSaveEdit,
  onFieldsReorder,
  tableVersion,
  autoEditId,
  onAutoEditDone
}) => {
  const [editRow, setEditRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [popup, setPopup] = useState<{ value: string; x: number; y: number } | null>(null);
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const nrField = fields.find(f => f.label.trim().toLowerCase() === 'nr' && f.visible);
  const firstVisibleField = fields.find(f => f.visible);
  const [sortKey, setSortKey] = useState<string | null>(
    nrField ? nrField.key : firstVisibleField ? firstVisibleField.key : null
  );
  const [sortAsc, setSortAsc] = useState(true);

  const startEdit = (entry: FrequencyEntry) => {
    setEditRow(entry.id);
    setEditValues(entry.fields);
  };

  const saveEdit = (id: string) => {
    onSaveEdit(id, editValues);
    setEditRow(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditRow(null);
    setEditValues({});
  };

  useEffect(() => {
    if (autoEditId) {
      const entry = entries.find(e => e.id === autoEditId);
      if (entry) {
        startEdit(entry);
        if (onAutoEditDone) onAutoEditDone();
      }
    }
  }, [autoEditId, entries]);

  const handleDragStart = (key: string) => setDragCol(key);
  const handleDragOver = (key: string) => setDragOverCol(key);
  const handleDrop = (key: string) => {
    if (dragCol && dragCol !== key && onFieldsReorder) {
      const fromIdx = fields.findIndex(f => f.key === dragCol);
      const toIdx = fields.findIndex(f => f.key === key);
      if (fromIdx === -1 || toIdx === -1) {
        setDragCol(null);
        setDragOverCol(null);
        return;
      }
      if (fromIdx === toIdx) {
        setDragCol(null);
        setDragOverCol(null);
        return;
      }
      const newFields = [...fields];
      const [moved] = newFields.splice(fromIdx, 1);
      let insertIdx = toIdx;
      if (fromIdx < toIdx) insertIdx = toIdx - 1;
      insertIdx = Math.max(0, Math.min(insertIdx, newFields.length));
      newFields.splice(insertIdx, 0, moved);
      const keysSet = new Set(newFields.map(f => f.key));
      if (newFields.length === fields.length && keysSet.size === fields.length) {
        onFieldsReorder(newFields);
      }
    }
    setDragCol(null);
    setDragOverCol(null);
  };

  const isNumericColumn = (key: string) => {
    return entries.some(e =>
      String(e.fields[key] ?? '').replace(/,/g, '.').match(/^\d+(\.\d+)?$/)
    );
  };

  const sortedEntries = React.useMemo(() => {
    if (!sortKey) return entries;
    const numeric = isNumericColumn(sortKey);
    return [...entries].sort((a, b) => {
      const va = String(a.fields[sortKey] ?? '');
      const vb = String(b.fields[sortKey] ?? '');
      if (numeric) {
        const na = parseFloat(va.replace(/,/g, '.'));
        const nb = parseFloat(vb.replace(/,/g, '.'));
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return sortAsc ? na - nb : nb - na;
      } else {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
    });
  }, [entries, sortKey, sortAsc, fields]);

  return (
    <div className="frequency-table">
      <table>
        <thead>
          <tr>
            {fields.filter(f => f.visible).map((field, colIdx) => {
              const labelLower = field.label.trim().toLowerCase();
              const isSpecial = ['shift', 'toon', 'toonsetting'].includes(labelLower);
              return (
                <th
                  key={field.key}
                  draggable={colIdx !== 0}
                  title={field.label}
                  onClick={() => {
                    setSortKey(field.key);
                    setSortAsc(a => (sortKey === field.key ? !a : true));
                  }}
                  onDragStart={e => {
                    if (colIdx === 0) return;
                    const th = e.currentTarget as HTMLElement;
                    const rect = th.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const width = rect.width;
                    if (x < width * 0.24 || x > width * 0.76) return;
                    handleDragStart(field.key);
                  }}
                  onDragOver={e => { if (colIdx !== 0) { e.preventDefault(); handleDragOver(field.key); } }}
                  onDrop={() => { if (colIdx !== 0) handleDrop(field.key); }}
                  className={dragOverCol === field.key ? 'drag-over' : ''}
                  style={isSpecial ? {
                    minWidth: '10ch', maxWidth: '10ch', width: '10ch',
                    position: 'relative', userSelect: 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', padding: 0, textAlign: 'left'
                  } : {
                    position: 'relative', userSelect: 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', padding: 0, textAlign: 'left'
                  }}
                >
                  <span style={{
                    pointerEvents: 'none', display: 'block',
                    width: '100%', textAlign: 'left', padding: '0 8px'
                  }}>
                    {field.label}
                  </span>
                </th>
              );
            })}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map(entry => (
            <tr key={entry.id}>
              {fields.filter(f => f.visible).map(field => (
                <td
                  key={field.key}
                  style={{
                    position: 'relative',
                    maxWidth: field.label.trim().toLowerCase() === 'omschrijving' ? 30 * 1.1 + 'ch' : 180,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    cursor: editRow === entry.id ? 'text' : entry.fields[field.key] ? 'pointer' : 'default'
                  }}
                  onClick={e => {
                    if (editRow === entry.id) return;
                    const value = entry.fields[field.key] || '';
                    if (value.length > 0) {
                      setPopup({ value, x: e.clientX, y: e.clientY });
                    }
                  }}
                >
                  {editRow === entry.id ? (
                    <input
                      type="text"
                      value={editValues[field.key] || ''}
                      onChange={e => setEditValues(v => ({ ...v, [field.key]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <span style={{
                      userSelect: 'text', WebkitUserSelect: 'text',
                      MozUserSelect: 'text', msUserSelect: 'text'
                    }}>
                      {entry.fields[field.key] || ''}
                    </span>
                  )}
                </td>
              ))}
              <td>
                {editRow === entry.id ? (
                  <span style={{ display: 'flex', flexDirection: 'row', gap: '0.2em', alignItems: 'center' }}>
                    <span
                      onClick={() => saveEdit(entry.id)}
                      style={{ cursor: 'pointer', color: '#4fa3ff', textDecoration: 'underline', fontSize: '0.9em' }}
                    >Save</span>
                    <span
                      onClick={cancelEdit}
                      style={{ cursor: 'pointer', color: '#888', textDecoration: 'underline', fontSize: '0.9em' }}
                    >Exit</span>
                  </span>
                ) : (
                  <span style={{ display: 'flex', flexDirection: 'row', gap: '0.2em', alignItems: 'center' }}>
                    <span
                      onClick={() => startEdit(entry)}
                      style={{ cursor: 'pointer', color: '#4fa3ff', textDecoration: 'underline', fontSize: '0.9em' }}
                    >Edit</span>
                    <span
                      onClick={() => onDelete(entry.id)}
                      style={{ cursor: 'pointer', color: '#e74c3c', textDecoration: 'underline', fontSize: '0.9em' }}
                    >Delete</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {popup && (
        <div
          style={{
            position: 'fixed', left: popup.x + 10, top: popup.y + 10,
            background: '#23272f', color: '#fff', border: '1px solid #4fa3ff',
            borderRadius: 6, padding: '0.7em 1.2em', zIndex: 9999,
            maxWidth: 400, maxHeight: 300, overflow: 'auto', fontSize: '1em',
            boxShadow: '0 2px 12px #0008', cursor: 'text', userSelect: 'text',
            whiteSpace: 'pre-wrap',
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <span style={{ userSelect: 'text' }}>{popup.value}</span>
          <span
            style={{
              position: 'absolute', top: 2, right: 8,
              color: '#4fa3ff', cursor: 'pointer', fontWeight: 700, fontSize: '1.2em'
            }}
            onClick={() => setPopup(null)}
          >×</span>
        </div>
      )}
    </div>
  );
};

export default FrequencyTable;