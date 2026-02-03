import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WebsiteData } from '../data/mockData';
import { Heart } from 'lucide-react';

interface SiteCardProps {
    site: WebsiteData;
    onClick: (site: WebsiteData) => void;
    // Optional: Pass a callback if we want the parent to know when a like changes (e.g. for "My Likes" filter refresh)
    onLikeToggle?: () => void;
}

export default function SiteCard({ site, onClick, onLikeToggle }: SiteCardProps) {
    const [liked, setLiked] = useState(() => {
        try {
            const savedLikes = JSON.parse(localStorage.getItem('sitecohub_likes') || '[]');
            return savedLikes.includes(site.id);
        } catch { return false; }
    });

    const [likes, setLikes] = useState(() => {
        // If we have already liked it locally, we visually add 1 to the static base count
        // so it looks consistent with "I liked it".
        const savedLikes = JSON.parse(localStorage.getItem('sitecohub_likes') || '[]');
        const isLiked = savedLikes.includes(site.id);
        return site.likes + (isLiked ? 1 : 0);
    });

    const [isLiking, setIsLiking] = useState(false); // For animation state

    useEffect(() => {
        // Sync if site prop updates
        // We re-check local storage only if site.id changes drastically, 
        // but generally standard useState init is better for row items.
    }, [site.id]);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();

        const savedLikes = JSON.parse(localStorage.getItem('sitecohub_likes') || '[]');
        let newLikesList = [...savedLikes];

        if (liked) {
            setLikes(prev => Math.max(0, prev - 1));
            setLiked(false);
            newLikesList = newLikesList.filter(id => id !== site.id);
        } else {
            setLikes(prev => prev + 1);
            setLiked(true);
            setIsLiking(true);
            setTimeout(() => setIsLiking(false), 300); // Reset animation
            newLikesList.push(site.id);
        }

        localStorage.setItem('sitecohub_likes', JSON.stringify(newLikesList));

        if (onLikeToggle) {
            onLikeToggle();
        }
    };

    const formatLikes = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num;
    };

    return (
        <motion.div
            layoutId={`card-container-${site.id}`}
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-[#121212] border border-[#222] hover:border-[#444] transition-colors duration-300"
            onClick={() => onClick(site)}
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-1">
                    <motion.h3
                        layoutId={`title-${site.id}`}
                        className="text-2xl font-serif font-medium text-white"
                    >
                        {site.name}
                    </motion.h3>
                    <div className="relative z-20">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-300 ${liked ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/5 text-[#888] hover:bg-white/10 hover:text-white'}`}
                        >
                            <Heart size={14} className={`transition-transform duration-300 ${liked ? 'fill-current scale-110' : 'scale-100'}`} />
                            <span className="text-xs font-mono font-medium">{formatLikes(likes)}</span>
                        </button>

                        {/* Pop Animation Effect */}
                        <AnimatePresence>
                            {isLiking && (
                                <motion.div
                                    initial={{ opacity: 1, scale: 0.5, y: 0 }}
                                    animate={{ opacity: 0, scale: 2, y: -20 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute -top-4 -right-2 pointer-events-none text-red-500"
                                >
                                    <Heart size={20} className="fill-current" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-[#888] mb-6 font-sans line-clamp-2"
                >
                    {site.description}
                </motion.p>

                {site.topColors && site.topColors.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {site.topColors.slice(0, 6).map((color, index) => (
                            <motion.div
                                key={`${site.id}-color-${index}`}
                                layoutId={`color-${site.id}-${color.hex}`} // Shared layout ID for seamless transition
                                className="aspect-square rounded-lg w-full relative group/color"
                                style={{ backgroundColor: color.hex }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color:opacity-100 transition-opacity duration-200">
                                    <span className="text-[10px] uppercase font-mono bg-black/50 text-white px-1 py-0.5 rounded backdrop-blur-md">
                                        {color.hex}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="aspect-[2/1] rounded-lg w-full bg-[#1a1a1a] border border-[#333] flex flex-col items-center justify-center p-4 text-center">
                        <p className="text-[#666] font-serif italic text-sm mb-2">
                            "{site.quote || 'Color is the place where our brain and the universe meet.'}"
                        </p>
                        <span className="text-[10px] text-[#444] font-mono uppercase tracking-wider border border-[#333] px-2 py-1 rounded-full">
                            Will fetch color
                        </span>
                    </div>
                )}
            </div>

            {/* Premium subtle glow on hover */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-white/[0.05] to-transparent" />
        </motion.div>
    );
}
