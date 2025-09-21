import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock initial data
const initialProfile = {
  name: "Monika Karthikeyan",
  email: "monika@gmail.com",
  job: "Developer",
  department: "CSE",
  organization: "KSSEM",
  location: "Bangalore",
};

// Hardcoded initials to "MK"
function getInitials(name?: string) {
  return "MK";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(
    () =>
      JSON.parse(localStorage.getItem("profile") || "null") || initialProfile
  );

  useEffect(() => {
    localStorage.setItem("profile", JSON.stringify(profile));
  }, [profile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-lg mx-auto py-10">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center">
          {/* Avatar and Header */}
          <div className="avatar-brand w-32 h-32 text-4xl mb-4">
            {getInitials(profile.name)}
          </div>
          <div className="text-2xl font-bold mb-1">{profile.name || "User"}</div>
          <div className="text-md text-gray-600 dark:text-gray-300 mb-4">
            {profile.email}
          </div>

          {/* Account actions */}
          <button
            className="border border-gray-300 dark:border-gray-700 px-3 py-1 rounded bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 mb-6 w-full"
            onClick={() => navigate("/account")}
          >
            Manage your account
          </button>

          {/* About Section */}
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 w-full rounded p-4">
            <div className="font-bold mb-3">About</div>
            <div className="space-y-2">
              <ProfileField
                label="Your job title"
                value={profile.job}
                onChange={(val) => setProfile({ ...profile, job: val })}
              />
              <ProfileField
                label="Your department"
                value={profile.department}
                onChange={(val) => setProfile({ ...profile, department: val })}
              />
              <ProfileField
                label="Your organization"
                value={profile.organization}
                onChange={(val) => setProfile({ ...profile, organization: val })}
              />
              <ProfileField
                label="Your location"
                value={profile.location}
                onChange={(val) => setProfile({ ...profile, location: val })}
              />
              <div className="text-sm text-gray-500 dark:text-gray-300 mt-3">
                <b>Contact:</b> {profile.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable profile editable field
function ProfileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  return (
    <div>
      <label className="text-sm font-medium block">{label}</label>
      {editing ? (
        <input
          className="border border-gray-300 dark:border-gray-700 w-full p-1 rounded mt-1 text-sm bg-transparent"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (editValue !== value) onChange(editValue);
          }}
          autoFocus
        />
      ) : (
        <span
          className="block py-1 px-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded cursor-pointer mt-1"
          onClick={() => setEditing(true)}
        >
          {value || (
            <span className="text-gray-400 dark:text-gray-300 italic">Enter...</span>
          )}
        </span>
      )}
    </div>
  );
}
