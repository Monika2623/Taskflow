import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./components/AuthPage/AuthPage";
import YourWork from "./pages/YourWork";
import Projects from "./pages/Projects";
import Board from "./pages/Board";
import TeamManagement from "./pages/TeamManagement";
import Calendar from "./pages/Calendar";


import RecentTabs from "./components/Recent";

import Reports from "./pages/Reports/Reports";


import Performance from "./pages/Reports/Performance";

import Starred from "./pages/Starred";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import ProfilePage from "./pages/ProfilePage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import ThemePopup from "./pages/ThemePopup";
import About from "./pages/About";


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem("accessToken"));

  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem("accessToken")) {
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        {/* Public login route */}
        <Route
          path="/auth"
          element={<AuthPage onAuth={() => setIsAuthenticated(true)} />}
        />

        {/* Protected routes */}
        {isAuthenticated ? (
          <Route
            path="/*"
            element={
              <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar />
                <div className="flex flex-col flex-grow">
                  <Navbar />
                  <main className="flex-grow p-6 overflow-auto bg-background text-foreground">
                    <Routes>
                      <Route path="/" element={<Navigate replace to="/auth" />} />
                      <Route path="/your-work" element={<YourWork />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/board" element={<Board />} />
                      <Route path="/team-management" element={<TeamManagement />} />
                      <Route path="/calendar" element={<Calendar />} />

                      <Route path="/starred" element={<Starred />} />
                      <Route path="/recent" element={<RecentTabs />} />

                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/account" element={<AccountSettingsPage />} />
                      <Route path="/theme" element={<ThemePopup />} />
                      
                      <Route path="/about" element={<About />} />
                      

                      <Route path="/reports" element={<Reports />}>
                        <Route index element={<Navigate to="Performance" replace />} />
                        
                        
                        <Route path="performance" element={<Performance />} />
                      </Route>

                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/auth" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            }
          />
        ) : (
          // Redirect all other paths to /auth if unauthenticated
          <Route path="*" element={<Navigate to="/auth" replace />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
