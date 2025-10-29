import { supabase } from '../lib/supabase';

/**
 * Serviço de Database - Operações CRUD
 */

// =====================================================
// PROFILES
// =====================================================

/**
 * Obtém perfil do usuário por ID
 */
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Obtém perfil por username
 */
export const getProfileByUsername = async (username) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Atualiza perfil do usuário
 */
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

// =====================================================
// MANGAS
// =====================================================

/**
 * Cria ou obtém mangá pelo ID da fonte
 * @param {Object} mangaData - Dados do mangá
 */
export const upsertManga = async (mangaData) => {
  const { source, id: sourceId, title, description, cover } = mangaData;
  
  console.log('[upsertManga] Input:', { source, sourceId, title, description, cover });
  
  // Prepara os dados baseado na fonte
  const mangaInsert = {
    title,
    description: description || '',
    cover_url: cover,
    source,
  };

  if (source === 'mangadex') {
    mangaInsert.mangadex_id = sourceId;
  } else {
    mangaInsert.lermanga_slug = sourceId;
  }

  console.log('[upsertManga] Inserting:', mangaInsert);

  // Upsert (insert ou update se já existir)
  const { data, error } = await supabase
    .from('mangas')
    .upsert(mangaInsert, {
      onConflict: source === 'mangadex' ? 'mangadex_id' : 'lermanga_slug',
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[upsertManga] Error:', error);
    throw error;
  }
  
  console.log('[upsertManga] Result:', data);
  return data;
};

/**
 * Busca mangá pelo ID da fonte
 */
export const getMangaBySourceId = async (sourceId, source) => {
  const column = source === 'mangadex' ? 'mangadex_id' : 'lermanga_slug';
  
  const { data, error } = await supabase
    .from('mangas')
    .select('*')
    .eq(column, sourceId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// =====================================================
// READING PROGRESS
// =====================================================

/**
 * Salva ou atualiza progresso de leitura
 */
export const saveReadingProgress = async (userId, mangaData, chapterData, page = 1) => {
  try {
    console.log('[saveReadingProgress] Starting...', { userId, mangaId: mangaData.id, chapter: chapterData.number });
    
    // Primeiro, garante que o mangá existe no banco
    const manga = await upsertManga(mangaData);
    console.log('[saveReadingProgress] Manga upserted:', manga.id);

    // Dados do progresso (usar nomes corretos das colunas)
    const progressData = {
      user_id: userId,
      manga_id: manga.id,
      last_chapter_id: chapterData.id || chapterData.number, // ID ou número como fallback
      last_chapter_number: chapterData.number,
      last_page: page,
      // created_at será gerado automaticamente pelo banco
    };

    console.log('[saveReadingProgress] Upserting progress:', progressData);

    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(progressData, {
        onConflict: 'user_id,manga_id',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[saveReadingProgress] Error:', error);
      throw error;
    }
    
    console.log('[saveReadingProgress] ✅ Success:', data);
    return data;
  } catch (error) {
    console.error('[saveReadingProgress] Unexpected error:', error);
    throw error;
  }
};

/**
 * Obtém progresso de leitura de um mangá específico
 */
export const getReadingProgress = async (userId, mangaId) => {
  const { data, error} = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('manga_id', mangaId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Obtém histórico completo de leitura do usuário
 */
export const getReadingHistory = async (userId, limit = 20) => {
  const { data, error } = await supabase
    .from('reading_history')
    .select('*')
    .eq('user_id', userId)
    .order('last_read_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// =====================================================
// FAVORITES
// =====================================================

/**
 * Adiciona mangá aos favoritos
 */
export const addFavorite = async (userId, mangaData) => {
  // Garante que o mangá existe
  const manga = await upsertManga(mangaData);

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      manga_id: manga.id,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Remove mangá dos favoritos
 */
export const removeFavorite = async (userId, mangaId) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('manga_id', mangaId);

  if (error) throw error;
};

/**
 * Verifica se mangá está nos favoritos
 */
export const isFavorite = async (userId, mangaSourceId, source) => {
  const manga = await getMangaBySourceId(mangaSourceId, source);
  if (!manga) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('manga_id', manga.id)
    .maybeSingle(); // Use maybeSingle() ao invés de single() para evitar erro 406

  if (error) throw error;
  return !!data;
};

/**
 * Obtém todos os favoritos do usuário
 */
export const getFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      mangas (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// =====================================================
// COMMENTS (MANGA & CHAPTER)
// =====================================================

/**
 * Adiciona comentário a um mangá
 */
export const addComment = async (userId, mangaData, content, parentId = null) => {
  // Garante que o mangá existe
  const manga = await upsertManga(mangaData);

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      manga_id: manga.id,
      content,
      parent_id: parentId,
    })
    .select(`
      *,
      profiles (username, display_name, avatar_url)
    `)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Adiciona comentário a um capítulo específico
 */
export const addChapterComment = async (userId, chapterData, content, parentId = null) => {
  const { id: chapterId, title, number } = chapterData;

  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      chapter_id: chapterId,
      chapter_title: title || `Capítulo ${number}`,
      chapter_number: number,
      content,
      parent_id: parentId,
    })
    .select(`
      *,
      profiles (username, display_name, avatar_url)
    `)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Obtém comentários de um mangá
 */
export const getComments = async (mangaSourceId, source) => {
  const manga = await getMangaBySourceId(mangaSourceId, source);
  if (!manga) return [];

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (username, display_name, avatar_url),
      comment_likes (count)
    `)
    .eq('manga_id', manga.id)
    .is('parent_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Obtém comentários de um capítulo específico
 */
export const getChapterComments = async (chapterId) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (username, display_name, avatar_url),
      comment_likes (count)
    `)
    .eq('chapter_id', chapterId)
    .is('parent_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Conta comentários de um capítulo
 */
export const getChapterCommentsCount = async (chapterId) => {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)
    .is('parent_id', null);

  if (error) throw error;
  return count || 0;
};

/**
 * Obtém respostas de um comentário (funciona para manga e chapter)
 */
export const getCommentReplies = async (commentId) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (username, display_name, avatar_url),
      comment_likes (count)
    `)
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Atualiza comentário
 */
export const updateComment = async (commentId, content) => {
  const { data, error } = await supabase
    .from('comments')
    .update({
      content,
      edited: true,
    })
    .eq('id', commentId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Deleta comentário
 */
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

/**
 * Curte comentário
 */
export const likeComment = async (userId, commentId) => {
  const { data, error } = await supabase
    .from('comment_likes')
    .insert({
      user_id: userId,
      comment_id: commentId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Remove curtida de comentário
 */
export const unlikeComment = async (userId, commentId) => {
  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .eq('user_id', userId)
    .eq('comment_id', commentId);

  if (error) throw error;
};

// =====================================================
// STATS
// =====================================================

/**
 * Obtém estatísticas de um mangá
 */
export const getMangaStats = async (mangaSourceId, source) => {
  const manga = await getMangaBySourceId(mangaSourceId, source);
  if (!manga) return { favorites_count: 0, comments_count: 0 };

  const { data, error } = await supabase
    .from('manga_stats')
    .select('*')
    .eq('id', manga.id)
    .maybeSingle();

  if (error) throw error;
  return data || { favorites_count: 0, comments_count: 0 };
};

// =====================================================
// CONTINUE READING
// =====================================================

/**
 * Obtém mangás em andamento (Continue Reading)
 * Retorna mangás que o usuário leu mas não terminou
 */
export const getContinueReading = async (userId) => {
  if (!userId) return [];

  try {
    // Primeiro, buscar o progresso de leitura
    const { data: progressData, error: progressError } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (progressError) {
      console.error('[getContinueReading] Error fetching progress:', progressError);
      return [];
    }

    if (!progressData || progressData.length === 0) {
      return [];
    }

    // Buscar os mangás correspondentes
    const mangaIds = progressData.map(p => p.manga_id).filter(Boolean);
    
    if (mangaIds.length === 0) {
      return [];
    }

    const { data: mangasData, error: mangasError } = await supabase
      .from('mangas')
      .select('*')
      .in('id', mangaIds);

    if (mangasError) {
      console.error('[getContinueReading] Error fetching mangas:', mangasError);
      return [];
    }

    // Combinar progresso com mangás e transformar para o formato esperado pelo MangaCard
    const result = progressData.map(progress => {
      const manga = mangasData?.find(m => m.id === progress.manga_id);
      if (!manga) return null;

      const transformed = {
        id: manga.mangadex_id || manga.lermanga_slug, // ID para o link
        slug: manga.lermanga_slug, // Slug para LerManga
        title: manga.title,
        cover: manga.cover_url,
        description: manga.description, // ← Adiciona description
        source: manga.source,
        progress: {
          chapter_id: progress.last_chapter_id,
          chapter_number: progress.last_chapter_number,
          last_page: progress.last_page,
          last_read_at: progress.last_read_at,
          created_at: progress.created_at
        }
      };

      console.log('[getContinueReading] Transformed manga:', {
        source: transformed.source,
        title: transformed.title,
        cover: transformed.cover,
        description: transformed.description,
        hasCover: !!transformed.cover,
        hasDescription: !!transformed.description
      });

      return transformed;
    }).filter(Boolean); // Remove nulls

    return result;
  } catch (error) {
    console.error('[getContinueReading] Unexpected error:', error);
    return [];
  }
};

