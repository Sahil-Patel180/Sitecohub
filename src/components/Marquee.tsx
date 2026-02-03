import React from 'react';
import { motion } from 'framer-motion';

interface MarqueeItem {
    name: string;
    url: string;
    description?: string;
}

interface MarqueeProps {
    items: MarqueeItem[];
    direction?: 'left' | 'right';
    speed?: number;
    className?: string; // To allow custom styling from parent
}

export const Marquee: React.FC<MarqueeProps> = ({
    items,
    direction = 'left',
    speed = 20,
    className = ''
}) => {
    return (
        <div className={`flex overflow-hidden relative w-full ${className}`}>
            <div className="flex gap-12 min-w-full">
                <MarqueeContent items={items} direction={direction} speed={speed} />
                <MarqueeContent items={items} direction={direction} speed={speed} />
            </div>
        </div>
    );
};

const MarqueeContent: React.FC<MarqueeProps> = ({ items, direction, speed }) => {
    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    return (
        <motion.div
            initial={{ x: direction === 'left' ? 0 : '-100%' }}
            animate={{ x: direction === 'left' ? '-100%' : 0 }}
            transition={{
                duration: speed,
                repeat: Infinity,
                ease: "linear"
            }}
            className="flex flex-shrink-0 gap-12 items-center py-4"
        >
            {items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center gap-3 group cursor-default">
                    {/* Favicon / Logo Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover:bg-white/10 transition-colors">
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${getHostname(item.url)}&sz=64`}
                            alt={item.name}
                            className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>

                    {/* Company Name */}
                    <span className="text-lg font-medium text-white/40 group-hover:text-white/80 transition-colors whitespace-nowrap capitalize">
                        {item.name}
                    </span>
                </div>
            ))}
        </motion.div>
    );
};
