import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Camera, MapPin, Calendar, Users, Grid, MessageCircle, MoreHorizontal, ThumbsUp, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user, login } = useContext(AuthContext); // Need refresh user logic really
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState(null);
    const postImageInputRef = useRef(null);

    // Profile Edit States
    const [profilePic, setProfilePic] = useState(null);
    const [coverPic, setCoverPic] = useState(null);
    const profileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Comment States
    const [activeCommentBox, setActiveCommentBox] = useState(null); // ID of post to show comments for
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        if (user) {
            fetchUserPosts();
        }
    }, [user]);

    const fetchUserPosts = async () => {
        try {
            const res = await api.get(`posts/?username=${user.username}`);
            setPosts(res.data);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoadingPosts(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        if (type === 'profile') formData.append('profile_pic', file);
        if (type === 'cover') formData.append('cover_pic', file);

        try {
            await api.put('auth/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            window.location.reload(); // Simple reload to refresh user data context
        } catch (err) {
            alert('Failed to update photo');
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !newPostImage) return;

        const formData = new FormData();
        formData.append('content', newPostContent);
        if (newPostImage) formData.append('image', newPostImage);

        try {
            await api.post('posts/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewPostContent('');
            setNewPostImage(null);
            fetchUserPosts();
        } catch (err) {
            alert('Failed to create post');
        }
    };

    const handleLike = async (postId) => {
        try {
            await api.post(`posts/${postId}/like/`);
            fetchUserPosts(); // Refresh to show new like count
        } catch (err) {
            console.error("Like failed");
        }
    };

    const handleCommentClick = (postId) => {
        if (activeCommentBox === postId) {
            setActiveCommentBox(null);
        } else {
            setActiveCommentBox(postId);
            setCommentText('');
        }
    };

    const submitComment = async (postId) => {
        if (!commentText.trim()) return;
        try {
            await api.post(`posts/${postId}/comment/`, { content: commentText });
            setCommentText('');
            fetchUserPosts(); // Refresh to show new comment
        } catch (err) {
            console.error("Comment failed");
        }
    };

    if (!user) return <div>Loading...</div>;

    const coverImage = user.cover_pic ? `http://localhost:8000${user.cover_pic.startsWith('/') ? '' : '/'}${user.cover_pic}` : 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';
    const profileImage = user.profile_pic ? `http://localhost:8000${user.profile_pic.startsWith('/') ? '' : '/'}${user.profile_pic}` : null;

    return (
        <div style={{ maxWidth: '940px', margin: '0 auto', color: 'var(--text-primary)' }}>

            {/* Hidden Inputs for File Upload */}
            <input type="file" ref={profileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'profile')} accept="image/*" />
            <input type="file" ref={coverInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" />

            {/* Header / Cover Section */}
            <div className="glass-panel" style={{ borderRadius: '0 0 1rem 1rem', overflow: 'hidden', borderTop: 'none' }}>
                <div style={{
                    height: '350px',
                    backgroundImage: `url(${coverImage})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    position: 'relative',
                    cursor: 'pointer'
                }} onClick={() => coverInputRef.current.click()}>
                    <button className="btn-primary" style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 10 }}>
                        <Camera size={18} /> Edit Cover Photo
                    </button>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }}></div>
                </div>

                <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-3rem' }}>
                        {/* Profile Pic */}
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => profileInputRef.current.click()}>
                            <div style={{
                                width: '168px', height: '168px', borderRadius: '50%',
                                border: '4px solid var(--bg-dark)',
                                background: 'var(--bg-card)',
                                backgroundImage: profileImage ? `url(${profileImage})` : 'none',
                                backgroundSize: 'cover',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '4rem', fontWeight: 'bold'
                            }}>
                                {!profileImage && user.username[0].toUpperCase()}
                            </div>
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--glass-border)' }}>
                                <Camera size={20} />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button className="btn-primary">
                                <span style={{ marginRight: '0.5rem' }}>+</span> Add to Story
                            </button>
                            <button className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: 'white' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Edit Bio</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <h1 style={{ fontSize: '2rem', margin: 0 }}>{user.first_name} {user.last_name}</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>@{user.username}</p>
                        <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{user.bio || "No bio added."}</p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '2rem', paddingTop: '1rem', display: 'flex', gap: '2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)', paddingBottom: '1rem' }}>Posts</span>
                        <span>About</span>
                        <span>Friends</span>
                        <span>Photos</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginTop: '1rem' }}>

                {/* Left Column: Intro */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <h3>Intro</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
                            <MapPin size={18} /> Lives in <b>{user.city || "Dhaka, Bangladesh"}</b>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
                            <Calendar size={18} /> Joined {new Date().getFullYear()}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Photos</h3>
                            <span style={{ color: 'var(--accent)' }}>See all</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
                            {/* Placeholders */}
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Create Post */}
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {profileImage ? <img src={profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username[0].toUpperCase()}
                            </div>
                            <input
                                className="input-field"
                                placeholder={`What's on your mind, ${user.first_name}?`}
                                style={{ borderRadius: '50px' }}
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => postImageInputRef.current.click()} style={{ background: 'none', border: 'none', color: '#10b981', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                    <Camera size={20} /> Photo/Video
                                </button>
                                <input type="file" ref={postImageInputRef} style={{ display: 'none' }} onChange={(e) => setNewPostImage(e.target.files[0])} accept="image/*" />
                            </div>
                            <button onClick={handleCreatePost} className="btn-primary" style={{ padding: '0.4rem 1.5rem' }}>Post</button>
                        </div>
                        {newPostImage && <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--accent)' }}>Image selected: {newPostImage.name}</div>}
                    </div>

                    {/* Posts List */}
                    {loadingPosts ? <p>Loading posts...</p> : posts.length === 0 ? <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>No posts yet.</div> : (
                        posts.map(post => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={post.id} className="glass-panel" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {post.user.profile_pic ? <img src={`http://localhost:8000${post.user.profile_pic.startsWith('/') ? '' : '/'}${post.user.profile_pic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (post.user.username ? post.user.username[0].toUpperCase() : 'U')}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{post.user.first_name || post.user.username} {post.user.last_name || ''}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <MoreHorizontal size={20} color="var(--text-secondary)" />
                                </div>

                                <p style={{ marginBottom: '1rem' }}>{post.content}</p>
                                {post.image && <img src={post.image} alt="post" style={{ width: '100%', borderRadius: '0.5rem', marginBottom: '1rem' }} />}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    <span>{post.likes_count} Likes</span>
                                    <span>{post.comments.length} Comments</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', marginBottom: activeCommentBox === post.id ? '1rem' : '0' }}>
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        style={{ background: 'none', border: 'none', color: post.is_liked ? 'var(--accent)' : 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <ThumbsUp size={18} /> Like
                                    </button>
                                    <button
                                        onClick={() => handleCommentClick(post.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <MessageCircle size={18} /> Comment
                                    </button>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                        <Share2 size={18} /> Share
                                    </button>
                                </div>

                                {/* Comment Section */}
                                {activeCommentBox === post.id && (
                                    <div className="fade-in" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                        {/* Existing Comments */}
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {post.comments.map(comment => (
                                                <div key={comment.id} style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--text-secondary)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {comment.user.profile_pic ? <img src={`http://localhost:8000${comment.user.profile_pic.startsWith('/') ? '' : '/'}${comment.user.profile_pic}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : comment.user.username[0].toUpperCase()}
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{comment.user.username}</div>
                                                        <div>{comment.content}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Input */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {user.username[0].toUpperCase()}
                                            </div>
                                            <input
                                                className="input-field"
                                                style={{ borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                placeholder="Write a comment..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
