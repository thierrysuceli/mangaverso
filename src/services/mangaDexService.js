/**
 * MangaDex API Service
 * Handles all communication with the MangaDex API
 * Based on the original base.html implementation
 */

// Use CORS proxy for MangaDex API
const CORS_PROXY = 'https://corsproxy.io/?';
const MANGADEX_API_BASE = 'https://api.mangadex.org';
const MANGADEX_COVER_BASE = 'https://uploads.mangadex.org';

// Backend API base URL
const BACKEND_API_BASE = import.meta.env.PROD 
  ? '/api'  // Em produção, usa a API serverless da Vercel
  : 'http://localhost:8000';  // Em desenvolvimento, usa localhost (rotas já têm /api/)

// Helper: Proxiar imagem do MangaDex através do nosso backend
const proxyMangaDexImage = (imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/256x360?text=No+Cover';
  return `${BACKEND_API_BASE}/api/mangadex-proxy?url=${encodeURIComponent(imageUrl)}`;
};

// Helper: Find relationship in manga data
const findRelationship = (manga, type) => {
  return manga.relationships?.find(rel => rel.type === type);
};

// Helper: Map status to Portuguese
const mapStatusToPortuguese = (status) => {
  const statusMap = {
    'ongoing': 'Em Andamento',
    'completed': 'Concluído',
    'hiatus': 'Em Hiato',
    'cancelled': 'Cancelado'
  };
  return statusMap[status] || status || 'Desconhecido';
};

/**
 * Fetch popular mangas from MangaDex
 * Filters to only show mangas with Portuguese (Brazil) translations
 * Excludes adult content by default
 * @returns {Promise<Array>} List of manga objects
 */
export const fetchPopularMangas = async () => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/manga?limit=20&order[latestUploadedChapter]=desc&includes[]=cover_art&includes[]=author&availableTranslatedLanguage[]=pt-br&contentRating[]=safe&contentRating[]=suggestive`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch mangas');
    
    const json = await response.json();
    
    if (!json.data) return [];
    
    return json.data.map(manga => {
      const coverRel = findRelationship(manga, 'cover_art');
      const authorRel = findRelationship(manga, 'author');
      
      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName 
        ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.256.jpg`
        : '';
      const heroUrl = coverFileName 
        ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.512.jpg`
        : '';
      
      return {
        id: manga.id,
        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown Title',
        author: authorRel?.attributes?.name || 'Unknown',
        description: manga.attributes.description.en || manga.attributes.description.pt || 'Nenhuma sinopse disponível.',
        genres: manga.attributes.tags?.map(tag => tag.attributes.name.en) || [],
        status: mapStatusToPortuguese(manga.attributes.status),
        totalChapters: manga.attributes.lastChapter || 'N/A',
        cover: proxyMangaDexImage(coverUrl),
        heroImage: proxyMangaDexImage(heroUrl),
        progress: 0,
        lastRead: null,
        source: 'mangadex'
      };
    });
  } catch (error) {
    console.error('Error fetching popular mangas:', error);
    throw error;
  }
};

/**
 * Search mangas by title in MangaDex
 * Excludes adult content by default
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of manga objects
 */
export const searchMangas = async (query) => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/manga?title=${query}&limit=20&includes[]=cover_art&includes[]=author&availableTranslatedLanguage[]=pt-br&contentRating[]=safe&contentRating[]=suggestive`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search mangas');
    
    const json = await response.json();
    
    if (!json.data) return [];
    
    return json.data.map(manga => {
      const coverRel = findRelationship(manga, 'cover_art');
      const authorRel = findRelationship(manga, 'author');
      
      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName 
        ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.256.jpg`
        : '';
      const heroUrl = coverFileName 
        ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.512.jpg`
        : '';
      
      return {
        id: manga.id,
        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown Title',
        author: authorRel?.attributes?.name || 'Unknown',
        description: manga.attributes.description.en || manga.attributes.description.pt || 'Nenhuma sinopse disponível.',
        genres: manga.attributes.tags?.map(tag => tag.attributes.name.en) || [],
        status: mapStatusToPortuguese(manga.attributes.status),
        totalChapters: manga.attributes.lastChapter || 'N/A',
        cover: proxyMangaDexImage(coverUrl),
        heroImage: proxyMangaDexImage(heroUrl),
        progress: 0,
        lastRead: null,
        source: 'mangadex'
      };
    });
  } catch (error) {
    console.error('Error searching mangas:', error);
    throw error;
  }
};

/**
 * Fetch manga details by ID
 * @param {string} mangaId - The manga ID
 * @returns {Promise<Object>} Manga details
 */
