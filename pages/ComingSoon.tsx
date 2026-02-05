import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComingSoonProps {
    title: string;
    description: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[#080A0F]/80 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 text-center p-12 glass rounded-[40px] border-white/5 bg-white/[0.02] max-w-2xl"
            >
                <div className="w-20 h-20 bg-[#4FD1FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Rocket className="w-10 h-10 text-[#4FD1FF] animate-pulse" />
                </div>

                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{title}</h2>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4FD1FF]/10 border border-[#4FD1FF]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#4FD1FF] mb-6">
                    Next-Gen Neural Upgrade Pending
                </div>

                <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
                    {description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 bg-white text-black py-4 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4FD1FF] transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Return to Active Node
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ComingSoon;
