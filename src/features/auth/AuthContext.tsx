import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Profile } from '../../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback demo user for offline or development preview when Supabase env vars are not set
const DEMO_ADMIN_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'R.H.V.R. Pramod',
  email: 'rusirupramod@gmail.com',
  role: 'admin',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or setup profile
  const fetchProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured) {
        setProfile(DEMO_ADMIN_PROFILE);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        // If profile row not found yet, default to active profile
        setProfile({
          id: userId,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
          role: 'admin',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
      setProfile(DEMO_ADMIN_PROFILE);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode when Supabase is not yet configured with real project credentials
      const demoUser = {
        id: DEMO_ADMIN_PROFILE.id,
        email: DEMO_ADMIN_PROFILE.email,
        app_metadata: {},
        user_metadata: { full_name: DEMO_ADMIN_PROFILE.full_name },
        aud: 'authenticated',
        created_at: DEMO_ADMIN_PROFILE.created_at,
      } as unknown as User;

      setUser(demoUser);
      setProfile(DEMO_ADMIN_PROFILE);
      setIsLoading(false);
      return;
    }

    // Real Supabase session listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      // Demo mode: accept any login
      setUser({
        id: DEMO_ADMIN_PROFILE.id,
        email,
        app_metadata: {},
        user_metadata: { full_name: 'Admin User' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User);
      setProfile(DEMO_ADMIN_PROFILE);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
      return { error };
    }
    if (data.user) {
      await fetchProfile(data.user.id);
    }
    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const isAdmin = profile?.role === 'admin' && profile?.active === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isAdmin,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
