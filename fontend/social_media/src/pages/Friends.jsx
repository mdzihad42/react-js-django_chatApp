import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Check, X, User } from 'lucide-react';

const Friends = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (user) {
            fetchFriendsData();
        }
    }, [user]);

    const fetchFriendsData = async () => {
        try {
            const [reqRes, suggRes, friendsRes] = await Promise.all([
                api.get('friends/'), // My requests
                api.get('users/suggestions/'),
                api.get('users/friends/')
            ]);

            // Filter only received requests
            const received = reqRes.data.filter(r => r.to_user.id === user.id && r.status === 'pending');
            setRequests(received);
            setSuggestions(suggRes.data);
            setFriends(friendsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAccept = async (reqId) => {
        try {
            await api.post(`friends/${reqId}/accept/`);
            setRequests(prev => prev.filter(r => r.id !== reqId));
            alert("Friend added!");
            fetchFriendsData(); // Refresh to update friend list
        } catch (err) {
            alert("Error accepting request");
        }
    };

    const handleRequest = async (userId) => {
        try {
            await api.post('friends/', { to_user_id: userId });
            setSuggestions(prev => prev.filter(u => u.id !== userId));
            alert("Request sent!");
        } catch (err) {
            alert("Failed");
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>My Friends</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {friends.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No friends yet.</p> : friends.map(f => (
                    <div key={f.id} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 0.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {f.profile_pic ? <img src={`http://localhost:8000${f.profile_pic.startsWith('/') ? '' : '/'}${f.profile_pic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : f.username[0].toUpperCase()}
                        </div>
                        <h4 style={{ margin: '0.5rem 0' }}>{f.username}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.first_name} {f.last_name}</div>
                    </div>
                ))}
            </div>

            <h2>Friend Requests</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {requests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p> : requests.map(req => (
                    <div key={req.id} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {req.from_user.username[0].toUpperCase()}
                        </div>
                        <h3>{req.from_user.username}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                            <button onClick={() => handleAccept(req.id)} className="btn-primary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={16} /> Confirm
                            </button>
                            <button className="glass" style={{ padding: '0.5rem', background: 'rgba(255,0,0,0.2)', border: 'none', color: 'white' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h2>People You May Know</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {suggestions.map(u => (
                    <div key={u.id} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--text-secondary)', margin: '0 auto 1rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {u.profile_pic ? <img src={`http://localhost:8000${u.profile_pic.startsWith('/') ? '' : '/'}${u.profile_pic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
                        </div>
                        <h3>{u.username}</h3>
                        <button onClick={() => handleRequest(u.id)} className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Add Friend</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Friends;
