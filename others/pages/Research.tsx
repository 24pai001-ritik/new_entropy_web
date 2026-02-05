import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, Sparkles, AlertTriangle, FileText, CheckCircle2, ShieldCheck, Microscope, Brain, Lightbulb, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

// Types for Research Data
interface ResearchState {
    file: File | null;
    sections: Record<string, string>;
    fullText: string;
    isProcessing: boolean;
    activeTab: 'claims' | 'assumptions' | 'methodology' | 'reviewer' | 'ideas';
    analysisResults: Record<string, any>; // Cache for analysis
}

const Research: React.FC = () => {
    const [state, setState] = useState<ResearchState>({
        file: null,
        sections: {},
        fullText: '',
        isProcessing: false,
        activeTab: 'claims',
        analysisResults: {}
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // 1. Handle File Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLocalError(null);
            setState(prev => ({ ...prev, isProcessing: true, file }));

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('http://localhost:5000/research/process-pdf', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.error) {
                    setLocalError(data.error);
                    setState(prev => ({ ...prev, isProcessing: false }));
                    return;
                }

                setState(prev => ({
                    ...prev,
                    isProcessing: false,
                    fullText: data.full_text,
                    sections: data.sections
                }));
            } catch (error: any) {
                console.error(error);
                setLocalError(error.message || "Failed to process PDF");
                setState(prev => ({ ...prev, isProcessing: false }));
            }
        }
    };

    // 2. Trigger Specific Analysis
    const runAnalysis = async (type: string) => {
        console.log(`[Research] Running analysis for: ${type}`);
        if (state.analysisResults[type]) {
            console.log(`[Research] Result found in cache for ${type}`);
            return;
        }

        setIsAnalyzing(true);
        setLocalError(null);
        try {
            let textToAnalyze = state.fullText;
            if (type === 'methodology' && state.sections['methodology']) {
                textToAnalyze = state.sections['methodology'];
            }

            const res = await fetch('http://localhost:5000/research/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, text: textToAnalyze })
            });
            const result = await res.json();

            if (result.error) {
                setLocalError(result.error);
                return;
            }

            setState(prev => ({
                ...prev,
                analysisResults: { ...prev.analysisResults, [type]: result }
            }));
        } catch (error: any) {
            console.error(error);
            setLocalError(error.message || `Analysis failed for ${type}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Components for Render Logic
    const renderClaims = () => {
        const claims = state.analysisResults['claims'];
        if (!claims) return <div className="text-center p-10 text-gray-500">Click "Start Processing" to begin.</div>;
        if (!Array.isArray(claims)) return <div className="text-red-400 p-6 glass rounded-2xl border border-red-500/20">Invalid data format received from intelligence node.</div>;

        return (
            <div className="space-y-4">
                {claims.map((item: any, idx: number) => (
                    <div key={idx} className="glass p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${item.confidence === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                                item.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {item.confidence} Confidence
                            </span>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-white">{item.claim}</h4>
                        <div className="pl-4 border-l-2 border-white/10 text-gray-400 text-sm">
                            <p className="mb-1"><strong className="text-gray-300">Evidence:</strong> {item.evidence}</p>
                            {item.quote && <p className="italic opacity-70">"{item.quote}"</p>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderAssumptions = () => {
        const data = state.analysisResults['assumptions'];
        if (!data) return <div className="text-center p-10 text-gray-500">Click "Start Processing" to begin.</div>;
        if (!Array.isArray(data)) return <div className="text-red-400 p-6 glass rounded-2xl border border-red-500/20">Analysis module failed to return structured data.</div>;

        return (
            <div className="grid md:grid-cols-2 gap-6">
                {data.map((item: any, idx: number) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${item.risk_level === 'Critical' ? 'bg-red-500/10 border-red-500/50' :
                        item.risk_level === 'High' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/5 border-white/10'
                        }`}>
                        <div className="flex items-center gap-2 mb-3">
                            {item.risk_level === 'Critical' && <AlertTriangle className="text-red-500" size={18} />}
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">{item.type} Assumption</span>
                        </div>
                        <h4 className="font-bold text-white mb-2">{item.assumption}</h4>
                        <p className="text-sm text-gray-400"><strong className="text-gray-300">Impact if false:</strong> {item.impact_if_false}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderMethodology = () => {
        const data = state.analysisResults['methodology'];
        if (!data) return <div className="text-center p-10 text-gray-500">Click "Stress Test" to begin.</div>;

        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between p-6 glass rounded-2xl">
                    <h3 className="text-xl font-bold">Verdict</h3>
                    <span className="text-2xl font-black uppercase tracking-tighter text-emerald-400">{data.verdict}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-4">Weaknesses Identified</h4>
                        <div className="space-y-3">
                            {data.weaknesses.map((w: any, i: number) => (
                                <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                                    <p className="font-bold text-white mb-1">{w.point}</p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] px-2 py-0.5 bg-red-500/20 rounded text-red-300">Severity: {w.severity}</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-gray-400">Risk: {w.reproducibility_risk}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-yellow-400 mb-4">Missing Elements</h4>
                        <ul className="space-y-2">
                            {data.missing_elements.map((m: string, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-gray-300 p-3 bg-yellow-500/5 rounded-xl border border-yellow-500/20">
                                    <AlertTriangle size={14} className="text-yellow-500" /> {m}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const renderReviewer = () => {
        const data = state.analysisResults['reviewer'];
        if (!data) return <div className="text-center p-10 text-gray-500">Click "Simulate Review" to begin.</div>;

        const ReviewerCard = ({ name, role, data }: { name: string, role: string, data: any }) => (
            <div className="glass p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-black text-lg">{name}</h4>
                        <p className="text-xs uppercase tracking-widest text-gray-500">{role}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg font-bold ${data.decision.includes('Accept') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {data.decision} ({data.score}/10)
                    </div>
                </div>
                <p className="text-sm text-gray-300 italic">"{data.summary}"</p>
                <div className="space-y-2">
                    <p className="text-xs font-bold text-green-400">+ {data.strengths[0]}</p>
                    <p className="text-xs font-bold text-red-400">- {data.weaknesses[0]}</p>
                </div>
            </div>
        );

        return (
            <div className="grid md:grid-cols-3 gap-6">
                <ReviewerCard name="Reviewer A" role="Methodology Specialist" data={data.reviewer_a} />
                <ReviewerCard name="Reviewer B" role="Novelty & Impact" data={data.reviewer_b} />
                <ReviewerCard name="Reviewer C" role="Reproducibility Check" data={data.reviewer_c} />
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 relative overflow-hidden">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#080A0F]/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 glass rounded-[40px] border-white/5 bg-white/[0.02]"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Microscope className="w-10 h-10 text-emerald-400 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Scholar</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-6">
                        Next-Gen Research Co-Pilot
                    </div>
                    <p className="text-gray-400 max-w-md mx-auto mb-8 font-mono text-sm">
                        Scholar is evolving. We're integrating deeper semantic analysis and cross-domain synthesis nodes to redefine how you process intelligence.
                    </p>
                    <Link to="/" className="inline-block bg-white text-black py-4 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all">
                        Explore Active Nodes
                    </Link>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4"
                        >
                            <ShieldCheck size={14} /> AI Research Co-Pilot V.2.0
                        </motion.div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                            Research <span className="text-gradient">Workstation.</span>
                        </h1>
                    </div>
                </div>

                {!state.fullText ? (
                    /* UPLOAD STATE */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-20 rounded-[3rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-6 hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            {state.isProcessing ? <Sparkles className="animate-spin text-emerald-400" size={40} /> : <Upload className="text-gray-400 group-hover:text-emerald-400 transition-colors" size={40} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Initialize Analysis Node</h3>
                            <p className="text-gray-500">Upload a research paper (PDF) to begin structural decomposition.</p>
                        </div>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="pdf-upload"
                            disabled={state.isProcessing}
                        />
                        <label
                            htmlFor="pdf-upload"
                            className={`px-8 py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl cursor-pointer hover:bg-emerald-400 transition-colors ${state.isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {state.isProcessing ? 'Decomposing...' : 'Select Paper'}
                        </label>
                    </motion.div>
                ) : (
                    /* WORKSTATION STATE */
                    <div className="grid lg:grid-cols-4 gap-8">

                        {/* Sidebar: Document Structure */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="glass p-6 rounded-3xl">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Structure</h3>
                                <div className="space-y-2">
                                    {Object.keys(state.sections).map((sec) => (
                                        <div key={sec} className="flex items-center gap-2 text-sm text-gray-400 capitalize hover:text-white cursor-default">
                                            <FileText size={14} /> {sec}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Status</h3>
                                <p className="text-sm font-bold text-white">Paper Decomposed</p>
                                <p className="text-xs text-gray-400 mt-1">Ready for Deep Analysis</p>
                            </div>
                        </div>

                        {/* Main Analysis Area */}
                        <div className="lg:col-span-3 space-y-8">

                            {/* Tabs */}
                            <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
                                {[
                                    { id: 'claims', label: 'Claim Map', icon: Microscope },
                                    { id: 'assumptions', label: 'Assumptions', icon: AlertTriangle },
                                    { id: 'methodology', label: 'Stress Test', icon: Brain },
                                    { id: 'reviewer', label: 'Peer Review', icon: Users },
                                    { id: 'ideas', label: 'New Ideas', icon: Lightbulb },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${state.activeTab === tab.id
                                            ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <tab.icon size={16} /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Action & Content */}
                            <div className="min-h-[500px]">
                                {localError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold"
                                    >
                                        <AlertTriangle size={18} />
                                        <span>Terminal Error: {localError}</span>
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={state.activeTab}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Run Button */}
                                        {!state.analysisResults[state.activeTab] && !isAnalyzing && (
                                            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                                <p className="text-xl font-bold mb-4 text-center max-w-md">
                                                    Initialize {state.activeTab.charAt(0).toUpperCase() + state.activeTab.slice(1)} Analysis Node
                                                </p>
                                                <button
                                                    onClick={() => runAnalysis(state.activeTab)}
                                                    className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors"
                                                >
                                                    Start Processing
                                                </button>
                                            </div>
                                        )}

                                        {/* Loading State */}
                                        {isAnalyzing && (
                                            <div className="flex flex-col items-center justify-center p-20">
                                                <Sparkles className="animate-spin text-emerald-500 mb-4" size={40} />
                                                <p className="animate-pulse font-mono text-emerald-400">Synthesizing Intelligence...</p>
                                            </div>
                                        )}

                                        {/* Results */}
                                        {state.analysisResults[state.activeTab] && !localError && (
                                            <div className="animate-fade-in-up">
                                                {state.activeTab === 'claims' && renderClaims()}
                                                {state.activeTab === 'assumptions' && renderAssumptions()}
                                                {state.activeTab === 'methodology' && renderMethodology()}
                                                {state.activeTab === 'reviewer' && renderReviewer()}
                                                {state.activeTab === 'ideas' && Array.isArray(state.analysisResults['ideas']) &&
                                                    <div className="grid gap-6">
                                                        {state.analysisResults['ideas'].map((idea: any, i: number) => (
                                                            <div key={i} className="glass p-8 rounded-3xl border border-purple-500/20">
                                                                <h3 className="text-2xl font-bold mb-2 text-white">{idea.title}</h3>
                                                                <p className="text-purple-400 text-xs font-black uppercase tracking-widest mb-4">Derived from: {idea.derived_from_gap}</p>
                                                                <p className="text-gray-300 leading-relaxed">{idea.proposed_method}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                }
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Research;
