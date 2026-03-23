"use client";

import { Package, Star, Zap, Check, X, CircleDot } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="w-full bg-white py-24 px-4 md:px-8 flex flex-col items-center">

      <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-6">
        <span className="text-gray-600 text-sm font-medium tracking-tight">
          Pricing
        </span>
      </div>
      <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-4">
        Simple Plans, Clear Value
      </h2>
      <p className="text-gray-400 text-center text-base mb-16 max-w-md">
        Start free, upgrade when you need the full AI experience.
      </p>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col mt-8 md:mt-12">
          <div className="flex items-center gap-3 mb-6">
            {/* <div className="bg-gray-100 p-2 rounded-full shrink-0">
              <CircleDot size={20} className="text-gray-800" />
            </div> */}
            <h3 className="text-2xl font-medium tracking-tight">Free</h3>
          </div>

          <div className="mb-4">
            <span className="text-5xl font-medium tracking-tight">$0</span>
            <span className="text-gray-500 font-medium ml-2">/ mo</span>
          </div>
          <p className="text-gray-500 text-sm mb-8 h-10">
            Everything you need to get started and stay organized.
          </p>

          <hr className="border-gray-100 mb-8" />

          <ul className="space-y-4 text-sm text-gray-600 flex-1">
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Google Calendar sync</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Month, week & day views</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Up to 10 active tasks</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Event creation & editing</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> 3 AI subtask generations / month</li>
          </ul>

          <hr className="border-gray-100 my-8" />

          <ul className="space-y-4 text-sm text-gray-400 flex-1">
            <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> AI smart scheduling</li>
            <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> File attachments</li>
            <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> Dynamic rescheduling</li>
            <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> Productivity analytics</li>
          </ul>
        </div>

        <div className="bg-[#4F84FF] rounded-[2rem] flex flex-col shadow-lg shadow-blue-500/20 relative z-10 md:-mt-4">
          <div className="text-center text-white py-3 text-sm font-medium tracking-wide">
            Most Popular
          </div>
          <div className="bg-white rounded-[1.75rem] p-8 flex-1 flex flex-col m-[3px] mt-0">
            <div className="flex items-center gap-3 mb-6">
              {/* <div className="bg-blue-50 p-2 rounded-full shrink-0">
                <CircleDot size={20} className="text-[#4F84FF] fill-[#4F84FF]" />
              </div> */}
              <h3 className="text-2xl font-medium tracking-tight">Pro</h3>
            </div>

            <div className="mb-1">
              <span className="text-5xl font-medium tracking-tight">$5</span>
              <span className="text-gray-500 font-medium ml-2">/ mo</span>
            </div>
            <p className="text-gray-400 text-xs mb-4">or $45 / year (save 25%)</p>
            <p className="text-gray-500 text-sm mb-8 h-10">
              Unlock all AI features to plan smarter, not harder.
            </p>

            <hr className="border-gray-100 mb-8" />

            <ul className="space-y-4 text-sm text-gray-600 flex-1">
              <li className="flex items-center gap-3"><Check size={18} className="text-[#4F84FF]" /> Everything in Free</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-[#4F84FF]" /> Unlimited tasks</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-[#4F84FF]" /> Unlimited AI subtask generation</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-[#4F84FF]" /> AI smart calendar scheduling</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-[#4F84FF]" /> File attachments on tasks</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-[#4F84FF]" /> Priority labels & conflict warnings</li>
            </ul>

            <hr className="border-gray-100 my-8" />

            <ul className="space-y-4 text-sm text-gray-400 flex-1">
              <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> Dynamic rescheduling</li>
              <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> Energy-aware scheduling</li>
              <li className="flex items-center gap-3"><X size={18} className="text-gray-300" /> Productivity analytics</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col mt-8 md:mt-12">
          <div className="flex items-center gap-3 mb-6">
            {/* <div className="bg-gray-100 p-2 rounded-full shrink-0">
              <CircleDot size={20} className="text-gray-800" />
            </div> */}
            <h3 className="text-2xl font-medium tracking-tight">Pro+</h3>
          </div>

          <div className="mb-1">
            <span className="text-5xl font-medium tracking-tight">$10</span>
            <span className="text-gray-500 font-medium ml-2">/ mo</span>
          </div>
          <p className="text-gray-400 text-xs mb-4">or $90 / year (save 25%)</p>
          <p className="text-gray-500 text-sm mb-8 h-10">
            The full AI experience for power users who want every edge.
          </p>

          <hr className="border-gray-100 mb-8" />

          <ul className="space-y-4 text-sm text-gray-600 flex-1">
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Everything in Pro</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Dynamic rescheduling</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Energy-aware scheduling</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Habit tracking & scheduling</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Weekly productivity analytics</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Multiple calendar connections</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Export tasks & reports</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-emerald-400" /> Early access to new features</li>
          </ul>
        </div>

      </div>
    </section>
  );
}