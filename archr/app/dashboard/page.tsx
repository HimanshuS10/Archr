"use client";

import Sidebar, { type Tab } from "@/components/dashboard/Sidebar";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/dashboard/Dashboard";
import Events from "@/components/dashboard/Events";
import Tasks from "@/components/dashboard/Tasks";
import Deadlines from "@/components/dashboard/Deadlines";

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Home");

  const marginLeft = collapsed ? 56 : 200;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((p) => !p)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div>
        {activeTab === "Home"      && <Dashboard isExpanded={!collapsed} />}
        {activeTab === "Events"    && <Events    isExpanded={!collapsed} />}
        {activeTab === "Tasks To Do" && <Tasks    isExpanded={!collapsed} />}
        {activeTab === "Deadlines" && (
          <Deadlines
            isExpanded={!collapsed}
            onViewTasksTab={() => setActiveTab("Tasks To Do")}
          />
        )}
      </div>
    </div>
  );
}
