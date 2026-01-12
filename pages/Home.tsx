import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Activity, Repeat, Layout, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo3D from '../components/Logo3D';
import { PRODUCTS, WHY_US } from '../constants';

const FeatureCard = ({ item, index }: { item: any; index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay: index * 0.1 }}
    whileHover={{ y: -10 }}
    className="glass p-10 rounded-[2.5rem] flex flex-col items-start gap-6 group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#4FD1FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-[#4FD1FF] group-hover:text-black transition-all duration-500 z-10">
      {item.icon}
    </div>
    <div className="z-10">
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{item.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed font-medium opacity-80">{item.description}</p>
    </div>
    <div className="mt-auto z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#4FD1FF]">
        Learn Logic <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  </motion.div>
);

const Home: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* HERO SECTION - Ultra Bold */}
      <section className="min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.5em] text-[#4FD1FF] mb-10"
            >
              <Activity className="w-3 h-3 animate-pulse" />
              Operational Efficiency V.1.0
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={isReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black mb-10 leading-[0.85] tracking-tighter uppercase"
            >
              Master the <br /> <span className="text-gradient">Entropy.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xl text-gray-400 mb-14 max-w-xl leading-relaxed font-medium"
            >
              Building the next generation of autonomous agents for Indian MSMEs. We resolve operational chaos into structural intelligence using Reinforcement Learning.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isReady ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-wrap gap-6"
            >
              <button className="group relative bg-white text-black px-12 py-5 rounded-2xl font-black text-xs tracking-[0.4em] overflow-hidden transition-all shadow-2xl hover:bg-[#4FD1FF] uppercase">
                Initialize Scan <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-2 transition-transform" />
              </button>
              <Link to="/pricing" className="glass px-12 py-5 rounded-2xl font-black text-xs tracking-[0.4em] uppercase hover:bg-white/10 transition-all flex items-center">
                Explore Nodes
              </Link>
            </motion.div>
          </div>

          <div className="flex justify-center items-center relative scale-110 lg:scale-125">
             <Logo3D size={550} triggerLoop={true} />
          </div>
        </div>
      </section>

      {/* CORE LOGIC SECTION - Bento Grid */}
      <section className="py-40 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24">
            <div className="max-w-3xl">
              <span className="text-[10px] font-black text-[#4FD1FF] tracking-[0.8em] uppercase mb-6 block opacity-50">System Architecture</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">The Reward <br /> <span className="text-gradient">Mechanism.</span></h2>
            </div>
            <p className="text-xl text-gray-500 max-w-sm font-bold leading-relaxed border-l-2 border-[#4FD1FF]/20 pl-8">
              Every interaction is a learning opportunity. Our RL loops optimize for business growth in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {WHY_US.map((item, idx) => (
              <FeatureCard key={idx} item={item} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION - High Impact Tiling */}
      <section className="py-40 px-6 bg-black/20">
        <div className="container mx-auto">
          <div className="mb-24 text-center">
             <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none opacity-10 absolute left-0 right-0 -translate-y-1/2 pointer-events-none">Agents</h2>
             <span className="text-[10px] font-black text-[#4FD1FF] tracking-[1em] uppercase mb-6 block">Ready to Deploy</span>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Autonomous Nodes.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {PRODUCTS.map((product, i) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group relative block">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="glass p-16 h-[600px] rounded-[4rem] flex flex-col justify-between overflow-hidden relative group-hover:border-[#4FD1FF]/50 transition-all duration-700"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-20 transition-opacity">
                    {product.id === 'chatbot-maker' && <Repeat className="w-40 h-40" />}
                    {product.id === 'video-gen' && <Zap className="w-40 h-40" />}
                    {product.id === 'research-helper' && <ShieldCheck className="w-40 h-40" />}
                  </div>

                  <div className="z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#4FD1FF]/10 flex items-center justify-center text-[#4FD1FF] mb-12 shadow-[0_0_20px_rgba(79,209,255,0.2)]">
                      {product.id === 'chatbot-maker' && <Repeat className="w-8 h-8" />}
                      {product.id === 'video-gen' && <Zap className="w-8 h-8" />}
                      {product.id === 'research-helper' && <ShieldCheck className="w-8 h-8" />}
                    </div>
                    <h3 className="text-4xl font-black mb-6 uppercase tracking-tighter leading-none">{product.title}</h3>
                    <p className="text-gray-400 text-lg leading-relaxed font-semibold opacity-70 group-hover:opacity-100 transition-opacity">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between z-10">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Deployment Logic</span>
                      <span className="text-xs font-black uppercase text-white">V.4 Sigma Node</span>
                    </div>
                    <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#4FD1FF] group-hover:text-black transition-all group-hover:border-transparent">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL - Cinematic Ending */}
      <section className="py-60 px-6 text-center overflow-hidden">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-7xl md:text-[12rem] font-black tracking-tighter uppercase leading-[0.8] mb-16">Enter <br /> <span className="text-gradient">Bharat.</span></h2>
            <p className="text-2xl text-gray-500 max-w-3xl mx-auto font-bold mb-20 opacity-80 leading-relaxed">
              We're scaling the backbone of the Indian economy. The journey from chaos to intelligence starts with a single node.
            </p>
            <Link to="/pricing" className="group relative glass border-2 border-white/10 text-white px-20 py-8 rounded-[3rem] font-black text-sm tracking-[0.8em] hover:bg-white hover:text-black transition-all uppercase inline-flex items-center shadow-[0_0_100px_rgba(79,209,255,0.2)]">
              Initialize Hub <ArrowRight className="w-6 h-6 ml-6 group-hover:translate-x-4 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
      
      <div className="h-40" />
    </div>
  );
};

export default Home;