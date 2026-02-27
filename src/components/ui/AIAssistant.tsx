import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

interface Message {
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            text: "Hi! I'm Aria, your Ardeno Studio Project Assistant. How can I help you today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    const [isMobile, setIsMobile] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Robust Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!isOpen) return;

            // If click is on the toggle button itself, let the button's own handler handle it
            if (toggleRef.current?.contains(e.target as Node)) return;

            // If click is outside the panel, close it
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Idle timer to collapse Aria
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            if (Date.now() - lastActivity > 45000) {
                setIsOpen(false);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, lastActivity]);

    const recordActivity = useCallback(() => {
        setLastActivity(Date.now());
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, [isOpen, messages]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: Message = { role: 'user', text, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        recordActivity();

        try {
            const history = messages.map((m) => ({ role: m.role, text: m.text }));
            const { reply } = await api.post<{ reply: string }>('/ai-assistant', {
                message: text,
                history,
            });
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', text: reply, timestamp: new Date() },
            ]);
        } catch (err) {
            console.error('[AIAssistant] Error sending message:', err);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: "I'm experiencing a temporary synchronization delay. Please re-establish connection.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, recordActivity]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const variants = {
        panel: {
            initial: isMobile ? { y: '100%', opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: isMobile ? { y: '100%', opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 },
        },
        message: {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
        }
    };

    return (
        <>
            {/* ── Toggle Button ── */}
            <AnimatePresence>
                {(!isOpen || !isMobile) && (
                    <motion.button
                        ref={toggleRef}
                        id="ai-assistant-toggle"
                        aria-label="Toggle Assistant"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="fixed z-[1000] flex items-center justify-center text-white border-none cursor-pointer overflow-hidden rounded-full shadow-2xl transition-all duration-300 group"
                        style={{
                            bottom: isMobile ? '1.25rem' : '2.5rem',
                            right: isMobile ? '1.25rem' : '2.5rem',
                            width: '3.75rem',
                            height: '3.75rem',
                            background: 'rgba(5, 5, 5, 0.8)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                        }}
                    >
                        {/* Refraction/Inner Glow Layer */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-20 mix-blend-overlay pointer-events-none" />

                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div key="x" initial={{ rotate: -90, opacity: 0, scale: 0.8 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}>
                                    <X size={20} className="text-white/80" />
                                </motion.div>
                            ) : (
                                <motion.div key="msg" initial={{ rotate: 90, opacity: 0, scale: 0.8 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }}>
                                    <MessageSquare size={20} className="text-white/80" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Ambient Red Halo */}
                        <div className="absolute -inset-4 bg-accent-0/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Aria Panel ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        id="ai-assistant-panel"
                        variants={variants.panel}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        onMouseMove={recordActivity}
                        onClick={(e) => {
                            e.stopPropagation();
                            recordActivity();
                        }}
                        className="fixed z-[999] flex flex-col overflow-hidden"
                        style={{
                            bottom: isMobile ? '0' : '7.5rem',
                            right: isMobile ? '0' : '2.5rem',
                            width: isMobile ? '100%' : '24rem',
                            height: isMobile ? '85vh' : '40rem',
                            background: 'rgba(5, 5, 5, 0.85)',
                            backdropFilter: 'blur(32px)',
                            border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: isMobile ? '24px 24px 0 0' : '20px',
                            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9)',
                        }}
                    >
                        {/* Premium Surface layers */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-accent-0/8 blur-[100px] pointer-events-none" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 pointer-events-none" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04] relative z-10">
                            {/* Breathing Top Glow */}
                            <motion.div
                                animate={{ opacity: [0.06, 0.1, 0.06] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 left-0 right-0 h-px bg-accent-0 blur-[2px]"
                            />

                            <div className="flex flex-col">
                                <span className="text-[0.7rem] font-display font-black tracking-[0.25em] text-white/90 uppercase">Aria</span>
                                <span className="text-[0.5rem] font-mono tracking-widest text-[#7A7A7A] uppercase mt-0.5">Logic_Core // v2.4</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]"
                                    />
                                    <span className="text-[0.55rem] font-mono text-white/40 tracking-wider font-bold">LIVE</span>
                                </div>
                                {isMobile && (
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                    }} className="text-white/40 hover:text-white transition-colors">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Message Stream */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    variants={variants.message}
                                    initial="initial"
                                    animate="animate"
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] leading-relaxed ${msg.role === 'user'
                                            ? 'text-[0.85rem] text-white/90 bg-white/[0.03] border border-white/[0.06] px-4 py-3 rounded-[18px]'
                                            : 'text-[0.88rem] text-[#EAEAEA] font-light leading-7'
                                        }`}>
                                        {msg.role === 'assistant' && i === 0 ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="font-bold text-white text-[0.95rem]">Hi! I'm Aria,</div>
                                                <div className="opacity-80">your Ardeno Studio Project Assistant. How can I help you today?</div>
                                            </div>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2 px-3">
                                    {[0, 1, 2].map(d => (
                                        <motion.div
                                            key={d}
                                            animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.15 }}
                                            className="w-1.5 h-1.5 rounded-full bg-accent-0/40"
                                        />
                                    ))}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Core */}
                        <div className="p-6 pt-2 mt-auto relative z-10">
                            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none -translate-y-full" />
                            <div className="relative flex items-center gap-3 border border-white/[0.04] bg-white/[0.02] p-1.5 pl-6 rounded-full focus-within:border-accent-0/10 focus-within:bg-white/[0.03] focus-within:shadow-[0_0_30px_rgba(255,51,1,0.03)] transition-all duration-500 shadow-inner">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Execute command..."
                                    rows={1}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="flex-1 bg-transparent border-none outline-none text-[0.85rem] text-white placeholder:text-[#8A8A8A] placeholder:tracking-wide py-3 resize-none font-sans tracking-normal normal-case"
                                    style={{
                                        textTransform: 'none',
                                        letterSpacing: 'normal'
                                    }}
                                />
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        sendMessage();
                                    }}
                                    disabled={!input.trim() || isLoading}
                                    whileHover={input.trim() ? { scale: 1.05, y: -2 } : {}}
                                    whileTap={input.trim() ? { scale: 0.95 } : {}}
                                    className={`w-11 h-11 rounded-full transition-all duration-500 flex items-center justify-center ${input.trim()
                                            ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                                            : 'bg-white/[0.02] text-white/10'
                                        }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <motion.div animate={input.trim() ? { rotate: [0, 5, 0] } : {}}>
                                            <Send size={18} />
                                        </motion.div>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
