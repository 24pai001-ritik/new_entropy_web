
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Fixed: Added ArrowRight and removed unused ChevronRight from lucide-react imports
import { ShieldCheck, Lock, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Checkout: React.FC = () => {
  const [method, setMethod] = useState('card');

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <Link to="/pricing" className="inline-flex items-center gap-3 text-gray-500 hover:text-white mb-12 transition-all">
           {/* Fixed: ArrowRight is now correctly imported from lucide-react */}
           <ArrowRight className="w-4 h-4 rotate-180" />
           <span className="text-[9px] font-black uppercase tracking-widest">Adjust Plan</span>
        </Link>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Form */}
          <div className="lg:col-span-7">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-10">Secure Gateway</h1>
            
            <div className="space-y-8">
              <div className="glass p-8 rounded-[2rem] border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-gray-500 mb-8">1. Intelligence Tier</h3>
                <div className="flex justify-between items-center">
                   <div>
                      <div className="text-xl font-black uppercase tracking-tight">Sigma Node</div>
                      <div className="text-sm text-gray-500">Billed monthly</div>
                   </div>
                   <div className="text-xl font-black">₹2,499</div>
                </div>
              </div>

              <div className="glass p-8 rounded-[2rem] border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-gray-500 mb-8">2. Node Access Identity</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Business Name</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4FD1FF]" placeholder="Entropy Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4FD1FF]" placeholder="you@sigma.net" />
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-[2rem] border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-gray-500 mb-8">3. Credit Logic</h3>
                <div className="space-y-6">
                  <div className="flex gap-4 mb-6">
                    <button onClick={() => setMethod('card')} className={`px-6 py-3 rounded-xl border transition-all ${method === 'card' ? 'bg-[#4FD1FF] text-black border-[#4FD1FF]' : 'border-white/10 hover:bg-white/5'}`}>
                      <CreditCard className="w-5 h-5" />
                    </button>
                    <button onClick={() => setMethod('upi')} className={`px-6 py-3 rounded-xl border transition-all ${method === 'upi' ? 'bg-[#4FD1FF] text-black border-[#4FD1FF]' : 'border-white/10 hover:bg-white/5'}`}>
                      <span className="font-black text-xs">UPI</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#4FD1FF]" placeholder="Card Number" />
                    <div className="grid grid-cols-2 gap-4">
                      <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#4FD1FF]" placeholder="MM/YY" />
                      <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#4FD1FF]" placeholder="CVV" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-white text-black py-6 rounded-2xl font-black text-xs tracking-[0.6em] uppercase hover:bg-[#4FD1FF] transition-all flex items-center justify-center gap-3 shadow-2xl">
                Commit Transaction <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 space-y-8">
             <div className="glass p-10 rounded-[3rem] border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest mb-10">Verification Summary</h3>
                <div className="space-y-6 text-sm">
                   <div className="flex justify-between">
                      <span className="text-gray-500">Sigma Node</span>
                      <span>₹2,499.00</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-gray-500">Service Logic Tax (18%)</span>
                      <span>₹449.82</span>
                   </div>
                   <div className="h-px bg-white/10 my-4" />
                   <div className="flex justify-between text-xl font-black uppercase">
                      <span>Total Refinement</span>
                      <span className="text-[#4FD1FF]">₹2,948.82</span>
                   </div>
                </div>
             </div>

             <div className="flex flex-col items-center gap-4 text-gray-500">
                <ShieldCheck className="w-10 h-10 opacity-20" />
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Bank-Grade Encryption Active</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
