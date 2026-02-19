"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/dashboard/Dashboard";

const Home = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const isExpanded = !collapsed || hoverOpen;
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log(data.session?.provider_token);
      console.log(data.session?.provider_refresh_token);
    };

    getSession();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar
        collapsed={!isExpanded}
        onToggle={() => setCollapsed((prev) => !prev)}
        onHoverOpen={() => setHoverOpen(true)}
        onHoverClose={() => setHoverOpen(false)}
      />
      <Dashboard isExpanded={isExpanded} />
    </div>
  );
}

export default Home;
