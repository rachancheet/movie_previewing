import React from 'react';
import { Calendar as CalendarIcon, List, AlertCircle } from 'lucide-react';

const ListView = ({ reminders }) => {
  if (reminders.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No reminders found. Sync from your iPhone!</div>;
  }

  return (
    <div className="view-container">
      <div className="reminder-list">
        {reminders.map(r => (
          <div key={r.id} className="reminder-item glass-panel">
            <div className="reminder-content">
              <div className="reminder-title">
                {r.title}
                {r.is_completed && <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>Done</span>}
              </div>
              {r.notes && <div className="reminder-notes">{r.notes}</div>}
              <div className="reminder-meta">
                {r.list_name && (
                  <div className="meta-item badge badge-list">
                    <List size={12} /> {r.list_name}
                  </div>
                )}
                {r.due_date && (
                  <div className="meta-item">
                    <CalendarIcon size={12} /> {new Date(r.due_date).toLocaleDateString()}
                  </div>
                )}
                {r.priority > 0 && (
                  <div className="meta-item badge badge-urgent">
                    <AlertCircle size={12} /> Urgent
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListView;
