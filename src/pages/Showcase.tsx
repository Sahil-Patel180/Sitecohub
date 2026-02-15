import { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { websites } from '../data/mockData';
import type { WebsiteData } from '../data/mockData';
import SiteCard from '../components/SiteCard';
import DetailView from '../components/DetailView';
import SearchableSelect from '../components/SearchableSelect';
import { Search, SlidersHorizontal, ArrowUpDown, X, Filter, Heart, Palette } from 'lucide-react';

export default function Showcase() {
    const [selectedSite, setSelectedSite] = useState<WebsiteData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [selectedColorFamily, setSelectedColorFamily] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'name-desc' | 'lastUpdated' | 'likes'>('lastUpdated');
    const [showFilters, setShowFilters] = useState(false);
    const [showLikedOnly, setShowLikedOnly] = useState(false);
    const [likedSiteIds, setLikedSiteIds] = useState<string[]>([]);
    const [visibleCount, setVisibleCount] = useState(24);
    const [searchParams, setSearchParams] = useSearchParams();

    // Handle URL query for direct site access
    useEffect(() => {
        const siteId = searchParams.get('site');
        if (siteId) {
            const site = websites.find(s => s.id === siteId);
            if (site) {
                setSelectedSite(site);
            }
        }
    }, [searchParams]);

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            // This effect is actually not needed if we control the input value directly BUT
            // if we want to debounce the FILTERING, we need a separate state. 
            // Let's stick to the simpler pagination fix first as that's the biggest win.
            // Actually, let's reset visibleCount when filters change.
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(24);
    }, [searchQuery, selectedCategory, selectedStyle, selectedColorFamily, showLikedOnly, sortBy]);
    // Force update trigger to refresh list when toggling likes


    // Auto-expand filters on large screens and load likes
    // Fix: Use ref to track width changes and ignore height changes (address bar toggle)
    const prevWidth = useRef(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            const currentWidth = window.innerWidth;

            // Only react if we cross the breakpoint (Mobile <-> Desktop)
            // This prevents resetting the user's manual toggle if width changes slightly
            // (e.g. scrollbar appears/disappears) or if height changes (mobile address bar)
            const wasDesktop = prevWidth.current >= 1024;
            const isDesktop = currentWidth >= 1024;

            if (wasDesktop !== isDesktop) {
                if (isDesktop) {
                    setShowFilters(true);
                } else {
                    setShowFilters(false);
                }
            }
            prevWidth.current = currentWidth;
        };

        // Initial check - we must run this once to set initial state correctly
        // We can't rely on the ref verification here because it's the first run
        if (window.innerWidth >= 1024) {
            setShowFilters(true);
        } else {
            setShowFilters(false);
        }

        // Load likes
        const loadLikes = () => {
            const saved = JSON.parse(localStorage.getItem('sitecohub_likes') || '[]');
            setLikedSiteIds(saved);

        };
        loadLikes();

        window.addEventListener('resize', handleResize);
        window.addEventListener('storage', loadLikes); // Listen to other tabs
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('storage', loadLikes);
        }
    }, []);

    const handleLikeToggle = () => {
        // Reload likes from local storage to ensure grid stays in sync immediately
        const saved = JSON.parse(localStorage.getItem('sitecohub_likes') || '[]');
        setLikedSiteIds(saved);
    };

    // Extract unique categories and styles
    const categories = Array.from(new Set(websites.map(site => site.category)));
    const styles = Array.from(new Set(websites.map(site => site.style)));
    const colorFamilies = Array.from(new Set(websites.map(site => site.primaryColorFamily)));

    // Color mapping for UI
    const colorMap: Record<string, string> = {
        'Blue': '#3b82f6',
        'Red': '#ef4444',
        'Green': '#22c55e',
        'Black': '#171717',
        'White': '#f8fafc',
        'Purple': '#a855f7',
        'Orange': '#f97316',
        'Pink': '#ec4899',
        'Yellow': '#eab308',
        'Gray': '#9ca3af'
    };

    // Filter and Sort Logic
    const filteredSites = useMemo(() => {
        let result = websites.filter(site => {
            const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                site.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory ? site.category === selectedCategory : true;
            const matchesStyle = selectedStyle ? site.style === selectedStyle : true;
            const matchesColor = selectedColorFamily ? site.primaryColorFamily === selectedColorFamily : true;
            const matchesLiked = showLikedOnly ? likedSiteIds.includes(site.id) : true;

            return matchesSearch && matchesCategory && matchesStyle && matchesColor && matchesLiked;
        });

        result.sort((a, b) => {
            // Priority 0: Sites with colors come first
            const aHasColors = a.topColors && a.topColors.length > 0;
            const bHasColors = b.topColors && b.topColors.length > 0;

            if (aHasColors && !bHasColors) return -1;
            if (!aHasColors && bHasColors) return 1;

            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'name-desc') {
                return b.name.localeCompare(a.name);
            } else if (sortBy === 'likes') {
                return b.likes - a.likes;
            } else {
                return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            }
        });

        return result;
    }, [searchQuery, selectedCategory, selectedStyle, selectedColorFamily, sortBy, showLikedOnly, likedSiteIds]); // likedSiteIds dependency ensures refresh

    const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedStyle ? 1 : 0) + (selectedColorFamily ? 1 : 0) + (showLikedOnly ? 1 : 0);

    return (
        <div className="pt-12 md:pt-20 px-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
            <div className="flex flex-col mb-12 gap-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-5xl font-serif mb-4 leading-tight"
                        >
                            Curated Palettes.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-[#888] text-lg font-light leading-relaxed max-w-xl"
                        >
                            Browse the color systems of the world's most popular digital products.
                        </motion.p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-white transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search websites..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#151515] border border-[#222] rounded-full pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#444] focus:bg-[#1a1a1a] transition-all w-full text-[#ccc] placeholder:text-[#444]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`lg:hidden flex items-center justify-center w-12 h-12 rounded-full border transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-white text-black border-white' : 'bg-[#151515] text-[#ccc] border-[#222]'}`}
                        >
                            {showFilters ? <X size={20} /> : (
                                <div className="relative">
                                    <Filter size={20} />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                    )}
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Collapsible Filter Bar */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10, overflow: 'hidden' }}
                            animate={{ opacity: 1, height: 'auto', y: 0, transitionEnd: { overflow: 'visible' } }}
                            exit={{ opacity: 0, height: 0, y: -10, overflow: 'hidden' }}
                        >
                            <div className="flex flex-col lg:flex-row gap-6 p-6 rounded-2xl bg-[#111] border border-[#222] lg:items-start justify-between">
                                <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full lg:w-auto">
                                    {/* Category Filter */}
                                    <div className="space-y-3 w-full md:w-64">
                                        <span className="text-[#666] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                            <SlidersHorizontal size={14} /> Category
                                        </span>
                                        <div className="flex flex-col gap-2">
                                            {/* Quick Filters */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setShowLikedOnly(false);
                                                        setSelectedCategory(null);
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-sm transition-colors flex-1 text-center ${!selectedCategory && !showLikedOnly ? 'bg-white text-black font-medium' : 'bg-[#1a1a1a] text-[#888] hover:bg-[#222] hover:text-white'}`}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowLikedOnly(!showLikedOnly);
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 flex-1 ${showLikedOnly ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-[#1a1a1a] text-[#888] hover:bg-[#222] hover:text-white'}`}
                                                >
                                                    <Heart size={14} className={showLikedOnly ? 'fill-current' : ''} />
                                                    My Likes
                                                </button>
                                            </div>

                                            {/* Category Dropdown */}
                                            <div className="relative group/idx">
                                                <SearchableSelect
                                                    options={categories.sort()}
                                                    value={selectedCategory}
                                                    onChange={setSelectedCategory}
                                                    placeholder="All Industries"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Style Filter */}
                                    <div className="space-y-3 md:border-l md:border-white/5 md:pl-8 lg:border-none lg:pl-0">
                                        <span className="text-[#666] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                            Style
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {styles.map(style => (
                                                <button
                                                    key={style}
                                                    onClick={() => setSelectedStyle(style === selectedStyle ? null : style)}
                                                    className={`px-4 py-2 rounded-lg text-sm transition-colors border ${selectedStyle === style ? 'border-white text-white bg-white/10' : 'border-[#222] text-[#666] hover:border-[#444] hover:text-[#bbb] bg-transparent'}`}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color Filter */}
                                    <div className="space-y-3 md:border-l md:border-white/5 md:pl-8 lg:border-none lg:pl-0">
                                        <span className="text-[#666] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                            <Palette size={14} /> Color
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {colorFamilies.map(family => (
                                                <button
                                                    key={family}
                                                    onClick={() => setSelectedColorFamily(family === selectedColorFamily ? null : family)}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${selectedColorFamily === family ? 'border-white scale-110 shadow-lg ring-2 ring-white/20' : 'border-transparent hover:scale-105'}`}
                                                    style={{ backgroundColor: colorMap[family] || '#333' }}
                                                    title={family}
                                                >
                                                    {selectedColorFamily === family && (
                                                        <div className={`w-2 h-2 rounded-full ${family === 'White' ? 'bg-black' : 'bg-white'}`} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sort Option */}
                                <div className="space-y-3 w-full lg:w-auto lg:border-l lg:border-[#333] lg:pl-8 pt-6 lg:pt-0 border-t border-[#222] lg:border-t-0 mt-2 lg:mt-0">
                                    <span className="text-[#666] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                        <ArrowUpDown size={14} /> Sort By
                                    </span>
                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="w-full lg:w-48 bg-[#1a1a1a] text-sm text-white px-4 py-2.5 rounded-lg border border-[#333] focus:border-[#555] focus:outline-none cursor-pointer hover:bg-[#222] appearance-none"
                                        >
                                            <option value="lastUpdated">Latest Updates</option>
                                            <option value="name">Name (A-Z)</option>
                                            <option value="name-desc">Name (Z-A)</option>
                                            <option value="likes">Most Liked</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#666]">
                                            <ArrowUpDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                <AnimatePresence mode='popLayout'>
                    {filteredSites.slice(0, visibleCount).map((site) => (
                        <SiteCard
                            key={site.id}
                            site={site}
                            onClick={setSelectedSite}
                            onLikeToggle={handleLikeToggle}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredSites.length > visibleCount && (
                <div className="flex justify-center pb-20">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 24)}
                        className="px-8 py-3 bg-[#222] text-white rounded-full hover:bg-[#333] transition-colors text-sm font-medium border border-[#333]"
                    >
                        Load More
                    </button>
                </div>
            )}

            {filteredSites.length === 0 && (
                <div className="text-center py-20 text-[#444]">
                    <p>No palettes found matching your filters.</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedStyle(null); setSelectedColorFamily(null); setShowLikedOnly(false); }}
                        className="mt-4 text-white text-sm underline underline-offset-4 hover:text-blue-400"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Detail View Modal */}
            <AnimatePresence>
                {selectedSite && (
                    <DetailView
                        site={selectedSite}
                        onClose={() => {
                            setSelectedSite(null);
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('site');
                            setSearchParams(newParams);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
