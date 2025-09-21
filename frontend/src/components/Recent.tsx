import React, { useEffect, useState } from "react";
import {
  getRecentWork,
  getRecentViews,
  searchRecent,
  type RecentItem,
} from "../api/recent";

type Tab = "worked" | "viewed";

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function groupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays <= 7) return "This week";
  if (diffDays <= 30) return "This month";
  return "Earlier";
}

export default function RecentTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("worked");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [work, setWork] = useState<RecentItem[]>([]);
  const [views, setViews] = useState<RecentItem[]>([]);

  // State to track "view all" per tab group
  // keys are group labels, values boolean: true if expanded (show all 10)
  const [expandedGroupsWorked, setExpandedGroupsWorked] = useState<Record<string, boolean>>({});
  const [expandedGroupsViewed, setExpandedGroupsViewed] = useState<Record<string, boolean>>({});

  // Fetch data function unchanged
  const fetchData = async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setError("Not authenticated. Please log in to view recent activity.");
        setWork([]);
        setViews([]);
        return;
      }
      if (q && q.trim()) {
        const results = await searchRecent(q.trim());
        setWork(results.filter((r) => r.type === "work"));
        setViews(results.filter((r) => r.type === "view"));
      } else {
        const [w, v] = await Promise.all([getRecentWork(), getRecentViews()]);
        setWork(w);
        setViews(v);
      }
    } catch (e: any) {
      setError(
        e?.response?.data
          ? JSON.stringify(e.response.data)
          : e?.message || "Failed to load recent"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const handler = () => fetchData(query);
    window.addEventListener("recent:refresh", handler);
    return () => window.removeEventListener("recent:refresh", handler);
  }, [query]);

  // Regroup items by date group label
  const groupBy = (items: RecentItem[]) =>
    items.reduce<Record<string, RecentItem[]>>((acc, it) => {
      const label = groupLabel(it.created_at);
      acc[label] = acc[label] || [];
      acc[label].push(it);
      return acc;
    }, {});

  const order = ["Today", "This week", "This month", "Earlier"];

  // Utility to display items with limits and remove excess >10 when expanded
  function renderGroup(items: RecentItem[], group: string, isExpanded: boolean, newExpandedStateSetter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, expandedGroups: Record<string, boolean>) {
    let itemsToShow = items;
    if (!isExpanded) {
      itemsToShow = items.slice(0, 5);
    } else {
      // Limit items to 10 max when expanded, remove excess silently by cutting off array
      if (items.length > 10) {
        itemsToShow = items.slice(0, 10);
      }
    }

    const hasMore = items.length > (isExpanded ? 10 : 5);

    return (
      <div key={group} style={{ marginTop: 30 }}>
        <div
          style={{
            color: "#888",
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 10,
          }}
        >
          {group}
        </div>
        {itemsToShow.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
              padding: "15px 0 10px 0",
              borderBottom: "1.2px solid #f1f1f2",
              fontSize: 18,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                maxWidth: 420,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={item.title}
            >
              {item.title}
            </div>
            <div
              style={{
                color: "#62677b",
                fontSize: 16,
                flex: 1,
                maxWidth: 410,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={item.message}
            >
              {item.message}
            </div>
            <div
              style={{ color: "#aaa", fontSize: 16, minWidth: 90 }}
              title={new Date(item.created_at).toLocaleString()}
            >
              {timeAgo(item.created_at)}
            </div>
          </div>
        ))}
        {/* Show View All or Show Less button */}
        {hasMore && (
          <button
            onClick={() => {
              newExpandedStateSetter((prev) => ({
                ...prev,
                [group]: !isExpanded,
              }));
            }}
            style={{
              marginTop: 8,
              color: "#0052cc",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            {isExpanded ? "Show Less" : "View All"}
          </button>
        )}
      </div>
    );
  }

  // Group items for views and work
  const groupedWork = groupBy(work);
  const groupedViews = groupBy(views);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow p-8 md:p-12 flex flex-col min-h-[calc(100vh-60px)] w-full">
      <div className="text-2xl font-bold mb-3">Recent</div>
      <div className="flex gap-10 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`pb-1.5 text-base ${
            activeTab === "worked"
              ? "font-bold text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent"
          }`}
          onClick={() => setActiveTab("worked")}
        >
          Worked on
        </button>
        <button
          className={`pb-1.5 text-base ${
            activeTab === "viewed"
              ? "font-bold text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent"
          }`}
          onClick={() => setActiveTab("viewed")}
        >
          Viewed
        </button>
      </div>
      <input
        type="text"
        placeholder="Search recent (both sections)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full md:w-1/2 mb-4 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent text-foreground placeholder-gray-400"
      />

      {loading && <div className="text-gray-500 mb-2">Loading activity…</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Worked content */}
      <div className={`${activeTab === "worked" ? "block" : "hidden"} flex-1 overflow-y-auto`}>
        {order.map((group) => {
          if (!groupedWork[group]) return null;
          const isExpanded = !!expandedGroupsWorked[group];
          return renderGroup(
            groupedWork[group],
            group,
            isExpanded,
            setExpandedGroupsWorked,
            expandedGroupsWorked
          );
        })}
        {work.length === 0 && !loading && !error && (
          <div className="mt-14 text-gray-400 text-lg">No worked items</div>
        )}
      </div>

      {/* Viewed content */}
      <div className={`${activeTab === "viewed" ? "block" : "hidden"} flex-1 overflow-y-auto`}>
        {order.map((group) => {
          if (!groupedViews[group]) return null;
          const isExpanded = !!expandedGroupsViewed[group];
          return renderGroup(
            groupedViews[group],
            group,
            isExpanded,
            setExpandedGroupsViewed,
            expandedGroupsViewed
          );
        })}
        {views.length === 0 && !loading && !error && (
          <div className="mt-14 text-gray-400 text-lg">No viewed items</div>
        )}
      </div>
    </div>
  );
}
