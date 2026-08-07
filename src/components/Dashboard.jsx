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
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [selectedListsToCopy, setSelectedListsToCopy] = useState([]);

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

  const generateMarkdown = (selectedLists) => {
    let md = "# 📱 My Reminders\n\n";
    
    // Group by list name
    const grouped = reminders.reduce((acc, r) => {
      const listName = r.list_name || "Uncategorized";
      if (selectedLists.length === 0 || selectedLists.includes(listName)) {
        if (!acc[listName]) acc[listName] = [];
        acc[listName].push(r);
      }
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
    const md = generateMarkdown(selectedListsToCopy);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setShowCopyMenu(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleListSelection = (list) => {
    setSelectedListsToCopy(prev => 
      prev.includes(list) ? prev.filter(l => l !== list) : [...prev, list]
    );
  };

  const lists = Array.from(new Set(reminders.map(r => r.list_name || "Uncategorized")));

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

      {showCopyMenu && (
        <div className="glass-panel" style={{ position: 'fixed', bottom: '90px', right: '30px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 100, minWidth: '200px' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Lists to Copy</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '5px 0' }}>
            {lists.map(list => (
              <label key={list} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedListsToCopy.includes(list)}
                  onChange={() => toggleListSelection(list)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>{list}</span>
              </label>
            ))}
          </div>
          <button className="btn" style={{ justifyContent: 'center', marginTop: '5px' }} onClick={handleCopyMarkdown}>
            Copy Selected
          </button>
        </div>
      )}

      <button className="fab" onClick={() => setShowCopyMenu(!showCopyMenu)} title="Copy to Markdown">
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
