import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Users, Bell, User, Cpu } from 'lucide-react';
import '../index.css';

const Navbar = ({ onChatToggle }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const location = useLocation();

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            alert(`Searching for: ${searchText} (Real-time search to be implemented)`);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass" style={{
            position: 'sticky', top: 0, zIndex: 100, padding: '0 1rem',
            borderBottom: '1px solid var(--glass-border)',
            background: 'var(--bg-card)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: '56px'
        }}>
            <div style={{ maxWidth: '1920px', margin: '0 auto', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                {/* Left: Logo & Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/" onClick={() => window.location.href = '/'} style={{ textDecoration: 'none', color: '#2d88ff', fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <svg viewBox="0 0 36 36" fill="currentColor" height="40" width="40"><path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.442 5.811 15.526 13.652 17.471L14 27.435v-9.177h-3.48v-4.09h3.48v-2.914c0-3.321 1.956-5.184 5.043-5.184 1.481 0 3.024.264 3.024.264v3.315h-1.706c-1.649 0-2.162 1.025-2.162 2.078v2.441h3.729l-.6 4.09h-3.13v10.158c2.481-1.353 4.908-2.607 4.987-2.607z"></path></svg>
                    </Link>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#b0b3b8' }}>
                            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" /></svg>
                        </div>
                        <input
                            className="input-field"
                            placeholder="Search Facebook"
                            style={{
                                paddingLeft: '2.5rem',
                                background: '#3a3b3c',
                                width: '240px',
                                height: '40px'
                            }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>

                {/* Center: Navigation Icons */}
                <div style={{ display: 'flex', gap: '0.5rem', height: '100%' }}>
                    <NavLink to="/" icon={<Home size={28} />} active={isActive('/')} />
                    <NavLink to="/friends" icon={<Users size={28} />} active={isActive('/friends')} />
                    <NavLink to="/video" icon={<div style={{ border: '2px solid currentColor', borderRadius: '4px', width: '24px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>} active={isActive('/video')} />
                    <NavLink to="/marketplace" icon={<div style={{ width: '24px', height: '24px', background: 'currentColor', clipPath: 'polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)' }}></div>} active={isActive('/marketplace')} />
                </div>

                {/* Right: Actions & Profile */}
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <div className="icon-circle" onClick={() => alert("Menu")}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', width: '20px' }}>
                            {[...Array(9)].map((_, i) => <div key={i} style={{ width: '4px', height: '4px', background: 'var(--text-primary)', borderRadius: '50%' }}></div>)}
                        </div>
                    </div>
                    <Link to="/messages" className="icon-circle" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <MessageCircle size={20} />
                    </Link>
                    <div className="icon-circle" onClick={() => alert("Notifications")}>
                        <Bell size={20} />
                    </div>
                    <button onClick={onChatToggle} className="icon-circle" style={{ background: 'linear-gradient(45deg, #FF3BFF, #ECBFBF)', border: 'none' }}>
                        <Cpu size={20} color="black" />
                    </button>

                    {/* User Dropdown */}
                    <div
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'hidden' }}>
                            <User size={24} />
                        </div>

                        {showDropdown && (
                            <div
                                className="glass-panel"
                                style={{
                                    position: 'absolute', top: '120%', right: 0, width: '300px', padding: '1rem',
                                    display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    zIndex: 200
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '0.5rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <User size={24} />
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>My Profile</div>
                                </div>
                                <hr style={{ borderColor: 'var(--glass-border)', margin: '0.5rem 0' }} />
                                <Link to="/profile" style={{ textDecoration: 'none', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hover-bg">
                                    <User size={20} /> See your profile
                                </Link>
                                <div className="hover-bg" style={{ padding: '0.5rem', borderRadius: '0.25rem', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>⚙️</span> Settings & Privacy
                                </div>
                                <div className="hover-bg" style={{ padding: '0.5rem', borderRadius: '0.25rem', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>❓</span> Help & Support
                                </div>
                                <div className="hover-bg" style={{ padding: '0.5rem', borderRadius: '0.25rem', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>🌙</span> Display & Accessibility
                                </div>
                                <div className="hover-bg" style={{ padding: '0.5rem', borderRadius: '0.25rem', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>🚪</span> Log Out
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, icon, active }) => (
    <Link to={to} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', color: active ? 'var(--accent)' : 'var(--text-secondary)',
        height: '100%', padding: '0 2.5rem',
        borderBottom: active ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'all 0.2s ease',
        borderRadius: '8px 8px 0 0'
    }} className={!active ? "hover-bg" : ""}>
        {icon}
    </Link>
);

export default Navbar;
