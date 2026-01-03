import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-shape auth-shape-1" />
            <div className="auth-shape auth-shape-2" />

            <form onSubmit={handleSubmit} className="auth-box">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Enter your details to access your account</p>
                </div>

                {error && (
                    <div style={{
                        color: '#ef4444',
                        backgroundColor: '#fef2f2',
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        border: '1px solid #fee2e2'
                    }}>
                        {error}
                    </div>
                )}

                <div className="input-group">
                    <input
                        className="input-field"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <User className="input-icon" size={20} />
                </div>

                <div className="input-group">
                    <input
                        className="input-field"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Lock className="input-icon" size={20} />
                </div>

                <button type="submit" className="btn-primary">Sign In</button>

                <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#64748b', marginTop: '0.5rem' }}>
                    New here? <Link to="/register" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>Create an account</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
