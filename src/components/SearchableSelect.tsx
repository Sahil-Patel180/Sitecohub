import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableSelectProps {
    options: string[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Select..." }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search when closing
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-[#1a1a1a] text-sm px-4 py-3 rounded-lg border cursor-pointer flex items-center justify-between group transition-colors ${isOpen ? 'border-[#555] bg-[#222]' : 'border-[#333] hover:bg-[#222]'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`truncate ${value ? 'text-[#eee]' : 'text-[#888]'}`}>
                        {value || placeholder}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[#666]">
                    {value && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="p-1 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-[#333]">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                                <input
                                    type="text"
                                    className="w-full bg-[#111] border border-[#333] rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#555] placeholder:text-[#555]"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(option => (
                                    <div
                                        key={option}
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                        }}
                                        className={`px-3 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between group transition-colors ${value === option ? 'bg-white/10 text-white' : 'text-[#aaa] hover:bg-[#222] hover:text-white'}`}
                                    >
                                        <span className="truncate">{option}</span>
                                        {value === option && <Check size={14} className="text-white" />}
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-[#666] text-xs">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
