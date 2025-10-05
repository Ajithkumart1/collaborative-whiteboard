import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 Checking auth...');
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    console.log('Token:', token);
    console.log('Saved user:', savedUser);

    if (token && savedUser) {
      try {
        console.log('📡 Making API call to /auth/me');
        const { data } = await api.get('/auth/me');
        console.log('✅ Auth successful:', data);
        setUser(data.user);
      } catch (error) {
        console.error('❌ Auth check failed:', error.response?.data || error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('ℹ️ No token or user found, staying logged out');
    }
    setLoading(false);
    console.log('✅ Loading complete');
  };

  const login = async (email, password) => {
    console.log('🔐 Attempting login...');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      console.log('✅ Login successful:', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    console.log('📝 Attempting registration...');
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      console.log('✅ Registration successful:', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};