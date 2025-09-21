import React, { useState, useMemo } from "react";

// Types
type Status = "pending" | "inprogress" | "completed";

interface Task {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  status: Status;
  note?: string;
}

const STATUS_META: Record<
  Status,
  { label: string; bgColor: string; textColor: string; badgeColor: string }
> = {
  pending: {
    label: "Pending",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    badgeColor: "bg-red-500",
  },
  inprogress: {
    label: "In Progress",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    badgeColor: "bg-yellow-400",
  },
  completed: {
    label: "Completed",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    badgeColor: "bg-green-500",
  },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray: number[] = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(0);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);
  while (daysArray.length % 7 !== 0) daysArray.push(0);
  return daysArray;
}

function formatDate(year: number, month: number, day: number) {
  const mm = (month + 1).toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function tasksByDate(tasks: Task[], date: string) {
  return tasks.filter((t) => t.date === date);
}

export default function Calendar() {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const dummyTasks: Task[] = [
    { id: "1", title: "Complete project setup", date: "2025-01-12", status: "completed" },
    { id: "2", title: "Design database", date: "2025-09-15", status: "inprogress" },
    { id: "3", title: "Authentication", date: "2025-09-18", status: "pending", note: "Critical" },
    
  ];

  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [tasks, setTasks] = useState(dummyTasks);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    date: formatDate(year, month, todayDate),
    status: "pending" as Status,
    note: "",
  });

  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [filterRange, setFilterRange] = useState({ start: "", end: "" });

  const daysArray = useMemo(() => getMonthDays(year, month), [year, month]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterRange.start && t.date < filterRange.start) return false;
      if (filterRange.end && t.date > filterRange.end) return false;
      return true;
    });
  }, [tasks, filterStatus, filterRange]);

  const tasksMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of filteredTasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [filteredTasks]);

  const selectedDateString = selectedDate !== null ? formatDate(year, month, selectedDate) : "";

  const upcomingTasks = useMemo(() => {
    const todayStr = formatDate(todayYear, todayMonth, todayDate);
    return filteredTasks
      .filter((t) => t.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTasks]);

  const prevMonth = () => {
    if (month === 0) setYear((y) => y - 1), setMonth(11);
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) setYear((y) => y + 1), setMonth(0);
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const onYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
    setSelectedDate(null);
  };

  const addTaskHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.date) return;
    const id = Date.now().toString();
    setTasks((ts) => [...ts, { ...newTask, id }]);
    setNewTask({ title: "", date: newTask.date, status: "pending", note: "" });
    setAddModalOpen(false);
    const day = parseInt(newTask.date.split("-")[2], 10);
    setSelectedDate(day);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50 flex flex-col md:flex-row gap-6">
      {/* Left: Calendar */}
      <main className="flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">Calendar View</h1>
          <div className="flex gap-3">
            <button onClick={() => setFilterModalOpen(true)} className="filter-button" aria-label="Open filter dialog">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 012 0v2a1 1 0 01-2 0V4zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm6-12a1 1 0 012 0v2a1 1 0 01-2 0V4zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm6-12a1 1 0 012 0v2a1 1 0 01-2 0V4zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm6-12a1 1 0 012 0v2a1 1 0 01-2 0V4zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2zm0 6a1 1 0 012 0v2a1 1 0 01-2 0v-2z" />
              </svg>
              Filter
            </button>
            <button onClick={() => setAddModalOpen(true)} className="add-button" aria-label="Open add task dialog">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex justify-center items-center gap-4 select-none mb-4" aria-label="Calendar navigation">
          <button onClick={prevMonth} className="nav-button" aria-label="Previous month">
            &lt;
          </button>
          <select className="year-select" onChange={onYearChange} value={year} aria-label="Select year">
            {Array.from({ length: 11 }, (_, i) => todayYear - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="month-label">{new Date(year, month).toLocaleString("default", { month: "long" })}</span>
          <button onClick={nextMonth} className="nav-button" aria-label="Next month">
            &gt;
          </button>
        </nav>

        {/* Calendar */}
        <div className="calendar-grid">
          <div className="days-of-week">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="day-label">
                {day}
              </div>
            ))}
          </div>
          <div className="days-grid">
            {daysArray.map((day, idx) =>
              day === 0 ? (
                <div key={"blank-" + idx} className="day-cell blank" />
              ) : (
                <div
                  key={day}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedDate === day}
                  aria-label={`Tasks on ${year}-${month + 1}-${day}`}
                  onClick={() => setSelectedDate(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedDate(day);
                    }
                  }}
                  className={`day-cell ${day === todayDate && month === todayMonth && year === todayYear ? "today" : ""} ${
                    selectedDate === day ? "selected" : ""
                  }`}
                >
                  <div className="day-number">{day}</div>
                  <div className="tasks-list">
                    {(tasksMap[formatDate(year, month, day)] || [])
                      .slice(0,3)
                      .map(task => (
                        <div key={task.id} className={`task-pill ${STATUS_META[task.status].bgColor} ${STATUS_META[task.status].textColor}`}>
                          {task.title}
                        </div>
                      ))}
                    {(tasksMap[formatDate(year, month, day)] || []).length > 3 && (
                      <div className="more-tasks">+{(tasksMap[formatDate(year, month, day)] || []).length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Sidebar */}
      <aside className="sidebar">
        {/* Selected Day Tasks */}
        <section className="tasks-section">
          <div className="tasks-header">
            <h2>{selectedDate !== null ? `Tasks for ${formatDate(year, month, selectedDate)}` : "Select a day"}</h2>
            <button className="add-task-icon" onClick={() => {
              if(selectedDate != null) {
                setNewTask({
                  title: "",
                  date: formatDate(year, month, selectedDate),
                  status: "pending",
                  note: ""
                });
                setAddModalOpen(true);
              }
            }} aria-label="Add Task">+</button>
          </div>
          {selectedDate === null || !tasksMap[selectedDateString!] ? (
            <p className="no-tasks">No tasks for this day.</p>
          ) : (
            <ul className="task-cards">
              {tasksMap[selectedDateString!].map(task => (
                <li key={task.id} className="task-card">
                  <div className="task-header">
                    <span>{task.title}</span>
                    <span className={`task-status ${STATUS_META[task.status].badgeColor}`}>{task.status === "inprogress" ? "In Progress" : STATUS_META[task.status].label}</span>
                  </div>
                  {task.note && <p className="task-note">{task.note}</p>}
                  <p className="task-date">{task.date}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming Tasks */}
        <section className="upcoming-tasks">
          <h2>Upcoming Tasks</h2>
          {upcomingTasks.length === 0 ? <p className="no-upcoming">No upcoming tasks.</p> : (
            <ul>
              {upcomingTasks.map(task => (
                <li key={task.id} className="upcoming-task">
                  <span className="upcoming-title">{task.title}</span>
                  <span className="upcoming-info">
                    <span>{task.date}</span>
                    <span className={`task-status ${STATUS_META[task.status].badgeColor}`}>{task.status === "inprogress" ? "In Progress" : STATUS_META[task.status].label}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="legend">
            {Object.entries(STATUS_META).map(([_, val]) => (
              <div key={val.label} className="legend-item">
                <span className={`legend-color ${val.badgeColor}`}></span>
                <span>{val.label}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      
      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="modal-backdrop" aria-modal="true" role="dialog">
          <div className="modal-content">
            <h3>Filter Tasks</h3>
            <form onSubmit={e => {e.preventDefault(); setFilterModalOpen(false);}}>
              <label>
                Status
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as "all" | Status)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label>
                Start Date
                <input type="date" value={filterRange.start} onChange={e => setFilterRange(r => ({...r, start: e.target.value}))} />
              </label>
              <label>
                End Date
                <input type="date" value={filterRange.end} onChange={e => setFilterRange(r => ({...r, end: e.target.value}))} />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setFilterStatus("all");
                  setFilterRange({start:"", end:""});
                  setFilterModalOpen(false);
                }}>Clear</button>
                <button type="submit">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
