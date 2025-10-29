-- Migration 004: Fix RLS Policies and Permissions
-- Corrige os erros 403 (Forbidden) e 406 (Not Acceptable)
-- Execução: Pode rodar múltiplas vezes sem erro (idempotente)

-- ============================================
-- 1. MANGAS TABLE - Permitir INSERT/UPDATE para usuários autenticados
-- ============================================

-- Remover políticas antigas que podem estar conflitando
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read all mangas" ON mangas;
    DROP POLICY IF EXISTS "Users can insert mangas" ON mangas;
    DROP POLICY IF EXISTS "Users can update mangas" ON mangas;
    DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON mangas;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON mangas;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON mangas;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas corretas
CREATE POLICY "Enable read access for all authenticated users"
ON mangas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON mangas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON mangas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. FAVORITES TABLE - Permitir todas operações para o próprio usuário
-- ============================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 3. READING_PROGRESS TABLE - Permitir UPSERT para o próprio usuário
-- ============================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own progress" ON reading_progress;
    DROP POLICY IF EXISTS "Users can insert own progress" ON reading_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON reading_progress;
    DROP POLICY IF EXISTS "Users can view own progress" ON reading_progress;
    DROP POLICY IF EXISTS "Users can create progress" ON reading_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON reading_progress;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view own progress"
ON reading_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create progress"
ON reading_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON reading_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. PROFILES TABLE - Garantir que policies estão corretas
-- ============================================

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. COMMENTS TABLE - Se existir
-- ============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
        -- Remover todas as policies antigas
        EXECUTE 'DROP POLICY IF EXISTS "Users can read all comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can create comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own comments" ON comments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own comments" ON comments';

        -- Criar policies novas
        EXECUTE 'CREATE POLICY "Anyone can view comments" ON comments FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can delete own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- ============================================
-- 6. CONFIGURAR FOREIGN KEY NA TABELA READING_PROGRESS
-- ============================================

-- Adicionar foreign key se não existir
DO $$ 
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reading_progress_manga_id_fkey' 
        AND table_name = 'reading_progress'
    ) THEN
        ALTER TABLE reading_progress 
        ADD CONSTRAINT reading_progress_manga_id_fkey 
        FOREIGN KEY (manga_id) 
        REFERENCES mangas(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 7. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICAÇÃO: Ver todas as policies criadas
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
