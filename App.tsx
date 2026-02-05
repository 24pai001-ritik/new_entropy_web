import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import IntelligenceField from './components/IntelligenceField';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import Converse from './pages/Converse';
import ChatbotView from './pages/ChatbotView';
import ComingSoon from './pages/ComingSoon';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
    >
        {children}
    </motion.div>
);

const App: React.FC = () => {
    const location = useLocation();
    const { pathname, hash } = location;

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
                <motion.div key={pathname}>
                    <Routes location={location}>
                        {/* Main Pages */}
                        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                        <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />

                        {/* Converse Feature */}
                        <Route path="/converse" element={<PageWrapper><Converse /></PageWrapper>} />
                        <Route path="/chatbot/:id" element={<PageWrapper><ChatbotView /></PageWrapper>} />

                        {/* Secondary Features -> Coming Soon */}
                        <Route path="/video-maker" element={<PageWrapper><ComingSoon title="Video Maker" description="Our AI-powered video synthesis engine is being calibrated for launch. Prepare for high-fidelity generative visual nodes." /></PageWrapper>} />
                        <Route path="/products/research-helper" element={<PageWrapper><ComingSoon title="Scholar" description="Scholar is evolving. We're integrating deeper semantic analysis and cross-domain synthesis nodes to redefine how you process intelligence." /></PageWrapper>} />
                        <Route path="/analytics" element={<PageWrapper><ComingSoon title="Analytics" description="The intelligence dashboard is undergoing architecture optimization. Real-time data synthesis will be available soon." /></PageWrapper>} />
                        <Route path="/pricing" element={<PageWrapper><ComingSoon title="Agents" description="Access to premium agent nodes is being configured. Stay tuned for neural deployment options." /></PageWrapper>} />

                        {/* Redirect all legacy paths or non-existent ones home for now */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </motion.div>
            </AnimatePresence>
            <Footer />
        </div>
    );
};

export default App;
