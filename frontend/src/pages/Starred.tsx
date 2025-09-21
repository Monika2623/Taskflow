import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiStar, FiMoreHorizontal } from "react-icons/fi";
import { getStarredProjects, toggleProjectStar, type ApiProject } from "../api/projects";

type UiProject = {
  id: number;
  name: string;
  description: string;
  status: ApiProject["status"];
  priority: ApiProject["priority"];
  category: string;
  startDate: string;   // mapped from API data
  dueDate: string;
  progress: number;    // mapped from API data
  starred: boolean;
  team: ApiProject["team"];
};

export default function StarredProjects() {
  const [projects, setProjects] = useState<UiProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getStarredProjects();
        const mapped: UiProject[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          priority: p.priority,
          category: p.category,
          startDate: p.start_date || "",  // mapping to camelCase
          dueDate: p.due_date || "",
          progress: p.progress ?? 0,
          starred: p.starred,
          team: p.team || [],
        }));
        setProjects(mapped);
      } catch (e: any) {
        setError(
          e?.response?.data
            ? JSON.stringify(e.response.data)
            : e?.message || "Failed to load starred projects"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onSearch = (e: Event) => {
      const ce = e as CustomEvent<{ query?: string }>;
      setSearchQuery(String(ce.detail?.query ?? ""));
    };
    window.addEventListener("app:search", onSearch as EventListener);
    return () => window.removeEventListener("app:search", onSearch as EventListener);
  }, []);

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (proj) =>
          proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proj.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "Active").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    return [
      {
        label: "Starred Projects",
        value: total,
        description: "Your favorite projects",
        icon: <FiStar className="text-yellow-500" />,
      },
      {
        label: "Active Starred",
        value: active,
        description: "Currently in progress",
        icon: <span className="w-4 h-4 rounded-full bg-green-400 inline-block" />,
      },
      {
        label: "Completed",
        value: completed,
        description: "Successfully finished",
        icon: <span className="w-4 h-4 rounded-full bg-gray-300 inline-block" />,
      },
    ];
  }, [projects]);

  const onToggleStar = async (proj: UiProject, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await toggleProjectStar(proj.id, !proj.starred);
      setProjects((prev) =>
        prev.filter((p) => p.id !== proj.id).concat(
          updated.starred
            ? [
                {
                  id: updated.id,
                  name: updated.name,
                  description: updated.description,
                  status: updated.status,
                  priority: updated.priority,
                  category: updated.category,
                  startDate: updated.start_date || "",
                  dueDate: updated.due_date || "",
                  progress: updated.progress ?? 0,
                  starred: updated.starred,
                  team: updated.team || [],
                },
              ]
            : []
        )
      );
      if (selectedProjectId === proj.id) setSelectedProjectId(null);
    } catch (e: any) {
      alert(
        e?.response?.data
          ? JSON.stringify(e.response.data)
          : e?.message || "Failed to update star"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      <div className="flex items-center mb-4">
        <FiStar className="text-yellow-500 mr-2" size={32} />
        <h1 className="text-3xl font-extrabold tracking-tight">Starred Projects</h1>
      </div>
      <p className="mb-6 text-gray-600">Your favorite projects and important work.</p>

      {loading && <div className="text-center text-blue-500 mb-4">Loading starred projects…</div>}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white shadow rounded-md p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-700 font-semibold">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-400">{s.description}</p>
            </div>
            <div>{s.icon}</div>
          </div>
        ))}
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.length === 0 && !loading ? (
          <p className="text-center text-gray-500">No projects found.</p>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedProjectId(proj.id)}
            >
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <FiMoreHorizontal size={20} />
              </button>

              <button
                className="absolute top-4 right-10 text-yellow-400 hover:text-yellow-500 z-10"
                onClick={(e) => onToggleStar(proj, e)}
                title={proj.starred ? "Unstar Project" : "Star Project"}
              >
                <FiStar size={20} />
              </button>

              <div className="flex items-center mb-1">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {proj.name}
                  {proj.starred && <FiStar className="text-yellow-400" />}
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-2">{proj.description}</p>
              <div className="flex gap-2 items-center mb-3">
                <span className="text-xs bg-green-100 text-green-700 rounded-full py-1 px-3">{proj.status}</span>
                <span className="text-xs bg-gray-100 text-gray-700 rounded-full py-1 px-3">{proj.priority} Priority</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{proj.team.length} team member{proj.team.length !== 1 ? "s" : ""}</span>
                <span>Due {proj.dueDate || "—"}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedProjectId(null)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedProjectId(null)}
            >
              <FiMoreHorizontal size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">{selectedProject.name}</h3>
            <p className="mb-4">{selectedProject.description}</p>
            <table className="w-full text-sm border border-gray-200 rounded-md">
              <tbody>
                <tr>
                  <td className="font-semibold border-b border-gray-200 p-2">Status</td>
                  <td className="border-b border-gray-200 p-2">{selectedProject.status}</td>
                </tr>
                <tr>
                  <td className="font-semibold border-b border-gray-200 p-2">Priority</td>
                  <td className="border-b border-gray-200 p-2">{selectedProject.priority}</td>
                </tr>
                <tr>
                  <td className="font-semibold border-b border-gray-200 p-2">Category</td>
                  <td className="border-b border-gray-200 p-2">{selectedProject.category || "N/A"}</td>
                </tr>
                <tr>
                  <td className="font-semibold border-b border-gray-200 p-2">Start Date</td>
                  <td className="border-b border-gray-200 p-2">{selectedProject.startDate || "N/A"}</td>
                </tr>
                <tr>
                  <td className="font-semibold border-b border-gray-200 p-2">Due Date</td>
                  <td className="border-b border-gray-200 p-2">{selectedProject.dueDate || "N/A"}</td>
                </tr>
                <tr>
                  <td className="font-semibold border-b border-gray-200 p-2">Progress</td>
                  <td className="border-b border-gray-200 p-2">{selectedProject.progress ? `${selectedProject.progress}%` : "N/A"}</td>
                </tr>
                <tr>
                  <td className="font-semibold p-2">Starred</td>
                  <td className="p-2">{selectedProject.starred ? "Yes" : "No"}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4">
              <h4 className="font-semibold text-lg mb-2">Team Members</h4>
              {selectedProject.team.length > 0 ? (
                <ul className="list-disc pl-6 space-y-1">
                  {selectedProject.team.map((member, idx) => (
                    <li key={idx}>{member.name} ({member.email})</li>
                  ))}
                </ul>
              ) : (
                <p>No team members</p>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-4 py-2 rounded"
                onClick={() => onToggleStar(selectedProject)}
              >
                {selectedProject.starred ? "Unstar" : "Star"}
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setSelectedProjectId(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
