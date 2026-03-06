import React from 'react';

interface IntegrationCardProps {
    Icon: React.FC;
    index: number;
}

const IntegrationIcons: React.FC[] = [
    () => (
        <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10" fill="none">
            <circle cx="9" cy="12" r="6" fill="#f97316" fillOpacity="0.8" />
            <circle cx="15" cy="12" r="6" fill="#38bdf8" fillOpacity="0.8" />
        </svg>
    ),
    // Icon 2 (Middle Left - blue layered bars)
    () => (
        <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10" fill="none">
            <path d="M7 15L12 10L17 15" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 10L12 5L17 10" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    // Icon 3 (Top Center - blue ring)
    () => (
        <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12" fill="none">
            <circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="4" />
            <path d="M12 10L10 14H14L12 10Z" fill="#2563eb" />
        </svg>
    ),
    // Icon 4 (Middle Right - orange circle)
    () => (
        <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10" fill="none">
            <circle cx="12" cy="12" r="8" stroke="#f97316" strokeWidth="3" />
            <circle cx="12" cy="12" r="3" fill="#f97316" />
        </svg>
    ),
    // Icon 5 (Bottom Right - blue geometric cross)
    () => (
        <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10" fill="none">
            <path d="M15 9L9 15M9 9L15 15" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 12L16 15L19 18" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 12L8 9L5 6" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
];

const IntegrationCard: React.FC<IntegrationCardProps> = ({ Icon, index }) => {
    // Defines custom rotation/position classes to align with the arc visual
    const positionClasses: string[] = [
        '-rotate-[45deg] translate-x-1 translate-y-24 md:translate-y-10', // Bottom Left
        '-rotate-[30deg] -translate-x-1 -translate-y-2 md:-translate-y-16', // Middle Left
        'rotate-0 -translate-y-16 md:-translate-y-28', // Top Center (Slightly larger)
        'rotate-[30deg] translate-x-1 -translate-y-2 md:-translate-y-16', // Middle Right
        '-rotate-[-45deg] translate-x-1 translate-y-24 md:translate-y-10',
    ];

    return (
        <div className={`
            flex items-center justify-center
            w-16 h-16 md:w-24 md:h-24 
            bg-gradient-to-b from-[#FFFFFF] via-[#F4F4F4] to-[#FAFAFA] 
            border-2 border-gray-100 
            rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl
            transform transition-all duration-300 ease-in-out
            ${positionClasses[index]}
        `}>
            <Icon />
        </div>
    );
};

const IntegrationsArc: React.FC = () => {
    return (
        <section className="w-full bg-white flex flex-col items-center pt-5 px-4 md:px-8 overflow-hidden">
            <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-8">
                <span className="text-gray-600 text-sm font-medium tracking-tight">Integrations</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-semibold text-center text-black mb-16 md:mb-24 leading-tight tracking-tight">
                Powerful Integrations, <br className="hidden md:block" />
                Effortless Setup
            </h2>

            <div className="relative w-full max-w-4xl h-[200px] md:h-[300px] flex mt-[-20px] justify-center items-center">
                
                <div className="absolute inset-0 z-0 flex justify-center w-full h-full overflow-visible">
                    <svg 
                        viewBox="0 0 100 50" 
                        preserveAspectRatio="none" 
                        className="w-[120%] md:w-[110%] h-[150%] md:h-[180%] -mt-10 md:-mt-20 opacity-60"
                    >
                        <defs>
                            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#eff6ff" stopOpacity="1" />
                                <stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path 
                            d="M -10 50 Q 50 -30 110 50" 
                            fill="url(#arcGradient)" 
                        />
                    </svg>
                </div>

                <div className="relative z-10 grid grid-cols-5 w-full max-w-3xl items-center justify-items-center gap-2 md:gap-6 px-2 md:px-0">
                    {IntegrationIcons.map((Icon, index) => (
                        <IntegrationCard key={index} Icon={Icon} index={index} />
                    ))}
                </div>

            </div>
        </section>
    );
};

export default IntegrationsArc;