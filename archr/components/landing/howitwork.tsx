"use client";

import { Plug, Timer } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="w-full bg-white px-4 py-14 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative items-start">

        {/* LEFT COLUMN: Sticky Header Content */}
        <div className="md:col-span-5 sticky top-32">
          
          {/* Restored the flex row for the badge and horizontal line! */}
          <div className="flex items-center w-full mb-8">
            <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mr-4">
              <span className="text-gray-600 text-sm font-medium tracking-tight">
                How It Works
              </span>
            </div>
            <hr className="border-gray-300 w-[300px]" />
          </div>

          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.15]">
            From setup to<br />
            insight—just three<br />
            simple steps.
          </h2>
        </div>

        <div className="md:col-span-7 flex flex-col gap-8">

          {/* CARD 1 */}
          <div className="sticky top-32 w-full h-[400px] bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <Plug size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">Connect Accounts</h3>
                <p className="text-gray-500">Securely link your bank and business tools in minutes.</p>
              </div>
            </div>

            {/* Card 1 Graphic Mockup */}
            <div className="flex-1 relative flex items-end justify-center mt-8">
              <div className="w-72 h-36 border-[16px] border-dashed border-[#4F84FF] rounded-t-full opacity-60"></div>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="sticky top-40 w-full h-[400px] bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-md flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <Timer size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">Track in Real-Time</h3>
                <p className="text-gray-500">View all your financial data live on one clean dashboard.</p>
              </div>
            </div>

            {/* Card 2 Graphic Mockup */}
            <div className="flex-1 relative mt-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-center overflow-hidden">
              {/* Simulated Chart */}
              <div className="absolute top-4 bg-white border border-gray-100 shadow-sm px-3 py-1 rounded-lg text-sm z-10">
                <span className="text-[#4F84FF] font-medium">$4,890</span> <span className="text-gray-600">Highest in May</span>
              </div>
              <div className="w-full h-full flex items-end justify-between gap-2 opacity-20">
                <div className="w-full bg-blue-100 h-1/3"></div>
                <div className="w-full bg-blue-100 h-2/3"></div>
                <div className="w-full bg-blue-100 h-1/2"></div>
                <div className="w-full bg-blue-100 h-full"></div>
                <div className="w-full bg-blue-100 h-1/4"></div>
              </div>
            </div>

            {/* Number Indicator */}
            <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
              02
            </div>
          </div>

          {/* CARD 3 (Included so the stacking effect feels complete) */}
          <div className="sticky top-48 w-full h-[400px] bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border border-gray-100 rounded-[2rem] p-8 shadow-lg flex flex-col overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-[#4F84FF] p-2.5 rounded-full text-white shrink-0">
                <div className="w-6 h-6 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-tight mb-1">Gain Insights</h3>
                <p className="text-gray-500">Make better decisions with AI-powered financial reporting.</p>
              </div>
            </div>
            <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
              03
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}