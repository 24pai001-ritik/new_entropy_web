import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6">
      {/* Background shards */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute bg-[#4FD1FF] h-1 w-20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              rotate: Math.random() * 360,
            }}
            animate={{
              y: [0, 50, 0],
              opacity: [0.1, 0.5, 0.1]
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-10 rounded-[2rem] border-white/5 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center overflow-hidden">
            <motion.img 
              src="entropy_logo.png" 
              alt="Entropy AI" 
              className="w-full h-full object-contain brightness-110 drop-shadow-[0_0_20px_rgba(79,209,255,0.6)]"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tighter uppercase">Access Hub</h2>
          <p className="text-gray-400 text-sm font-medium">Initialize your autonomous agent network.</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Identity Tag</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                className="w-full glass rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#4FD1FF] transition-all text-sm font-medium"
                placeholder="identity@node.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password" 
                className="w-full glass rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#4FD1FF] transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
              <input type="checkbox" className="rounded border-white/10 bg-transparent text-[#4FD1FF]" />
              Sync Node
            </label>
            <a href="#" className="text-[#4FD1FF] hover:underline">Reset Logic</a>
          </div>

          <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#4FD1FF] transition-all flex items-center justify-center gap-2 shadow-xl">
            Authorize <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-black uppercase tracking-widest text-gray-500">
          New node? <Link to="/signup" className="text-[#4FD1FF] hover:underline">Initialize Trial</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;