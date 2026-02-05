import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Github, Twitter, Linkedin, Send } from 'lucide-react';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0B0E14] pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <motion.img
                src="entropy_logo.png"
                alt="Entropy AI"
                className="w-8 h-8 object-contain brightness-110"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <h3 className="text-xl font-black tracking-tighter uppercase">Entropy AI</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium opacity-80">
              Empowering India's next billion businesses with self-learning AI agents built for structural clarity and exponential impact.
            </p>
            <div className="flex gap-4">
              <Twitter className="w-5 h-5 text-gray-500 hover:text-[#4FD1FF] cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-gray-500 hover:text-[#3B6DFF] cursor-pointer transition-colors" />
              <Github className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-6 opacity-50">Modular Systems</h4>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-gray-500">
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Chatbot Maker</li>
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Video Engine</li>
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Research Co-Pilot</li>
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Core API</li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-6 opacity-50">Intelligence Node</h4>
            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-gray-500">
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">About Us</li>
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Neural Logs</li>
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Open Nodes</li>
              <li className="hover:text-[#4FD1FF] cursor-pointer transition-colors">Compliance</li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-6 opacity-50">The Neural Feed</h4>
            <p className="text-xs font-medium text-gray-400 mb-4 opacity-80">Stay updated with structural AI breakthroughs.</p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                placeholder="Identity@node.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass bg-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#4FD1FF] transition-all border-white/5"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-white text-black rounded-md hover:bg-[#4FD1FF] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <AnimatePresence>
              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[#4FD1FF] text-[9px] font-black uppercase tracking-widest mt-3"
                >
                  Sync Successful.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-black uppercase tracking-widest text-gray-600">
          <p>© 2024 Entropy AI. Built for Bharat.</p>
          <div className="flex gap-8">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Logic</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookie Cache</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;