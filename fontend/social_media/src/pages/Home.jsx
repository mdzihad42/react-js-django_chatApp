import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { LogOut, Send, Search, Plus, Users, X, Image, Video, Smile, Trash2, EyeOff, MoreVertical, ArrowLeft } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [allUsers, setAllUsers] = useState([]);
    const [conversations, setConversations] = useState([]);

    // Group Modal
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

    // Initial Load
    // Initial Load & Polling for Status
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Active conversations
                const convRes = await api.get('messages/conversations/');
                // All users (for search)
                const usersRes = await api.get('users/');

                setConversations(convRes.data);
                setAllUsers(usersRes.data);

                // Update filtered items only if search is empty to avoid overwriting search results while typing
                setFilteredItems(prev => {
                    // This logic is a bit tied to search query, simplified:
                    // Only update if we want fresh data. 
                    // Actually, modifying 'conversations' state triggers the filter useEffect below,
                    // so we might not need to setFilteredItems here explicitly if we rely on that dependency.
                    // But the filter useEffect depends on [conversations, searchQuery].
                    // So just updating setConversations is enough!
                    return prev;
                });

            } catch (err) {
                console.error("Failed to load data", err);
            }
        };

        fetchUsers();
        const interval = setInterval(fetchUsers, 5000); // Poll every 5s for status updates
        return () => clearInterval(interval);
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredItems(conversations);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            // Filter users
            const users = allUsers.filter(u =>
                u.username.toLowerCase().includes(lowerQuery) ||
                (u.first_name && u.first_name.toLowerCase().includes(lowerQuery)) ||
                (u.last_name && u.last_name.toLowerCase().includes(lowerQuery))
            ).map(u => ({ ...u, type: 'user' })); // Ensure type set matches backend

            // Also keep matching groups from conversations?
            const groups = conversations.filter(c => c.type === 'group' && c.name.toLowerCase().includes(lowerQuery));

            setFilteredItems([...groups, ...users]);
        }
    }, [searchQuery, allUsers, conversations]);

    // Fetch Messages
    useEffect(() => {
        let interval;
        const fetchMessages = async () => {
            if (!selectedChat) return;
            try {
                const endpoint = selectedChat.type === 'group'
                    ? `messages/?group_id=${selectedChat.id}`
                    : `messages/?user_id=${selectedChat.id}`;

                const res = await api.get(endpoint);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to fetch messages");
            }
        };

        if (selectedChat) {
            fetchMessages();
            interval = setInterval(fetchMessages, 3000);
        }

        return () => clearInterval(interval);
    }, [selectedChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !selectedChat) return;

        const msgContent = newMessage;
        const tempId = Date.now();

        // Optimistic UI for text/image
        const optimisticMsg = {
            id: tempId,
            sender: user,
            receiver: selectedChat.type === 'user' ? selectedChat : null,
            content: msgContent,
            timestamp: new Date().toISOString(),
            image: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            video: file && file.type.startsWith('video/') ? URL.createObjectURL(file) : null
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        setFile(null);
        setShowEmojiPicker(false);

        const formData = new FormData();
        if (msgContent) formData.append('content', msgContent);
        if (file) {
            if (file.type.startsWith('image/')) formData.append('image', file);
            if (file.type.startsWith('video/')) formData.append('video', file);
        }

        if (selectedChat.type === 'group') {
            formData.append('group_id', selectedChat.id);
        } else {
            formData.append('receiver_id', selectedChat.id);
        }

        try {
            await api.post('messages/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh logic handled by interval or redundant fetch if needed
            // For now, let's rely on standard poll or lazy refresh to confirm ID
        } catch (err) {
            console.error("Send failed", err);
            alert("Failed to send");
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedGroupMembers.length === 0) {
            alert("Please provide a name and select members");
            return;
        }
        try {
            await api.post('groups/', {
                name: groupName,
                member_ids: selectedGroupMembers
            });
            setShowGroupModal(false);
            setGroupName('');
            setSelectedGroupMembers([]);
            alert("Group created! Refreshing...");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Failed to create group");
        }
    };

    const toggleMemberSelection = (id) => {
        if (selectedGroupMembers.includes(id)) {
            setSelectedGroupMembers(prev => prev.filter(m => m !== id));
        } else {
            setSelectedGroupMembers(prev => [...prev, id]);
        }
    };

    const handleUnsend = async (msgId) => {
        if (!window.confirm("Unsend this message for everyone?")) return;
        try {
            await api.post(`messages/${msgId}/unsend/`);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: 'Message unsent', image: null, video: null } : m));
        } catch (err) {
            console.error("Unsend failed", err);
            alert("Failed to unsend");
        }
    };

    const handleHide = async (msgId) => {
        if (!window.confirm("Delete this message for YOU only?")) return;
        try {
            await api.post(`messages/${msgId}/hide/`);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (err) {
            console.error("Hide failed", err);
            alert("Failed to hide");
        }
    };

    const formatLastActive = (dateString) => {
        if (!dateString) return 'Offline';
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / 60000);

        if (diffInMinutes < 1) return 'Active just now';
        if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
        return 'Offline'; // or date.toLocaleDateString()
    };

    const currentChatData = selectedChat ? (conversations.find(c => c.id === selectedChat.id && c.type === selectedChat.type)
        || allUsers.find(u => u.id === selectedChat.id && u.type === selectedChat.type)
        || selectedChat) : null;

    return (
        <div className="chat-page" style={{ padding: isMobile ? 0 : '1.5rem' }}>
            <div className="chat-container" style={{ borderRadius: isMobile ? 0 : '24px', height: isMobile ? '100vh' : '92vh', border: isMobile ? 'none' : undefined }}>
                {/* Sidebar */}
                {(!isMobile || !selectedChat) && (
                    <div className="sidebar" style={{ width: isMobile ? '100%' : '380px', position: 'relative', borderRight: isMobile ? 'none' : undefined }}>
                        <div className="sidebar-header">
                            <span>Chats</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowGroupModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} title="New Group">
                                    <Plus size={24} />
                                </button>
                                <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} title="Logout">
                                    <LogOut size={24} />
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Search size={18} style={{ position: 'absolute', left: '10px', color: '#9ca3af' }} />
                                <input
                                    style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '20px', border: '1px solid #e5e7eb', background: '#f9fafb', outline: 'none' }}
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus={!isMobile}
                                />
                            </div>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {filteredItems.map(item => {
                                const isGroup = item.type === 'group';
                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`user-item ${selectedChat?.id === item.id && selectedChat?.type === item.type ? 'active' : ''}`}
                                        onClick={() => setSelectedChat(item)}
                                    >
                                        <div className="avatar" style={{ background: isGroup ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : undefined, position: 'relative' }}>
                                            {isGroup ? <Users size={20} /> : (item.username?.[0].toUpperCase())}
                                            {item.type === 'user' && item.is_online && (
                                                <div style={{
                                                    position: 'absolute', bottom: 0, right: 0,
                                                    width: 14, height: 14, borderRadius: '50%',
                                                    backgroundColor: '#10b981', border: '2px solid white'
                                                }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937' }}>
                                                {isGroup ? item.name : (item.first_name || item.username)}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                                                {isGroup ? 'Group Chat' : (item.is_online ? 'Active now' : `@${item.username}`)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                {(!isMobile || selectedChat) && (
                    <div className="chat-area">
                        {selectedChat ? (
                            <>
                                <div className="chat-header">
                                    {isMobile && (
                                        <button onClick={() => setSelectedChat(null)} style={{ background: 'none', border: 'none', marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <ArrowLeft size={24} color="#333" />
                                        </button>
                                    )}
                                    <div className="avatar" style={{ width: 40, height: 40, fontSize: 16, background: currentChatData.type === 'group' ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : undefined, position: 'relative' }}>
                                        {currentChatData.type === 'group' ? <Users size={18} /> : currentChatData.username?.[0].toUpperCase()}
                                        {currentChatData.type === 'user' && currentChatData.is_online && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, right: 0,
                                                width: 12, height: 12, borderRadius: '50%',
                                                backgroundColor: '#10b981', border: '2px solid white'
                                            }} />
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1.2 }}>
                                            {currentChatData.type === 'group' ? currentChatData.name : (currentChatData.first_name || currentChatData.username)}
                                        </div>
                                        {currentChatData.type === 'user' && (
                                            <div style={{ fontSize: '0.8rem', color: currentChatData.is_online ? '#10b981' : '#9ca3af' }}>
                                                {currentChatData.is_online ? 'Active now' : formatLastActive(currentChatData.last_active)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="chat-messages">
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender.id === user.id;
                                        return (
                                            <div key={idx} className={`message-container ${isMe ? 'sent' : 'received'}`}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                                    <div className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                                                        {!isMe && selectedChat.type === 'group' && (
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '2px', color: '#555' }}>
                                                                {msg.sender.username}
                                                            </div>
                                                        )}
                                                        {msg.image && (
                                                            <img
                                                                src={msg.image.startsWith('blob:') || msg.image.startsWith('http') ? msg.image : `http://localhost:8000${msg.image}`}
                                                                alt="shared"
                                                                style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '5px' }}
                                                            />
                                                        )}
                                                        {msg.video && (
                                                            <video
                                                                src={msg.video.startsWith('blob:') || msg.video.startsWith('http') ? msg.video : `http://localhost:8000${msg.video}`}
                                                                controls
                                                                style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '5px' }}
                                                            />
                                                        )}
                                                        {msg.content && <div style={{ fontStyle: msg.content === 'Message unsent' ? 'italic' : 'normal', color: msg.content === 'Message unsent' ? '#888' : 'inherit' }}>{msg.content}</div>}
                                                    </div>

                                                    {msg.id && msg.content !== 'Message unsent' && (
                                                        <div style={{ position: 'relative' }}>
                                                            <button
                                                                onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, opacity: 0.5 }}
                                                            >
                                                                <MoreVertical size={16} color="#6b7280" />
                                                            </button>

                                                            {activeMenuId === msg.id && (
                                                                <div style={{
                                                                    position: 'absolute', top: '100%', [isMe ? 'right' : 'left']: 0,
                                                                    zIndex: 20, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', minWidth: '120px'
                                                                }}>
                                                                    {isMe && (
                                                                        <button
                                                                            onClick={() => { handleUnsend(msg.id); setActiveMenuId(null); }}
                                                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}
                                                                        >
                                                                            Unsend
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => { handleHide(msg.id); setActiveMenuId(null); }}
                                                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}
                                                                    >
                                                                        Delete for you
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="chat-input-area" style={{ position: 'relative' }}>
                                    {showEmojiPicker && (
                                        <div style={{ position: 'absolute', bottom: '80px', left: '20px', zIndex: 10 }}>
                                            <EmojiPicker onEmojiClick={(emojiObject) => setNewMessage(prev => prev + emojiObject.emoji)} />
                                        </div>
                                    )}

                                    <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>
                                            <Smile size={20} color="#666" />
                                        </button>

                                        <label style={{ cursor: 'pointer', marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                                            <Image size={20} color="#666" />
                                        </label>

                                        <label style={{ cursor: 'pointer', marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                                            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                                            <Video size={20} color="#666" />
                                        </label>

                                        <input
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            className="chat-input"
                                            placeholder={file ? `File selected: ${file.name}` : `Message ${selectedChat.type === 'group' ? selectedChat.name : (selectedChat.first_name || selectedChat.username)}...`}
                                        />
                                        <button type="submit" className="send-btn">
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af' }}>
                                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <Send size={40} color="#d1d5db" style={{ transform: 'rotate(-45deg)', marginLeft: -5 }} />
                                </div>
                                <h2 style={{ color: '#374151', marginBottom: '0.5rem' }}>Welcome to Chat</h2>
                                <p>Select a chat or create a group to start.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Group Modal */}
                {showGroupModal && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', width: '400px', maxWidth: '90%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Create Group</h3>
                                <button onClick={() => setShowGroupModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                            </div>

                            <input
                                className="input-field"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />

                            <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '5px' }}>
                                {conversations.filter(c => c.type === 'user').length === 0 ? (
                                    <div style={{ padding: '10px', color: '#999', textAlign: 'center' }}>No contacts found. Chat with someone first!</div>
                                ) : (
                                    conversations.filter(c => c.type === 'user').map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleMemberSelection(u.id)}
                                            style={{
                                                padding: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                                                cursor: 'pointer',
                                                background: selectedGroupMembers.includes(u.id) ? '#f0f9ff' : 'white'
                                            }}
                                        >
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #ccc', background: selectedGroupMembers.includes(u.id) ? 'blue' : 'white' }}></div>
                                            <span>{u.username}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button onClick={handleCreateGroup} className="btn-primary" style={{ marginTop: '1rem' }}>Create Group</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDashboard;
