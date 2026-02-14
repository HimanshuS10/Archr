"use client"

import Sidebar from "@/components/dashboard/Sidebar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
    <div className="min-h-screen bg-[#05060f] text-white">
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar />
        <main className="flex-1 px-8 py-10">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-white/60">
            Placeholder content area.
          </p>
        </main>
      </div>
    </div>
  );
};

export default Home;
