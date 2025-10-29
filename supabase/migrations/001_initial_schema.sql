-- =====================================================
-- MIGRATION 001: Initial Schema
-- Criação das tabelas principais do sistema
-- =====================================================

-- 1. Tabela de Perfis de Usuário
-- Estende a autenticação do Supabase com dados públicos
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Index para busca rápida por username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Tabela de Mangás
-- Armazena informações dos mangás de ambas as APIs (MangaDex e LerManga)
CREATE TABLE IF NOT EXISTS public.mangas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identificadores únicos por fonte
    mangadex_id TEXT UNIQUE,
    lermanga_slug TEXT UNIQUE,
    
    -- Dados do mangá
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    source TEXT NOT NULL CHECK (source IN ('mangadex', 'lermanga')),
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: pelo menos um ID deve estar presente
    CONSTRAINT at_least_one_id CHECK (
        mangadex_id IS NOT NULL OR lermanga_slug IS NOT NULL
    )
);

-- Indexes para busca rápida
CREATE INDEX IF NOT EXISTS idx_mangas_mangadex_id ON public.mangas(mangadex_id);
CREATE INDEX IF NOT EXISTS idx_mangas_lermanga_slug ON public.mangas(lermanga_slug);
CREATE INDEX IF NOT EXISTS idx_mangas_source ON public.mangas(source);

-- 3. Tabela de Progresso de Leitura
-- Armazena onde o usuário parou em cada mangá
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
    
    -- Informações do último capítulo lido
    last_chapter_id TEXT NOT NULL,
    last_chapter_number TEXT NOT NULL,
    last_page INTEGER DEFAULT 1,
    
    -- Timestamps
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: um progresso por usuário por mangá
    UNIQUE(user_id, manga_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_manga_id ON public.reading_progress(manga_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON public.reading_progress(last_read_at DESC);

-- 4. Tabela de Favoritos/Likes
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: um like por usuário por mangá
    UNIQUE(user_id, manga_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_manga_id ON public.favorites(manga_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- 5. Tabela de Comentários
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
    
    -- Conteúdo do comentário
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
    
    -- Sistema de respostas (comentários podem ter pais)
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_manga_id ON public.comments(manga_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- 6. Tabela de Curtidas em Comentários
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, comment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- =====================================================
-- FUNCTIONS E TRIGGERS
-- =====================================================

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_mangas
    BEFORE UPDATE ON public.mangas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_comments
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuário')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile após signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies para PROFILES
-- Todos podem ver perfis públicos
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policies para MANGAS
-- Todos podem ver mangás (público)
CREATE POLICY "Mangas are viewable by everyone"
    ON public.mangas FOR SELECT
    USING (true);

-- Apenas autenticados podem criar mangás (quando marcam como favorito)
CREATE POLICY "Authenticated users can insert mangas"
    ON public.mangas FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policies para READING_PROGRESS
-- Usuários veem apenas seu próprio progresso
CREATE POLICY "Users can view own reading progress"
    ON public.reading_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar seu próprio progresso
CREATE POLICY "Users can insert own reading progress"
    ON public.reading_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio progresso
CREATE POLICY "Users can update own reading progress"
    ON public.reading_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Usuários podem deletar seu próprio progresso
CREATE POLICY "Users can delete own reading progress"
    ON public.reading_progress FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para FAVORITES
-- Usuários veem apenas seus próprios favoritos
CREATE POLICY "Users can view own favorites"
    ON public.favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios favoritos
CREATE POLICY "Users can insert own favorites"
    ON public.favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios favoritos
CREATE POLICY "Users can delete own favorites"
    ON public.favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para COMMENTS
-- Todos podem ver comentários
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

-- Usuários autenticados podem criar comentários
CREATE POLICY "Authenticated users can insert comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios comentários
CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios comentários
CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para COMMENT_LIKES
-- Usuários veem curtidas
CREATE POLICY "Comment likes are viewable by everyone"
    ON public.comment_likes FOR SELECT
    USING (true);

-- Usuários podem curtir comentários
CREATE POLICY "Users can insert own comment likes"
    ON public.comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem remover suas curtidas
CREATE POLICY "Users can delete own comment likes"
    ON public.comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para contagem de favoritos por mangá
CREATE OR REPLACE VIEW public.manga_stats AS
SELECT 
    m.id,
    m.title,
    m.source,
    COUNT(DISTINCT f.id) as favorites_count,
    COUNT(DISTINCT c.id) as comments_count
FROM public.mangas m
LEFT JOIN public.favorites f ON f.manga_id = m.id
LEFT JOIN public.comments c ON c.manga_id = m.id
GROUP BY m.id, m.title, m.source;

-- View para histórico de leitura com detalhes
CREATE OR REPLACE VIEW public.reading_history AS
SELECT 
    rp.id,
    rp.user_id,
    rp.manga_id,
    m.title as manga_title,
    m.cover_url,
    m.source,
    rp.last_chapter_number,
    rp.last_page,
    rp.last_read_at
FROM public.reading_progress rp
JOIN public.mangas m ON m.id = rp.manga_id
ORDER BY rp.last_read_at DESC;

-- =====================================================
-- GRANTS
-- =====================================================

-- Permitir acesso às views
GRANT SELECT ON public.manga_stats TO authenticated;
GRANT SELECT ON public.reading_history TO authenticated;

COMMIT;
