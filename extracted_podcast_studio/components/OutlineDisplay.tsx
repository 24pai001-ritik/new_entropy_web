
import React, { useEffect, useState } from 'react';
import { ArrowRight, Link as LinkIcon, PenLine } from 'lucide-react';

interface OutlineDisplayProps {
  outline: string;
  sources: string[];
  setOutline: (val: string) => void;
  onConfirm: (title: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  initialTitle: string;
}

export const OutlineDisplay: React.FC<OutlineDisplayProps> = ({ 
  outline, 
  sources,
  setOutline, 
  onConfirm, 
  onCancel,
  isProcessing,
  initialTitle
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [cleanedOutline, setCleanedOutline] = useState(outline);

  // Extract initial title from markdown if present and not already set
  useEffect(() => {
    // Look for "# Title" pattern
    const match = outline.match(/^#\s+(.+)$/m);
    if (match) {
        setTitle(match[1].trim());
        // Remove the title line from the textarea body to avoid duplication
        setCleanedOutline(outline.replace(/^#\s+.+$/m, '').trim());
    } else {
        setCleanedOutline(outline);
    }
  }, []);

  const handleConfirm = () => {
      // Re-combine for context but pass title specifically
      onConfirm(title);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm overflow-hidden flex flex-col h-[85vh]">
      
      <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-white">Review & Edit</h2>
            <p className="text-sm text-slate-400">Customize the title and structure before generating.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
            >
                Back
            </button>
            <button 
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Creating Script...' : 'Generate Episode'}
                {!isProcessing && <ArrowRight size={16} />}
            </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
         
         {/* Title Editor */}
         <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <PenLine size={12} /> Episode Title
            </label>
            <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0f1219] border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-slate-600"
                placeholder="Enter a catchy title..."
            />
         </div>

         {/* Outline Editor */}
         <div className="space-y-2 h-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Episode Structure</label>
            <textarea 
                value={cleanedOutline}
                onChange={(e) => {
                    setCleanedOutline(e.target.value);
                    setOutline(e.target.value); // Sync back
                }}
                className="w-full h-[300px] bg-[#0f1219] border border-slate-700 rounded-xl p-6 text-slate-300 font-mono leading-relaxed focus:border-blue-500 outline-none resize-none"
            />
         </div>
      </div>

      {sources.length > 0 && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-700 text-xs text-slate-400">
             <div className="flex items-center gap-2 mb-2 font-semibold">
                <LinkIcon size={12} />
                <span>Sources Used:</span>
             </div>
             <div className="flex flex-wrap gap-2">
                {sources.map((src, idx) => (
                    <a 
                        key={idx} 
                        href={src} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 truncate max-w-[200px] transition-colors"
                    >
                        {src}
                    </a>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};
