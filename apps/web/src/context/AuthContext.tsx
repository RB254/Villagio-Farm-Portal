import React, { createContext, useContext, useState, useEffect } from 'react';
import { Farmer } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  farmer: Farmer | null;
  admin: { id: number; username: string; role: string } | null;
  token: string | null;
  adminToken: string | null;
  login: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  adminLogout: () => void;
  refreshFarmer: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farmer, setFarmer] = useState<Farmer | null>(() => {
    const saved = localStorage.getItem('villagio_farmer_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [admin, setAdmin] = useState<{ id: number; username: string; role: string } | null>(() => {
    const savedAdmin = localStorage.getItem('villagio_admin_user');
    if (savedAdmin) {
      try { return JSON.parse(savedAdmin); } catch { return null; }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('villagio_token'));
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('villagio_admin_token'));
  const [loading, setLoading] = useState(false);

  const refreshFarmer = async () => {
    if (!token) {
      setFarmer(null);
      return;
    }
    const res = await api.getMe();
    if (res.success && res.data) {
      setFarmer(res.data);
      localStorage.setItem('villagio_farmer_user', JSON.stringify(res.data));
    }
  };

  const login = async (phone: string, pin: string) => {
    setLoading(true);
    const res = await api.login(phone, pin);
    setLoading(false);
    if (res.success && res.data) {
      localStorage.setItem('villagio_token', res.data.token);
      localStorage.setItem('villagio_farmer_user', JSON.stringify(res.data.farmer));
      setToken(res.data.token);
      setFarmer(res.data.farmer);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const adminLogin = async (username: string, pin: string) => {
    setLoading(true);
    const res = await api.adminLogin(username, pin);
    setLoading(false);
    if (res.success && res.data) {
      localStorage.setItem('villagio_admin_token', res.data.token);
      localStorage.setItem('villagio_admin_user', JSON.stringify(res.data.admin));
      setAdminToken(res.data.token);
      setAdmin(res.data.admin);
      return { success: true };
    }
    return { success: false, error: res.error || 'Admin login failed' };
  };

  const logout = () => {
    localStorage.removeItem('villagio_token');
    localStorage.removeItem('villagio_farmer_user');
    setToken(null);
    setFarmer(null);
  };

  const adminLogout = () => {
    localStorage.removeItem('villagio_admin_token');
    localStorage.removeItem('villagio_admin_user');
    setAdminToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        farmer,
        admin,
        token,
        adminToken,
        login,
        adminLogin,
        logout,
        adminLogout,
        refreshFarmer,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
