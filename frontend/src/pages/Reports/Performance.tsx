import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { listProjects, type ApiProject } from "../../api/projects";

function ProjectProgress({
  name,
  start,
  due,
  progress,
}: {
  name: string;
  start: string | null;
  due: string | null;
  progress: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm font-medium">
        <span>{name}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 mt-1 relative overflow-hidden">
        <div
          className="bg-black dark:bg-blue-500 h-2 rounded"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-gray-500 text-xs mt-1">
        {start ? `Start: ${start}` : "Start: -"} · {due ? `Due: ${due}` : "Due: -"}
      </p>
    </div>
  );
}

export default function ReportPerformance() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listProjects();
        setProjects(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load performance data");
      } finally {
        setLoading(false);
      }
    })();
    const onRefresh = async () => {
      try {
        const data = await listProjects();
        setProjects(data);
      } catch {}
    };
    window.addEventListener("projects:refresh", onRefresh as any);
    return () => window.removeEventListener("projects:refresh", onRefresh as any);
  }, []);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === "Active"),
    [projects]
  );

  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const sum = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round((sum / projects.length) * 10) / 10;
  }, [projects]);

  // Chart Series → project progress values
  const chartSeries = [
    {
      name: "Progress %",
      data: projects.map((p) => p.progress || 0),
    },
  ];

  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: false, // vertical bars
        columnWidth: "55%",
        borderRadius: 6,
        distributed: false, // ❌ disable distributed colors
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      style: { colors: ["#000"] },
    },
    xaxis: {
      categories: projects.map((p) => p.name), // project names on X-axis
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Progress (%)" },
      max: 100,
    },
    colors: ["#1E90FF"], // ✅ all bars same blue
    legend: { show: false },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {loading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="Avg Project Progress"
          value={`${avgProgress}%`}
          delta={`${projects.length} projects`}
          noArrow
        />
        <SummaryCard
          title="Active Projects"
          value={`${activeProjects.length}`}
          delta="On track"
          noArrow
        />
        <SummaryCard
          title="Total Projects"
          value={`${projects.length}`}
          delta="All"
          noArrow
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded shadow p-6">
          <h2 className="font-semibold mb-4">Project Progress</h2>
          <div className="space-y-4">
            {projects.map((p) => (
              <ProjectProgress
                key={p.id}
                name={p.name}
                start={p.start_date}
                due={p.due_date}
                progress={p.progress || 0}
              />
            ))}
            {projects.length === 0 && (
              <div className="text-sm text-gray-500">No projects found.</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded shadow p-6">
          <h2 className="font-semibold mb-4">Project Progress Chart</h2>
          <Chart type="bar" height={300} series={chartSeries} options={chartOptions} />
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  delta,
  noArrow = false,
}: {
  title: string;
  value: string;
  delta?: string;
  noArrow?: boolean;
}) {
  return (
    <div className="bg-white rounded shadow p-6 flex flex-col gap-2">
      <h3 className="text-gray-600 font-medium">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
      {delta && (
        <p
          className={`text-sm ${
            noArrow ? "text-gray-600" : "text-green-600"
          } flex items-center`}
        >
          {!noArrow && <span className="mr-1">▲</span>} {delta}
        </p>
      )}
    </div>
  );
}
