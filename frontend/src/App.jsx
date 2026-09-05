import { useCallback, useEffect, useState } from "react";
import api from "./api/client";

import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Books from "./components/Books";
import Shelves from "./components/Shelves";
import Lending from "./components/Lending";
import Activity from "./components/Activity";
import useWebSocket from "./hooks/useWebSocket";

function App() {
 const [realtimeEvent, setRealtimeEvent] = useState(null);

const handleWebSocketEvent = useCallback((event) => {
  console.log("Realtime event:", event);
  setRealtimeEvent(event);
}, []);

useWebSocket(handleWebSocketEvent);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeSection, setActiveSection] =
    useState("dashboard");

  /*
   * --------------------------------------------------
   * Load currently logged-in user
   * --------------------------------------------------
   */

  const loadUser = useCallback(async () => {
    const accessToken =
      localStorage.getItem("access_token");

    if (!accessToken) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      setUser(response.data);
    } catch (error) {
      console.error("User authentication error:", error);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  /*
   * --------------------------------------------------
   * Check authentication when application starts
   * --------------------------------------------------
   */

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /*
   * --------------------------------------------------
   * Login callback
   * --------------------------------------------------
   */

  const handleLogin = async () => {
    await loadUser();

    setActiveSection("dashboard");
  };

  /*
   * --------------------------------------------------
   * Logout
   * --------------------------------------------------
   */

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setUser(null);
    setActiveSection("dashboard");
  };

  /*
   * --------------------------------------------------
   * When books/shelves/etc. change
   *
   * Components can use this callback if needed.
   * --------------------------------------------------
   */

  const handleDataChange = () => {
    // Components currently reload their own data.
    // This callback exists so App can coordinate
    // future global refreshes without duplicating API logic.
  };

  /*
   * --------------------------------------------------
   * Navigation
   * --------------------------------------------------
   */

  const handleNavigate = (section) => {
    setActiveSection(section);
  };

  /*
   * --------------------------------------------------
   * Loading screen
   * --------------------------------------------------
   */

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <h2>📚 BookNest</h2>
          <p>Loading your library...</p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * Authentication screen
   * --------------------------------------------------
   */

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  /*
   * --------------------------------------------------
   * Main application
   * --------------------------------------------------
   */

  return (
    <div className="app">
      <Navbar
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
      />

      <main className="content">
        {activeSection === "dashboard" && (
          <Dashboard onNavigate={handleNavigate} />
        )}

        {activeSection === "books" && (
<Books
  onDataChange={handleDataChange}
  realtimeEvent={realtimeEvent}
/> 
        )}

        {activeSection === "shelves" && (
<Shelves
  onDataChange={handleDataChange}
  realtimeEvent={realtimeEvent}
/>        )}

        {activeSection === "lending" && (
<Lending realtimeEvent={realtimeEvent} />        )}

        {activeSection === "activity" && (
<Activity realtimeEvent={realtimeEvent} />        )}
      </main>
    </div>
  );
}

export default App;