import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Zap, TrendingUp } from 'lucide-react';
import { Marquee } from '../components/Marquee';
import { realSites } from '../data/realSites';

export default function Landing() {
    return (
        <div className="relative overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-screen pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-purple-500/10 blur-[120px]" />
            </div>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-40 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#ccc] mb-8"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    v3.{__COMMIT_COUNT__}.0 Now Available with Version History
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-serif font-medium tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
                >
                    The Art of <br /> Digital Color.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl text-[#888] max-w-2xl mb-12 font-light leading-relaxed"
                >
                    Decode the aesthetic DNA of the world's most successful websites.
                    Analyze usage percentages, track historical changes, and spot emerging trends.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link
                        to="/showcase"
                        className="group relative px-8 py-4 bg-white text-black rounded-full font-medium transition-transform hover:scale-105"
                    >
                        Explore Showcase
                        <ArrowRight size={18} className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        to="/analytics"
                        className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium transition-colors hover:bg-white/10"
                    >
                        View Analytics
                    </Link>
                </motion.div>
            </section>




            {/* Brand Marquee */}
            <section className="py-24 relative z-10 w-full overflow-hidden border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-3xl md:text-5xl font-serif font-medium text-white mb-6"
                    >
                        Top Companies Website Palettes
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-[#888] text-lg max-w-2xl mx-auto"
                    >
                        Explore the color systems of industry leaders.
                    </motion.p>
                </div>

                <div className="relative w-full">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-20 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-20 pointer-events-none" />

                    <div className="flex flex-col gap-12">
                        <Marquee items={realSites.slice(0, 15)} direction="left" speed={30} />
                        <Marquee items={realSites.slice(15, 30)} direction="right" speed={40} />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pb-40 mt-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Layers size={24} />}
                        title="Deep Analysis"
                        description="Break down brand palettes into precise usage percentages and roles."
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={<Zap size={24} />}
                        title="Live Tracking"
                        description="Monitor cosmetic updates and version changes in real-time."
                        delay={0.5}
                    />
                    <FeatureCard
                        icon={<TrendingUp size={24} />}
                        title="Trend Insights"
                        description="Visualize dominant colors and aesthetic shifts across the industry."
                        delay={0.6}
                    />
                </div>
            </section>


        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay }}
            className="p-8 rounded-2xl bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
        >
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 text-white">
                {icon}
            </div>
            <h3 className="text-xl font-serif text-white mb-3">{title}</h3>
            <p className="text-[#888] leading-relaxed">{description}</p>
        </motion.div>
    )
}
