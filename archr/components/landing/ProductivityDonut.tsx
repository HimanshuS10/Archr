import React from 'react';
import { PenTool, Users, FolderOpen } from 'lucide-react';

export default function ProductivityDonut() {
  // SVG Circle Math: Radius = 35, Circumference = 2 * PI * 35 = ~220
  // Segments: Admin (25%), Deep Work (45%), Meetings (30%)
  // We leave a gap of 2 units between each segment for that clean separated look.
  
  return (
    <div className="relative w-full max-w-[360px] h-[400px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-48 h-32 bg-cyan-400/20 blur-[40px] rounded-full pointer-events-none"></div>

      {/* Chart & Labels Container */}
      <div className="relative w-full h-64 mt-4 flex justify-center items-center">
        
        {/* The SVG Donut */}
        <div className="relative w-48 h-48 drop-shadow-xl z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
            
            {/* Admin: 25% (Length: 53, Gap: 2) */}
            <circle 
              cx="50" cy="50" r="35" 
              fill="transparent" 
              className="stroke-gray-300" 
              strokeWidth="22" 
              strokeDasharray="53 167" 
              strokeDashoffset="0" 
            />
            
            {/* Deep Work: 45% (Length: 97, Gap: 2, Offset starts after Admin+Gap) */}
            <circle 
              cx="50" cy="50" r="35" 
              fill="transparent" 
              className="stroke-blue-600" 
              strokeWidth="22" 
              strokeDasharray="97 123" 
              strokeDashoffset="-55" 
            />
            
            {/* Meetings: 30% (Length: 64, Gap: 2, Offset starts after Admin+DeepWork+Gaps) */}
            <circle 
              cx="50" cy="50" r="35" 
              fill="transparent" 
              className="stroke-cyan-500" 
              strokeWidth="22" 
              strokeDasharray="64 156" 
              strokeDashoffset="-154" 
            />
          </svg>

          {/* Icons Embedded inside the Donut Segments */}
          <div className="absolute top-[28px] left-[32px] text-gray-600 z-20">
            <FolderOpen size={18} strokeWidth={2.5} />
          </div>
          <div className="absolute top-[60px] right-[20px] text-white z-20">
            <PenTool size={18} strokeWidth={2.5} />
          </div>
          <div className="absolute bottom-[30px] left-[50px] text-white z-20">
            <Users size={18} strokeWidth={2.5} />
          </div>
        </div>

        {/* Floating Labels with Connecting Lines */}
        
        {/* Admin Label */}
        <div className="absolute top-4 left-4 flex flex-col items-start z-10">
          <span className="text-[10px] font-bold text-gray-800 tracking-wider">ADMIN</span>
          <span className="text-xs font-medium text-gray-500">25%</span>
          {/* Connecting Line */}
          <div className="absolute top-3 left-12 w-8 h-[1px] bg-gray-300 rotate-12 origin-left"></div>
        </div>

        {/* Deep Work Label */}
        <div className="absolute top-4 right-2 flex flex-col items-end z-10">
          <span className="text-[10px] font-bold text-gray-800 tracking-wider">DEEP WORK</span>
          <span className="text-xs font-medium text-gray-500">45%</span>
          {/* Connecting Line */}
          <div className="absolute top-3 right-16 w-10 h-[1px] bg-blue-200 -rotate-[20deg] origin-right"></div>
        </div>

        {/* Meetings Label */}
        <div className="absolute bottom-4 left-4 flex flex-col items-start z-10">
          <span className="text-[10px] font-bold text-gray-800 tracking-wider">MEETINGS</span>
          <span className="text-xs font-medium text-gray-500">30%</span>
          {/* Connecting Line */}
          <div className="absolute bottom-6 left-14 w-12 h-[1px] bg-cyan-200 -rotate-[35deg] origin-left"></div>
        </div>

      </div>

      {/* Card Title */}
      <h3 className="mt-8 mb-2 text-lg font-semibold text-gray-900 tracking-tight z-10">
        Productivity Analytics
      </h3>
    </div>
  );
}