-- Script para criar usuário autenticado via automação de assinatura
-- Execute este script quando um usuário comprar uma assinatura

-- PASSO 1: Gerar UUID para o novo usuário
-- Você pode usar gen_random_uuid() ou definir manualmente

-- PASSO 2: Criar usuário no sistema de autenticação
-- IMPORTANTE: Substitua os valores conforme necessário
-- - id: UUID único do usuário (copie de auth.users após criação via API de admin)
-- - email: email do comprador
-- - encrypted_password: hash bcrypt da senha gerada
-- - email_confirmed_at: NOW() para já confirmar o email

-- Exemplo de criação via Supabase Admin API (use isto na sua automação):
/*
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // ⚠️ Use service_role key, não anon key
)

async function createSubscriptionUser(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Confirma email automaticamente
    user_metadata: {
      subscription_date: new Date().toISOString(),
      ...metadata
    }
  })
  
  if (error) {
    console.error('Error creating user:', error)
    return null
  }
  
  console.log('User created:', data.user.id)
  return data.user
}

// Uso:
await createSubscriptionUser('cliente@email.com', 'senha_gerada_123', {
  subscription_plan: 'premium',
  subscription_id: 'stripe_sub_123'
})
*/

-- IMPORTANTE: Após criar o usuário via Admin API, ELE NÃO TERÁ PERFIL
-- O perfil será criado quando ele fizer login pela primeira vez e acessar /complete-profile

-- Para verificar usuários sem perfil completo:
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  p.username,
  p.profile_completed,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE 
  au.email_confirmed_at IS NOT NULL -- Usuário confirmado
  AND (p.id IS NULL OR p.profile_completed = false) -- Sem perfil ou perfil incompleto
ORDER BY au.created_at DESC;

-- Para verificar todos os usuários com perfil completo:
SELECT 
  au.email,
  p.username,
  p.display_name,
  p.profile_completed,
  p.created_at as profile_completed_at
FROM auth.users au
INNER JOIN public.profiles p ON p.id = au.id
WHERE p.profile_completed = true
ORDER BY p.created_at DESC;

-- Para limpar um usuário de teste (CUIDADO EM PRODUÇÃO):
/*
-- Substitua 'email@teste.com' pelo email do usuário
DELETE FROM public.profiles WHERE email = 'email@teste.com';
DELETE FROM auth.users WHERE email = 'email@teste.com';
*/

-- Exemplo de senha bcrypt (use bcrypt.hash() na sua automação):
-- Senha: 'TempPassword123!'
-- Hash: $2a$10$rT8L0O8Z5Yq5Q9Z5Z5Z5ZOGj8Q9Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5
-- ⚠️ NÃO use este hash em produção, é apenas exemplo

-- Fluxo completo da automação:
-- 1. Cliente compra assinatura no seu sistema
-- 2. Sistema gera senha aleatória segura
-- 3. Sistema chama Supabase Admin API para criar usuário autenticado
-- 4. Sistema envia email ao cliente com credenciais de acesso
-- 5. Cliente acessa plataforma, faz login
-- 6. Sistema redireciona para /complete-profile
-- 7. Cliente escolhe username e completa perfil
-- 8. Perfil marcado como profile_completed = true
-- 9. Cliente tem acesso total à plataforma
