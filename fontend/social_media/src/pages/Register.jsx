import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Info } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: ''
    });
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError('Registration failed. Profile already exists or check details.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-shape auth-shape-1" />
            <div className="auth-shape auth-shape-2" />

            <form onSubmit={handleSubmit} className="auth-box" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <h2>Join Us</h2>
                    <p>Create your account and start connecting</p>
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
                    <input className="input-field" type="text" name="username" placeholder="Username" onChange={handleChange} required />
                    <User className="input-icon" size={20} />
                </div>

                <div className="input-group">
                    <input className="input-field" type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
                    <Mail className="input-icon" size={20} />
                </div>

                <div className="input-group">
                    <input className="input-field" type="password" name="password" placeholder="Password" onChange={handleChange} required />
                    <Lock className="input-icon" size={20} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <input className="input-field" type="text" name="first_name" placeholder="First Name" onChange={handleChange} style={{ paddingLeft: '40px' }} />
                        <Info className="input-icon" size={18} style={{ left: '12px' }} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <input className="input-field" type="text" name="last_name" placeholder="Last Name" onChange={handleChange} style={{ paddingLeft: '40px' }} />
                        <Info className="input-icon" size={18} style={{ left: '12px' }} />
                    </div>
                </div>

                <button type="submit" className="btn-primary">Sign Up</button>

                <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Already have an account? <Link to="/login" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
                </div>
            </form>
        </div>
    );
};

export default Register;
