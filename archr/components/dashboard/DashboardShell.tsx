"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Dashboard from "@/components/dashboard/Dashboard";
import Events from "@/components/dashboard/Events";
import Tasks from "@/components/dashboard/Tasks";
import type { InitialCalendarEvent } from "@/lib/calendar-events-server";

type Tab = "Home" | "Events" | "Tasks";

type DashboardShellProps = {
  initialEvents: InitialCalendarEvent[];
};

export default function DashboardShell({ initialEvents }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Home");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Keep all tabs mounted — CSS hidden prevents re-fetch and flash on switch */}
      <div className={activeTab === "Home" ? "" : "hidden"}>
        <Dashboard isExpanded={!collapsed} initialEvents={initialEvents} />
      </div>
      <div className={activeTab === "Events" ? "" : "hidden"}>
        <Events isExpanded={!collapsed} />
      </div>
      <div className={activeTab === "Tasks" ? "" : "hidden"}>
        <Tasks isExpanded={!collapsed} />
      </div>
    </div>
  );
}
