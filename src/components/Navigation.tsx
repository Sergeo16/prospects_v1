'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'retro' | 'light' | 'dark'>('retro');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('theme') as 'retro' | 'light' | 'dark') || 'retro';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const themes: ('retro' | 'light' | 'dark')[] = ['retro', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return (
    <>
      <section className="fixed top-0 left-0 w-full z-50 bg-base-100 shadow-lg backdrop-blur-sm bg-opacity-95 px-4 py-3 border-b border-base-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center font-bold text-xl md:text-3xl transition-transform hover:scale-105"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-base-content">Prospects</span>
            <span className="text-accent"> v1</span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <ul className="flex items-center space-x-6">
              <li>
                <Link
                  href="/"
                  className="relative inline-block mx-2 py-1 text-base-content md:text-xl hover:text-accent transition duration-300
                            before:content-[''] before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-0 
                            before:bg-accent before:transition-all before:duration-300 hover:before:w-full"
                >
                  Formulaire
                </Link>
              </li>
            </ul>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              aria-label="Toggle theme"
              title={`Thème actuel: ${theme}`}
            >
              {theme === 'retro' ? '🎨' : theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>

          {/* Menu Mobile Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              aria-label="Toggle theme"
            >
              {theme === 'retro' ? '🎨' : theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <button
              className="text-base-content"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Menu Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full bg-base-100 z-40 shadow-lg border-b border-base-300 px-4 py-4 animate-slide-in">
          <ul className="flex flex-col space-y-4 items-start">
            <li>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="relative inline-block py-2 text-base-content text-lg hover:text-accent transition duration-300
                          before:content-[''] before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-0 
                          before:bg-accent before:transition-all before:duration-300 hover:before:w-full"
              >
                Formulaire
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

