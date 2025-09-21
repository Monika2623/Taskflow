import React from "react";

const points = [
  "TaskFlow is a modern task management application for individuals and teams.",
  "Task Board: Organize tasks into customizable columns like To Do, In Progress, and Done.",
  "Details & Priorities: Add due dates, priorities, and assignees to keep work on track.",
  "Activity Tracking: Recent updates help everyone stay aligned.",
  "Collaboration: Assign tasks, share progress, and deliver faster together.",
];

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="glass rounded-xl p-8 elevate-sm">
        <h1 className="text-3xl font-extrabold heading-font mb-2">About TaskFlow</h1>
        <p className="text-foreground/80 mb-6">
          Beautiful, fast, and collaborative task management for modern teams.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          {points.map((p, i) => (
            <li key={i} className="text-foreground/80">{p}</li>
          ))}
        </ul>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 card-hover">
            <div className="text-xl font-semibold mb-1">Performance</div>
            <div className="text-sm text-foreground/70">Snappy navigation and realtime UI updates.</div>
          </div>
          <div className="card p-5 card-hover">
            <div className="text-xl font-semibold mb-1">Design System</div>
            <div className="text-sm text-foreground/70">Consistent components across light/dark.</div>
          </div>
          <div className="card p-5 card-hover">
            <div className="text-xl font-semibold mb-1">Accessibility</div>
            <div className="text-sm text-foreground/70">Reduced motion support and keyboard-friendly.</div>
          </div>
        </div>
        <div className="mt-8 text-sm text-foreground/60">
          © {new Date().getFullYear()} TaskFlow. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default About;
