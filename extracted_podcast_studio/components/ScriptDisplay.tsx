
import React from 'react';
import { PodcastSettings, HostConfig } from '../types';
import { FileText, User } from 'lucide-react';

interface ScriptDisplayProps {
  script: string;
  settings: PodcastSettings;
}

export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ script, settings }) => {
  const lines = script.split('\n').filter(line => line.trim() !== '');
  
  // Create a map for quick host lookup
  const hostMap = new Map<string, HostConfig & { idx: number }>();
  settings.hosts.forEach((h, idx) => {
    hostMap.set(h.name.toLowerCase(), { ...h, idx });
  });

  return (
    <div className="glass-panel rounded-3xl border border-white/5 shadow-2xl overflow-hidden h-full flex flex-col backdrop-blur-xl">
      
      {/* Header */}
      <div className="bg-slate-950/40 border-b border-white/5 p-5 flex justify-between items-center backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-inner">
                <FileText size={16} className="text-slate-200" />
            </div>
            <div>
                <h3 className="font-bold text-sm text-slate-100">Live Transcript</h3>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">AI Generated Dialogue</p>
            </div>
        </div>
        <div className="flex -space-x-2">
            {settings.hosts.map((h, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400" title={h.name}>
                    {h.name.charAt(0)}
                </div>
            ))}
        </div>
      </div>
      
      {/* Transcript Content */}
      <div className="flex-1 overflow-y-auto p-0 space-y-0 bg-transparent custom-scrollbar">
        {lines.map((line, idx) => {
          const colonIndex = line.indexOf(':');
          
          // Action / Stage Direction
          if (colonIndex === -1) {
              return (
                  <div key={idx} className="px-6 py-4 flex items-center gap-4 opacity-50">
                      <div className="h-[1px] flex-1 bg-slate-800"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{line.replace(/\*/g, '')}</span>
                      <div className="h-[1px] flex-1 bg-slate-800"></div>
                  </div>
              );
          }

          const speaker = line.substring(0, colonIndex).trim();
          const content = line.substring(colonIndex + 1).trim();
          
          const hostInfo = hostMap.get(speaker.toLowerCase());
          const hostIdx = hostInfo ? hostInfo.idx : 0;
          
          // Color Theme per Speaker
          const themeColors = [
            'border-blue-500/30 text-blue-400 bg-blue-500/5',
            'border-purple-500/30 text-purple-400 bg-purple-500/5', 
            'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
            'border-amber-500/30 text-amber-400 bg-amber-500/5'
          ];
          const activeTheme = themeColors[hostIdx % themeColors.length];

          return (
            <div key={idx} className={`group relative px-6 py-5 hover:bg-white/[0.02] transition-colors border-b border-white/5`}>
                
                {/* Speaker Label */}
                <div className="flex items-baseline gap-2 mb-1.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTheme.split(' ')[1]}`}>
                        {speaker}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                        {/* Timestamp placeholder - could be real if mapped */}
                        {Math.floor(idx / 2)}:{(idx % 2) * 30 < 10 ? '0' : ''}{(idx % 2) * 30}
                    </span>
                </div>

                {/* Dialogue */}
                <div className="flex gap-4">
                     <div className={`mt-1 w-0.5 self-stretch rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeTheme.split(' ')[0].replace('border', 'bg').replace('/30', '')}`}></div>
                     <p className="text-sm text-slate-300 leading-relaxed font-normal">
                        {content}
                     </p>
                </div>

            </div>
          );
        })}
        
        {/* End Padding */}
        <div className="h-12 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-slate-800 mx-1"></div>
            <div className="w-1 h-1 rounded-full bg-slate-800 mx-1"></div>
            <div className="w-1 h-1 rounded-full bg-slate-800 mx-1"></div>
        </div>
      </div>
    </div>
  );
};
