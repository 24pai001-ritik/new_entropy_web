import React from 'react';
import { motion } from 'framer-motion';
import { Target, Lightbulb, Heart, Zap } from 'lucide-react';

const About: React.FC = () => {
  const milestones = [
    { year: "2021", event: "Founded in Bangalore to bridge the AI gap for small businesses." },
    { year: "2022", event: "Developed India's first MSME-specific RL training loop." },
    { year: "2023", event: "Empowered 1000+ businesses across 15 Indian states." },
    { year: "2024", event: "Launching autonomous multi-agent systems for global scale." },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 container mx-auto">
      <div className="max-w-3xl mx-auto text-center mb-24">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter"
        >
          Democratizing <span className="text-gradient">Intelligence</span>
        </motion.h1>
        <p className="text-lg text-gray-400 leading-relaxed font-medium">
          We believe the world's most powerful technology shouldn't just be for the Fortune 500. 
          Our mission is to empower India's MSMEs with reinforcement learning—AI that doesn't just work, but learns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
        <div className="glass p-10 rounded-[2.5rem] border-white/5">
            <Target className="w-10 h-10 text-[#4FD1FF] mb-6" />
            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Our Vision</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-medium opacity-80">
                To become the operating system for small businesses in Bharat, where autonomous agents handle the mundane, allowing entrepreneurs to focus on innovation and human connection.
            </p>
        </div>
        <div className="glass p-10 rounded-[2.5rem] border-white/5">
            <Heart className="w-10 h-10 text-[#8B5CF6] mb-6" />
            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Our Values</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-medium opacity-80">
                Trust, Accessibility, and Evolution. We build transparent systems that evolve alongside our users' needs, ensuring technology remains a bridge, not a barrier.
            </p>
        </div>
      </div>

      <div className="mb-32">
        <h2 className="text-2xl font-black mb-16 text-center uppercase tracking-widest">Our Journey</h2>
        <div className="max-w-xl mx-auto space-y-12 relative">
          <div className="absolute left-[20px] top-0 bottom-0 w-px bg-white/10" />
          {milestones.map((m, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="flex gap-10 relative"
            >
              <div className="w-10 h-10 rounded-full glass border border-white/20 flex items-center justify-center shrink-0 z-10 bg-[#0B0E14]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4FD1FF]" />
              </div>
              <div>
                <span className="text-[#4FD1FF] font-black text-base tracking-widest">{m.year}</span>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{m.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass rounded-[3rem] p-12 md:p-20 text-center border-white/5 max-w-4xl mx-auto">
        <Zap className="w-12 h-12 text-[#3B6DFF] mx-auto mb-8" />
        <h2 className="text-3xl font-black mb-6 tracking-tighter">Join the Revolution</h2>
        <p className="text-base text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">We are always looking for passionate engineers and visionaries to help us build for Bharat's future.</p>
        <button className="bg-white text-black px-10 py-4 rounded-xl font-black text-[10px] tracking-[0.4em] hover:scale-105 transition-all shadow-xl">
            VIEW CAREERS
        </button>
      </div>
    </div>
  );
};

export default About;