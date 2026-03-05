"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does this platform help our team manage financial data better?",
    answer: "Our platform centralizes all your financial data into a single, easy-to-use dashboard. It automates categorization, provides real-time reporting, and gives you actionable insights to make informed business decisions."
  },
  {
    question: "Can we connect our existing banks and financial tools easily?",
    answer: "Yes! We support integrations with over 10,000 global financial institutions. You can securely connect your bank accounts, credit cards, and accounting software in just a few clicks."
  },
  {
    question: "Is our company's financial data secure and properly protected here?",
    answer: "Security is our top priority. We use bank-level 256-bit encryption and strictly adhere to industry standards like SOC 2 to ensure your data is always safe and private."
  },
  {
    question: "Does the platform support multiple team members with different access levels?",
    answer: "Absolutely. You can invite your entire team and assign custom roles and permissions. This ensures everyone has the access they need while keeping sensitive information restricted."
  }
];

export default function faq() {
  // 1. Tell TypeScript this can be a number OR null
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 2. Simplify this to just expect a number
  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white pb-20 px-4 md:px-8">
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