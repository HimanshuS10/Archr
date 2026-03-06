"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/dashboard/Dashboard";
import Events from "@/components/dashboard/Events";
import Tasks from "@/components/dashboard/Tasks";

const Home = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"Home" | "Events" | "Tasks">("Home");

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log(data.session?.provider_token);
      console.log(data.session?.provider_refresh_token);
    };

    getSession();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "Home" && <Dashboard isExpanded={!collapsed} />}
      {activeTab === "Events" && <Events isExpanded={!collapsed} />}
      {activeTab === "Tasks" && <Tasks isExpanded={!collapsed} />}

    </div>
  );
}

export default Home;
