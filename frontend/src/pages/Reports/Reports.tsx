import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Reports() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Reports & Analytics</h1>
      <p className="mb-4 text-gray-600">Track project progress </p>

      <nav className="flex border-b border-gray-200 mb-6" role="tablist" aria-label="Report Sections">
      <NavLink
          to="performance"
          className={({ isActive }) =>
            "px-4 py-2 -mb-px text-sm font-medium cursor-pointer " +
            (isActive ? "border-b-2 border-black font-semibold" : "text-gray-500 hover:text-gray-700")
          }
          role="tab"
        >
          Performance
        </NavLink>
        
        
        
      </nav>

      {/* Render the child route here */}
      <Outlet />
    </div>
  );
}
