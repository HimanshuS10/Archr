import React from 'react';

const Feature = () => {
    return (
        <section className="w-full bg-white flex flex-col items-center pt-10 pb-20 px-4 md:px-8">
            <div className="w-fit px-4 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm mb-8">
                <span className="text-gray-600 text-sm font-medium tracking-tight">Features</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-semibold text-center text-black mb-10 leading-tight tracking-tight">
                Streamline Finances <br className="hidden md:block" />
                with Smart Features
            </h2>

            {/* Top Row: 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
                <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col overflow-hidden h-[420px]">
                    <h3 className="text-2xl font-semibold mb-3">Real-Time Analytics</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Monitor your finances live with clear, intuitive dashboards.
                    </p>
                    <div className="relative flex-grow mt-auto flex justify-center w-full">
                        {/* Placeholder for Graphic */}
                    </div>
                </div>

                <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col overflow-hidden h-[420px]">
                    <h3 className="text-2xl font-semibold mb-3">Automated Reports</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Generate summaries instantly —no manual work needed.
                    </p>
                    <div className="relative flex-grow w-full mt-auto flex items-end">
                        {/* Placeholder for Graphic */}
                    </div>
                </div>

                <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col overflow-hidden h-[420px]">
                    <h3 className="text-2xl font-semibold mb-3">Smart Budgeting</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Plan and adjust with AI-powered budget suggestions.
                    </p>
                    <div className="relative flex-grow mt-auto flex justify-center items-center w-full h-full pb-10">
                        {/* Placeholder for Graphic */}
                    </div>
                </div>
            </div>

            {/* Bottom Row: 2 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mt-6">
                
                {/* Secure Syncing Card */}
                <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center overflow-hidden min-h-[220px]">
                    <div className="flex-1 pr-4 text-center md:text-left mb-6 md:mb-0">
                        <h3 className="text-2xl font-semibold mb-3">Secure Syncing</h3>
                        <p className="text-gray-500 leading-relaxed max-w-[250px] mx-auto md:mx-0">
                            Link accounts safely with real-time data syncing.
                        </p>
                    </div>
                    <div className="w-48 h-24 relative flex-shrink-0 flex items-end justify-center">
                       
                    </div>
                </div>

                {/* Growth Score Card */}
                <div className="bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] border-2 border-gray-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center overflow-hidden min-h-[220px]">
                    <div className="flex-1 pr-4 text-center md:text-left mb-6 md:mb-0">
                        <h3 className="text-2xl font-semibold mb-3">Growth Score</h3>
                        <p className="text-gray-500 leading-relaxed max-w-[250px] mx-auto md:mx-0">
                            View key metrics and trends at a glance.
                        </p>
                    </div>
                    <div className="w-48 h-24 relative flex-shrink-0 flex items-end justify-center">

                    </div>
                </div>

            </div>
        </section>
    );
};

export default Feature;