import React, {
  createContext,
  useContext,
  useState,
} from 'react';

import {
  apiRequest,
  getStoredAdmin,
  storeSession,
  clearSession,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(getStoredAdmin());

  const login = async (email, password) => {
    try {
      const { ok, data } = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (ok && data?.success && data?.token && data?.admin) {
        storeSession(data.token, data.admin);
        setAdmin(data.admin);

        return { success: true };
      }

      return {
        success: false,
        message:
          data?.message ||
          `Login failed${data?.status ? ` (HTTP ${data.status})` : ''}.`,
      };
    } catch (error) {
      console.error('[VeriCure Auth] Login error:', error);

      return {
        success: false,
        message:
          'Unable to connect to the VeriCure backend. Please check that the backend is running.',
      };
    }
  };

  const logout = () => {
    clearSession();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
