/**
 * LerManga API Service
 * Handles all communication with your custom FastAPI backend
 */

// Use a URL da Vercel em produção, localhost em desenvolvimento
const LERMANGA_API_BASE = import.meta.env.PROD 
  ? '/api'  // Em produção, usa a API serverless da Vercel
  : 'http://localhost:8000';  // Em desenvolvimento, usa localhost

/**
 * Search mangas by text
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of manga results
 */
export const searchMangas = async (query) => {
  try {
    const url = `${LERMANGA_API_BASE}/search?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search mangas');
    
    const data = await response.json();
    
    // Map to standardized format
    return data.map(manga => ({
      id: manga.slug,
      slug: manga.slug,
      title: manga.title,
      cover: manga.cover_image,
      rating: manga.rating,
      url: manga.url,
      source: 'lermanga'
    }));
  } catch (error) {
    console.error('Error searching mangas:', error);
    // Return empty array instead of throwing to allow partial results
    return [];
  }
};

/**
 * Filter mangas by genres/tags
 * @param {Object} filters - Filter options
 * @param {string} filters.genres - Comma-separated genre slugs
 * @param {string} filters.status - Manga status
 * @param {string} filters.order - Sort order
 * @param {number} filters.page - Page number
 * @returns {Promise<Array>} List of filtered mangas
 */
export const filterMangas = async (filters) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.genres) params.append('genres', filters.genres);
    if (filters.status) params.append('status', filters.status);
    if (filters.order) params.append('order', filters.order);
    if (filters.page) params.append('page', filters.page);
    
    const url = `${LERMANGA_API_BASE}/filter?${params}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to filter mangas');
    
    const data = await response.json();
    
    // Map to standardized format
    return data.map(manga => ({
      id: manga.slug,
      slug: manga.slug,
      title: manga.title,
      cover: manga.cover_image,
      rating: manga.rating,
      url: manga.url,
      source: 'lermanga'
    }));
  } catch (error) {
    console.error('Error filtering mangas:', error);
    return [];
  }
};

/**
 * Get all available genres
 * @returns {Promise<Array>} List of genres
 */
export const fetchGenres = async () => {
  try {
    const url = `${LERMANGA_API_BASE}/genres`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch genres');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};

/**
 * Get manga details by slug
 * @param {string} slug - The manga slug
 * @returns {Promise<Object>} Manga details
 */
export const fetchMangaBySlug = async (slug) => {
  try {
    const url = `${LERMANGA_API_BASE}/manga/${slug}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch manga');
    
    const data = await response.json();
    
    console.log('[LerManga API] fetchMangaBySlug RAW:', {
      slug,
      title: data.title,
      cover_image: data.cover_image,
      summary: data.summary
    });
    
    // Map to standardized format
    const mapped = {
      ...data,
      cover: data.cover_image,  // ← Map cover_image to cover
      description: data.summary, // ← Map summary to description
      source: 'lermanga'
    };
    
    console.log('[LerManga API] fetchMangaBySlug MAPPED:', {
      cover: mapped.cover,
      description: mapped.description
    });
    
    return mapped;
  } catch (error) {
    console.error('Error fetching manga by slug:', error);
    throw error;
  }
};

/**
 * Get chapter details
 * @param {string} chapterId - The chapter ID/slug
 * @returns {Promise<Object>} Chapter details with pages
 */
export const fetchChapter = async (chapterId) => {
  try {
    const url = `${LERMANGA_API_BASE}/chapter/${chapterId}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch chapter');
    
    const data = await response.json();
    
    return {
      ...data,
      source: 'lermanga'
    };
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }
};

/**
 * Get chapter by manga slug and chapter number
 * @param {string} slug - The manga slug
 * @param {string} chapterNumber - The chapter number
 * @returns {Promise<string[]>} Array of image URLs (proxied)
 */
export const fetchChapterBySlugAndNumber = async (slug, chapterNumber) => {
  try {
    const url = `${LERMANGA_API_BASE}/manga/${slug}/chapter/${chapterNumber}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch chapter');
    
    const data = await response.json();
    
    // Usar o proxy para as imagens evitar bloqueio de CORS/Referer
    const images = data.images || [];
    return images.map(imageUrl => 
      `${LERMANGA_API_BASE}/proxy-image?url=${encodeURIComponent(imageUrl)}`
    );
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }
};
