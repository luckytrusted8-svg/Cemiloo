'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  role: 'owner' | 'staff';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isSupabaseLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: 'owner-cemiloo-1',
    email: 'owner@cemiloo.com',
    role: 'owner',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      setIsLoading(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'owner@cemiloo.com',
            role: 'owner',
          });
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'owner@cemiloo.com',
            role: 'owner',
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password = ''): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }
        return true;
      } else {
        // Fallback local owner login
        setUser({
          id: 'owner-cemiloo-1',
          email: email.trim(),
          role: 'owner',
        });
        return true;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isSupabaseLive: isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
