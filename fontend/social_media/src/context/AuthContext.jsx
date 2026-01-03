import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const res = await api.get('auth/me/');
                setUser(res.data);
            } catch (error) {
                console.error("Auth check failed", error);
                logout();
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = async (username, password) => {
        const res = await api.post('auth/login/', { username, password });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        await checkUser();
    };

    const register = async (userData) => {
        await api.post('auth/register/', userData);
        await login(userData.username, userData.password);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
