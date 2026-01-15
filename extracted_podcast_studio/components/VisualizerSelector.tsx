import React from 'react';
import { VISUALIZER_CATEGORIES } from '../constants';
import { Check, CheckCircle2 } from 'lucide-react';

interface VisualizerSelectorProps {
    selectedCategories: string[];
    onChange: (categories: string[]) => void;
}

export const VisualizerSelector: React.FC<VisualizerSelectorProps> = ({ selectedCategories, onChange }) => {
    
    const toggleCategory = (id: string) => {
        if (selectedCategories.includes(id)) onChange(selectedCategories.filter(c => c !== id));
        else onChange([...selectedCategories, id]);
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Visual Themes
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onChange(VISUALIZER_CATEGORIES.map(c => c.id))}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                    >
                        Select All
                    </button>
                    <button 
                        onClick={() => onChange([])}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 transition-colors border border-slate-700"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VISUALIZER_CATEGORIES.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                        <div 
                            key={category.id}
                            onClick={() => toggleCategory(category.id)}
                            className={`
                                relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden
                                ${isSelected 
                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)] translate-y-[-2px]' 
                                    : 'bg-[#0B0D14]/40 border-slate-800 hover:border-slate-600 hover:bg-[#0B0D14]/60'}
                            `}
                        >
                            {/* Background Glow */}
                            {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>}

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h4 className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                    {category.label}
                                </h4>
                                <div className={`transition-all duration-300 ${isSelected ? 'text-blue-400 scale-110' : 'text-slate-700 scale-100'}`}>
                                    {isSelected ? <CheckCircle2 size={18} fill="currentColor" className="text-blue-900" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-700"></div>}
                                </div>
                            </div>
                            
                            <p className={`text-xs leading-relaxed relative z-10 ${isSelected ? 'text-blue-200/70' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                {category.description}
                            </p>
                        </div>
                    );
                })}
            </div>
            
            {selectedCategories.length === 0 && (
                <div className="text-center p-3 text-xs text-amber-500/80 font-medium bg-amber-500/5 rounded-xl border border-amber-500/20 animate-pulse">
                    Please select at least one visual theme for the video generation.
                </div>
            )}
        </div>
    );
};