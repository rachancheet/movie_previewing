import React, { useState, useEffect } from 'react';
import { List, AlertCircle, Plus, Trash2 } from 'lucide-react';

const Kanban = ({ reminders, setReminders }) => {
  const [columns, setColumns] = useState([]);

  // Initialize columns from reminders
  useEffect(() => {
    const lists = new Set();
    reminders.forEach(r => {
      lists.add(r.list_name || 'Uncategorized');
    });
    // Add default columns if none exist
    if (lists.size === 0) {
      lists.add('Uncategorized');
    }
    // Only update if different
    setColumns(prev => {
      const newCols = Array.from(lists);
      if (prev.length === 0) return newCols;
      // merge unique
      return Array.from(new Set([...prev, ...newCols]));
    });
  }, [reminders]);

  const handleDragStart = (e, reminderId) => {
    e.dataTransfer.setData('reminderId', reminderId);
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const reminderId = e.dataTransfer.getData('reminderId');
    if (!reminderId) return;

    const listName = targetColumn === 'Uncategorized' ? null : targetColumn;

    setReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, list_name: listName } : r
    ));
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const addColumn = () => {
    const name = prompt("Enter new column name:");
    if (name && !columns.includes(name)) {
      setColumns([...columns, name]);
    }
  };

  const deleteColumn = (colName) => {
    if (colName === 'Uncategorized') {
      alert("Cannot delete Uncategorized column");
      return;
    }
    if (confirm(`Delete column "${colName}"? All reminders inside will be moved to Uncategorized.`)) {
      setColumns(columns.filter(c => c !== colName));
      setReminders(prev => prev.map(r => 
        r.list_name === colName ? { ...r, list_name: null } : r
      ));
    }
  };

  return (
    <div className="view-container kanban-board">
      {columns.map(col => {
        const colItems = reminders.filter(r => (r.list_name || 'Uncategorized') === col);
        
        return (
          <div 
            key={col} 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, col)}
            onDragOver={handleDragOver}
          >
            <div className="kanban-header">
              <span>{col} ({colItems.length})</span>
              {col !== 'Uncategorized' && (
                <button 
                  className="btn-icon" 
                  style={{ width: 24, height: 24, border: 'none' }} 
                  onClick={() => deleteColumn(col)}
                  title="Delete Column"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            
            <div className="kanban-list">
              {colItems.map(r => (
                <div 
                  key={r.id} 
                  className="reminder-item glass-panel"
                  draggable
                  onDragStart={(e) => handleDragStart(e, r.id)}
                  style={{ cursor: 'grab' }}
                >
                  <div className="reminder-content">
                    <div className="reminder-title" style={{ fontSize: '1rem' }}>
                      {r.title}
                    </div>
                    {r.notes && (
                      <div className="reminder-notes" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                        {r.notes}
                      </div>
                    )}
                    <div className="reminder-meta" style={{ marginTop: '8px' }}>
                      {r.priority > 0 && (
                        <div className="meta-item badge badge-urgent" style={{ fontSize: '0.65rem' }}>
                          <AlertCircle size={10} /> Urgent
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <button className="add-column-btn" onClick={addColumn}>
        <Plus size={20} /> Add Column
      </button>
    </div>
  );
};

export default Kanban;
