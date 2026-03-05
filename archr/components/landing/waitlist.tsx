"use client";

import { ChevronDown } from "lucide-react";

export default function waitlist() {
  return (
    <section className="w-full bg-white py-24 px-4 md:px-8 flex justify-center">
      {/* Main Card Wrapper */}
      <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative flex flex-col items-center">
        
        {/* Badge */}
        <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-6">
          <span className="text-gray-500 text-sm font-medium tracking-tight">
            Contact
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-10 text-gray-900">
          Get in Touch
        </h2>

        {/* Form */}
        <form className="w-full flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-gray-600 text-sm mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Jane Smith"
              className="w-full bg-[#FAFAFC] border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-gray-600 text-sm mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="jane@framer.com"
              className="w-full bg-[#FAFAFC] border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
          </div>

          {/* Topic Field */}
          <div className="relative">
            <label htmlFor="topic" className="block text-gray-600 text-sm mb-2">
              Topic
            </label>
            <div className="relative">
              {/* appearance-none removes the default browser dropdown arrow */}
              <select
                id="topic"
                className="w-full bg-[#FAFAFC] border border-gray-100 rounded-xl px-4 py-3.5 text-gray-500 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled hidden>Select...</option>
                <option value="sales">Sales</option>
                <option value="support">Support</option>
                <option value="partnership">Partnership</option>
              </select>
              {/* Custom Dropdown Arrow */}
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={18} strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="message" className="block text-gray-600 text-sm mb-2">
              Message
            </label>
            <textarea
              id="message"
              placeholder="Enter your message"
              rows={4}
              className="w-full bg-[#FAFAFC] border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-y min-h-[120px]"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="submit"
              className="bg-[#333333] hover:bg-black text-white px-12 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg"
            >
              Submit
            </button>
          </div>

        </form>
      </div>
    </section>
  );
}