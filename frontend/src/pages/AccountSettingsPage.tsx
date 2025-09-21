import React, { useState } from "react";

const fields = [
  { key: "photo", label: "Profile photo", type: "avatar" },
  { key: "fullName", label: "Full name" },
  { key: "publicName", label: "Public name", info: "The name shown publicly" },
  { key: "job", label: "Job title" },
  { key: "department", label: "Department" },
  { key: "organization", label: "Organization" },
  { key: "location", label: "Location" },
  
  { key: "email", label: "Email address", section: "Contact" },
];

const initialValues = {
  photo: "MK",
  fullName: "Monika Karthikeyan",
  publicName: "Monika K",
  job: "Developer",
  department: "CSE",
  organization: "KSSEM",
  location: "Bangalore",
  
  email: "monika@gmail.com",
};

export default function AccountSettingsPage() {
  // Field values
  const [values, setValues] = useState(() => {
    return JSON.parse(localStorage.getItem("accountValues") || "null") || initialValues;
  });

  

  // Save changes to localStorage
  const handleFieldChange = (key: string, value: string) => {
    const newVals = { ...values, [key]: value };
    setValues(newVals);
    localStorage.setItem("accountValues", JSON.stringify(newVals));
  };
  

  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Profile Header Card */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl text-white font-bold">
          {values.photo}
        </div>
        <div>
          <div className="font-bold text-2xl mb-2 text-gray-900 dark:text-gray-100">{values.fullName}</div>
          <div className="text-sm text-gray-500 dark:text-gray-300">{values.email}</div>
        </div>
        
      </div>

      {/* About you Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-8 mb-8">
        <div className="font-bold text-lg mb-5">About you</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-6">
          {fields
            .filter(f => !f.section)
            .map(field => (
              <div key={field.key}>
                <label className="block font-semibold mb-1">
                  {field.label}
                  {field.info && (
                    <span title={field.info} className="ml-1 text-gray-400 dark:text-gray-300 cursor-help">ⓘ</span>
                  )}
                </label>
                <input
                  type="text"
                  className="border border-gray-300 dark:border-gray-700 w-full rounded px-2 py-1 text-sm mb-1 bg-transparent"
                  value={values[field.key]}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                />
                
              </div>
            ))}
        </div>
      </div>

      {/* Contact Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow p-8">
        <div className="font-bold text-lg mb-4">Contact</div>
        <div className="flex items-center gap-7">
          <div>
            <label className="block font-semibold mb-1">Email address</label>
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-700 w-full rounded px-2 py-1 text-sm mb-1 bg-transparent"
              value={values.email}
              onChange={e => handleFieldChange("email", e.target.value)}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}

