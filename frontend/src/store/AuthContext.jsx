import { createContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data.user; // Return user so caller can read role for redirect
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    // User is NOT logged in automatically upon registration
    return data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  /**
   * Returns the correct dashboard path based on user role.
   */
  const getDashboardPath = (role) => {
    if (role === 'teacher') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};