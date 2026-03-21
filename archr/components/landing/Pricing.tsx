"use client";

import { Package, Star, Zap, Check, X } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="w-full bg-white py-24 px-4 md:px-8 flex flex-col items-center">
      
      {/* HEADER SECTION */}
      <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-6">
        <span className="text-gray-600 text-sm font-medium tracking-tight">
          Pricing
        </span>
      </div>
      <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-16">
        Simple Plans, Clear Value
      </h2>

      {/* PRICING CARDS GRID */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* CARD 1: Starter */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col mt-8 md:mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-full shrink-0">
              <Package size={20} className="text-gray-800" />
            </div>
            <h3 className="text-2xl font-medium tracking-tight">Free</h3>
          </div>
          
          <div className="mb-4">
            <span className="text-5xl font-medium tracking-tight">$0</span>
            <span className="text-gray-500 font-medium ml-2">/ mo</span>
          </div>
          <p className="text-gray-500 text-sm mb-8 h-10">
            Perfect for solo founders and early-stage projects.
          </p>
          
          <button className="w-full bg-[#222222] hover:bg-black text-white py-3.5 rounded-full font-medium transition-colors mb-8">
            Get Started
          </button>
          
          <hr className="border-gray-100 mb-8" />
          
          <ul className="space-y-4 text-sm text-gray-600 flex-1">
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Up to 10 tasks / week</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Basic auto-scheduling</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Manual drag & drop</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Weekly plan view</li>
          </ul>
          <hr className="border-gray-300 my-8" />
          <ul className="space-y-4 text-sm text-gray-600 flex-1">
            <li className="flex items-center gap-3"><X size={18} className="text-gray-400" /> Up to 10 tasks / week</li>
            <li className="flex items-center gap-3"><X size={18} className="text-gray-400" /> Basic auto-scheduling</li>
            <li className="flex items-center gap-3"><X size={18} className="text-gray-400" /> Manual drag & drop</li>
            <li className="flex items-center gap-3"><X size={18} className="text-gray-400" /> Weekly plan view</li>
          </ul>
        </div>

        {/* CARD 2: Growth (Highlighted) */}
        <div className="bg-[#4F84FF] rounded-[2rem] flex flex-col shadow-lg shadow-blue-500/20 relative z-10 md:-mt-4">
          <div className="text-center text-white py-3 text-sm font-medium tracking-wide">
            Best Deal
          </div>
          <div className="bg-white rounded-[1.75rem] p-8 flex-1 flex flex-col m-[3px] mt-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-2 rounded-full shrink-0">
                <Star size={20} className="text-[#4F84FF] fill-[#4F84FF]" />
              </div>
              <h3 className="text-2xl font-medium tracking-tight">Growth</h3>
            </div>
            
            <div className="mb-4">
              <span className="text-5xl font-medium tracking-tight">$15</span>
              <span className="text-gray-500 font-medium ml-2">/ mo</span>
            </div>
            <p className="text-gray-500 text-sm mb-8 h-10">
              Ideal for growing teams who need deeper insights.
            </p>
            
            <button className="w-full bg-[#4F84FF] hover:bg-blue-600 text-white py-3.5 rounded-full font-medium transition-colors mb-8 shadow-sm">
              Get Started
            </button>
            
            <hr className="border-gray-100 mb-8" />
            
            <ul className="space-y-4 text-sm text-gray-600 flex-1">
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Unlimited tasks & projects</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Energy-aware scheduling</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Dynamic rescheduling</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> AI task breakdown</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Priority conflict engine</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Buffer & transition logic</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Unlimited habits</li>
              <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Weekly productivity analytics</li>
            </ul>
          </div>
        </div>

        {/* CARD 3: Scale */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col mt-8 md:mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-100 p-2 rounded-full shrink-0">
              <Zap size={20} className="text-gray-800" />
            </div>
            <h3 className="text-2xl font-medium tracking-tight">Scale</h3>
          </div>
          
          <div className="mb-4">
            <span className="text-5xl font-medium tracking-tight">$35</span>
            <span className="text-gray-500 font-medium ml-2">/ mo</span>
          </div>
          <p className="text-gray-500 text-sm mb-8 h-10">
            For established teams ready to maximize performance.
          </p>
          
          <button className="w-full bg-[#222222] hover:bg-black text-white py-3.5 rounded-full font-medium transition-colors mb-8">
            Contact Us
          </button>
          
          <hr className="border-gray-100 mb-8" />
          
          <ul className="space-y-4 text-sm text-gray-600 flex-1">
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Unlimited connected accounts</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Custom dashboards</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Exportable reports</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Dedicated support</li>
            <li className="flex items-center gap-3"><Check size={18} className="text-gray-400" /> Unlimited team members</li>
          </ul>
        </div>

      </div>
    </section>
  );
}