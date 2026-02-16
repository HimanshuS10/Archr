"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CalendarView from "@/components/dashboard/CalendarView";

const Home = () => {
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
      <Sidebar />
      <main className="ml-[260px] min-h-screen px-8 py-10">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-white/60">
            <CalendarView />
          </p>
      </main>
    </div>
  );
};

export default Home;
