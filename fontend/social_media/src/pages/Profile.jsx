import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../api';
import { Camera, ArrowLeft, Edit2, Phone, User, Grip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);

    // Edit Form & Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const profileInputRef = useRef(null);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        address: '',
        hobbies: '',
        phone: '' // Assuming we might want to add phone later, but using email for now
    });

    useEffect(() => {
        if (user) {
            setEditForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                bio: user.bio || '',
                address: user.address || '',
                hobbies: user.hobbies || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_pic', file);

        try {
            // FIXED: Removed manual 'Content-Type': 'multipart/form-data' header.
            // Axios automatically sets the correct Content-Type with boundary when passed a FormData object.
            await api.put('auth/profile/', formData);
            window.location.reload();
        } catch (err) {
            console.error("Upload failed", err);
            alert('Failed to update photo: ' + (err.response?.statusText || "Unknown error"));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(editForm).forEach(key => formData.append(key, editForm[key]));

        try {
            await api.put('auth/profile/', formData);
            window.location.reload();
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update profile");
        }
    };

    if (!user) return <div className="tg-loading">Loading...</div>;

    const profileImage = user.profile_pic
        ? `${BASE_URL}${user.profile_pic.startsWith('/') ? '' : '/'}${user.profile_pic}`
        : null;

    return (
        <div className="tg-profile-page">
            <input type="file" ref={profileInputRef} hidden onChange={handleFileUpload} accept="image/*" />

            {/* Top Navigation Bar */}
            <div className="tg-navbar">
                <button onClick={() => navigate('/')} className="tg-nav-btn">
                    <ArrowLeft size={24} />
                </button>
                <div className="tg-nav-spacer"></div>
                <button onClick={() => setShowEditModal(true)} className="tg-nav-btn">
                    <Edit2 size={24} />
                </button>
            </div>

            <div className="tg-container">
                {/* Profile Header (Avatar + Name) */}
                <div className="tg-header">
                    <div
                        className="tg-avatar-container"
                        onMouseEnter={() => setIsHoveringAvatar(true)}
                        onMouseLeave={() => setIsHoveringAvatar(false)}
                        onClick={() => profileInputRef.current.click()}
                    >
                        <div className="tg-avatar">
                            {profileImage ? <img src={profileImage} alt="Profile" /> : <span className="tg-avatar-text">{user.username[0].toUpperCase()}</span>}
                        </div>
                        {isHoveringAvatar && (
                            <div className="tg-avatar-overlay">
                                <Camera size={24} color="white" />
                            </div>
                        )}
                    </div>

                    <h1 className="tg-name">{user.first_name} {user.last_name || ''}</h1>
                    <p className="tg-status">{user.bio || 'online'}</p>
                </div>

                {/* Info List Section */}
                <div className="tg-info-list">
                    {/* Mobile / Email */}
                    <div className="tg-info-item">
                        <div className="tg-info-icon"><Phone size={22} /></div>
                        <div className="tg-info-content">
                            <div className="tg-info-value">{user.email || 'No email set'}</div>
                            <div className="tg-info-label">Mobile (Email)</div>
                        </div>
                    </div>

                    {/* Username */}
                    <div className="tg-info-item">
                        <div className="tg-info-icon"><User size={22} /></div>
                        <div className="tg-info-content">
                            <div className="tg-info-value">@{user.username}</div>
                            <div className="tg-info-label">Username</div>
                        </div>
                        <div className="tg-qr-icon"><Grip size={20} /></div>
                    </div>

                    {/* Address / Bio Extra */}
                    {user.address && (
                        <div className="tg-info-item">
                            <div className="tg-info-content" style={{ marginLeft: '42px' }}>
                                <div className="tg-info-value">{user.address}</div>
                                <div className="tg-info-label">Address</div>
                            </div>
                        </div>
                    )}
                    {user.hobbies && (
                        <div className="tg-info-item">
                            <div className="tg-info-content" style={{ marginLeft: '42px' }}>
                                <div className="tg-info-value">{user.hobbies}</div>
                                <div className="tg-info-label">Hobbies</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stories Placeholder */}
                <div className="tg-stories-section">
                    <div className="tg-stories-text">Your stories will be here.</div>
                </div>
            </div>

            {/* Edit Modal (Telegram Desktop Style) */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="tg-modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="tg-modal"
                        >
                            <div className="tg-modal-header">
                                <h3>Edit Profile</h3>
                                <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
                            </div>
                            <div className="tg-modal-body">
                                <div className="tg-input-group">
                                    <input
                                        className="tg-input"
                                        placeholder="First Name"
                                        value={editForm.first_name}
                                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                    />
                                    <label>First Name</label>
                                </div>
                                <div className="tg-input-group">
                                    <input
                                        className="tg-input"
                                        placeholder="Last Name"
                                        value={editForm.last_name}
                                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                    />
                                    <label>Last Name</label>
                                </div>
                                <div className="tg-input-group">
                                    <input
                                        className="tg-input"
                                        placeholder="Bio"
                                        value={editForm.bio}
                                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    />
                                    <label>Bio (Status)</label>
                                </div>
                                <div className="tg-input-group">
                                    <input
                                        className="tg-input"
                                        placeholder="Address"
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    />
                                    <label>Address</label>
                                </div>
                                <div className="tg-input-group">
                                    <input
                                        className="tg-input"
                                        placeholder="Hobbies"
                                        value={editForm.hobbies}
                                        onChange={e => setEditForm({ ...editForm, hobbies: e.target.value })}
                                    />
                                    <label>Hobbies</label>
                                </div>
                            </div>
                            <div className="tg-modal-footer">
                                <button className="tg-cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button className="tg-save-btn" onClick={handleProfileUpdate}>Save</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
