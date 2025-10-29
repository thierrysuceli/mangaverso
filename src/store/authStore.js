import { create } from 'zustand';
import * as authService from '../services/authService';
import * as dbService from '../services/databaseService';

/**
 * Auth Store - Global authentication state
 * Supabase handles session persistence automatically
 */
// Flag para prevenir múltiplas chamadas simultâneas
let isInitializing = false;

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isLoggedIn: false,
  profileCompleted: false,

  // Initialize auth state
  initialize: async () => {
    // Se já está inicializando, ignora
    if (isInitializing) {
      console.log('[INIT] BLOCKED - Already initializing');
      return;
    }
    
    console.log('[INIT] START');
    isInitializing = true;
    set({ isLoading: true });
    
    try {
      console.log('[INIT] Getting session...');
      const session = await authService.getSession();
      console.log('[INIT] Session result:', session ? 'EXISTS' : 'NULL');
      
      if (session?.user) {
        console.log('[INIT] User found, loading profile...');
        let profile = null;
        let profileCompleted = false;
        
        try {
          profile = await dbService.getProfile(session.user.id);
          profileCompleted = profile?.profile_completed || false;
          console.log('[INIT] Profile loaded:', profileCompleted);
        } catch (error) {
          console.log('[INIT] Profile error:', error.message);
        }
        
        console.log('[INIT] Setting logged state...');
        set({
          user: session.user,
          profile,
          session,
          isLoggedIn: true,
          profileCompleted,
          isLoading: false,
        });
        console.log('[INIT] DONE - LOGGED IN');
      } else {
        console.log('[INIT] No session, setting logged out state...');
        set({
          user: null,
          profile: null,
          session: null,
          isLoggedIn: false,
          profileCompleted: false,
          isLoading: false,
        });
        console.log('[INIT] DONE - LOGGED OUT');
      }
    } catch (error) {
      console.error('[INIT] ERROR:', error);
      set({
        user: null,
        profile: null,
        session: null,
        isLoggedIn: false,
        profileCompleted: false,
        isLoading: false,
      });
      console.log('[INIT] DONE - ERROR STATE');
    } finally {
      // SEMPRE libera a trava no final
      isInitializing = false;
      console.log('[INIT] Released lock');
    }
  },

  // Sign up
  signUp: async (email, password, username, displayName) => {
    const { user } = await authService.signUp(email, password, username, displayName);
    // NÃO chama initialize aqui - o listener SIGNED_IN vai chamar
    return { user };
  },

  // Sign in
  signIn: async (email, password) => {
    const { user, session } = await authService.signIn(email, password);
    
    // Atualizar estado imediatamente após login bem-sucedido
    if (user && session) {
      console.log('[SIGN_IN] Login successful, fetching profile...');
      
      const profile = await dbService.getProfile(user.id);
      
      set({
        user,
        session,
        profile,
        isLoggedIn: true,
        profileCompleted: profile?.profile_completed || false,
        isLoading: false,
      });
      
      console.log('[SIGN_IN] Profile loaded:', {
        username: profile?.username,
        profileCompleted: profile?.profile_completed
      });
    }
    
    return { user, session };
  },

  // Sign out
  signOut: async () => {
    await authService.signOut();
    set({
      user: null,
      profile: null,
      session: null,
      isLoggedIn: false,
      profileCompleted: false,
    });
  },

  // Update profile
  updateProfile: async (updates) => {
    const userId = get().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const updatedProfile = await dbService.updateProfile(userId, updates);
    set({ 
      profile: updatedProfile,
      profileCompleted: updatedProfile?.profile_completed || false,
    });
    return updatedProfile;
  },

  // Refresh profile
  refreshProfile: async () => {
    const userId = get().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    const profile = await dbService.getProfile(userId);
    set({ 
      profile,
      profileCompleted: profile?.profile_completed || false,
    });
    return profile;
  },

  // Update password
  updatePassword: async (newPassword) => {
    await authService.updatePassword(newPassword);
  },

  // Setup auth listener
  setupAuthListener: () => {
    return authService.onAuthStateChange(async (event, session) => {
      console.log('[LISTENER] Event:', event);
      
      // APENAS atualiza o estado, NÃO chama initialize
      if (event === 'SIGNED_OUT') {
        console.log('[LISTENER] User signed out, clearing state');
        set({
          user: null,
          profile: null,
          session: null,
          isLoggedIn: false,
          profileCompleted: false,
        });
      }
      // Ignora SIGNED_IN - o initialize já cuidou disso
    });
  },
}));
