import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

type DevUser = {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role?: string;
  };
};

export function useAuth() {
  const [user, setUser] = useState<User | DevUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkDevLogin = () => {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    if (userId && userEmail) {
      console.log('Using development login from localStorage');
      
      const devUUID = '00000000-0000-0000-0000-000000000000';
      
      return {
        id: userId === 'dev-user-id' ? devUUID : userId,
        email: userEmail,
        user_metadata: {
          name: userName || 'Development User',
          role: localStorage.getItem('userRole') || 'user',
        },
      } as DevUser;
    }
    
    return null;
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        const supabaseUser = data.session?.user ?? null;
        
        const devUser = supabaseUser ? null : checkDevLogin();
        
        setUser(supabaseUser || devUser);
      } catch (error) {
        console.error('Error getting initial session:', error);
        
        const devUser = checkDevLogin();
        setUser(devUser);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        
        const supabaseUser = session?.user ?? null;
        
        const devUser = supabaseUser ? null : checkDevLogin();
        
        setUser(supabaseUser || devUser);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
}
