
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Users, Repeat, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl bg-white/5 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`text-xs font-black tracking-widest ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </div>
    </div>
    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{title}</div>
    <div className="text-4xl font-black tracking-tighter">{value}</div>
    <motion.div 
      initial={{ x: '-100%' }}
      whileHover={{ x: '100%' }}
      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#4FD1FF] to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity"
    />
  </div>
);

const LineChart = () => (
  <svg viewBox="0 0 400 150" className="w-full h-40">
    <defs>
      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4FD1FF" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#4FD1FF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0,130 C50,120 80,140 120,100 C160,60 200,90 250,50 C300,10 350,40 400,20 L400,150 L0,150 Z" fill="url(#chartGradient)" />
    <motion.path 
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
      d="M0,130 C50,120 80,140 120,100 C160,60 200,90 250,50 C300,10 350,40 400,20" 
      fill="none" 
      stroke="#4FD1FF" 
      strokeWidth="3" 
    />
  </svg>
);

const Analytics: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
        <div>
          <span className="text-[10px] font-black text-[#4FD1FF] tracking-[0.6em] uppercase mb-4 block">System Metrics</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Intelligence Log</h1>
        </div>
        <div className="flex gap-4">
           <button className="glass px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5">Export CSV</button>
           <button className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4FD1FF] transition-colors">Generate Strategy</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard title="Resolved Queries" value="12.4k" change="+14.2%" icon={Activity} color="[#4FD1FF]" />
        <StatCard title="Avg Latency" value="240ms" change="-12ms" icon={Zap} color="[#3B6DFF]" />
        <StatCard title="Total Agents" value="8" change="+2" icon={Users} color="[#8B5CF6]" />
        <StatCard title="RL Retraining" value="1.2k" change="+42" icon={Repeat} color="white" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="glass p-10 rounded-[3rem] border-white/5">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-sm font-black uppercase tracking-widest">Efficiency Waveform</h3>
                 <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>1D</span>
                    <span className="text-[#4FD1FF]">1W</span>
                    <span>1M</span>
                    <span>1Y</span>
                 </div>
              </div>
              <LineChart />
           </div>

           <div className="grid md:grid-cols-2 gap-8">
              <div className="glass p-10 rounded-[3rem] border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest mb-8">Active Nodes</h3>
                <div className="space-y-6">
                   {[
                     { name: 'Chat Support', val: 92, color: '#4FD1FF' },
                     { name: 'Video Gen', val: 78, color: '#3B6DFF' },
                     { name: 'Market Intel', val: 45, color: '#8B5CF6' }
                   ].map((node, i) => (
                     <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                           <span>{node.name}</span>
                           <span>{node.val}% Capacity</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${node.val}%` }} className="h-full" style={{ backgroundColor: node.color }} />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
              <div className="glass p-10 rounded-[3rem] border-white/5 flex flex-col justify-between">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6">Network Health</h3>
                   <div className="flex items-center gap-4 text-green-500 mb-6">
                      <TrendingUp className="w-8 h-8" />
                      <span className="text-3xl font-black">99.98%</span>
                   </div>
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">No anomalies detected in the last 2,400 reinforcement iterations.</p>
                </div>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sigma Node V.4</span>
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="glass p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-[#4FD1FF]/5 to-transparent">
              <div className="flex items-center gap-3 mb-10">
                 <Sparkles className="w-5 h-5 text-[#4FD1FF]" />
                 <h3 className="text-sm font-black uppercase tracking-widest">AI Insights</h3>
              </div>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#4FD1FF]">Optimization Alert</div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">The RL loop has identified a 12% support efficiency gain by shifting response policy to "Direct Action".</p>
                 </div>
                 <div className="space-y-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#8B5CF6]">Market Synthesis</div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">New competitor data detected. Research helper recommends refreshing the Market Gap analysis.</p>
                 </div>
              </div>
              <button className="w-full mt-10 py-4 rounded-xl glass border-white/10 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">Apply All Updates</button>
           </div>

           <div className="glass p-10 rounded-[3rem] border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest mb-8">Node Activity</h3>
              <div className="space-y-6">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 items-start">
                       <div className="w-2 h-2 rounded-full bg-[#4FD1FF] mt-1" />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Reward Update</span>
                          <span className="text-[9px] text-gray-500">2 minutes ago</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
