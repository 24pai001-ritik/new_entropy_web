
import React, { useEffect } from 'react';
// Explicitly import core routing from react-router to resolve type visibility issues
import { Routes, Route, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import Blog from './pages/Blog';
import ProductDetail from './pages/ProductDetail';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import Analytics from './pages/Analytics';
import IntelligenceField from './components/IntelligenceField';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="relative z-10"
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-[#080A0F] text-white selection:bg-[#4FD1FF] selection:text-black">
      <IntelligenceField />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={pathname} key={pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />
          <Route path="/products/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
          <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
          <Route path="/analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default App;
