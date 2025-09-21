import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiFolder,
  FiUsers,
  FiCalendar,
  FiStar,
  FiClock,
} from "react-icons/fi";
import { HiOutlineViewGrid, HiOutlineChartBar } from "react-icons/hi";

type MenuItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: number;
  highlight?: boolean;
};

type Section = {
  heading?: string;
  items: MenuItem[];
};

const sections: Section[] = [
  {
    items: [
      {
        label: "Your work",
        to: "/your-work",
        icon: <FiGrid size={18} />,
      },
      {
        label: "Projects",
        to: "/projects",
        icon: <FiFolder size={18} />,
      },
      {
        label: "Team Management",
        to: "/team-management",
        icon: <FiUsers size={18} />,
      },
    ],
  },
  {
    heading: "PLANNING",
    items: [
      { label: "Board", to: "/board", icon: <HiOutlineViewGrid size={18} /> },
      { label: "Calendar", to: "/calendar", icon: <FiCalendar size={18} /> },
      { label: "Reports", to: "/reports", icon: <HiOutlineChartBar size={18} /> },
    ],
  },
  {
    heading: "QUICK ACCESS",
    items: [
      {
        label: "Starred",
        to: "/starred",
        icon: <FiStar size={18} />,
        
      },
      {
        label: "Recent",
        to: "/recent",
        icon: <FiClock size={18} />,
      },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  return (
    <aside className="w-64 bg-white dark:bg-gray-900 text-foreground min-h-screen border-r border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
      {/* Logo */}
      <div className="flex items-center space-x-2 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-9 h-9 flex items-center justify-center rounded bg-blue-700 dark:bg-amber-500 text-white font-bold text-[20px] select-none cursor-pointer ring-2 ring-white/60 dark:ring-white/20 shadow-sm">
          T
        </div>
        <span className="text-lg font-semibold select-none text-gray-900 dark:text-gray-100">
          TaskFlow
        </span>
      </div>
      {/* Main navigation */}
      <nav className="p-4 pb-0 flex-1">
        {sections.map((section, i) => (
          <div className="mb-2" key={i}>
            {section.heading && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold px-2 mb-1 mt-5 select-none">
                {section.heading}
              </div>
            )}
            {section.items.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center px-3 py-2 mb-1 rounded-lg transition ${
                  location.pathname === item.to || item.highlight
                    ? "bg-gray-100 dark:bg-gray-800 font-semibold text-foreground"
                    : "text-foreground/80 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                }`}
              >
                <span className="mr-3 flex items-center">{item.icon}</span>
                <span className="text-[15px] flex-1">{item.label}</span>
                {typeof item.badge === "number" && (
                  <span className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 rounded text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      {/* Bottom items removed as requested */}
    </aside>
  );
};

export default Sidebar;
