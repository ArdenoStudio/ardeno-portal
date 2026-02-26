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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, messages]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: Message = { role: 'user', text, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

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
                    text: "Sorry, I'm having a bit of trouble connecting right now. Please try again in a moment.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* ── Floating Button ── */}
            <motion.button
                id="ai-assistant-toggle"
                aria-label="Open AI Assistant"
                onClick={() => setIsOpen((v) => !v)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 1000,
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(229, 9, 20, 0.45)',
                    color: '#fff',
                }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                            <X size={22} />
                        </motion.span>
                    ) : (
                        <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                            <MessageSquare size={22} />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* ── Chat Panel ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="ai-assistant-panel"
                        key="panel"
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: 'fixed',
                            bottom: '5.5rem',
                            right: '1.5rem',
                            zIndex: 999,
                            width: '22rem',
                            maxHeight: '32rem',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '1.25rem',
                            overflow: 'hidden',
                            background: '#0e0e10',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,51,1,0.08)',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
                                padding: '0.875rem 1.125rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Sparkles size={14} color="#fff" />
                            </div>
                            <div>
                                <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2, margin: 0 }}>Aria</p>
                                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', margin: 0 }}>Ardeno Studio Assistant</p>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>Online</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#222 transparent',
                            }}
                        >
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '80%',
                                            padding: '0.625rem 0.875rem',
                                            borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                                            background: msg.role === 'user'
                                                ? 'linear-gradient(135deg, #E50914, #B20710)'
                                                : 'rgba(255, 255, 255, 0.06)',
                                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
                                            color: msg.role === 'user' ? '#fff' : '#d4d4d8',
                                            fontSize: '0.8125rem',
                                            lineHeight: 1.55,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                                >
                                    <div
                                        style={{
                                            padding: '0.625rem 0.875rem',
                                            borderRadius: '1rem 1rem 1rem 0.25rem',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        {[0, 1, 2].map((i) => (
                                            <motion.span
                                                key={i}
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                                style={{ width: 6, height: 6, borderRadius: '50%', background: '#E50914', display: 'inline-block' }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div
                            style={{
                                padding: '0.75rem',
                                borderTop: '1px solid rgba(255,255,255,0.07)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'flex-end',
                                background: '#0e0e10',
                                flexShrink: 0,
                            }}
                        >
                            <textarea
                                ref={inputRef}
                                id="ai-assistant-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Aria anything…"
                                rows={1}
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '0.625rem 0.875rem',
                                    color: '#e4e4e7',
                                    fontSize: '0.8125rem',
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    lineHeight: 1.5,
                                    maxHeight: '6rem',
                                    overflowY: 'auto',
                                }}
                                onInput={(e) => {
                                    const t = e.currentTarget;
                                    t.style.height = 'auto';
                                    t.style.height = Math.min(t.scrollHeight, 96) + 'px';
                                }}
                            />
                            <motion.button
                                id="ai-assistant-send"
                                aria-label="Send message"
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '2.375rem',
                                    height: '2.375rem',
                                    borderRadius: '0.75rem',
                                    background: input.trim() ? 'linear-gradient(135deg, #E50914, #B20710)' : 'rgba(255,255,255,0.06)',
                                    border: 'none',
                                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: input.trim() ? '#fff' : '#555',
                                    flexShrink: 0,
                                    transition: 'background 0.2s',
                                }}
                            >
                                {isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
