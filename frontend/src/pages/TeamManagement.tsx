import React, { useEffect, useMemo, useState } from "react";
import { listTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, type TeamMemberApi as ApiTeamMember } from "../api/team";
import { listTasks, type ApiTask } from "../api/tasks";
import { listProjects, type ApiProject } from "../api/projects";
import { createActivity } from "../api/activities";

const roles = ["Employee", "Scrum Master", "Manager"] as const;

type UiMember = {
  id: number;
  name: string;
  email: string;
  role: typeof roles[number];
  project: string;
  totalTasks: number;
  completedTasks: number;
  // Derived weighted progress based on story points
  progressPct?: number;
};

const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<UiMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMember, setEditMember] = useState<UiMember | null>(null);
  const [newMember, setNewMember] = useState<UiMember>({
    id: 0,
    name: "",
    email: "",
    role: "Employee",
    project: "",
    totalTasks: 0,
    completedTasks: 0,
  });
  const [search, setSearch] = useState("");

  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);

  useEffect(() => {
    createActivity({ type: "view", message: "Viewed Team Management page" }).catch(() => {});
    const loadAll = async () => {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
          setError("Not authenticated. Please log in to manage team members.");
          setLoading(false);
          return;
        }
        const [tm, tk, pj] = await Promise.all([
          listTeamMembers(),
          listTasks().catch(() => [] as ApiTask[]),
          listProjects().catch(() => [] as ApiProject[]),
        ]);
        const mapped: UiMember[] = tm.map((m: ApiTeamMember) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role as UiMember["role"],
          project: (m as any).project_name || m.department || "",
          totalTasks: m.total_tasks,
          completedTasks: m.completed_tasks,
        }));
        setMembers(mapped);
        setTasks(tk);
        setProjects(pj);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          setError("Unauthorized. Please log in again to load team members.");
        } else {
          setError(e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || "Failed to load team members"));
        }
      } finally {
        setLoading(false);
      }
    };
    loadAll();

    // Refresh tasks when board changes push updates
    const onTeamRefresh = () => {
      listTasks()
        .then(setTasks)
        .catch(() => {});
    };
    window.addEventListener("team:refresh", onTeamRefresh as EventListener);
    return () => window.removeEventListener("team:refresh", onTeamRefresh as EventListener);
  }, []);

  const statCards = useMemo(() => ([
    { label: "Total Members", value: members.length, sub: "All members are active" },
    { label: "Projects", value: new Set(members.map(m => m.project)).size, sub: "Across different projects" },
  ]), [members]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setEditMember((prev) => (prev ? { ...prev, [name]: value } : prev));
    } else {
      setNewMember(prev => ({ ...prev, [name]: value } as UiMember));
    }
  };

  const handleAddMember = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        alert("Please log in to add team members.");
        return;
      }
      const selectedProjectId = newMember.project ? (projects.find(p => p.name === newMember.project)?.id ?? null) : null;
      const created = await createTeamMember({
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        department: newMember.project, // keep legacy department string for display
        project_id: selectedProjectId,
        total_tasks: Number(newMember.totalTasks) || 0,
        completed_tasks: Number(newMember.completedTasks) || 0,
      } as any);
      const mapped: UiMember = {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role as UiMember["role"],
        project: created.project_name || created.department || "", // prefer backend project name
        totalTasks: created.total_tasks,
        completedTasks: created.completed_tasks,
      };
      setMembers(prev => [...prev, mapped]);
      setShowAddModal(false);
      setNewMember({ id: 0, name: "", email: "", role: "Employee", project: "", totalTasks: 0, completedTasks: 0 });
    } catch (e: any) {
      if (e?.response?.status === 401) {
        alert("Unauthorized. Please log in again.");
      } else {
        alert(e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || "Failed to add member"));
      }
    }
  };

  const handleEdit = (member: UiMember) => {
    createActivity({ type: "view", message: `Viewed member ${member.name}` }).catch(() => {});
    setEditMember({ ...member });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editMember) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        alert("Please log in to edit team members.");
        return;
      }
      const selectedProjectId = editMember.project ? (projects.find(p => p.name === editMember.project)?.id ?? null) : null;
      const updated = await updateTeamMember(editMember.id, {
        name: editMember.name,
        email: editMember.email,
        role: editMember.role,
        department: editMember.project,
        project_id: selectedProjectId,
        total_tasks: Number(editMember.totalTasks) || 0,
        completed_tasks: Number(editMember.completedTasks) || 0,
      } as any);
      const mapped: UiMember = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role as UiMember["role"],
        project: updated.project_name || updated.department || "",
        totalTasks: updated.total_tasks,
        completedTasks: updated.completed_tasks,
      };
      setMembers(prev => prev.map(m => (m.id === mapped.id ? mapped : m)));
      setShowEditModal(false);
      setEditMember(null);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        alert("Unauthorized. Please log in again.");
      } else {
        alert(e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || "Failed to save changes"));
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        alert("Please log in to delete team members.");
        return;
      }
      await deleteTeamMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (e: any) {
      if (e?.response?.status === 401) {
        alert("Unauthorized. Please log in again.");
      } else {
        alert(e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || "Failed to delete member"));
      }
    }
  };

  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.project.toLowerCase().includes(search.toLowerCase())
  );

  // Compute weighted progress per member using story points from tasks
  const computedMembers: UiMember[] = useMemo(() => {
    if (!filteredMembers.length) return [];
    const projectNameById = new Map<number, string>();
    const projectIdByNameLc = new Map<string, number>();
    projects.forEach((p) => {
      projectNameById.set(p.id, p.name);
      projectIdByNameLc.set(p.name.toLowerCase(), p.id);
    });

    return filteredMembers.map((m) => {
      const memberEmailLc = m.email.toLowerCase();
      const memberLocalPart = memberEmailLc.split("@")[0];

      // Build candidate projects: by explicit member.project and by team membership
      const candidateProjectIds = new Set<number>();
      if (m.project) {
        const exact = projectIdByNameLc.get(m.project.toLowerCase());
        if (exact) candidateProjectIds.add(exact);
        // fuzzy contains
        projects.forEach((p) => {
          if (p.name.toLowerCase().includes(m.project.toLowerCase())) {
            candidateProjectIds.add(p.id);
          }
        });
      }
      const memberNameLc = m.name.trim().toLowerCase();
      const memberEmailLc2 = m.email.trim().toLowerCase();
      const memberLocal = memberEmailLc2.split("@")[0];
      projects.forEach((p) => {
        if (Array.isArray(p.team)) {
          const hit = p.team.some((u: any) => {
            const nm = (u?.name || "").toString().trim().toLowerCase();
            const em = (u?.email || "").toString().trim().toLowerCase();
            return (
              (em && em === memberEmailLc2) ||
              (nm && nm === memberNameLc) ||
              (em && em.split("@")[0] === memberLocal)
            );
          });
          if (hit) candidateProjectIds.add(p.id);
        }
      });

      // Prefer tasks assigned to member within candidate projects
      let relevantTasks = tasks.filter((t) => {
        if (!t.assignee) return false;
        const assigneeEmail = (t.assignee as any).email as string | undefined;
        const assigneeUsername = (t.assignee as any).username as string | undefined;
        const first = ((t.assignee as any).first_name as string | undefined) || "";
        const last = ((t.assignee as any).last_name as string | undefined) || "";
        const fullName = `${first} ${last}`.trim().toLowerCase();

        // Primary match by email
        let matched = false;
        if (assigneeEmail && assigneeEmail.toLowerCase() === memberEmailLc) {
          matched = true;
        } else if (
          // Fallback: username equals member email local-part (common pattern)
          assigneeUsername && assigneeUsername.toLowerCase() === memberLocalPart
        ) {
          matched = true;
        } else if (fullName && fullName === m.name.trim().toLowerCase()) {
          matched = true;
        }
        if (!matched) return false;

        // Limit to candidate projects if any were inferred
        if (candidateProjectIds.size > 0) {
          if (!t.project || !candidateProjectIds.has(t.project as number)) return false;
        }
        return true;
      });

      // If none, but we do have candidate projects, use all tasks in those projects
      if (relevantTasks.length === 0 && candidateProjectIds.size > 0) {
        relevantTasks = tasks.filter((t) => t.project && candidateProjectIds.has(t.project as number));
      }
      // If still none, and we matched by assignee only (no candidate projects), include all tasks assigned to member across projects
      if (relevantTasks.length === 0 && candidateProjectIds.size === 0) {
        relevantTasks = tasks.filter((t) => {
          if (!t.assignee) return false;
          const assigneeEmail = (t.assignee as any).email as string | undefined;
          const assigneeUsername = (t.assignee as any).username as string | undefined;
          const first = ((t.assignee as any).first_name as string | undefined) || "";
          const last = ((t.assignee as any).last_name as string | undefined) || "";
          const fullName = `${first} ${last}`.trim().toLowerCase();
          return (
            (assigneeEmail && assigneeEmail.toLowerCase() === memberEmailLc) ||
            (assigneeUsername && assigneeUsername.toLowerCase() === memberLocalPart) ||
            (fullName && fullName === m.name.trim().toLowerCase())
          );
        });
      }

      const totalSP = relevantTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
      const doneSP = relevantTasks
        .filter((t) => t.status === "done")
        .reduce((acc, t) => acc + (t.story_points || 0), 0);
      const inprogSP = relevantTasks
        .filter((t) => t.status === "in_progress")
        .reduce((acc, t) => acc + (t.story_points || 0), 0);

      let progressPct = 0;
      if (totalSP > 0) {
        progressPct = ((doneSP + 0.5 * inprogSP) / totalSP) * 100.0;
      } else if (relevantTasks.length > 0) {
        const done = relevantTasks.filter((t) => t.status === "done").length;
        const inprog = relevantTasks.filter((t) => t.status === "in_progress").length;
        progressPct = ((done + 0.5 * inprog) / relevantTasks.length) * 100.0;
      } else {
        // Final fallback: use member's own stored totals if available
        if (m.totalTasks > 0) {
          progressPct = (m.completedTasks / m.totalTasks) * 100.0;
        } else {
          progressPct = 0;
        }
      }

      // Keep counts as number of tasks for readability
      const totalTasks = relevantTasks.length > 0 ? relevantTasks.length : m.totalTasks;
      const completedTasks = relevantTasks.length > 0
        ? relevantTasks.filter((t) => t.status === "done").length
        : m.completedTasks;

      return {
        ...m,
        totalTasks,
        completedTasks,
        progressPct: Math.round(progressPct),
      };
    });
  }, [filteredMembers, tasks, projects]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-1">Team Management</h2>
      <div className="mb-6 text-gray-500 dark:text-gray-300">Manage team members and their roles</div>

      {loading && <div className="text-sm text-gray-500 mb-2">Loading team members…</div>}
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col">
            <span className="font-medium">{card.label}</span>
            <span className="text-2xl font-bold mt-2">{card.value}</span>
            <span className="text-sm text-gray-500 dark:text-gray-300">{card.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between mb-3">
        <input
          type="text"
          placeholder="Search team members..."
          className="w-96 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-transparent"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={() => setShowAddModal(true)}
        >
          + Add Team Member
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        
        {/* Group by project */}
        {(() => {
          const groups = new Map<string, UiMember[]>();
          computedMembers.forEach((m) => {
            const key = m.project || "Unassigned";
            const arr = groups.get(key) || [];
            arr.push(m);
            groups.set(key, arr);
          });
          const entries = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
          return entries.map(([projectName, group]) => (
            <div key={projectName} className="mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-300 font-semibold mb-2">Project: {projectName}</div>
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 px-2 w-2/5">Member</th>
                    <th className="px-2 w-1/5">Role</th>
                    <th className="px-2 w-1/5">Project</th>
                    <th className="px-2 w-1/5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((member) => (
                    <tr key={member.id} className="border-b border-gray-200 dark:border-gray-800 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800/60 align-middle">
                      <td className="py-2 px-2">
                        <div className="flex items-center space-x-2">
                          <div className="avatar-brand w-8 h-8 text-xs">
                            {member.name
                              .split(" ")
                              .map(n => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div>{member.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            member.role === "Scrum Master"
                              ? "bg-black text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-2 truncate" title={member.project}>{member.project}</td>
                      <td className="px-2 text-center">
                        <div className="inline-flex items-center gap-4">
                          <button
                            className="text-xl cursor-pointer hover:text-blue-600"
                            title="Edit"
                            onClick={() => handleEdit(member)}
                            aria-label={`Edit ${member.name}`}
                          >
                            &#9998;
                          </button>
                          <button
                            className="text-xl cursor-pointer text-pink-500 hover:text-red-600"
                            title="Delete"
                            onClick={() => handleDelete(member.id)}
                            aria-label={`Delete ${member.name}`}
                          >
                            &#128465;
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ));
        })()}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded p-8 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            <input
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-2 rounded bg-transparent"
              type="text"
              placeholder="Enter full name"
              name="name"
              value={newMember.name}
              onChange={handleInputChange}
              autoFocus
            />
            <input
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-2 rounded bg-transparent"
              type="email"
              placeholder="Enter email address"
              name="email"
              value={newMember.email}
              onChange={handleInputChange}
            />
            <select
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-2 rounded bg-transparent"
              name="role"
              value={newMember.role}
              onChange={handleInputChange}
            >
              <option value="">Select a role</option>
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Project</label>
            <select
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-4 rounded bg-transparent"
              name="project"
              value={newMember.project}
              onChange={handleInputChange}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-black text-white px-4 py-2 rounded"
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.email || !newMember.role || !newMember.project}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editMember && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded p-8 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Team Member</h3>
            <input
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-2 rounded bg-transparent"
              type="text"
              placeholder="Enter full name"
              name="name"
              value={editMember.name}
              onChange={handleInputChange}
              autoFocus
            />
            <input
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-2 rounded bg-transparent"
              type="email"
              placeholder="Enter email address"
              name="email"
              value={editMember.email}
              onChange={handleInputChange}
            />
            <select
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-2 rounded bg-transparent"
              name="role"
              value={editMember.role}
              onChange={handleInputChange}
            >
              <option value="">Select a role</option>
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Project</label>
            <select
              className="border border-gray-300 dark:border-gray-700 w-full p-2 mb-4 rounded bg-transparent"
              name="project"
              value={editMember.project}
              onChange={handleInputChange}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-black text-white px-4 py-2 rounded"
                onClick={handleSaveEdit}
                disabled={!editMember.name || !editMember.email || !editMember.role || !editMember.project}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
