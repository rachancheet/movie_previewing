import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Kanban = ({ reminders, setReminders }) => {
  const [columns, setColumns] = useState([]);

  // Initialize columns from reminders
  useEffect(() => {
    const lists = new Set();
    reminders.forEach(r => {
      lists.add(r.list_name || 'Uncategorized');
    });
    if (lists.size === 0) {
      lists.add('Uncategorized');
    }
    setColumns(prev => {
      const newCols = Array.from(lists);
      if (prev.length === 0) return newCols;
      return Array.from(new Set([...prev, ...newCols]));
    });
  }, [reminders]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const reminderId = result.draggableId;
    const targetColumn = result.destination.droppableId;
    const listName = targetColumn === 'Uncategorized' ? null : targetColumn;

    // Local state update
    setReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, list_name: listName } : r
    ));

    // API update
    try {
      await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reminderId, list_name: listName })
      });
    } catch (err) {
      console.error('Failed to update reminder:', err);
    }
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="view-container kanban-board">
        {columns.map(col => {
          const colItems = reminders.filter(r => (r.list_name || 'Uncategorized') === col);
          
          return (
            <Droppable droppableId={col} key={col}>
              {(provided) => (
                <div 
                  className="kanban-column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
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
                  
                  <div className="kanban-list" style={{ flexGrow: 1, minHeight: '100px' }}>
                    {colItems.map((r, index) => (
                      <Draggable key={r.id} draggableId={r.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            className="reminder-item glass-panel"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.9 : 1,
                              transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'none',
                              boxShadow: snapshot.isDragging ? '0 5px 15px rgba(255,255,255,0.2)' : 'none',
                              borderColor: snapshot.isDragging ? '#fff' : 'var(--panel-border)',
                              zIndex: snapshot.isDragging ? 100 : 1,
                            }}
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}

        <button className="add-column-btn" onClick={addColumn}>
          <Plus size={20} /> Add Column
        </button>
      </div>
    </DragDropContext>
  );
};

export default Kanban;
