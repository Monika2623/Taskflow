import React, { useState, useEffect, useRef } from "react";
import {
  createProject as apiCreateProject,
  listProjects,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  type ApiProject,
} from "../api/projects";
import { createActivity } from "../api/activities";

// Define a type for team member
type TeamMember = { name: string; email: string };

const initialProjects: {
  id: number;
  name: string;
  description: string;
  starred: boolean;
  status: string;
  priority: string;
  category: string;
  startDate: string;
  dueDate: string;
  progress: number;
  team: TeamMember[];
}[] = [
  {
    id: 1,
    name: "TaskFlow MVP",
    description: "Main project management application with full feature set",
    starred: true,
    status: "Active",
    priority: "High",
    category: "Development",
    startDate: "2024-01-01",
    dueDate: "2024-03-31",
    progress: 0,
    team: [
      { name: "Alice Johnson", email: "alice@company.com" },
      { name: "Bob Smith", email: "bob@company.com" },
    ],
  },
  {
    id: 2,
    name: "Mobile App Design",
    description: "UI/UX design for TaskFlow mobile application",
    starred: false,
    status: "Active",
    priority: "Medium",
    category: "Design",
    startDate: "2023-12-01",
    dueDate: "2024-02-15",
    progress: 0,
    team: [{ name: "Charlie Lee", email: "charlie@company.com" }],
  },
  {
    id: 3,
    name: "API Documentation",
    description: "Comprehensive API documentation and developer guides",
    starred: true,
    status: "Completed",
    priority: "Low",
    category: "Documentation",
    startDate: "2023-11-01",
    dueDate: "2024-01-20",
    progress: 100,
    team: [],
  },
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<null | number>(null);
  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    startDate: string;
    dueDate: string;
    starred: boolean;
    team: TeamMember[];
  }>({
    name: "",
    description: "",
    status: "Active",
    priority: "Medium",
    category: "",
    startDate: "",
    dueDate: "",
    starred: false,
    team: [],
  });
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState<null | number>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  // To handle adding team members in new project modal
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  // Track which projects we've already auto-completed / notified to avoid repeats
  const autoCompletedNotified = useRef<Set<number>>(new Set());
  const autoCompletingIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    createActivity({ type: "view", message: "Viewed Projects page" }).catch(() => {});

    const loadProjects = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listProjects();
        const mapped = data.map((p: ApiProject) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          starred: p.starred,
          status: p.status,
          priority: p.priority,
          category: p.category,
          startDate: p.start_date || "",
          dueDate: p.due_date || "",
          team: p.team || [],
          progress: p.progress ?? 0,
        }));
        setProjects(mapped as any);
      } catch (e: any) {
        setError(e?.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    const onRefresh = () => {
      loadProjects();
    };
    window.addEventListener("projects:refresh", onRefresh as any);
    return () => {
      window.removeEventListener("projects:refresh", onRefresh as any);
    };
  }, []);

  // Listen to global search from Navbar
  useEffect(() => {
    const onSearch = (e: Event) => {
      const ce = e as CustomEvent<{ query?: string }>;
      setSearch(String(ce.detail?.query ?? ""));
    };
    window.addEventListener("app:search", onSearch as EventListener);
    return () => window.removeEventListener("app:search", onSearch as EventListener);
  }, []);

  useEffect(() => {
    const run = async () => {
      for (const p of projects) {
        const prog = (p as any).progress ?? 0;
        if (prog === 100 && p.status !== "Completed" && !autoCompletingIds.current.has(p.id)) {
          try {
            autoCompletingIds.current.add(p.id);
            const updated = await apiUpdateProject(p.id as any, { status: "Completed" } as any);
            setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "Completed" } : x)));
            window.dispatchEvent(new CustomEvent("projects:refresh"));
            if (!autoCompletedNotified.current.has(p.id)) {
              autoCompletedNotified.current.add(p.id);
              setToast({ message: `Project "${updated.name || p.name}" completed successfully`, id: Date.now() });
              createActivity({
                type: "work_done",
                message: `Project ${updated.name || p.name} auto-completed at 100%`,
              }).catch(() => {});
            }
          } catch (e) {
            // Ignore error, allow retry later
          } finally {
            autoCompletingIds.current.delete(p.id);
          }
        }
      }
    };
    if (projects.length > 0) run();
  }, [projects]);

  // ----------------------
  // New logic: compute status based on progress
  // ----------------------
  const getComputedStatus = (project: any) => {
    const prog = (project as any).progress ?? 0;
    if (prog === 100) return "Completed";
    // fallback to actual project.status, but normalize to "On Hold" / "Active"
    if (project.status === "On Hold") return "On Hold";
    return "Active";
  };

  const statCards = [
    { label: "Total Projects", getValue: (p: typeof initialProjects) => p.length, sub: "All projects" },
    {
      label: "Active",
      getValue: (p: typeof initialProjects) => p.filter((pr) => getComputedStatus(pr) === "Active").length,
      sub: "Currently in progress",
    },
    {
      label: "Completed",
      getValue: (p: typeof initialProjects) => p.filter((pr) => getComputedStatus(pr) === "Completed").length,
      sub: "Successfully finished",
    },
    {
      label: "Starred",
      getValue: (p: typeof initialProjects) => p.filter((pr) => pr.starred).length,
      sub: "Your favorites",
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setNewProject((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setNewProject((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateProject = async () => {
    try {
      const created = await apiCreateProject({
        name: newProject.name,
        description: newProject.description,
        status: newProject.status as any,
        priority: newProject.priority as any,
        category: newProject.category,
        start_date: (newProject as any).startDate || null,
        due_date: newProject.dueDate || null,
        starred: newProject.starred,
        team: newProject.team,
      });
      const mapped = {
        id: created.id,
        name: created.name,
        description: created.description,
        starred: created.starred,
        status: created.status,
        priority: created.priority,
        category: created.category,
        startDate: created.start_date || "",
        dueDate: created.due_date || "",
        team: created.team || [],
        progress: created.progress ?? 0,
      } as any;
      setProjects([...projects, mapped]);
      setShowModal(false);
      setNewProject({
        name: "",
        description: "",
        status: "Active",
        priority: "Medium",
        category: "",
        startDate: "",
        dueDate: "",
        starred: false,
        team: [],
      });
      setMemberName("");
      setMemberEmail("");
      setShowInfo(mapped.id);
      createActivity({ type: "work_done", message: `Created project ${created.name}` }).catch(() => {});
      window.dispatchEvent(new CustomEvent("recent:refresh"));
    } catch (e: any) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to create project");
    }
  };

  const handleAddMember = () => {
    if (memberName && memberEmail) {
      setNewProject((prev) => ({
        ...prev,
        team: [...prev.team, { name: memberName, email: memberEmail }],
      }));
      setMemberName("");
      setMemberEmail("");
    }
  };

  const displayedProjects = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  // Helper to get status badge colors
  function statusBadge(status: string) {
    switch (status) {
      case "Active":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200";
      case "Completed":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200";
      case "On Hold":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200";
    }
  }

  return (
    <div className="p-6 bg-background text-foreground min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold">Projects</h2>
        <div className="flex gap-2">
          <button
            className="border px-4 py-2 rounded"
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const data = await listProjects();
                const mapped = data.map((p: ApiProject) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  starred: p.starred,
                  status: p.status,
                  priority: p.priority,
                  category: p.category,
                  startDate: p.start_date || "",
                  dueDate: p.due_date || "",
                  team: p.team || [],
                  progress: p.progress ?? 0,
                }));
                setProjects(mapped as any);
                window.dispatchEvent(new CustomEvent("projects:refresh"));
              } catch (e: any) {
                setError(e?.message || "Failed to refresh projects");
              } finally {
                setLoading(false);
              }
            }}
          >
            Refresh
          </button>
          <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setShowModal(true)}>
            + Create Project
          </button>
        </div>
      </div>

      <div className="mb-6 text-foreground/70">Manage all your projects in one place</div>

      {loading && <div className="text-sm text-foreground/70">Loading projects…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Statistic cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col"
          >
            <span className="font-medium">{card.label}</span>
            <span className="text-2xl font-bold mt-2">{card.getValue(projects)}</span>
            <span className="text-sm text-foreground/70">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedProjects.map((project) => {
          const computedStatus = getComputedStatus(project);
          return (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow flex flex-col space-y-3 cursor-pointer"
              onClick={() => setShowInfo(project.id)}
              tabIndex={0}
              role="button"
              aria-pressed="false"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">
                  {project.name} {project.starred && <span title="Starred">⭐</span>}
                </span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="text-xs px-2 py-1 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    onClick={() => setShowEditModal(project.id)}
                    aria-label={`Edit project ${project.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs px-2 py-1 border dark:border-gray-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                    onClick={async () => {
                      if (!confirm("Delete this project? This cannot be undone.")) return;
                      try {
                        await apiDeleteProject(project.id as any);
                        setProjects((prev) => prev.filter((p) => p.id !== project.id));
                        window.dispatchEvent(new CustomEvent("projects:refresh"));
                      } catch (e: any) {
                        alert(e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to delete project");
                      }
                    }}
                    aria-label={`Delete project ${project.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded ${statusBadge(computedStatus)}`}>{computedStatus}</span>
                <span className="text-xs text-foreground/60">
                  Start {project.startDate || "-"} · Due {project.dueDate || "-"}
                </span>
              </div>
              <div className="flex space-x-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{project.category || "General"}</span>
              </div>
              {typeof (project as any).progress === "number" && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-foreground/70 mb-1">
                    <span>Progress</span>
                    <span>{(project as any).progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded">
                    <div className="bg-black dark:bg-blue-500 h-2 rounded" style={{ width: `${(project as any).progress}%` }} />
                  </div>
                </div>
              )}
              {project.team.length > 0 && (
                <div className="text-xs mt-2 text-foreground/70">
                  Team: {project.team.map((m) => m.name).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create Project */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full shadow-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            <input
              className="border dark:border-gray-700 w-full p-3 mb-4 rounded bg-transparent focus:outline-blue-500"
              type="text"
              placeholder="Project Name"
              name="name"
              value={newProject.name}
              onChange={handleInputChange}
              autoFocus
              aria-label="Project Name"
            />
            <textarea
              className="border dark:border-gray-700 w-full p-3 mb-4 rounded bg-transparent focus:outline-blue-500"
              placeholder="Description"
              name="description"
              value={newProject.description}
              onChange={handleInputChange}
              aria-label="Project Description"
              rows={4}
            />
            <div className="flex space-x-2 mb-4">
              <select
                className="border dark:border-gray-700 p-3 rounded w-1/2 bg-transparent focus:outline-blue-500"
                name="priority"
                value={newProject.priority}
                onChange={handleInputChange}
                aria-label="Priority"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select
                className="border dark:border-gray-700 p-3 rounded w-1/2 bg-transparent focus:outline-blue-500"
                name="status"
                value={newProject.status}
                onChange={handleInputChange}
                aria-label="Status"
              >
                <option>Active</option>
                {/* In create flow, new projects won't be at 100% yet, so keep Completed disabled */}
                <option disabled title="Progress must be 100%">Completed</option>
                <option>On Hold</option>
              </select>
            </div>
            <div className="text-xs text-foreground/60 mb-3">
              Note: Status automatically becomes <strong>Completed</strong> once progress reaches 100%.
            </div>
            <input
              className="border dark:border-gray-700 w-full p-3 mb-4 rounded bg-transparent focus:outline-blue-500"
              type="text"
              placeholder="Category"
              name="category"
              value={newProject.category}
              onChange={handleInputChange}
              aria-label="Category"
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-foreground/70 mb-1 block">Start Date</label>
                <input
                  className="border dark:border-gray-700 w-full p-3 rounded bg-transparent focus:outline-blue-500"
                  type="date"
                  name="startDate"
                  value={(newProject as any).startDate || ""}
                  onChange={handleInputChange}
                  aria-label="Start Date"
                />
              </div>
              <div>
                <label className="text-xs text-foreground/70 mb-1 block">Due Date</label>
                <input
                  className="border dark:border-gray-700 w-full p-3 rounded bg-transparent focus:outline-blue-500"
                  type="date"
                  name="dueDate"
                  value={newProject.dueDate}
                  onChange={handleInputChange}
                  aria-label="Due Date"
                />
              </div>
            </div>
            <label className="flex items-center mb-4 cursor-pointer">
              <input
                className="mr-2"
                type="checkbox"
                name="starred"
                checked={newProject.starred}
                onChange={handleInputChange}
                aria-checked={newProject.starred}
                aria-label="Star project"
              />
              Star project
            </label>

            {/* Team Members Input */}
            <div className="mb-4">
              <div className="font-medium mb-2">Team Members</div>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  className="border dark:border-gray-700 p-3 rounded w-1/2 bg-transparent focus:outline-blue-500"
                  placeholder="Name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  aria-label="Team member name"
                />
                <input
                  type="email"
                  className="border dark:border-gray-700 p-3 rounded w-1/2 bg-transparent focus:outline-blue-500"
                  placeholder="Email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  aria-label="Team member email"
                />
                <button
                  type="button"
                  className="bg-black text-white px-4 rounded shadow hover:bg-gray-900 disabled:opacity-50 transition"
                  onClick={handleAddMember}
                  disabled={!memberName || !memberEmail}
                  aria-disabled={!memberName || !memberEmail}
                  aria-label="Add team member"
                >
                  Add
                </button>
              </div>
              {newProject.team.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-foreground/80 max-h-32 overflow-auto border border-gray-200 rounded p-2">
                  {newProject.team.map((m, idx) => (
                    <li key={idx}>
                      {m.name} ({m.email})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="bg-gray-200 dark:bg-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-black text-white px-6 py-2 rounded shadow hover:bg-gray-900 transition disabled:opacity-50"
                onClick={handleCreateProject}
                disabled={!newProject.name}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Project Info */}
      {showInfo !== null && (() => {
        const selectedProject = projects.find((p) => p.id === showInfo);
        if (!selectedProject) return null;
        const computedStatus = getComputedStatus(selectedProject);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full shadow-lg max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedProject.name}</h3>
                <button
                  className="text-gray-600 dark:text-gray-400 text-xl px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setShowInfo(null)}
                  aria-label="Close project info"
                >
                  &times;
                </button>
              </div>
              <p className="mb-6 text-gray-700 dark:text-gray-300">{selectedProject.description}</p>
              <table className="w-full text-sm mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="font-medium w-1/3 px-4 py-2">Status:</td>
                    <td className="px-4 py-2">{computedStatus}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="font-medium px-4 py-2">Priority:</td>
                    <td className="px-4 py-2">{selectedProject.priority}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="font-medium px-4 py-2">Category:</td>
                    <td className="px-4 py-2">{selectedProject.category}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="font-medium px-4 py-2">Start Date:</td>
                    <td className="px-4 py-2">{(selectedProject as any).startDate || "-"}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="font-medium px-4 py-2">Due Date:</td>
                    <td className="px-4 py-2">{selectedProject.dueDate}</td>
                  </tr>
                  <tr>
                    <td className="font-medium px-4 py-2">Progress:</td>
                    <td className="px-4 py-2">{(selectedProject as any).progress ?? 0}%</td>
                  </tr>
                  <tr>
                    <td className="font-medium px-4 py-2">Starred:</td>
                    <td className="px-4 py-2">{selectedProject.starred ? "Yes" : "No"}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mb-6">
                <div className="font-medium mb-2">Team Members</div>
                {selectedProject.team.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 max-h-40 overflow-auto">
                    {selectedProject.team.map((m, idx) => (
                      <li key={idx}>
                        {m.name} ({m.email})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm italic text-gray-400 dark:text-gray-600">No team members</div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-gray-200 dark:bg-gray-700 px-6 py-3 rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  onClick={() => setShowInfo(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-pop">
          <div className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex items-start gap-3 max-w-sm">
            <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
            <div className="text-sm">
              <div className="font-semibold mb-0.5">Success</div>
              <div className="text-foreground/80">{toast.message}</div>
            </div>
            <button
              className="ml-auto text-gray-500 hover:text-black dark:hover:text-white"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modal: Edit Project */}
      {showEditModal !== null &&
        (() => {
          const p = projects.find((pr) => pr.id === showEditModal);
          if (!p) return null;
          return (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <EditProjectModal
                project={p as any}
                onClose={() => setShowEditModal(null)}
                onSaved={(updated) => {
                  setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  setShowEditModal(null);
                  window.dispatchEvent(new CustomEvent("projects:refresh"));
                }}
              />
            </div>
          );
        })()}
    </div>
  );
};

function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: any;
  onClose: () => void;
  onSaved: (p: any) => void;
}) {
  const [form, setForm] = React.useState<{
    name: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    startDate: string;
    dueDate: string;
    starred: boolean;
    team: { name: string; email: string }[];
  }>({
    name: project.name || "",
    description: project.description || "",
    // keep underlying status; displayed status will be computed by parent when needed.
    status: project.status || "Active",
    priority: project.priority || "Medium",
    category: project.category || "",
    startDate: project.startDate || "",
    dueDate: project.dueDate || "",
    starred: !!project.starred,
    team: project.team || [],
  });

  const [memberName, setMemberName] = React.useState("");
  const [memberEmail, setMemberEmail] = React.useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : (e.target as HTMLInputElement).value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMember = () => {
    if (memberName && memberEmail) {
      setForm((prev) => ({
        ...prev,
        team: [...prev.team, { name: memberName, email: memberEmail }],
      }));
      setMemberName("");
      setMemberEmail("");
    }
  };

  const onSave = async () => {
    try {
      const currentProgress = (project as any).progress ?? 0;
      // If progress is 100, force status to Completed for consistency
      const finalStatus = currentProgress === 100 ? "Completed" : form.status;

      // Prevent saving "Completed" if progress < 100
      if (form.status === "Completed" && currentProgress < 100) {
        alert("Cannot set status to Completed unless progress is 100%.");
        return;
      }

      const updated = await apiUpdateProject(project.id, {
        name: form.name,
        description: form.description,
        status: finalStatus as any,
        priority: form.priority as any,
        category: form.category,
        start_date: form.startDate || null,
        due_date: form.dueDate || null,
        starred: form.starred,
        team: form.team,
      } as any);

      const mapped = {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        starred: updated.starred,
        status: updated.status,
        priority: updated.priority,
        category: updated.category,
        startDate: updated.start_date || "",
        dueDate: updated.due_date || "",
        team: updated.team || [],
        progress: (updated as any).progress ?? project.progress ?? 0,
      };
      onSaved(mapped as any);
    } catch (e: any) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to update project");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 w-full max-w-[520px] shadow-lg max-h-[85vh] overflow-auto">
      <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
      <input
        className="border border-gray-300 dark:border-gray-700 w-full p-3 mb-4 rounded focus:outline-blue-500 bg-transparent"
        type="text"
        placeholder="Project Name"
        name="name"
        value={form.name}
        onChange={onChange}
        autoFocus
        aria-label="Project Name"
      />
      <textarea
        className="border border-gray-300 dark:border-gray-700 w-full p-3 mb-4 rounded focus:outline-blue-500 bg-transparent"
        placeholder="Description"
        name="description"
        value={form.description}
        onChange={onChange}
        rows={3}
        aria-label="Project Description"
      />
      <div className="flex space-x-3 mb-4">
        {(() => {
          const currentProgress = (project as any).progress ?? 0;
          const normalizedStatus = currentProgress < 100 && form.status === "Completed" ? "Active" : form.status;
          return (
            <select
              className="border border-gray-300 dark:border-gray-700 p-3 rounded w-1/2 focus:outline-blue-500 bg-transparent"
              name="status"
              value={normalizedStatus}
              onChange={onChange}
              aria-label="Status"
            >
              <option>Active</option>
              {/* Disable Completed unless computed progress is 100 */}
              <option disabled={currentProgress < 100} title={currentProgress < 100 ? "Progress must be 100%" : undefined}>
                Completed
              </option>
              <option>On Hold</option>
            </select>
          );
        })()}
      </div>
      <div className="text-xs text-foreground/60 mb-2">Progress: {(project as any).progress ?? 0}%</div>
      <div className="text-xs text-foreground/60 mb-4">Status will switch to <strong>Completed</strong> automatically when progress reaches 100%.</div>
      <input
        className="border border-gray-300 dark:border-gray-700 w-full p-3 mb-4 rounded focus:outline-blue-500 bg-transparent"
        type="text"
        placeholder="Category"
        name="category"
        value={form.category}
        onChange={onChange}
        aria-label="Category"
      />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
          <input className="border border-gray-300 dark:border-gray-700 w-full p-3 rounded focus:outline-blue-500 bg-transparent" type="date" name="startDate" value={form.startDate} onChange={onChange} aria-label="Start Date" />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Due Date</label>
          <input className="border border-gray-300 dark:border-gray-700 w-full p-3 rounded focus:outline-blue-500 bg-transparent" type="date" name="dueDate" value={form.dueDate} onChange={onChange} aria-label="Due Date" />
        </div>
      </div>
      <label className="flex items-center mb-6 cursor-pointer">
        <input className="mr-3" type="checkbox" name="starred" checked={form.starred} onChange={onChange} aria-label="Star project" />
        Star project
      </label>

      {/* Team Members Input */}
      <div className="mb-6">
        <div className="font-medium mb-3">Team Members</div>
        <div className="flex space-x-3 mb-4">
          <input
            type="text"
            className="border border-gray-300 dark:border-gray-700 p-3 rounded w-1/2 focus:outline-blue-500 bg-transparent"
            placeholder="Name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            aria-label="Team member name"
          />
          <input
            type="email"
            className="border border-gray-300 dark:border-gray-700 p-3 rounded w-1/2 focus:outline-blue-500 bg-transparent"
            placeholder="Email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            aria-label="Team member email"
          />
          <button
            type="button"
            className="bg-black text-white px-4 rounded shadow hover:bg-gray-900 disabled:opacity-50 transition"
            onClick={handleAddMember}
            disabled={!memberName || !memberEmail}
            aria-disabled={!memberName || !memberEmail}
            aria-label="Add team member"
          >
            Add
          </button>
        </div>
        {form.team.length > 0 && (
          <ul className="list-disc pl-5 text-gray-700 max-h-32 overflow-auto border border-gray-200 rounded p-2 text-sm">
            {form.team.map((m, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <span>
                  {m.name} ({m.email})
                </span>
                <button
                  className="text-red-600 hover:text-red-800 ml-3"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      team: prev.team.filter((_, i) => i !== idx),
                    }));
                  }}
                  aria-label={`Remove team member ${m.name}`}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button className="bg-gray-200 px-6 py-3 rounded shadow hover:bg-gray-300 transition" onClick={onClose}>
          Cancel
        </button>
        <button className="bg-black text-white px-6 py-3 rounded shadow hover:bg-gray-900 transition" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Projects;
