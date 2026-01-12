import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOG_POSTS } from '../constants';
import { Calendar, ArrowRight, Search, Clock, Tag } from 'lucide-react';
import { BlogPost } from '../types';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulating a dynamic fetch from "https://entropy-ai.netlify.app/#blog"
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // In a real scenario, this would be a fetch() call.
        // We simulate the latency of the travel journey.
        await new Promise(resolve => setTimeout(resolve, 1200));
        setPosts(BLOG_POSTS);
      } catch (err) {
        console.error("Failed to sync with neural logs archive.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const categories = ['All', ...new Set(BLOG_POSTS.map(post => post.category))];

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-40 pb-20 px-6 container mx-auto bg-[#080A0F]">
      {/* 1. Header (Dynamic Entry) */}
      <div className="max-w-4xl mb-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-[#4FD1FF]/10 border border-[#4FD1FF]/20 text-[10px] font-black uppercase tracking-[0.5em] text-[#4FD1FF] mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#4FD1FF] animate-pulse" />
          Synchronizing Neural Archive
        </motion.div>
        
        <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[0.85] tracking-tighter uppercase">
          Structural <span className="text-gradient">Logs</span>
        </h1>
        
        <p className="text-2xl text-gray-400 max-w-xl leading-relaxed font-bold opacity-80">
          Raw insights and agent evolution records retrieved from the Entropy AI development node.
        </p>
      </div>

      {/* 2. Controls (Functional & Minimal) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20 border-b border-white/5 pb-10">
        <div className="flex flex-wrap gap-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat 
                ? 'bg-[#4FD1FF] text-black shadow-[0_0_30px_rgba(79,209,255,0.2)]' 
                : 'glass text-gray-500 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Query Archive..."
            className="w-full md:w-80 glass bg-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#4FD1FF] border-white/5"
          />
        </div>
      </div>

      {/* 3. Grid (Card Rejection / Acceptance Feel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="h-[500px] glass rounded-[4rem] border-white/5 animate-pulse flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-700">Loading Node...</span>
               </div>
            ))
          ) : (
            filteredPosts.map((post) => (
              <motion.article 
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -15 }}
                className="group cursor-pointer flex flex-col h-full perspective-2000"
              >
                <div className="relative h-72 w-full glass rounded-[4rem] overflow-hidden mb-10 border border-white/5 shadow-2xl">
                    <img 
                        src={`https://images.unsplash.com/photo-${1581091226825 + parseInt(post.id) * 10}?auto=format&fit=crop&q=80&w=1000`} 
                        alt={post.title} 
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-1000 ease-out"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] to-transparent opacity-80" />
                    <div className="absolute bottom-8 left-8">
                        <div className="glass px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border-white/10 group-hover:bg-[#4FD1FF] group-hover:text-black transition-all">
                            {post.category}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 px-4">
                  <div className="flex items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 opacity-60">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {post.date}</span>
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 6 min Read</span>
                  </div>
                  
                  <h3 className="text-3xl font-black mb-6 group-hover:text-[#4FD1FF] transition-colors leading-[0.9] uppercase tracking-tighter">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-10 text-base font-bold opacity-70">
                    {post.excerpt}
                  </p>
                </div>
                
                <div className="mt-auto px-4 pb-4 flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.5em] text-white group-hover:translate-x-4 transition-all duration-500">
                    Open Log <ArrowRight className="w-5 h-5 text-[#4FD1FF]" />
                </div>
              </motion.article>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 4. Newsletter (Credibility Node) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-60 glass p-20 md:p-32 rounded-[5rem] border-white/5 relative overflow-hidden bg-gradient-to-br from-[#4FD1FF]/10 via-transparent to-[#8B5CF6]/5"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h3 className="text-5xl md:text-7xl font-black mb-8 leading-[0.8] uppercase tracking-tighter">Stay <br /> <span className="text-gradient">Synced</span></h3>
            <p className="text-xl text-gray-400 leading-relaxed max-w-sm font-bold opacity-80">
              Receive raw business intelligence and autonomous agent updates directly from Bharat's RL core.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
              <input 
                  type="email" 
                  placeholder="IDENTITY@NODE.COM"
                  className="glass bg-white/5 px-10 py-6 rounded-3xl focus:outline-none focus:ring-1 focus:ring-[#4FD1FF] flex-1 text-[12px] font-black uppercase tracking-[0.4em] border-white/10"
              />
              <button className="bg-white text-black px-16 py-6 rounded-3xl font-black text-xs tracking-[0.6em] hover:scale-105 transition-all shadow-3xl uppercase">
                  Initialize
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Blog;
