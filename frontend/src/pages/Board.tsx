import React, { useState, useEffect, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  listTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  type ApiTask,
} from "../api/tasks";
import { createActivity } from "../api/activities";
import { listProjects, type ApiProject } from "../api/projects";
import { listUsers, type ApiUser } from "../api/users";

interface Task {
  id: string; // numeric API id as string
  title: string;
  description: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  storyPoints?: number;
  tags?: string[];
  type: "task" | "project";
  projectId?: number;
  assigneeId?: number | null;
  assigneeName?: string | null;
}

const apiToUiStatus = (s: ApiTask["status"]): string =>
  s === "in_progress" ? "inprogress" : s;
const uiToApiStatus = (s: string): ApiTask["status"] =>
  s === "inprogress"
    ? "in_progress"
    : s === "completed"
    ? "done"
    : (s as ApiTask["status"]);

const toUiTask = (t: ApiTask): Task => ({
  id: String(t.id),
  title: t.title,
  description: t.description || "",
  status: apiToUiStatus(t.status),
  startDate: t.start_date || undefined,
  dueDate: t.due_date || undefined,
  priority: (t.priority as any) || "medium",
  storyPoints: typeof t.story_points === "number" ? t.story_points : 1,
  tags: [],
  type: "task",
  projectId: typeof t.project === "number" ? t.project : undefined,
  assigneeId: t.assignee ? t.assignee.id : null,
  assigneeName: t.assignee ? `${t.assignee.first_name || ""} ${t.assignee.last_name || ""}`.trim() || t.assignee.username : null,
});

const statuses = [
  { key: "todo", label: "To Do", color: "bg-blue-200" },
  { key: "inprogress", label: "In Progress", color: "bg-yellow-200" },
  { key: "done", label: "Done", color: "bg-green-200" },
];

