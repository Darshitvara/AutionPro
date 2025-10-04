import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing token on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify token is still valid
                    const response = await authAPI.verify();
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token is invalid
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const register = async (username, email, password) => {
        try {
            const response = await authAPI.register(username, email, password);
            
            if (response.success) {
                const { token, user } = response;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setToken(token);
                setUser(user);
                setIsAuthenticated(true);
                toast.success('Registration successful!');
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            
            if (response.success) {
                const { token, user } = response;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setToken(token);
                setUser(user);
                setIsAuthenticated(true);
                toast.success(`Welcome back, ${user.username}!`);
                return { success: true };
            }
        } catch (error) {
            let message = 'Login failed';
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                message = 'Invalid username or password';
            } else if (error.response?.status === 400) {
                message = error.response?.data?.error || 'Please check your email and password';
            } else if (error.response?.data?.error) {
                message = error.response.data.error;
            } else if (!navigator.onLine) {
                message = 'Network error. Please check your connection';
            }
            
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
