-- Migration 003: Disable automatic profile creation
-- Perfis agora são criados apenas quando o usuário completa o cadastro na plataforma

-- Remove trigger automático de criação de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Adiciona campo para indicar se perfil foi completado
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Adiciona campo email para facilitar busca
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar índice para email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Atualizar RLS: Permitir que usuário autenticado crie seu próprio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Atualizar RLS: Permitir que usuário autenticado atualize seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.profile_completed IS 
'Indica se o usuário completou o cadastro na plataforma após comprar assinatura';

COMMENT ON COLUMN public.profiles.email IS 
'Email do usuário para facilitar busca (copiado de auth.users)';
