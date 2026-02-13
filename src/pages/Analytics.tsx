import { motion } from 'framer-motion';
import { websites } from '../data/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getNearestColorFamily } from '../utils/colorUtils';
import { useState, useEffect } from 'react';

export default function Analytics() {
    // 0. Current Date for "Last Updated"
    const currentDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const navigate = useNavigate();

    // Responsive check for charts
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 1. Calculate Dominant Colors Aggregate
    const colorCounts: Record<string, number> = {};
    websites.forEach(site => {
        site.topColors.forEach(color => {
            let key = color.name || 'Custom';

            // If name is "Custom" or purely hex-based, try to cluster it
            if (key === 'Custom' || key.startsWith('#')) {
                key = getNearestColorFamily(color.hex);
            } else {
                const simpleName = key.split(' ')[1] || key;
                key = simpleName;
            }

            colorCounts[key] = (colorCounts[key] || 0) + 1;
        });
    });

    const pieData = Object.entries(colorCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 color families

    // Map common families to specific hexes for the chart slice colors
    const FAMILY_TO_HEX: Record<string, string> = {
        'Black': '#000000', 'White': '#FFFFFF', 'Gray': '#808080',
        'Red': '#FF0000', 'Orange': '#FFA500', 'Yellow': '#FFD700',
        'Green': '#008000', 'Cyan': '#00FFFF', 'Blue': '#0000FF',
        'Purple': '#800080', 'Pink': '#FFC0CB', 'Brown': '#A52A2A'
    };

    // Generate colors for the pie chart slices based on the family name
    const CHART_COLORS = pieData.map(entry => FAMILY_TO_HEX[entry.name] || '#888888');

    // 2. Style Preferences (Donut Chart)
    const styleCounts: Record<string, number> = {};
    websites.forEach(site => {
        if (site.style) {
            styleCounts[site.style] = (styleCounts[site.style] || 0) + 1;
        }
    });

    const styleData = Object.entries(styleCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const STYLE_COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];

    // 3. Category Distribution (Vertical Bar Chart for readable labels)
    const categoryCounts: Record<string, number> = {};
    websites.forEach(site => {
        if (site.category) {
            categoryCounts[site.category] = (categoryCounts[site.category] || 0) + 1;
        }
    });

    const categoryData = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 categories

    // 4. Top Liked Sites
    const topLikedSites = [...websites]
        .filter(site => site.topColors && site.topColors.length > 0)
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5);

    // Stats
    const totalLikes = websites.reduce((acc, site) => acc + site.likes, 0);
    const mostPopularStyle = styleData.length > 0 ? styleData[0].name : 'N/A';

    return (
        <div className="pt-8 md:pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-12 md:pb-20">
            {/* Header */}
            <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-serif mb-4 leading-tight"
                    >
                        Market Intelligence.
                    </motion.h2>
                    <p className="text-[#888] text-base md:text-lg font-light leading-relaxed max-w-xl">
                        Real-time insights across {websites.length} curated datasets.
                    </p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[#666] font-mono text-xs md:text-sm border border-[#333] px-4 py-2 rounded-full inline-block self-start md:self-auto"
                >
                    Report Generated: <span className="text-[#fff]">{currentDate}</span>
                </motion.div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                <StatCard label="Sites Tracked" value={websites.length.toString()} delay={0.1} />
                <StatCard label="Colors Indexed" value={websites.reduce((acc, site) => acc + site.allColors.length, 0).toString()} delay={0.2} />
                <StatCard label="Total Likes" value={totalLikes.toLocaleString()} delay={0.3} />
                <StatCard label="Trending Style" value={mostPopularStyle} delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                {/* Style Preferences (Donut) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 md:p-8 rounded-2xl bg-[#111] border border-[#222] min-h-[350px] md:min-h-[400px] flex flex-col"
                >
                    <h3 className="text-xl font-serif text-white mb-2">Design Style Distribution</h3>
                    <p className="text-sm text-[#666] mb-6">Breakdown of aesthetic categories across the dataset.</p>
                    <div className="flex-grow w-full h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={styleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isMobile ? 50 : 60}
                                    outerRadius={isMobile ? 80 : 100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {styleData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STYLE_COLORS[index % STYLE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#ccc' }}
                                />
                                <Legend
                                    layout={isMobile ? "horizontal" : "vertical"}
                                    verticalAlign={isMobile ? "bottom" : "middle"}
                                    align={isMobile ? "center" : "right"}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', color: '#888' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 md:p-8 rounded-2xl bg-[#111] border border-[#222] min-h-[350px] md:min-h-[400px] flex flex-col"
                >
                    <h3 className="text-xl font-serif text-white mb-2">Top Industries</h3>
                    <p className="text-sm text-[#666] mb-6">Representation by industry sector.</p>
                    <div className="flex-grow w-full h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: isMobile ? 0 : 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={isMobile ? 80 : 100}
                                    tick={{ fill: '#888', fontSize: 11 }}
                                    interval={0}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#fff" radius={[0, 4, 4, 0]} barSize={isMobile ? 15 : 20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
                {/* Color Families (Pie) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1 p-5 md:p-8 rounded-2xl bg-[#111] border border-[#222]"
                >
                    <h3 className="text-xl font-serif text-white mb-2">Dominant Colors</h3>
                    <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={isMobile ? 40 : 50}
                                    outerRadius={isMobile ? 60 : 70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#ccc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center mt-4">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full border border-gray-600" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                <span className="text-xs text-[#888]">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Top Liked Sites List */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 p-5 md:p-8 rounded-2xl bg-[#111] border border-[#222]"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif text-white">Most Admired Sites</h3>
                        <span className="text-xs text-[#666] uppercase tracking-wider">Top 5 by Likes</span>
                    </div>

                    <div className="space-y-4">
                        {topLikedSites.map((site, index) => (
                            <div
                                key={site.id}
                                onClick={() => navigate(`/showcase?site=${site.id}`)}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] hover:bg-[#222] transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-[#444] font-mono text-sm w-4">#{index + 1}</span>
                                    <div className="max-w-[120px] sm:max-w-none">
                                        <p className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">{site.name}</p>
                                        <p className="text-xs text-[#666] truncate">{site.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-[#888]">Primary Color</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-xs text-[#666] uppercase">{site.topColors[0]?.hex || 'N/A'}</span>
                                            <div
                                                className="w-3 h-3 rounded-full border border-[#333]"
                                                style={{ backgroundColor: site.topColors[0]?.hex || 'transparent' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-[#111] px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-[#333] flex items-center gap-2">
                                        <span className="text-red-400 text-xs md:text-sm">♥</span>
                                        <span className="text-white font-mono text-xs md:text-base">{site.likes}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({ label, value, delay }: { label: string, value: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="p-4 md:p-6 rounded-xl bg-[#111] border border-[#222]"
        >
            <p className="text-[#666] text-[10px] md:text-xs uppercase tracking-wide font-medium mb-1 md:mb-2 truncate">{label}</p>
            <p className="text-2xl md:text-3xl font-serif text-white">{value}</p>
        </motion.div>
    )
}