export const fetchMangaDetails = async (mangaId) => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/manga/${mangaId}?includes[]=cover_art&includes[]=author`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch manga details');
    
    const json = await response.json();
    const manga = json.data;
    
    const coverRel = findRelationship(manga, 'cover_art');
    const authorRel = findRelationship(manga, 'author');
    
    const coverFileName = coverRel?.attributes?.fileName;
    const coverUrl = coverFileName 
      ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.512.jpg`
      : '';
    
    return {
      id: manga.id,
      title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
      author: authorRel?.attributes?.name || 'Unknown',
      description: manga.attributes.description.en || manga.attributes.description.pt || 'Nenhuma sinopse disponível.',
      genres: manga.attributes.tags?.map(tag => tag.attributes.name.en) || [],
      status: mapStatusToPortuguese(manga.attributes.status),
      totalChapters: manga.attributes.lastChapter || 'N/A',
      cover: proxyMangaDexImage(coverUrl),
      source: 'mangadex'
    };
  } catch (error) {
    console.error('Error fetching manga details:', error);
    throw error;
  }
};

/**
 * Fetch chapters for a manga
 * @param {string} mangaId - The manga ID
 * @param {string} language - Language code (default: 'pt-br')
 * @returns {Promise<Array>} List of chapters
 */
export const fetchMangaChapters = async (mangaId, language = 'pt-br') => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/manga/${mangaId}/feed?translatedLanguage[]=${language}&order[chapter]=desc&limit=500`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch chapters');
    
    const json = await response.json();
    
    if (!json.data) return [];
    
    // Map to standardized format
    return json.data.map(chapter => ({
      id: chapter.id,
      number: chapter.attributes.chapter || 'N/A',
      title: chapter.attributes.title || '',
      date: chapter.attributes.publishAt ? new Date(chapter.attributes.publishAt).toLocaleDateString('pt-BR') : '',
      pages: chapter.attributes.pages || 0
    }));
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
};

/**
 * Fetch pages for a chapter
 * @param {string} chapterId - The chapter ID
 * @returns {Promise<Array>} List of page URLs (proxied)
 */
export const fetchChapterPages = async (chapterId) => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/at-home/server/${chapterId}`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch chapter pages');
    
    const json = await response.json();
    
    if (json.result !== 'ok' || !json.chapter) return [];
    
    const baseUrl = json.baseUrl;
    const hash = json.chapter.hash;
    
    // IMPORTANTE: Proxiar todas as imagens através do nosso backend
    // MangaDex exige que imagens sejam proxiadas (não hotlinked)
    return json.chapter.data.map(filename => {
      const imageUrl = `${baseUrl}/data/${hash}/${filename}`;
      return proxyMangaDexImage(imageUrl);
    });
  } catch (error) {
    console.error('Error fetching chapter pages:', error);
    throw error;
  }
};

/**
 * Fetch all available tags from MangaDex
 * @returns {Promise<Array>} List of tag objects
 */
export const fetchTags = async () => {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/manga/tag`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tags');
    
    const json = await response.json();
    
    if (!json.data) return [];
    
    return json.data.map(tag => ({
      id: tag.id,
      name: tag.attributes.name.en || Object.values(tag.attributes.name)[0],
      group: tag.attributes.group
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

/**
 * Filter mangas by tags
 * @param {Object} filters - Filter options (includedTags, excludedTags)
 * @returns {Promise<Array>} List of filtered manga objects
 */
export const filterMangasByTags = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Basic params
    params.append('limit', '20');
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('availableTranslatedLanguage[]', 'pt-br');
    params.append('order[latestUploadedChapter]', 'desc');
    
    // Content rating filter - Excluir conteúdo adulto por padrão
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    // Não incluir: 'erotica' e 'pornographic'
    
    // Included tags
    if (filters.includedTags && filters.includedTags.length > 0) {
      filters.includedTags.forEach(tagId => {
        params.append('includedTags[]', tagId);
      });
    }
    
    // Excluded tags
    if (filters.excludedTags && filters.excludedTags.length > 0) {
      filters.excludedTags.forEach(tagId => {
        params.append('excludedTags[]', tagId);
      });
    }
    
    const url = `${CORS_PROXY}${encodeURIComponent(`${MANGADEX_API_BASE}/manga?${params.toString()}`)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to filter mangas');
    
    const json = await response.json();
    
    if (!json.data) return [];
    
    return json.data.map(manga => {
      const coverRel = findRelationship(manga, 'cover_art');
      const authorRel = findRelationship(manga, 'author');
      
      const coverFileName = coverRel?.attributes?.fileName;
      const coverUrl = coverFileName 
        ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.256.jpg`
        : '';
      const heroUrl = coverFileName 
        ? `${MANGADEX_COVER_BASE}/covers/${manga.id}/${coverFileName}.512.jpg`
        : '';
      
      return {
        id: manga.id,
        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown Title',
        author: authorRel?.attributes?.name || 'Unknown',
        description: manga.attributes.description.en || manga.attributes.description.pt || 'Nenhuma sinopse disponível.',
        genres: manga.attributes.tags?.map(tag => tag.attributes.name.en) || [],
        status: mapStatusToPortuguese(manga.attributes.status),
        totalChapters: manga.attributes.lastChapter || 'N/A',
        cover: proxyMangaDexImage(coverUrl),
        heroImage: proxyMangaDexImage(heroUrl),
        progress: 0,
        lastRead: null,
        source: 'mangadex'
      };
    });
  } catch (error) {
    console.error('Error filtering mangas by tags:', error);
    throw error;
  }
};

