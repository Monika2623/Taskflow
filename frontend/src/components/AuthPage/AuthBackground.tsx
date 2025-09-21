import React from "react";

export default function AuthBackground() {
  return (
    <div className="auth-background">
      <svg
        viewBox="0 0 500 200"
        width="500"
        height="200"
        xmlns="http://www.w3.org/2000/svg"
        className="auth-svg"
      >
        <rect x="60" y="35" rx="42" width="420" height="120" fill="#a7c3fd" opacity="0.38" />
        <circle cx="60" cy="160" r="60" fill="#f8e2a5" opacity="0.39" />
        <circle cx="410" cy="40" r="44" fill="#73c2e3" opacity="0.45" />
      </svg>
    </div>
  );
}
