import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatbotView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatbotInfo, setChatbotInfo] = useState<any>(null);
    const [sessionId] = useState(() => crypto.randomUUID());
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchChatbotInfo = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/chatbot/${id}/embed`);
                const data = await res.json();
                setChatbotInfo(data);
                setMessages([{ role: 'assistant', content: data.welcome_message || 'Hello! I am ready to help.' }]);
            } catch (error) {
                console.error('Failed to load chatbot', error);
            }
        };
        fetchChatbotInfo();
    }, [id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Send the last 10 messages as history
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch(`http://127.0.0.1:8000/chat/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    session_id: sessionId,
                    history: history
                })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Connection failure'}. Check if backend is online.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="pt-20 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 h-screen flex flex-col max-w-4xl mx-auto">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#4FD1FF]/10 rounded-2xl flex items-center justify-center border border-[#4FD1FF]/20">
                    <Bot className="text-[#4FD1FF] w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter">{chatbotInfo?.name || 'Entropy Converse'}</h1>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#4FD1FF]/60 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Grounded by Gemini RAG
                    </p>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pr-2 md:pr-4 custom-scrollbar mb-6 md:mb-8"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[80%] p-4 md:p-6 rounded-2xl md:rounded-3xl ${msg.role === 'user'
                                ? 'bg-[#4FD1FF] text-black font-medium rounded-tr-none'
                                : 'glass border-white/5 text-gray-300 rounded-tl-none'
                                }`}>
                                <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 opacity-50">
                                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">
                                        {msg.role === 'user' ? 'Human' : 'Agent'}
                                    </span>
                                </div>
                                <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl rounded-tl-none flex gap-2">
                            <span className="w-1.5 h-1.5 bg-[#4FD1FF] rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-[#4FD1FF] rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-[#4FD1FF] rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="relative group">
                <input
                    type="text"
                    placeholder="Inquire document intelligence..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 md:px-8 py-4 md:py-6 focus:outline-none focus:border-[#4FD1FF]/50 transition-all font-mono text-xs md:text-sm pr-14 md:pr-20"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                    onClick={handleSendMessage}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 md:p-3 bg-[#4FD1FF] text-black rounded-xl hover:shadow-[0_0_20px_#4FD1FF44] transition-all"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ChatbotView;
