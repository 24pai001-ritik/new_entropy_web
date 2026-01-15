import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, Bot, ChevronRight, CheckCircle2, Copy, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChatbotMaker: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [chatbotName, setChatbotName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [recentChatbotId, setRecentChatbotId] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleCreateChatbot = async () => {
        if (!chatbotName || files.length === 0) return alert('Please provide a name and at least one PDF.');

        setIsUploading(true);
        const formData = new FormData();
        formData.append('chatbot_name', chatbotName);
        formData.append('owner_id', '00000000-0000-0000-0000-000000000000'); // Mocking owner_id for demo
        files.forEach(file => formData.append('files', file));

        try {
            const response = await fetch('http://localhost:5000/upload-pdf', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.chatbot_id) {
                setRecentChatbotId(data.chatbot_id);
                alert('Chatbot created successfully!');
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
                {/* Creation Form */}
                <div className="space-y-8 glass p-10 rounded-[30px] border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#4FD1FF]/10 rounded-xl flex items-center justify-center">
                            <Plus className="text-[#4FD1FF]" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Spawn New Agent</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Agent Designation</label>
                        <input
                            type="text"
                            placeholder="e.g. Project X Assistant"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-[#4FD1FF]/50 transition-all font-mono text-sm"
                            value={chatbotName}
                            onChange={(e) => setChatbotName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Data Injection (.PDF)</label>
                        <div
                            className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-[#4FD1FF]/30 transition-all cursor-pointer bg-white/[0.01]"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <Upload className="w-10 h-10 text-gray-600" />
                            <p className="text-sm text-gray-400 font-mono">
                                {files.length > 0 ? `${files.length} files staged` : 'Select PDF Intelligence Blocks'}
                            </p>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreateChatbot}
                        disabled={isUploading}
                        className="w-full bg-[#4FD1FF] text-black font-black uppercase tracking-[0.3em] py-5 rounded-xl hover:shadow-[0_0_30px_#4FD1FF44] transition-all disabled:opacity-50"
                    >
                        {isUploading ? 'Initializing...' : 'Construct Knowledge Base'}
                    </button>
                </div>

                {/* Dashboard / Info */}
                <div className="space-y-8">
                    <div className="glass p-10 rounded-[30px] border-white/5 bg-[#4FD1FF]/[0.02] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4FD1FF]/20 blur-[100px] -mr-32 -mt-32"></div>

                        <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Automation Status</h3>

                        {recentChatbotId ? (
                            <div className="space-y-6">
                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Bot className="w-5 h-5 text-[#4FD1FF]" />
                                        <span className="text-sm font-bold">{chatbotName} Online</span>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/20 rounded-lg">
                                                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">Neural Node Activated</h3>
                                                    <p className="text-xs text-gray-400">Your agent is now synced with the intelligence layer.</p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/chatbot/${recentChatbotId}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#4FD1FF]/10 hover:bg-[#4FD1FF]/20 text-[#4FD1FF] rounded-lg transition-all text-xs border border-[#4FD1FF]/30"
                                            >
                                                Try Chatbot
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-xl space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-4 h-4 text-gray-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Integration Script</span>
                                            </div>
                                            <pre className="text-[10px] bg-black/30 p-3 rounded-lg text-gray-500 overflow-x-auto font-mono">
                                                {`<script 
  src="http://localhost:5000/embed-script.js" 
  data-chatbot-id="${recentChatbotId}"
></script>`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <Bot className="w-16 h-16 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Active Deployments</p>
                            </div>
                        )}
                    </div>

                    <div className="glass p-10 rounded-[30px] border-white/5 text-sm text-gray-400 space-y-4">
                        <p>Our Entropy Converse engine uses semantic vector mapping to isolate document intelligence within a closed RAG loop.</p>
                        <p>Each agent is cryptographically bound to its data context, ensuring zero-cross-contamination between knowledge bases.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ChatbotMaker;
