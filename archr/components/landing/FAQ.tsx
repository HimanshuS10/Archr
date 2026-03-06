"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does Archr automatically plan my tasks?",
    answer: "Archr acts as an AI-powered productivity layer over your calendar. You simply input your tasks, estimates, and deadlines, and Archr intelligently slots them around your existing meetings and deep-work preferences."
  },
  {
    question: "What happens if a meeting goes long or my schedule changes?",
    answer: "That's exactly where Archr shines. If a meeting is added, delayed, or a deadline shifts, Archr dynamically rebalances your schedule on the fly. It automatically recalculates and shifts your remaining tasks so you never have to manually reorganize your calendar."
  },
  {
    question: "Do I have to stop using my current calendar?",
    answer: "Not at all. Archr is designed to sync seamlessly with your existing calendar providers. It reads your current events to find the best times for your tasks, ensuring you always know what to focus on next without abandoning the tools you already use."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full bg-white pb-20 px-4 md:px-8">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        
        {/* Header Section */}
        <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-6">
          <span className="text-gray-600 text-sm font-medium tracking-tight">
            FAQ
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-12">
          All You Need to Know
        </h2>

        {/* FAQ Accordion List */}
        <div className="w-full flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div 
                key={index} 
                className="w-full bg-[#FAFAFC] rounded-2xl overflow-hidden cursor-pointer transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-100"
                onClick={() => toggleFaq(index)}
              >
                {/* Question Row */}
                <div className="p-6 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-medium text-gray-900 tracking-tight">
                    {faq.question}
                  </h3>
                  <div className="text-gray-400 shrink-0">
                    {isOpen ? (
                      <Minus size={20} strokeWidth={1.5} />
                    ) : (
                      <Plus size={20} strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                {/* Answer Content (Animated via CSS Grid) */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-gray-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}