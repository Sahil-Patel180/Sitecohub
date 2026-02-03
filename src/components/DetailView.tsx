import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { WebsiteData, Color } from '../data/mockData';
import { realSites } from '../data/realSites';
import { getGlobalTrendingColors } from '../utils/analytics';
import { X, ExternalLink, Calendar, History, TrendingUp, Clock, Copy, Check } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface DetailViewProps {
    site: WebsiteData;
    onClose: () => void;
}

// Calculate global trends once outside the component to avoid expensive re-calcs
// This assumes realSites doesn't change during the session, which is true for the static file.
const GLOBAL_TREND_LIMIT = 50;
let globalTrendingStats: { hex: string }[] = [];
try {
    if (realSites && Array.isArray(realSites)) {
        globalTrendingStats = getGlobalTrendingColors(realSites, GLOBAL_TREND_LIMIT);
    }
} catch (e) {
    console.error("Failed to calculate global trends", e);
}
const globalTrendingHexSet = new Set(globalTrendingStats.map(s => s.hex));

export default function DetailView({ site, onClose }: DetailViewProps) {
    const [showAllColors, setShowAllColors] = useState(false);
    const displayedAllColors = showAllColors ? site.allColors : site.allColors.slice(0, 16);

    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    const handleCopyPalette = (colors: Color[], sectionId: string) => {
        const hexList = colors.map(c => c.hex).join(', ');
        navigator.clipboard.writeText(hexList);
        setCopiedSection(sectionId);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    // Identify which of THIS site's colors are globally trending
    const siteTrendingColors = useMemo(() => {
        const trending: Color[] = [];
        const seen = new Set<string>();

        // Check topColors first
        site.topColors.forEach(c => {
            if (globalTrendingHexSet.has(c.hex.toLowerCase()) && !seen.has(c.hex.toLowerCase())) {
                trending.push(c);
                seen.add(c.hex.toLowerCase());
            }
        });

        return trending;
    }, [site]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div
                layoutId={`card-container-${site.id}`}
                className="fixed inset-0 md:inset-10 md:rounded-2xl z-50 bg-[#0f0f0f] border border-[#333] overflow-y-auto md:overflow-hidden flex flex-col"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Panel: Visuals & Main Info */}
                    <div className="w-full md:w-1/3 p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#333] flex flex-col justify-between relative overflow-hidden bg-[#111]">
                        <div>
                            <motion.h2
                                layoutId={`title-${site.id}`}
                                className="text-5xl md:text-6xl font-serif text-white mb-4"
                            >
                                {site.name}
                            </motion.h2>
                            <a
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-8 group"
                            >
                                <span className="font-mono text-sm">{site.url.replace('https://', '')}</span>
                                <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </a>

                            <div className="mb-8">
                                <p className="text-[#c0c0c0] leading-relaxed">
                                    {site.description}
                                </p>
                            </div>

                            <div className="mt-8">
                                <div className="flex items-center gap-2 text-[#888] mb-4 text-xs uppercase tracking-wider font-semibold">
                                    <Calendar size={14} />
                                    <span>Latest Update</span>
                                </div>
                                <div className="text-white text-3xl font-serif">
                                    {format(new Date(site.lastUpdated), 'dd MMMM yyyy')}
                                </div>
                                <div className="text-[#555] font-mono text-sm mt-1">
                                    {format(new Date(site.lastUpdated), 'EEEE, HH:mm')}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 w-full">
                            <div className="flex items-center gap-2 text-[#888] mb-4 text-xs uppercase tracking-wider font-semibold">
                                <TrendingUp size={14} />
                                <span>Trending Colors</span>
                            </div>
                            {siteTrendingColors.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 scrollbar-hide mask-fade-right">
                                    {siteTrendingColors.map((color, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 group flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300 relative" style={{ backgroundColor: color.hex }}>
                                                {/* Optional: Tooltip for ranking? */}
                                            </div>
                                            <span className="text-[10px] font-mono text-[#666] text-center">{color.hex}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[#555] text-sm italic">This site uses a unique palette.</p>
                            )}
                        </div>

                        {/* Decorative Background Blur */}
                        <div
                            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[120px] opacity-10 pointer-events-none"
                            style={{ backgroundColor: site.topColors[0]?.hex || '#333' }}
                        />
                    </div>

                    {/* Right Panel: Data & History */}
                    <div className="w-full md:w-2/3 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-[#0f0f0f]">

                        {/* Top 6 Colors Section */}
                        {site.topColors && site.topColors.length > 0 ? (
                            <>
                                <section className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-white flex items-center gap-2 font-serif">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                            Top 6 Colors
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {site.topColors.slice(0, 6).map((color, index) => (
                                            <div key={index} className="flex flex-col gap-3 group w-[calc(50%-0.5rem)] md:w-[calc(33.33%-0.7rem)] lg:w-[calc(16.66%-0.7rem)] min-w-[100px]">
                                                <div
                                                    className="w-full aspect-[4/5] rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300 border border-white/5 relative overflow-hidden"
                                                    style={{ backgroundColor: color.hex }}
                                                >
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white font-mono text-xs">{color.hex}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="text-white text-sm font-medium">{color.percentage}%</span>
                                                        <span className="text-[#444] text-[10px] font-mono">{color.hex}</span>
                                                    </div>
                                                    <div className="w-full bg-[#222] h-1 rounded-full overflow-hidden">
                                                        <div className="h-full bg-white/30" style={{ width: `${color.percentage}%` }} />
                                                    </div>
                                                    {color.usage && <p className="text-[#666] text-xs mt-1 truncate">{color.usage}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Text Colors Section */}
                                <section className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-white flex items-center gap-2 font-serif">
                                            <span className="w-1.5 h-1.5 bg-[#888] rounded-full"></span>
                                            Text Colors
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {(site.textColors && site.textColors.length > 0 ? site.textColors : site.topColors.filter(c => c.usage?.toLowerCase().includes('text'))).map((color, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-[#151515] pr-4 rounded-full border border-white/5 group hover:border-white/10 transition-colors">
                                                <div
                                                    className="w-10 h-10 rounded-full border border-white/5 relative overflow-hidden"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-white text-sm font-mono">{color.hex}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!site.textColors || site.textColors.length === 0) && site.topColors.filter(c => c.usage?.toLowerCase().includes('text')).length === 0 && (
                                            <p className="text-[#666] text-sm">No specific text colors defined.</p>
                                        )}
                                    </div>
                                </section>

                                {/* All Colors Section */}
                                <section className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-white flex items-center gap-2 font-serif">
                                            <span className="w-1.5 h-1.5 bg-[#444] rounded-full"></span>
                                            All Colors
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleCopyPalette(site.allColors, 'all')}
                                                className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#ccc] hover:text-white transition-colors border border=white/5"
                                            >
                                                {copiedSection === 'all' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                                {copiedSection === 'all' ? 'Copied' : 'Copy All'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {displayedAllColors.map((color, index) => (
                                            <motion.div
                                                key={index}
                                                layoutId={`color-${site.id}-${color.hex}`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group relative h-24 rounded-xl overflow-hidden cursor-copy border border-white/5 bg-[#151515] flex"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(color.hex);
                                                }}
                                            >
                                                <div className="w-24 h-full" style={{ backgroundColor: color.hex }} />
                                                <div className="flex-1 p-3 flex flex-col justify-center">
                                                    <span className="text-white font-mono text-sm font-medium">{color.hex}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[#666] text-xs">{color.percentage}%</span>
                                                        <div className="w-8 h-0.5 bg-[#333] rounded-full">
                                                            <div className="h-full bg-[#666]" style={{ width: `${Math.min(color.percentage, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {site.allColors.length > 16 && (
                                        <button
                                            onClick={() => setShowAllColors(!showAllColors)}
                                            className="w-full mt-4 py-3 text-sm text-[#888] hover:text-white bg-[#151515] hover:bg-[#222] rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            {showAllColors ? 'Show Less' : `Show ${site.allColors.length - 16} More Colors`}
                                        </button>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-xl font-medium text-white mb-8 flex items-center gap-2 font-serif">
                                        <History size={18} className="text-[#666]" />
                                        <span>Version History</span>
                                    </h3>

                                    <div className="space-y-0 relative border-l border-[#222] ml-3">
                                        {site.versions.map((version, idx) => {
                                            const date = new Date(version.date);
                                            // Check if previous version was on same day to condense or differentiate
                                            const isSameDayAsNext = idx < site.versions.length - 1 && isSameDay(date, new Date(site.versions[idx + 1].date));
                                            const isSameDayAsPrev = idx > 0 && isSameDay(date, new Date(site.versions[idx - 1].date));
                                            const sectionId = `version-${idx}`;

                                            return (
                                                <div key={idx} className="relative pl-8 py-6 group hover:bg-white/[0.02] transition-colors rounded-r-lg">
                                                    {/* Timeline Dot */}
                                                    <div className="absolute left-[-5px] top-8 w-2.5 h-2.5 bg-[#222] border border-[#444] rounded-full z-10 group-hover:border-white group-hover:scale-125 transition-all" />

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-baseline gap-3 mb-1">
                                                                <span className="font-serif text-lg text-white">{format(date, 'MMM dd, yyyy')}</span>
                                                                {(isSameDayAsNext || isSameDayAsPrev) && (
                                                                    <span className="text-xs font-mono text-[#888] flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded">
                                                                        <Clock size={10} />
                                                                        {format(date, 'HH:mm')}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-[#222]">{version.version}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopyPalette(version.colors, sectionId)}
                                                                className="mt-2 text-[10px] flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#888] hover:text-white transition-colors w-fit"
                                                            >
                                                                {copiedSection === sectionId ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                                                                {copiedSection === sectionId ? 'Copied' : 'Copy Palette'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {version.colors.map((c, i) => (
                                                                <div key={i} className="flex flex-col items-center gap-1">
                                                                    <div className="w-8 h-8 rounded-full ring-1 ring-white/10 relative group/c" style={{ backgroundColor: c.hex }}>
                                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/c:opacity-100 whitespace-nowrap pointer-events-none z-20">
                                                                            {c.hex} ({c.percentage}%)
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] text-[#444] font-mono">{c.percentage}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-4">
                                <h3 className="text-2xl md:text-4xl font-serif text-white/90 leading-tight max-w-lg">
                                    "{site.description || 'Color is the place where our brain and the universe meet.'}"
                                </h3>
                                <p className="mt-6 text-[#555] font-mono text-sm uppercase tracking-widest">
                                    Will fetch color
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </motion.div>
        </>
    );
}
