import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Globe, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRICING_PLANS } from '../constants';

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen pt-40 pb-20 px-6 bg-[#080A0F]">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-[#4FD1FF] tracking-[1em] uppercase mb-8"
          >
            Operational Commitment
          </motion.div>
          <h1 className="text-5xl md:text-9xl font-black mb-12 tracking-tighter uppercase leading-none">Node Access</h1>
          <p className="text-2xl text-gray-500 font-bold max-w-2xl mx-auto leading-relaxed opacity-80">
            Select the structural tier required to resolve your data entropy.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto mb-40">
          {PRICING_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass p-16 rounded-[4rem] border flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${
                plan.recommended 
                ? 'border-[#4FD1FF]/40 ring-1 ring-[#4FD1FF]/20 shadow-[0_0_100px_rgba(79,209,255,0.1)]' 
                : 'border-white/5 hover:border-white/20'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-12 right-12 bg-[#4FD1FF] text-black text-[10px] font-black uppercase px-6 py-2 rounded-full tracking-widest shadow-xl">
                  Sigma Standard
                </div>
              )}
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">{plan.name}</h3>
                <div className="flex items-baseline gap-3 mb-12">
                  <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-gray-500 font-black uppercase text-xs tracking-[0.3em]">{plan.period}</span>
                </div>
                <ul className="space-y-8 mb-16">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-5 text-base font-bold text-gray-400">
                      <CheckCircle2 className={`w-5 h-5 ${plan.recommended ? 'text-[#4FD1FF]' : 'text-gray-600'}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                to="/checkout"
                className={`w-full py-7 rounded-[2.5rem] font-black text-xs tracking-[0.5em] uppercase text-center transition-all ${
                  plan.recommended 
                  ? 'bg-[#4FD1FF] text-black hover:bg-white shadow-2xl scale-105' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                Access Node
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Simple Comparison / Trust Grid */}
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto text-center border-t border-white/5 pt-32 pb-40">
           <div className="space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
                 <Lock className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest">Bank-Grade Logic</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">All node computations are isolated and encrypted at the hardware level.</p>
           </div>
           <div className="space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
                 <Globe className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest">Global Sync</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Agents sync across all Indian hubs with sub-20ms policy updates.</p>
           </div>
           <div className="space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
                 <ShieldCheck className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest">MSME Compliant</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Verified for GST compliance and local Indian data sovereignty laws.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
