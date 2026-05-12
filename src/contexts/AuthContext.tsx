import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/arrow';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from profiles table
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch error:', error.message);
        return null;
      }
      return data as unknown as Profile;
    } catch (err) {
      console.warn('Profile fetch exception:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) setProfile(p);
    }
  }, [user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Safety timeout: if Supabase doesn't respond in 10s, clear stale state and release
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth init timeout — clearing stale session data and releasing app.');
        // Clear potentially corrupted auth storage
        try {
          const storageKey = `sb-lsehzmqywlpzceyctwrr-auth-token`;
          localStorage.removeItem(storageKey);
        } catch (_) { /* ignore */ }
        setLoading(false);
      }
    }, 10000);

    async function init() {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Auth getSession error:', sessionError.message);
          // Clear stale data that may be causing the error
          try {
            const storageKey = `sb-lsehzmqywlpzceyctwrr-auth-token`;
            localStorage.removeItem(storageKey);
          } catch (_) { /* ignore */ }
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const p = await fetchProfile(currentSession.user.id);
            if (mounted) setProfile(p);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        // On critical failure, clear auth data to prevent persistent deadlocks
        try {
          const storageKey = `sb-lsehzmqywlpzceyctwrr-auth-token`;
          localStorage.removeItem(storageKey);
        } catch (_) { /* ignore */ }
        if (mounted) setLoading(false);
      }
    }

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Small delay to allow trigger to create profile
          if (event === 'SIGNED_IN') {
            await new Promise(r => setTimeout(r, 500));
          }
          const p = await fetchProfile(newSession.user.id);
          if (mounted) setProfile(p);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Translate common errors
      if (error.message.includes('Invalid login')) return { error: 'Email ou senha incorretos.' };
      if (error.message.includes('Email not confirmed')) return { error: 'Confirme seu email antes de fazer login.' };
      return { error: error.message };
    }
    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) return { error: 'Este email ja esta cadastrado.' };
      if (error.message.includes('rate limit')) return { error: 'Muitas tentativas. Aguarde alguns minutos.' };
      return { error: error.message };
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return { error: null, needsConfirmation: true };
    }

    return { error: null };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  async function updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    if (!user) return { error: 'Nao autenticado' };

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) return { error: error.message };

    // Refresh local profile
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);

    return { error: null };
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signInWithGoogle, signOut,
      updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
