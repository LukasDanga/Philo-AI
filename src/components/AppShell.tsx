import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      {/* Overlay for mobile sidebar */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      <main className="main-content">
        <TopBar toggleSidebar={toggleSidebar} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </div>

        <BottomNav />
      </main>
    </div>
  );
}
