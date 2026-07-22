import { useState, useEffect } from 'react';
import { Download, Menu, X } from 'lucide-react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: '特性', href: '#features' },
    { label: '下载', href: '#download' },
    { label: '更新日志', href: '#changelog' },
    { label: '关于', href: '#about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5b8c3e] to-[#3d6b24] flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'monospace' }}>MC</span>
            </div>
            <span className="text-xl font-bold text-white">Craft Launcher</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="#download"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4b3fe3] text-white text-sm font-medium hover:bg-[#6a6fff] transition-all hover:scale-105 shadow-lg shadow-[#4b3fe3]/30"
            >
              <Download className="w-4 h-4" />
              立即下载
            </a>
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#download"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#4b3fe3] text-white text-sm font-medium mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Download className="w-4 h-4" />
                立即下载
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}