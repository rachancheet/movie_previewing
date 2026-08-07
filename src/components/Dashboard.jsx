import React, { useState, useEffect } from 'react';
import { Copy, LayoutList, Columns, Calendar as CalendarIcon, Check } from 'lucide-react';
import Kanban from './Kanban';
import CalendarView from './Calendar';
import ListView from './ListView';

const Dashboard = () => {
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('kanban');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      setReminders(data);
    } catch (e) {
      console.error("Error fetching reminders", e);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = () => {
    let md = "# 📱 My Reminders\n\n";
    
    // Group by list name
    const grouped = reminders.reduce((acc, r) => {
      const listName = r.list_name || "Uncategorized";
      if (!acc[listName]) acc[listName] = [];
      acc[listName].push(r);
      return acc;
    }, {});

    for (const [listName, items] of Object.entries(grouped)) {
      md += `## 📋 List: ${listName}\n\n`;
      items.forEach(r => {
        const checkbox = r.is_completed ? "[x]" : "[ ]";
        const urgent = r.priority > 0 ? " **[URGENT]**" : "";
        const dateStr = r.due_date ? ` (Due: ${new Date(r.due_date).toLocaleString()})` : "";
        md += `- ${checkbox} ${r.title}${urgent}${dateStr}\n`;
        if (r.notes) {
          const indentedNotes = r.notes.split('\n').map(line => `  > ${line}`).join('\n');
          md += `${indentedNotes}\n`;
        }
      });
      md += "\n";
    }
    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="dashboard">
      <header className="header glass-panel" style={{ padding: '20px 30px' }}>
        <h1>Reminders</h1>
      </header>

      <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="nav-tabs">
          <button 
            className={`btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <LayoutList size={18} /> List
          </button>
          <button 
            className={`btn ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <Columns size={18} /> Kanban
          </button>
          <button 
            className={`btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={18} /> Calendar
          </button>
        </div>

        <div style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--primary-color)' }}>Loading Reminders...</div>
          ) : (
            <>
              {activeTab === 'list' && <ListView reminders={reminders} />}
              {activeTab === 'kanban' && <Kanban reminders={reminders} setReminders={setReminders} />}
              {activeTab === 'calendar' && <CalendarView reminders={reminders} />}
            </>
          )}
        </div>
      </div>

      <button className="fab" onClick={handleCopyMarkdown} title="Copy to Markdown">
        {copied ? <Check size={28} /> : <Copy size={28} />}
      </button>

      {copied && (
        <div className="toast glass-panel">
          Copied for AI ✨
        </div>
      )}
    </div>
  );
};

export default Dashboard;