const initialTasks: Task[] = [
  {
    id: "tf1",
    title: "Implement authentication",
    description:
      "Add secure user login, registration and session management functionality",
    status: "todo",
    priority: "high",
    storyPoints: 13,
    tags: ["Security", "Backend"],
    dueDate: "2024-01-18",
    type: "task",
  },
];

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });
  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };
  return [storedValue, setValue] as const;
}

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"task" | "project">("task");
  const [modalStatus, setModalStatus] = useState<string>("todo");
  const [newItem, setNewItem] = useState<Partial<Task>>({
    status: "todo",
    priority: "medium",
    storyPoints: 1,
    startDate: "",
  });
  const [searchTerm, setSearchTerm] = useLocalStorage<string>("taskSearch", "");
  const [filterStatuses, setFilterStatuses] = useLocalStorage<string[]>(
    "taskFilterStatuses",
    []
  );
  const [filterPriorities, setFilterPriorities] = useLocalStorage<string[]>(
    "taskFilterPriorities",
    []
  );
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [showBoardSettingsDrawer, setShowBoardSettingsDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);
  // Debounce timers for inline field updates (by task id + field)
  const debounceTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listTasks();
        const mapped = data.map(toUiTask);
        setTasks((prev) => (mapped.length > 0 ? mapped : prev));
      } catch (e: any) {
        setError(e?.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const ps = await listProjects();
        setProjects(ps);
      } catch {}
    })();
    (async () => {
      try {
        const us = await listUsers();
        setUsers(us);
      } catch {}
    })();
    const el = boardRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowLeftShadow(el.scrollLeft > 5);
      setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Listen for global search triggered from Navbar
  useEffect(() => {
    const onGlobalSearch = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { q?: string } | undefined;
        const q = (detail?.q ?? "").toString();
        setSearchTerm(q);
      } catch {}
    };
    window.addEventListener("global:search", onGlobalSearch as EventListener);
    return () => window.removeEventListener("global:search", onGlobalSearch as EventListener);
  }, [setSearchTerm]);

  useEffect(() => {
    if (selectedTask) {
      setEditForm({ ...selectedTask });
    } else {
      setEditForm(null);
    }
  }, [selectedTask]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (
      searchTerm.length > 0 &&
      !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !task.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filterPriorities.length > 0 && !filterPriorities.includes(task.priority))
      return false;
    if (filterStatuses.length > 0 && !filterStatuses.includes(task.status))
      return false;
    return true;
  });

  const removeFilter = (
    filterType: "status" | "priority",
    value: string
  ) => {
    if (filterType === "status") {
      setFilterStatuses(filterStatuses.filter((f) => f !== value));
    } else if (filterType === "priority") {
      setFilterPriorities(filterPriorities.filter((f) => f !== value));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatuses([]);
    setFilterPriorities([]);
  };

  const updateTaskField = (id: string, field: keyof Task, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, [field]: value } : prev));
      setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    }

    // Persist certain inline edits to the backend with debounce
    const numericId = Number(id);
    if (!Number.isNaN(numericId)) {
      const key = `${id}:${String(field)}`;
      // Clear previous timer
      const existing = debounceTimers.current.get(key);
      if (existing) {
        window.clearTimeout(existing);
      }
      // Only persist supported fields
      if (field === "storyPoints") {
        const timer = window.setTimeout(() => {
          apiUpdateTask(numericId, { story_points: Number(value) } as any)
            .then(() => {
              window.dispatchEvent(new CustomEvent("team:refresh"));
            })
            .catch(() => {
              // On error, revert local change by reloading from server soon (optional)
            })
            .finally(() => {
              debounceTimers.current.delete(key);
            });
        }, 400);
        debounceTimers.current.set(key, timer);
      }
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;
    const newStatus = result.destination!.droppableId;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === result.draggableId ? { ...t, status: newStatus } : t
      )
    );
    const numericId = Number(result.draggableId);
    if (!Number.isNaN(numericId)) {
      apiUpdateTask(numericId, { status: uiToApiStatus(newStatus) })
        .then(() => {
          if (newStatus === "done" || newStatus === "completed") {
            createActivity({
              type: "work_done",
              message: "Marked task as done",
              task_id: numericId,
            })
              .then(() => window.dispatchEvent(new CustomEvent("recent:refresh")))
              .catch(() => {});
          }
          window.dispatchEvent(new CustomEvent("projects:refresh"));
          window.dispatchEvent(new CustomEvent("team:refresh"));
        })
        .catch(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === String(numericId)
                ? { ...t, status: result.source.droppableId }
                : t
            )
          );
        });
    }
  };

  const openCreateModal = (status?: string) => {
    if (status) setModalStatus(status);
    setCreateType("task");
    setNewItem({
      status: status || "todo",
      priority: "medium",
      storyPoints: 1,
      type: "task",
    });
    setShowCreateModal(true);
  };

  const handleCreateInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]:
        name === "storyPoints"
          ? Number(value)
          : name === "tags"
          ? value.split(",").map((s) => s.trim()).filter((s) => s)
          : name === "projectId"
          ? value
            ? Number(value)
            : undefined
          : name === "assigneeId"
          ? value
            ? Number(value)
            : undefined
          : value,
    }));
  };

  const handleCreate = async () => {
    if (!newItem.title || !newItem.status) return;
    try {
      const created = await apiCreateTask({
        title: newItem.title,
        description: newItem.description || "",
        status: uiToApiStatus(newItem.status),
        start_date: newItem.startDate || null,
        due_date: newItem.dueDate || null,
        project_id: newItem.projectId ?? null,
        priority: (newItem.priority as any) || "medium",
        story_points: newItem.storyPoints || 0,
        assignee_id: (newItem as any).assigneeId ?? null,
      } as any);
      const uiTask = toUiTask(created);
      uiTask.priority = (newItem.priority as any) || uiTask.priority || "medium";
      uiTask.storyPoints = typeof newItem.storyPoints === "number" ? newItem.storyPoints : uiTask.storyPoints || 1;
      uiTask.tags = newItem.tags || [];
      uiTask.type = createType;
      setTasks((prev) => [...prev, uiTask]);
      createActivity({
        type: "work_done",
        message: `Created task ${created.title}`,
        task_id: created.id,
      })
        .then(() => window.dispatchEvent(new CustomEvent("recent:refresh")))
        .catch(() => {});
      window.dispatchEvent(new CustomEvent("projects:refresh"));
      window.dispatchEvent(new CustomEvent("team:refresh"));
      setShowCreateModal(false);
      setNewItem({ status: modalStatus, priority: "medium", storyPoints: 1, startDate: "" });
    } catch (e: any) {
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : e?.message || "Failed to create task";
      alert(`Failed to create task: ${msg}`);
    }
  };

  const handleSaveEdits = async () => {
    if (!editForm || !editForm.id) return;
    const numericId = Number(editForm.id);
    try {
      await apiUpdateTask(numericId, {
        title: editForm.title,
        description: editForm.description,
        status: uiToApiStatus(editForm.status || "todo"),
        start_date: editForm.startDate || null,
        due_date: editForm.dueDate || null,
        project_id: (editForm as any).projectId ?? null,
        priority: (editForm.priority as any) || "medium",
        story_points: typeof editForm.storyPoints === "number" ? editForm.storyPoints : undefined,
        assignee_id: (editForm as any).assigneeId ?? null,
      } as any);
      setTasks((prev) =>
        prev.map((t) => (t.id === String(numericId) ? { ...t, ...(editForm as Task) } : t))
      );
      setSelectedTask(editForm as Task);
      window.dispatchEvent(new CustomEvent("projects:refresh"));
      window.dispatchEvent(new CustomEvent("team:refresh"));
      const finalStatus = editForm.status || "todo";
      if (finalStatus === "done" || finalStatus === "completed") {
        createActivity({
          type: "work_done",
          message: "Updated task as done",
          task_id: numericId,
        })
          .then(() => window.dispatchEvent(new CustomEvent("recent:refresh")))
          .catch(() => {});
      }
    } catch (e) {
      alert("Failed to save changes");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task? This action cannot be undone.")) return;
    const numericId = Number(id);
    try {
      if (!Number.isNaN(numericId)) {
        await apiDeleteTask(numericId);
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelectedTask(null);
      window.dispatchEvent(new CustomEvent("projects:refresh"));
      window.dispatchEvent(new CustomEvent("team:refresh"));
    } catch (e) {
      alert("Failed to delete task");
    }
  };

  const onBackdropClick = (e: React.MouseEvent) => {
    setSelectedTask(null);
  };

  return (
    <div className="p-4 mx-auto max-w-screen-xl bg-background text-foreground min-h-screen">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between mb-4 items-center gap-2">
        <div>
          <h1 className="text-xl font-semibold">TaskFlow MVP Board</h1>
        
        </div>
        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-1"
            onClick={() => setShowFilterRow(!showFilterRow)}
            aria-expanded={showFilterRow}
          >
            Filter
          </button>
          <button
            className="bg-black text-white rounded px-4 py-1.5"
            onClick={() => openCreateModal()}
          >
            + Create issue
          </button>
        </div>
      </div>

      {/* Filter Row */}
      {showFilterRow && (
        <div className="mb-4 card p-4 border border-gray-200 dark:border-gray-700">
          {/* Top row: Search + Clear */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="relative w-full md:max-w-lg">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              <input
                type="text"
                placeholder="Search tasks by title, description…"
                className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search tasks"
              />
            </div>
            {(filterStatuses.length > 0 || filterPriorities.length > 0 || searchTerm) && (
              <button
                className="self-start md:self-auto px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-sm"
                onClick={clearAllFilters}
                aria-label="Clear all filters"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {(filterStatuses.length > 0 || filterPriorities.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filterStatuses.map((status) => {
                const s = statuses.find((s) => s.key === status);
                if (!s) return null;
                return (
                  <button
                    key={status}
                    className="rounded-full border border-blue-400/40 bg-blue-500/10 text-blue-300 px-3 py-1 text-xs flex items-center gap-1 hover:bg-blue-500/20"
                    onClick={() => removeFilter("status", status)}
                    aria-label={`Remove status filter ${s.label}`}
                  >
                    {s.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                );
              })}
              {filterPriorities.map((p) => (
                <button
                  key={p}
                  className="rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-300 px-3 py-1 text-xs flex items-center gap-1 hover:bg-amber-500/20"
                  onClick={() => removeFilter("priority", p)}
                  aria-label={`Remove priority filter ${p}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              ))}
            </div>
          )}

          {/* Segmented controls */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="mb-1 font-semibold text-sm">Status</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Status filters">
                {statuses.map((s) => {
                  const active = filterStatuses.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      className={`${active ? "bg-blue-500/20 ring-1 ring-blue-400/40" : "bg-gray-100 dark:bg-gray-800"} text-sm rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700 hover:bg-blue-500/10`}
                      onClick={() => {
                        if (active) setFilterStatuses(filterStatuses.filter((f) => f !== s.key));
                        else setFilterStatuses([...filterStatuses, s.key]);
                      }}
                      aria-pressed={active}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-1 font-semibold text-sm">Priority</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Priority filters">
                {["high", "medium", "low"].map((p) => {
                  const active = filterPriorities.includes(p);
                  return (
                    <button
                      key={p}
                      className={`${active ? "bg-amber-500/20 ring-1 ring-amber-400/40" : "bg-gray-100 dark:bg-gray-800"} text-sm rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700 hover:bg-amber-500/10`}
                      onClick={() => {
                        if (active) setFilterPriorities(filterPriorities.filter((f) => f !== p));
                        else setFilterPriorities([...filterPriorities, p]);
                      }}
                      aria-pressed={active}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="flex gap-5 overflow-x-auto pb-4 relative"
          ref={boardRef}
          tabIndex={0}
          aria-label="Kanban board columns"
        >
          {/* Left shadow */}
          <div
            className={`absolute top-0 left-0 h-full w-8 pointer-events-none transition-shadow ${
              showLeftShadow ? "shadow-[inset_10px_0_8px_-8px_rgba(0,0,0,0.3)]" : ""
            }`}
          />
          {/* Right shadow */}
          <div
            className={`absolute top-0 right-0 h-full w-8 pointer-events-none transition-shadow ${
              showRightShadow ? "shadow-[inset_-10px_0_8px_-8px_rgba(0,0,0,0.3)]" : ""
            }`}
          />
          {statuses.map(({ key, label, color }) => {
            const columnTasks = filteredTasks.filter((t) => t.status === key);
            return (
              <Droppable droppableId={key} key={key}>
                {(provided: any) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow p-3 w-72 flex flex-col max-h-[600px]"
                  >
                    <div
                      className={`flex justify-between mb-2 items-center ${color} rounded px-2 py-1`}
                    >
                      <span className="text-lg font-semibold select-none text-black">{label}</span>
                      <span className="ml-2 px-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs select-none">
                        {columnTasks.length}
                      </span>
                      <button
                        className="text-2xl font-bold text-gray-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black rounded"
                        title="Add Task"
                        onClick={() => openCreateModal(key)}
                        aria-label={`Add Task to ${label}`}
                      >
                        +
                      </button>
                    </div>
                    <div className="overflow-auto max-h-[520px] scrollbar-thin scrollbar-thumb-gray-300">
                      {columnTasks.map((task, idx) => (
                        <Draggable
                          draggableId={task.id}
                          index={idx}
                          key={task.id}
                        >
                          {(provided: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 shadow cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black"
                              onClick={() => setSelectedTask(task)}
                              tabIndex={0}
                              aria-label={`Open details for ${task.title}`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setSelectedTask(task);
                                  e.preventDefault();
                                }
                              }}
                            >
                              <div className="text-sm font-semibold">
                                {highlightText(task.title, searchTerm)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {highlightText(task.description, searchTerm)}
                              </div>
                              {/* Inline editable story points and priority */}
                              <div className="flex justify-between items-center mt-3">
                                <div>
                                  <label
                                    className="text-xs font-semibold mr-1"
                                    htmlFor={`storyPoints-${task.id}`}
                                  >
                                    SP:
                                  </label>
                                  <input
                                    id={`storyPoints-${task.id}`}
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={task.storyPoints || 0}
                                    onChange={(e) =>
                                      updateTaskField(
                                        task.id,
                                        "storyPoints",
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-12 border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 text-xs bg-transparent text-foreground"
                                  />
                                </div>
                                <div>
                                  <label
                                    className="text-xs font-semibold mr-1"
                                    htmlFor={`priority-${task.id}`}
                                  >
                                    Pri:
                                  </label>
                                  <select
                                    id={`priority-${task.id}`}
                                    value={task.priority}
                                    onChange={(e) =>
                                      updateTaskField(
                                        task.id,
                                        "priority",
                                        e.target.value as "low" | "medium" | "high"
                                      )
                                    }
                                    className="border border-gray-300 dark:border-gray-700 rounded px-1 py-0.5 text-xs bg-transparent text-foreground"
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                  </select>
                                </div>
                              </div>
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2 select-none">
                                  {task.tags.map((t) => (
                                    <span
                                      key={t}
                                      className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex justify-between text-xs text-gray-500 mt-2 select-none">
                                <span></span>
                                <span>
                                  Start: {task.startDate || "None"} · Due:{" "}
                                  {task.dueDate || "None"}
                                </span>
                              </div>
                              {task.projectId && (
                                <div className="text-[10px] text-gray-500 mt-1">
                                  Project:{" "}
                                  {projects.find((p) => p.id === task.projectId)?.name ||
                                    task.projectId}
                                </div>
                              )}
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
        </div>
      </DragDropContext>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-issue-title"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowCreateModal(false);
          }}
        >
          <div className="bg-white w-[480px] rounded-md p-6 shadow-lg max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-semibold mb-4" id="create-issue-title">
              Create New
            </h3>
            <div className="flex mb-4 border rounded overflow-hidden">
              <button
                className={`flex-1 py-2 ${
                  createType === "task"
                    ? "bg-black text-white"
                    : "text-gray-600"
                }`}
                onClick={() => setCreateType("task")}
              >
                Task
              </button>
            </div>
            <input
              className="border border-gray-300 dark:border-gray-700 w-full p-2 rounded mb-3 bg-transparent"
              type="text"
              placeholder={"Name *"}
              value={newItem.title || ""}
              name="title"
              onChange={handleCreateInputChange}
              autoFocus
              aria-required="true"
              aria-describedby="titleHelp"
            />
            <textarea
              className="border border-gray-300 dark:border-gray-700 w-full p-2 rounded mb-3 bg-transparent"
              placeholder="Description"
              value={newItem.description || ""}
              name="description"
              onChange={handleCreateInputChange}
              rows={4}
            />
            {createType === "task" && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <select
                    className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-transparent"
                    name="status"
                    value={newItem.status || modalStatus}
                    onChange={handleCreateInputChange}
                    aria-label="Task Status"
                  >
                    {statuses.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-transparent"
                    name="priority"
                    value={newItem.priority || "medium"}
                    onChange={handleCreateInputChange}
                    aria-label="Priority"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    Project
                  </label>
                  <select
                    className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-transparent"
                    name="projectId"
                    value={newItem.projectId ?? ""}
                    onChange={handleCreateInputChange}
                    aria-label="Project"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-300">Start Date</label>
                    <input
                      className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-transparent"
                      type="date"
                      name="startDate"
                      value={newItem.startDate || ""}
                      onChange={handleCreateInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-300">Due Date</label>
                    <input
                      className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-transparent"
                      type="date"
                      name="dueDate"
                      value={newItem.dueDate || ""}
                      onChange={handleCreateInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <input
                    className="border border-gray-300 dark:border-gray-700 w-full p-2 rounded bg-transparent text-foreground"
                    name="storyPoints"
                    type="number"
                    min={0}
                    max={100}
                    value={newItem.storyPoints || 1}
                    onChange={handleCreateInputChange}
                    aria-label="Story Points"
                  />
                  <input
                    className="border border-gray-300 dark:border-gray-700 w-full p-2 rounded bg-transparent text-foreground"
                    name="tags"
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={
                      newItem.tags
                        ? Array.isArray(newItem.tags)
                          ? newItem.tags.join(", ")
                          : ""
                        : ""
                    }
                    onChange={handleCreateInputChange}
                    aria-label="Tags"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={!newItem.title}
                onClick={handleCreate}
              >
                Create {createType === "task" ? "Task" : "Project"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Board Settings Drawer */}
      {showBoardSettingsDrawer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="board-settings-title"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowBoardSettingsDrawer(false);
          }}
        >
          <div className="bg-white w-96 p-6 h-full overflow-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" id="board-settings-title">
                Board Settings
              </h3>
              <button
                className="text-xl"
                onClick={() => setShowBoardSettingsDrawer(false)}
                aria-label="Close board settings"
              >
                &times;
              </button>
            </div>
            <p>
              This panel can include board-wide settings such as column
              customization, permissions, WIP limits, etc.
            </p>
          </div>
        </div>
      )}
      {/* Task Detail Drawer (editable) */}
      {selectedTask && editForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-detail-title"
          tabIndex={-1}
          onClick={onBackdropClick}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedTask(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-[520px] p-6 h-full overflow-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <input
                  aria-label="Task title"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-lg font-semibold w-full border-b border-gray-300 dark:border-gray-700 pb-2 focus:outline-none bg-transparent"
                />
                <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                  {statuses.find((s) => s.key === (editForm.status || ""))?.label}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded"
                  onClick={() => {
                    const next =
                      editForm.status === "todo"
                        ? "inprogress"
                        : editForm.status === "inprogress"
                        ? "done"
                        : "completed";
                    setEditForm({ ...editForm, status: next });
                  }}
                  title="Quick toggle status"
                >
                  ⤴
                </button>
                <button
                  className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-red-600"
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  aria-label="Delete task"
                >
                  Delete
                </button>
                <button
                  className="text-xl"
                  onClick={() => setSelectedTask(null)}
                  aria-label="Close task detail"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                rows={6}
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                aria-label="Task description"
              />
            </div>
            {/* Status, priority */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                  aria-label="Status"
                >
                  {statuses.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({ ...editForm, priority: e.target.value as "low" | "medium" | "high" })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                  aria-label="Priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            {/* Project */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Project</label>
              <select
                value={editForm.projectId ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, projectId: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                aria-label="Project"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start & due date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={editForm.startDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                />
              </div>
            </div>

            {/* Story points and tags */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Story Points</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.storyPoints || 0}
                  onChange={(e) => setEditForm({ ...editForm, storyPoints: Number(e.target.value) })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                  aria-label="Story points"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editForm.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 bg-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700"
                onClick={() => setEditForm({ ...(selectedTask as Task) })}
              >
                Revert
              </button>
              <button
                className="bg-black text-white px-4 py-2 rounded"
                onClick={() => {
                  handleSaveEdits();
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

