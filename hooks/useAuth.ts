'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as jose from 'jose';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // Get token from localStorage or cookies
  const getToken = useCallback((): string | null => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) return storedToken;
      
      // Fallback to cookies
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (cookieToken) {
        // Migrate to localStorage
        localStorage.setItem('authToken', cookieToken);
        return cookieToken;
      }
    }
    return null;
  }, []);

  // Set token in both localStorage and cookies for better compatibility
  const setAuthToken = useCallback((token: string | null) => {
    if (typeof window === 'undefined') return;
    
    if (token) {
      // Store in localStorage
      localStorage.setItem('authToken', token);
      
      // Also set cookie with proper attributes
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // 30 days
      
      document.cookie = `token=${token}; ` +
        `expires=${expires.toUTCString()}; ` +
        `path=/; ` +
        `${window.location.protocol === 'https:' ? 'Secure; ' : ''}` +
        `SameSite=Lax`;
    } else {
      // Clear both storage methods
      localStorage.removeItem('authToken');
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    setToken(token);
  }, []);

  // Get auth headers for API requests
  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [getToken]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        console.log('No token found');
        setUser(null);
        setToken(null);
        return false;
      }

      // Verify token with same configuration as backend
      const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET!);
      const { payload } = await jose.jwtVerify(currentToken, secret, {
        issuer: 'my-umkm',
        audience: 'user',
      });
      
      if (payload && payload.userId) {
        console.log('Token verified successfully', { userId: payload.userId });
        const userData = {
          id: payload.userId as string,
          email: payload.email as string,
          name: (payload.name as string) || 'User'
        };
        setUser(userData);
        setToken(currentToken);
        return true;
      }
      
      console.log('Token verification failed - invalid payload', { payload });
      setUser(null);
      setToken(null);
      return false;
    } catch (error) {
      console.error('Auth error:', error);
      // Clear invalid token
      setAuthToken(null);
      setUser(null);
      return false;
    }
  }, [getToken, setAuthToken]);

  // Check auth on mount and setup storage listener
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth verification error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Add event listener for storage changes (like from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        checkAuth().catch(console.error);
      }
    };
    
    // Initial auth check
    verifyAuth();
    
    // Set up storage event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      
      // Store the token from response if available
      if (data.token) {
        setAuthToken(data.token);
      }
      
      // Verify auth state after login
      await checkAuth();
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof Error ? error : new Error('Login failed');
    }
  };

  const logout = async () => {
    try {
      // Clear all auth-related data first
      setUser(null);
      setToken(null);
      
      // Clear all possible token storage locations
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('authToken');
        
        // Clear all cookies by setting expiration to past date
        document.cookie.split(';').forEach(c => {
          document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        
        // Clear sessionStorage as well
        sessionStorage.clear();
        
        // Trigger storage event to sync across tabs
        const logoutEvent = new Event('logout');
        window.dispatchEvent(logoutEvent);
      }
      
      // Call server-side logout
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.warn('Error during server logout:', err);
        // Continue with client-side cleanup even if server logout fails
      }
      
      // Force a hard redirect to ensure complete cleanup
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to redirect
      window.location.href = '/';
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    checkAuth,
    getAuthHeaders,
    getToken, // Export getToken for use in API calls
    token,
    isAuthenticated: !!user,
  };
}
