import { supabase } from '../lib/supabase';

/**
 * Serviço de Autenticação com Supabase
 */

/**
 * Faz signup de novo usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha
 * @param {string} username - Nome de usuário único
 * @param {string} displayName - Nome de exibição
 */
export const signUp = async (email, password, username, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Faz login do usuário
 * @param {string} email - Email
 * @param {string} password - Senha
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

/**
 * Faz logout do usuário
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Obtém sessão atual do usuário
 * Supabase gerencia automaticamente: cache, refresh, expiração
 */
export const getSession = async () => {
  console.log('[getSession] Calling Supabase...');
  const { data, error } = await supabase.auth.getSession();
  console.log('[getSession] Response:', { hasData: !!data, hasError: !!error });
  
  if (error) {
    console.error('[getSession] Error:', error);
    return null;
  }
  
  console.log('[getSession] Session:', data.session ? 'EXISTS' : 'NULL');
  return data.session;
};

/**
 * Obtém usuário atual
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Atualiza senha do usuário
 * @param {string} newPassword - Nova senha
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
};

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do usuário
 */
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return data;
};

/**
 * Listener para mudanças no estado de autenticação
 * @param {Function} callback - Função executada quando auth muda
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
