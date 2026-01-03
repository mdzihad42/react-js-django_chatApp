import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Send, User, MessageCircle } from 'lucide-react';

const Messages = () => {
    const { user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null); // User object
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Fetch friends on mount
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await api.get('users/friends/');
                setFriends(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchFriends();
    }, []);

    // Fetch messages when friend selected or polling
    useEffect(() => {
        let interval;
        const fetchMessages = async () => {
            if (!selectedFriend) return;
            try {
                const res = await api.get('messages/');
                // Filter messages between me and selected friend
                // Ideally backend should support filtering ?user_id=X, but for now we filter locally
                // Ensure IDs are compared as strings to avoid type mismatches
                const myId = String(user.id);
                const friendId = String(selectedFriend.id);

                const filtered = res.data.filter(m => {
                    const senderId = String(m.sender.id);
                    const receiverId = String(m.receiver.id);
                    return (senderId === myId && receiverId === friendId) || (senderId === friendId && receiverId === myId);
                });

                // Sort by time
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                setMessages(filtered);
            } catch (err) {
                console.error("Message fetch error:", err);
            }
        };

        if (selectedFriend) {
            fetchMessages(); // Initial fetch
            interval = setInterval(fetchMessages, 3000); // Poll every 3s
        }

        return () => clearInterval(interval);
    }, [selectedFriend, user]); // Only re-run when friend/user changes, not on every message update to avoid excessive re-renders/scrolls unless necessary

    // Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedFriend) return;

        const tempId = Date.now();
        const msgContent = newMessage;

        // Optimistic Update: Show immediately
        setMessages(prev => [...prev, {
            id: tempId,
            sender: user,
            receiver: selectedFriend,
            content: msgContent,
            created_at: new Date().toISOString()
        }]);
        setNewMessage('');

        try {
            await api.post('messages/', {
                receiver_id: selectedFriend.id,
                content: msgContent
            });
            // Result will be fetched in next poll
        } catch (err) {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "Failed to send message.";
            alert(`Error: ${errorMsg}`);
            console.error(err);
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setNewMessage(msgContent); // Restore text
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container glass-panel" style={{ height: 'calc(100vh - 100px)', display: 'flex', padding: 0, overflow: 'hidden', marginTop: '1rem' }}>
            {/* Sidebar - Friends List */}
            <div style={{ width: '300px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold' }}>
                    Messages
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {friends.length === 0 ? <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No friends yet.</p> : friends.map(friend => (
                        <div
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            style={{
                                padding: '1rem',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                cursor: 'pointer',
                                background: selectedFriend?.id === friend.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {friend.profile_pic ? <img src={`http://localhost:8000${friend.profile_pic.startsWith('/') ? '' : '/'}${friend.profile_pic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : friend.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{friend.first_name || friend.username}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click to chat</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                {selectedFriend ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {selectedFriend.profile_pic ? <img src={`http://localhost:8000${selectedFriend.profile_pic.startsWith('/') ? '' : '/'}${selectedFriend.profile_pic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedFriend.username[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 'bold' }}>{selectedFriend.first_name || selectedFriend.username}</span>
                        </div>

                        {/* Messages List */}
                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender.id === user.id;
                                return (
                                    <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '1rem',
                                            background: isMe ? 'var(--accent)' : 'var(--glass-bg)',
                                            color: 'white',
                                            borderTopRightRadius: isMe ? '0.2rem' : '1rem',
                                            borderTopLeftRadius: isMe ? '1rem' : '0.2rem'
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
                            <input
                                className="input-field"
                                placeholder="Type a message..."
                                style={{ borderRadius: '50px', padding: '0.75rem 1.5rem', flex: 1 }}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="btn-primary" style={{ borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={40} />
                        </div>
                        <h3>Select a friend to start knowing each other!</h3>
                    </div>
                )}
            </div>
        </div>
    );
};


export default Messages;
