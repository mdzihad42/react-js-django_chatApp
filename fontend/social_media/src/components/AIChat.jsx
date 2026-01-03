import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Cpu, Loader } from 'lucide-react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const AIChat = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Hello! I am your AI Assistant. Ask me anything about your friends or posts.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('ai-chat/', { query: userMsg.content });
            setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error connecting to the brain." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="glass-panel"
                    style={{
                        position: 'fixed', bottom: '20px', right: '20px',
                        width: '350px', height: '500px', display: 'flex', flexDirection: 'column',
                        zIndex: 1000, overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1rem', borderBottom: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--accent-glow)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <Cpu size={20} /> AI Assistant
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                marginBottom: '1rem',
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    maxWidth: '80%', padding: '0.75rem', borderRadius: '1rem',
                                    background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                    color: 'white', fontSize: '0.9rem'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && <div style={{ display: 'flex', justifyContent: 'center' }}><Loader className="spin" size={20} /></div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="input-field"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about data..."
                        />
                        <button onClick={handleSend} className="btn-primary" style={{ padding: '0.5rem' }}>
                            <Send size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIChat;
