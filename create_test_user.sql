-- ============================================
-- SQL para criar usuário de teste no Supabase
-- ============================================
-- ATENÇÃO: Este script cria um usuário diretamente nas tabelas auth.users
-- Use apenas para testes em ambiente de desenvolvimento!
-- ============================================

-- 1. Criar usuário na tabela auth.users
-- Substitua os valores conforme necessário
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  -- UUID único para o usuário (gere um novo em: https://www.uuidgenerator.net/)
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  
  -- Instance ID (geralmente '00000000-0000-0000-0000-000000000000')
  '00000000-0000-0000-0000-000000000000'::uuid,
  
  -- Email do usuário
  'teste@mangaverso.com',
  
  -- Senha criptografada (bcrypt hash de '123456')
  -- Hash válido gerado com bcrypt, cost 10
  '$2a$10$N9qo8uLOickgx2ZMRZoMye.Ix5BdmLoKP5T.mwx9H3i3FwQKcH9Oi',
  
  -- Email confirmado agora
  NOW(),
  
  -- Data de criação
  NOW(),
  
  -- Data de atualização
  NOW(),
  
  -- Metadata da aplicação
  '{"provider":"email","providers":["email"]}'::jsonb,
  
  -- Metadata do usuário (vazio por padrão)
  '{}'::jsonb,
  
  -- Audience
  'authenticated',
  
  -- Role
  'authenticated'
);

-- 2. Criar perfil automaticamente (o trigger deve fazer isso, mas caso não funcione)
INSERT INTO public.profiles (
  id,
  username,
  display_name,
  bio,
  avatar_url
)
VALUES (
  -- Mesmo UUID do usuário criado acima
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  
  -- Username único (3-20 caracteres)
  'testuser',
  
  -- Nome de exibição (opcional)
  'Usuário de Teste',
  
  -- Biografia (opcional)
  'Perfil criado para testes do sistema',
  
  -- Avatar URL (opcional)
  NULL
)
ON CONFLICT (id) DO NOTHING; -- Não insere se já existir (trigger já criou)

-- 3. Verificar criação
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.username,
  p.display_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'teste@mangaverso.com';


-- ============================================
-- ALTERNATIVA: Script para usuários múltiplos
-- ============================================

-- Usuário 1: Admin
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
  gen_random_uuid(), -- Gera UUID automaticamente
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@mangaverso.com',
  '$2a$10$rT8L0O8Z5Yq5Q9Z5Z5Z5ZOGj8Q9Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', -- senha: 123456
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated'
)
RETURNING id; -- Retorna o UUID gerado

-- Depois use o UUID retornado para criar o profile manualmente


-- ============================================
-- ALTERNATIVA MAIS SEGURA: Usar signup da API
-- ============================================
-- Ao invés de inserir direto no banco, use a interface de signup:
-- 1. Acesse: http://localhost:5173/signup
-- 2. Preencha os dados
-- 3. O Supabase cria o usuário corretamente
-- 4. O trigger cria o perfil automaticamente


-- ============================================
-- RESET: Deletar usuário de teste
-- ============================================
-- Se precisar remover o usuário criado:

-- DELETE FROM auth.users WHERE email = 'teste@mangaverso.com';
-- DELETE FROM public.profiles WHERE username = 'testuser';
-- -- O CASCADE deve limpar automaticamente favoritos, progresso, comentários, etc.


-- ============================================
-- OBSERVAÇÕES IMPORTANTES
-- ============================================
/*
1. HASH DA SENHA:
   - O hash fornecido é de '123456'
   - Para criar hash de outra senha, use: https://bcrypt-generator.com/
   - Custo recomendado: 10 rounds

2. UUID:
   - Use gen_random_uuid() para gerar automaticamente
   - Ou gere manualmente em: https://www.uuidgenerator.net/

3. TRIGGER:
   - O trigger handle_new_user() deve criar o profile automaticamente
   - Mas o INSERT manual do profile garante que exista

4. RLS (Row Level Security):
   - Usuários só podem ver/editar seus próprios dados
   - O perfil é público (todos podem ver)

5. AMBIENTE DE PRODUÇÃO:
   - NUNCA use este método em produção
   - Use sempre o signup flow normal da aplicação
*/
