import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';

const LogoIcon = () => (
  <img
    src="entropy_logo.png"
    alt="Entropy AI Logo"
    className="w-8 h-8 object-contain"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
      const parent = e.currentTarget.parentElement;
      if (parent && !parent.querySelector('.fallback-icon')) {
        const fallback = document.createElement('div');
        fallback.className = 'fallback-icon w-8 h-8 bg-[#4FD1FF] rounded-lg flex items-center justify-center text-[10px] font-black text-black';
        fallback.innerText = 'Σ';
        parent.appendChild(fallback);
      }
    }}
  />
);

const Navbar: React.FC = () => {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const diff = latest - lastY;
    if (diff > 50 && latest > 200) {
      setHidden(true);
    } else if (diff < -50 || latest < 100) {
      setHidden(false);
    }
    setLastY(latest);
  });

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Converse', path: '/converse' },
    { name: 'Video Maker', path: '/video-maker', status: 'Coming Soon' },
    { name: 'Scholar', path: '/products/research-helper', status: 'Coming Soon' },
  ];

  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 md:top-8 left-0 right-0 z-50 px-4 md:px-6 flex items-center justify-center pointer-events-none"
      >
        <div className="glass px-6 md:px-10 py-3 md:py-4 rounded-full flex items-center gap-6 md:gap-12 max-w-3xl w-full justify-between border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] pointer-events-auto">
          <Link to="/" className="flex items-center gap-3 md:gap-4 group">
            <LogoIcon />
            <span className="hidden sm:inline font-black tracking-tight group-hover:text-[#4FD1FF] transition-colors text-xs md:text-sm uppercase whitespace-nowrap tracking-widest">Entropy <span className="text-[#4FD1FF]">AI</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group relative text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:text-[#4FD1FF] ${(location.pathname === link.path || (link.path === '/' && location.pathname === '/converse'))
                  ? 'text-[#4FD1FF]'
                  : 'text-gray-400'
                  }`}
              >
                {link.name}
                {link.status && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#4FD1FF] text-black px-2 py-0.5 rounded-full text-[6px] whitespace-nowrap">
                    {link.status}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4FD1FF]/10 border border-[#4FD1FF]/20 text-[8px] font-black uppercase tracking-[0.2em] text-[#4FD1FF]">
              <Sparkles className="w-3 h-3" />
              Live Node
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-[#4FD1FF] transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden bg-[#030507]/95 backdrop-blur-xl flex flex-col items-center justify-center pt-20"
          >
            <div className="flex flex-col items-center gap-8 text-center">
              {navLinks.map((link) => (
                <div key={link.path} className="flex flex-col items-center gap-1">
                  <Link
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-2xl font-black uppercase tracking-[0.4em] transition-all ${(location.pathname === link.path || (link.path === '/' && location.pathname === '/converse'))
                      ? 'text-[#4FD1FF]'
                      : 'text-gray-400'
                      }`}
                  >
                    {link.name}
                  </Link>
                  {link.status && <span className="text-[8px] text-[#4FD1FF]/60 font-black uppercase tracking-widest">{link.status}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;