

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Sun, Moon, X } from 'lucide-react';
import { getSettings } from '../services/data';

interface Props {
    onHome: () => void;
    onSecret: () => void;
    onSearch: (query: string) => void;
    searchTerm: string;
    onCategorySelect: (category: string) => void;
    activeCategory: string;
}

const Navbar: React.FC<Props> = ({ onHome, onSecret, onSearch, searchTerm, onCategorySelect, activeCategory }) => {
  const settings = getSettings();
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Categories are now strictly defined in settings
  const categories = ['All', ...settings.navCategories];

  // Secret Click Logic
  const [clicks, setClicks] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    onHome();
    setClicks(prev => {
        const newCount = prev + 1;
        if (newCount >= 5) {
            onSecret();
            return 0;
        }
        return newCount;
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
        setClicks(0);
    }, 1000);
  };

  const logoSrc = settings.logoUrl || "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=100&auto=format&fit=crop";

  return (
    <nav className="fixed top-0 w-full z-40 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo with Secret Knock */}
          <div className="flex items-center gap-8">
            <button onClick={handleLogoClick} className="flex items-center gap-3 group select-none">
                <div className="relative w-8 h-8 overflow-hidden rounded-lg group-hover:rotate-12 transition-transform duration-300 border border-slate-200 dark:border-white/10">
                   <img 
                     src={logoSrc} 
                     alt="Lumina Logo" 
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay"></div>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hidden sm:inline">
                    {settings.siteName}
                </span>
            </button>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                {categories.map((item) => (
                    <button 
                        key={item} 
                        onClick={() => onCategorySelect(item)}
                        className={`transition-colors relative group capitalize ${
                            activeCategory === item 
                            ? 'text-indigo-600 dark:text-indigo-400' 
                            : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                    >
                        {item}
                        <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 transition-all ${activeCategory === item ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                    </button>
                ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Toggle Theme"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="relative hidden sm:block group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search stories..." 
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full pl-9 pr-8 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-white dark:focus:bg-indigo-500/10 transition-all w-40 focus:w-60"
                />
                {searchTerm && (
                    <button 
                        onClick={() => onSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            
            <button className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <Menu size={20} />
            </button>
          </div>

        </div>
        
        {/* Mobile Category Scroller (Optional enhancement for small screens) */}
        <div className="md:hidden overflow-x-auto pb-2 no-scrollbar flex gap-4 px-1">
             {categories.map((item) => (
                <button 
                    key={item} 
                    onClick={() => onCategorySelect(item)}
                    className={`whitespace-nowrap text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                        activeCategory === item 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                >
                    {item}
                </button>
            ))}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;