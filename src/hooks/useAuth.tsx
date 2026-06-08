import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  viewMode: 'admin' | 'student';
  setViewMode: (mode: 'admin' | 'student') => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'student'>('student');

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    const adminStatus = !!data && !error;
    setIsAdmin(adminStatus);
    // Set view mode based on role
    if (adminStatus) {
      const savedMode = localStorage.getItem('viewMode') as 'admin' | 'student' | null;
      setViewMode(savedMode || 'admin');
    } else {
      setViewMode('student');
    }
    return adminStatus;
  }, []);

  const handleSetViewMode = useCallback((mode: 'admin' | 'student') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  }, []);

  const refreshRole = useCallback(async (): Promise<boolean> => {
    if (user) {
      return await checkAdminRole(user.id);
    }
    return false;
  }, [user, checkAdminRole]);

  useEffect(() => {
    let isMounted = true;
    let roleCheckTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRoleCheck = (userId: string) => {
      if (roleCheckTimer) clearTimeout(roleCheckTimer);
      roleCheckTimer = setTimeout(() => {
        if (!isMounted) return;
        checkAdminRole(userId)
          .catch(() => {
            if (!isMounted) return;
            setIsAdmin(false);
            setViewMode('student');
          })
          .finally(() => {
            if (!isMounted) return;
            setIsLoading(false);
          });
      }, 0);
    };

    // IMPORTANT: keep this callback synchronous to avoid auth deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        scheduleRoleCheck(session.user.id);
      } else {
        setIsAdmin(false);
        setViewMode('student');
        setIsLoading(false);
      }
    });

    // Then initialize from existing session
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          scheduleRoleCheck(session.user.id);
        } else {
          setIsAdmin(false);
          setViewMode('student');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      if (roleCheckTimer) clearTimeout(roleCheckTimer);
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      // Check admin status immediately after sign in
      const adminStatus = await checkAdminRole(data.user.id);
      return { error: null, isAdmin: adminStatus };
    }
    
    return { error };
  };

  const signOut = async () => {
    setIsAdmin(false);
    setViewMode('student');
    localStorage.removeItem('viewMode');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAdmin,
      viewMode,
      setViewMode: handleSetViewMode,
      signUp, 
      signIn, 
      signOut,
      refreshRole
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
