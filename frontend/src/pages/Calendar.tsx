import React, { useState, useMemo, useEffect } from "react";
import { listProjects, type ApiProject } from "../api/projects";

// Types
type Status = "pending" | "inprogress" | "Done";

interface Task {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  status: Status;
  note?: string;
}

// Status styling meta
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
  Done: {
    label: "Done",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    badgeColor: "bg-green-500",
  },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Generate days for calendar grid, including blanks for alignment
function getMonthDays(year: number, month: number): number[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray: number[] = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(0);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);
  while (daysArray.length % 7 !== 0) daysArray.push(0);
  return daysArray;
}

// Format a date as yyyy-mm-dd string
function formatDate(year: number, month: number, day: number) {
  const m = (month + 1).toString().padStart(2, "0");
  const d = day.toString().padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// Filter tasks for a specific date
function tasksByDate(tasks: Task[], date: string) {
  return tasks.filter((t) => t.date === date);
}

export default function Calendar() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Preloaded dummy tasks
  const dummyTasks: Task[] = [];

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [tasks, setTasks] = useState(dummyTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    date: formatDate(year, month, currentDay),
    status: "pending" as Status,
    note: "",
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [filterRange, setFilterRange] = useState({ start: "", end: "" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const projects = await listProjects();
        // Map projects with due_date to calendar tasks
        const toStatus = (p: ApiProject): Status =>
          p.status === "Completed" ? "Done" : p.status === "Active" ? "inprogress" : "pending";
        const mapped: Task[] = projects
          .filter((p) => !!p.due_date)
          .map((p) => ({
            id: String(p.id),
            title: p.name,
            date: p.due_date as string,
            status: toStatus(p),
            note: p.category || "",
          }));
        setTasks(mapped);
      } catch (e: any) {
        setError(e?.message || "Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Global search from Navbar
  useEffect(() => {
    const onSearch = (e: Event) => {
      const ce = e as CustomEvent<{ query?: string }>;
      setQuery(String(ce.detail?.query ?? ""));
    };
    window.addEventListener("app:search", onSearch as EventListener);
    return () => window.removeEventListener("app:search", onSearch as EventListener);
  }, []);

  // Calculate days for current month display
  const daysArray = useMemo(() => getMonthDays(year, month), [year, month]);

  // Filter tasks according to filter controls
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterRange.start && t.date < filterRange.start) return false;
      if (filterRange.end && t.date > filterRange.end) return false;
      if (q && !(t.title.toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tasks, filterStatus, filterRange, query]);

  // Map of date -> tasks
  const tasksMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filteredTasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Selected date string for lookup
  const selectedDateStr = selectedDate !== null ? formatDate(year, month, selectedDate) : "";

  // Tasks from today onward, sorted
  const upcomingTasks = useMemo(() => {
    const todayStr = formatDate(currentYear, currentMonth, currentDay);
    return filteredTasks
      .filter((t) => t.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTasks, currentYear, currentMonth, currentDay]);

  // Handlers for navigation and form submissions
  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function onYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setYear(Number(e.target.value));
    setSelectedDate(null);
  }

  function addTaskHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title || !newTask.date) return;
    const id = String(Date.now());
    setTasks((ts) => [...ts, { ...newTask, id }]);
    setNewTask({ title: "", date: newTask.date, status: "pending", note: "" });
    setAddModalOpen(false);
    setSelectedDate(parseInt(newTask.date.split("-")[2], 10));
  }

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-background text-foreground flex gap-6 flex-col md:flex-row">
      {/* Left: Calendar */}
      <main className="flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">Calendar View</h1>
          {loading && <span className="text-sm text-foreground/70">Loading…</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
          <div className="flex gap-3">
            <button
              onClick={() => setFilterModalOpen(true)}
              className="btn border border-gray-300 dark:border-gray-700 bg-transparent"
              aria-label="Open filter dialog"
            >
              Filter
            </button>
            
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex justify-center items-center gap-4 select-none mb-4"
          aria-label="Calendar navigation"
        >
          <button onClick={prevMonth} className="btn" aria-label="Previous month">
            &lt;
          </button>
          <select
            className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-transparent text-foreground"
            onChange={onYearChange}
            value={year}
            aria-label="Select year"
          >
            {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="text-lg font-semibold select-none">
            {new Date(year, month).toLocaleString("default", { month: "long" })}
          </div>
          <button onClick={nextMonth} className="btn" aria-label="Next month">
            &gt;
          </button>
        </nav>

        {/* Calendar grid */}
        <div className="bg-white dark:bg-gray-900 rounded shadow border border-gray-200 dark:border-gray-800 p-4">
          <div className="grid grid-cols-7 text-center font-semibold mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) =>
              day === 0 ? (
                <div key={"blank-" + idx} className="h-24 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900" />
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
                  className={`h-24 border border-gray-200 dark:border-gray-800 p-1 rounded relative cursor-pointer select-none ${
                    day === currentDay && month === currentMonth && year === currentYear
                      ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-400 dark:border-yellow-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  } ${selectedDate === day ? "ring-2 ring-black dark:ring-gray-300" : ""}`}
                >
                  <div className="text-xs font-semibold mb-1">{day}</div>
                  <div className="max-h-[80%] overflow-y-auto">
                    {(tasksMap[formatDate(year, month, day)] || [])
                      .slice(0, 3)
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`truncate text-xs px-1 py-0.5 rounded ${STATUS_META[task.status].bgColor} ${STATUS_META[task.status].textColor}`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                    {(tasksMap[formatDate(year, month, day)] || []).length > 3 && (
                      <div className="text-xs text-foreground/50 select-none">
                        +{(tasksMap[formatDate(year, month, day)] || []).length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Right Side */}
      <aside className="w-full md:w-80 flex flex-col gap-6">
        {/* Selected day tasks */}
        <section className="bg-white dark:bg-gray-900 rounded shadow border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {selectedDate
                ? `Tasks for ${formatDate(year, month, selectedDate)}`
                : "Select a day"}
            </h2>
            
          </div>
          {selectedDate === null || !tasksMap[selectedDateStr!] ? (
            <p className="text-foreground/70 italic uppercase tracking-wide">No tasks for selected day.</p>
          ) : (
            <ul className="flex flex-col gap-3 max-h-72 overflow-auto">
              {tasksMap[selectedDateStr!].map((task) => (
                <li key={task.id} className="rounded border border-gray-200 dark:border-gray-800 p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{task.title}</p>
                    <span
                      className={`text-xs uppercase font-bold px-2 py-0.5 rounded text-white ${STATUS_META[task.status].badgeColor}`}
                    >
                      {task.status === "inprogress" ? "In Progress" : STATUS_META[task.status].label}
                    </span>
                  </div>
                  {task.note && <p className="mt-1 text-sm italic">{task.note}</p>}
                  <p className="mt-1 text-xs text-foreground/70">{task.date}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming tasks */}
        <section className="bg-white dark:bg-gray-900 rounded shadow border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-foreground/70 italic uppercase tracking-wide">No upcoming tasks.</p>
          ) : (
            <ul className="max-h-72 overflow-auto space-y-2">
              {upcomingTasks.slice(0, 10).map((task) => (
                <li key={task.id} className="flex justify-between items-center border border-gray-200 dark:border-gray-800 rounded px-3 py-2">
                  <span className="truncate max-w-[60%]">{task.title}</span>
                  <span>
                    <span className="block text-xs text-foreground/50">{task.date}</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 uppercase text-white text-xs font-bold rounded ${STATUS_META[task.status].badgeColor}`}>
                      {task.status === "inprogress" ? "In Progress" : STATUS_META[task.status].label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {/* Legend */}
          <div className="mt-4 flex space-x-6">
            {Object.entries(STATUS_META).map(([key, val]) => (
              <div key={key} className="flex items-center space-x-2">
                <span className={`w-4 h-4 rounded-full ${val.badgeColor}`}></span>
                <span>{val.label}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      {/* Add Task Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded shadow-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-4">Add Task or Note</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTask.title || !newTask.date) return;
                const newTaskWithId = { ...newTask, id: Date.now().toString() };
                setTasks((t) => [...t, newTaskWithId]);
                setNewTask({ title: "", date: newTask.date, status: "pending", note: "" });
                setAddModalOpen(false);
                setSelectedDate(parseInt(newTask.date.split("-")[2], 10));
              }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
              />
              <input
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask((prev) => ({ ...prev, date: e.target.value }))}
                min={`${currentYear - 5}-01-01`}
                max={`${currentYear + 5}-12-31`}
                required
                className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
              />
              <select
                value={newTask.status}
                onChange={(e) => setNewTask((prev) => ({ ...prev, status: e.target.value as Status }))}
                className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
                required
              >
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <textarea
                placeholder="Optional note"
                value={newTask.note}
                onChange={(e) => setNewTask((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full border dark:border-gray-700 p-2 rounded resize-y h-24 bg-transparent"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" className="border dark:border-gray-700 px-4 py-2 rounded" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded shadow-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-4">Filter Tasks</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFilterModalOpen(false);
              }}
              className="space-y-4"
            >
              <label className="block">
                Status
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | Status)}
                  className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="block">
                Start Date
                <input
                  type="date"
                  value={filterRange.start}
                  onChange={(e) => setFilterRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
                />
              </label>

              <label className="block">
                End Date
                <input
                  type="date"
                  value={filterRange.end}
                  onChange={(e) => setFilterRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
                />
              </label>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterRange({ start: "", end: "" });
                    setFilterModalOpen(false);
                  }}
                  className="border dark:border-gray-700 px-4 py-2 rounded"
                >
                  Clear
                </button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
