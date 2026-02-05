
import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PRODUCTS } from '../constants';
import {
  Bot, Video, FileSearch, ArrowLeft, CheckCircle2,
  Activity, ArrowRight, Upload, Search, Settings, Rocket,
  Eye, Zap, Layers, Binary
} from 'lucide-react';

const ProductVisual = ({ id }: { id: string }) => {
  if (id === 'chatbot-maker') {
    return (
      <div className="relative w-full h-[500px] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[400px] h-[400px] border border-[#4FD1FF]/10 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="w-80 h-80 bg-gradient-to-br from-[#4FD1FF]/20 to-transparent rounded-full blur-3xl"
        />
        <div className="glass p-12 rounded-[4rem] border-[#4FD1FF]/20 relative z-10 shadow-[0_0_100px_rgba(79,209,255,0.15)]">
          <Bot className="w-32 h-32 text-[#4FD1FF]" />
        </div>
      </div>
    );
  }
  if (id === 'video-gen') {
    return (
      <div className="relative w-full h-[500px] flex items-center justify-center">
        <div className="flex gap-4 items-end">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              animate={{ height: [60, 200, 60] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              className="w-4 bg-gradient-to-t from-[#3B6DFF] to-[#4FD1FF] rounded-full opacity-40"
            />
          ))}
        </div>
        <Video className="w-24 h-24 text-[#3B6DFF] absolute z-10 opacity-30 blur-[2px]" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="grid grid-cols-2 gap-8"
      >
        <div className="w-24 h-24 glass rounded-3xl border-[#8B5CF6]/20 flex items-center justify-center">
          <Layers className="w-10 h-10 text-[#8B5CF6]/50" />
        </div>
        <div className="w-24 h-24 glass rounded-3xl border-[#8B5CF6]/20 flex items-center justify-center">
          <Binary className="w-10 h-10 text-[#8B5CF6]/50" />
        </div>
        <div className="w-24 h-24 glass rounded-3xl border-[#8B5CF6]/20 flex items-center justify-center">
          <Eye className="w-10 h-10 text-[#8B5CF6]/50" />
        </div>
        <div className="w-24 h-24 glass rounded-3xl bg-[#8B5CF6]/10 border-[#8B5CF6]/40 flex items-center justify-center">
          <FileSearch className="w-12 h-12 text-[#8B5CF6]" />
        </div>
      </motion.div>
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const product = PRODUCTS.find(p => p.id === id);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const pushScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  if (!product) return <div className="pt-40 text-center font-black text-xs tracking-[1em] uppercase">Target Null</div>;

  // Use components instead of elements to avoid cloneElement type issues with className
  const StepIcon = ({ index }: { index: number }) => {
    const icons = [Upload, Search, Settings, Rocket];
    const Icon = icons[index];
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div ref={containerRef} className="relative bg-[#080A0F]">
      {/* 1. ENTRY HERO (Cinematic Departure) */}
      <motion.div
        style={{ scale: pushScale, opacity: heroOpacity }}
        className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      >
        <div className="container mx-auto grid lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-7">
            <Link to="/" className="inline-flex items-center gap-4 text-gray-500 hover:text-white mb-16 transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Central Hub</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.6em] text-[#4FD1FF] mb-10"
            >
              <Activity className="w-3 h-3 animate-pulse" />
              Node Arrived: {id?.replace('-', ' ')}
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.85] tracking-tighter uppercase">
              {product.title}
            </h1>

            <p className="text-xl text-gray-400 max-w-xl mb-16 leading-relaxed font-medium">
              {product.detailedDescription}
            </p>

            {id === 'video-gen' && (
              <Link to="/video-maker" className="inline-block bg-white text-black px-16 py-6 rounded-2xl font-black text-[11px] tracking-[0.6em] uppercase hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] text-center">
                Initialize Trial
              </Link>
            )}
            {id === 'chatbot-maker' && (
              <Link to="/converse" className="inline-block bg-white text-black px-16 py-6 rounded-2xl font-black text-[11px] tracking-[0.6em] uppercase hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] text-center">
                Initialize Trial
              </Link>
            )}
            {id === 'research-helper' && (
              <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="inline-block bg-white text-black px-16 py-6 rounded-2xl font-black text-[11px] tracking-[0.6em] uppercase hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                Start Analysis
              </button>
            )}
            {!['video-gen', 'chatbot-maker', 'research-helper'].includes(id || '') && (
              <button className="bg-white text-black px-16 py-6 rounded-2xl font-black text-[11px] tracking-[0.6em] uppercase hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                Initialize Trial
              </button>
            )}
          </div>

          <div className="lg:col-span-5 hidden lg:block">
            <ProductVisual id={product.id} />
          </div>
        </div>
      </motion.div>

      {/* 2. HOW IT WORKS (Structural Process) */}
      <section className="py-60 px-6 relative bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto">
          <div className="max-w-3xl mb-32">
            <span className="text-[10px] font-black text-[#4FD1FF] tracking-[0.8em] uppercase mb-6 block opacity-50">Operational Protocol</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">The <span className="text-gradient">Agent</span> Journey</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Progress line */}
            <div className="hidden md:block absolute top-[45px] left-0 w-full h-[1px] bg-white/5 -z-10" />

            {product.steps?.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glass p-10 rounded-[3rem] border-white/5 hover:border-[#4FD1FF]/30 transition-all group"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10 group-hover:bg-white group-hover:text-black transition-all duration-700 shadow-2xl relative">
                  <StepIcon index={idx} />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#4FD1FF] text-black flex items-center justify-center font-black text-[10px]">
                    0{idx + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES (Visual Clarity) */}
      <section className="py-60 px-6">
        <div className="container mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <div className="grid grid-cols-1 gap-6">
            {product.features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-8 p-10 glass rounded-[3rem] border-white/5 hover:bg-white/5 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#4FD1FF]/10 flex items-center justify-center text-[#4FD1FF] shadow-[0_0_20px_rgba(79,209,255,0.2)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xl font-black uppercase tracking-widest">{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black text-[#4FD1FF] tracking-[0.8em] uppercase mb-8 block opacity-50">Core Advantage</span>
            <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-12">Total <br /> <span className="text-gradient">Clarity</span></h2>
            <p className="text-2xl text-gray-500 max-w-md ml-auto leading-relaxed font-bold italic opacity-80">
              "Our RL engine doesn't just process inputs; it discovers the most profitable response policies for your specific business."
            </p>
          </div>
        </div>
      </section>

      {/* 4. CALM CTA (The Arrival) */}
      <section className="py-80 px-6 text-center bg-gradient-to-b from-transparent to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          viewport={{ once: true }}
          className="container mx-auto"
        >
          <div className="inline-block p-12 rounded-full glass border border-white/10 glow-bloom mb-20">
            <Zap className="w-16 h-16 text-[#4FD1FF] animate-pulse" />
          </div>
          <h2 className="text-5xl md:text-[10rem] font-black tracking-tighter uppercase mb-16 leading-none">Ready for <br /> <span className="text-gradient">Scale?</span></h2>
          <p className="text-2xl text-gray-500 max-w-3xl mx-auto font-bold mb-24 opacity-80 px-6">
            The environment is ready. Select your access tier to begin the training loop.
          </p>
          <Link
            to="/pricing"
            className="group relative glass border-2 border-white/10 text-white px-24 py-10 rounded-[4rem] font-black text-[13px] tracking-[1em] hover:bg-white hover:text-black transition-all uppercase shadow-[0_0_120px_rgba(79,209,255,0.3)]"
          >
            Choose Node <ArrowRight className="w-6 h-6 inline ml-6 group-hover:translate-x-5 transition-transform" />
          </Link>
        </motion.div>
      </section>

      <div className="h-40" />
    </div>
  );
};

export default ProductDetail;
