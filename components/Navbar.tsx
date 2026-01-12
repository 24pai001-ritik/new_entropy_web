import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

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
    { name: 'Journey', path: '/' },
    { name: 'Agents', path: '/pricing' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Logs', path: '/blog' },
  ];

  return (
    <motion.nav 
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: -100, opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-8 left-0 right-0 z-50 px-6 flex items-center justify-center pointer-events-none"
    >
      <div className="glass px-10 py-4 rounded-full flex items-center gap-12 max-w-3xl w-full justify-between border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] pointer-events-auto">
        <Link to="/" className="flex items-center gap-4 group">
          <LogoIcon />
          <span className="hidden sm:inline font-black tracking-tight group-hover:text-[#4FD1FF] transition-colors text-sm uppercase">Entropy AI</span>
        </Link>

        <div className="flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-[#4FD1FF] ${
                location.pathname === link.path ? 'text-[#4FD1FF]' : 'text-gray-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <Link 
          to="/login" 
          className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black tracking-[0.4em] hover:bg-[#4FD1FF] transition-all uppercase shadow-lg"
        >
          Access
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;