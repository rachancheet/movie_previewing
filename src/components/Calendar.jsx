import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ reminders }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Get reminders for this day
      const dayReminders = reminders.filter(r => r.due_date && isSameDay(new Date(r.due_date), cloneDay));

      days.push(
        <div 
          className={`calendar-day glass-panel ${!isSameMonth(day, monthStart) ? "other-month" : ""} ${isSameDay(day, new Date()) ? "today" : ""}`} 
          key={day}
        >
          <div className="calendar-date">{formattedDate}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {dayReminders.map(r => (
              <div key={r.id} className={`calendar-reminder ${r.priority > 0 ? 'urgent' : ''}`} title={r.title}>
                {r.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="calendar-grid" key={day} style={{ marginBottom: '10px' }}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="view-container">
      <div className="header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
          <button className="btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="calendar-grid" style={{ marginBottom: '10px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
      </div>
      <div className="calendar-body">
        {rows}
      </div>
    </div>
  );
};

export default CalendarView;
