
import React, { useState, useEffect } from 'react';
import { ArrowRight, FileText, AlertCircle, PlayCircle } from 'lucide-react';
import { PodcastSettings } from '../types';

interface ScriptEditorProps {
  initialScript: string;
  settings: PodcastSettings;
  onConfirm: (finalScript: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ 
  initialScript, 
  settings, 
  onConfirm, 
  onCancel,
  isProcessing 
}) => {
  const [script, setScript] = useState(initialScript);
  const [error, setError] = useState<string | null>(null);

  // Validate format on change
  const validateFormat = (text: string) => {
    // Check if lines generally follow "Name: Text" pattern
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const validLines = lines.filter(l => l.includes(':'));
    if (validLines.length < lines.length * 0.8) {
       setError("Warning: Many lines are missing the 'Speaker Name:' prefix.");
    } else {
       setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setScript(e.target.value);
      validateFormat(e.target.value);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col h-[85vh]">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                Edit Script
            </h2>
            <p className="text-sm text-slate-400">Refine the dialogue before generating audio.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
                Back
            </button>
            <button 
                onClick={() => onConfirm(script)}
                disabled={isProcessing}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Rendering Audio...' : 'Generate Audio'}
                {!isProcessing && <PlayCircle size={16} />}
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
         
         {/* Editor Area */}
         <div className="flex-1 flex flex-col p-4 md:p-6 border-r border-slate-700/50">
            {error && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}
            <div className="flex-1 relative">
                <textarea 
                    value={script}
                    onChange={handleChange}
                    className="w-full h-full bg-[#0f1219] border border-slate-700 rounded-xl p-6 text-slate-200 font-mono text-sm leading-relaxed focus:border-blue-500 outline-none resize-none shadow-inner"
                    spellCheck={false}
                />
                <div className="absolute top-2 right-4 text-[10px] text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded border border-slate-700 pointer-events-none">
                    FORMAT: HostName: Spoken text...
                </div>
            </div>
         </div>

         {/* Sidebar / Tips */}
         <div className="w-full md:w-64 bg-slate-900/30 p-6 overflow-y-auto space-y-6 hidden md:block">
             <div>
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hosts</h4>
                 <div className="space-y-2">
                     {settings.hosts.map(h => (
                         <div key={h.id} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700">
                             <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                                 {h.name.charAt(0)}
                             </div>
                             <span>{h.name}</span>
                         </div>
                     ))}
                 </div>
             </div>

             <div>
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pro Tips</h4>
                 <ul className="text-xs text-slate-500 space-y-3 leading-relaxed">
                     <li>
                        <strong className="text-slate-300 block mb-1">Emotion:</strong>
                        Use "..." for pauses, "!" for excitement, and CAPS for emphasis.
                     </li>
                     <li>
                        <strong className="text-slate-300 block mb-1">Pacing:</strong>
                        Break long paragraphs into shorter lines for better audio flow.
                     </li>
                     <li>
                        <strong className="text-slate-300 block mb-1">Format:</strong>
                        Ensure every line starts with the exact Host Name followed by a colon.
                     </li>
                 </ul>
             </div>
         </div>
      </div>
    </div>
  );
};
