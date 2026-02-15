import { Outlet, Link, useLocation } from 'react-router-dom';
import { Palette, BarChart3, Home } from 'lucide-react';


export default function MainLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/20 font-sans">
            <header className="fixed top-0 left-0 right-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors overflow-hidden">
                            <img src="/Sitecohub.png" alt="SiteCoHub" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-xl font-serif tracking-tight">SiteCoHub</h1>
                    </Link>

                    <nav className="flex items-center gap-8">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition-colors hover:text-white flex items-center gap-2 ${location.pathname === '/' ? 'text-white' : 'text-[#888]'}`}
                        >
                            <Home size={16} />
                            <span className="hidden md:inline">Home</span>
                        </Link>
                        <Link
                            to="/showcase"
                            className={`text-sm font-medium transition-colors hover:text-white flex items-center gap-2 ${location.pathname === '/showcase' ? 'text-white' : 'text-[#888]'}`}
                        >
                            <Palette size={16} />
                            <span className="hidden md:inline">Showcase</span>
                        </Link>
                        <Link
                            to="/analytics"
                            className={`text-sm font-medium transition-colors hover:text-white flex items-center gap-2 ${location.pathname === '/analytics' ? 'text-white' : 'text-[#888]'}`}
                        >
                            <BarChart3 size={16} />
                            <span className="hidden md:inline">Analytics</span>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="pt-20">
                <Outlet />
            </main>

            <footer className="border-t border-[#222] py-12 text-center text-[#444] text-sm mt-auto">
                <p>Designed for Designers. Inspired by artisanal craftsmanship.</p>
                <p className="mt-2 font-serif opacity-50">&copy; {new Date().getFullYear()} SiteCoHub</p>
            </footer>
        </div>
    );
}
