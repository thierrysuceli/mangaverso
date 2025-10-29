/**
 * API Adapter - Abstraction layer for API-agnostic application
 * UI components should ONLY import from this file, never directly from API services
 */

import * as mangaDexService from './mangaDexService';
import * as lerMangaService from './lerMangaService';

/**
 * Get popular/highlighted mangas for home page
 * Uses MangaDex API exclusively
 */
export const getPopularMangas = async () => {
  return await mangaDexService.fetchPopularMangas();
};

/**
 * Search mangas by text query
 * Fetches from BOTH APIs and merges results
 * @param {string} query - Search query
 * @returns {Promise<Array>} Combined results from both APIs
 */
export const searchMangas = async (query) => {
  try {
    // Fetch from both APIs in parallel
    const [mangaDexResults, lerMangaResults] = await Promise.allSettled([
      mangaDexService.searchMangas(query),
      lerMangaService.searchMangas(query)
    ]);

    // Combine results
    const results = [];
    
    if (mangaDexResults.status === 'fulfilled') {
      results.push(...mangaDexResults.value);
    }
    
    if (lerMangaResults.status === 'fulfilled') {
      results.push(...lerMangaResults.value);
    }

    return results;
  } catch (error) {
    console.error('Error searching mangas:', error);
    throw error;
  }
};

/**
 * Filter mangas by genres/tags
 * Uses LerManga API for genre filtering
 * @param {Object} filters - Filter options
 */
export const filterByGenres = async (filters) => {
  return await lerMangaService.filterMangas(filters);
};

/**
 * Filter mangas by tags (MangaDex only)
 * @param {Object} filters - Filter options (includedTags, excludedTags)
 */
export const filterByTags = async (filters) => {
  return await mangaDexService.filterMangasByTags(filters);
};

/**
 * Get all available genres from LerManga
 */
export const getGenres = async () => {
  return await lerMangaService.fetchGenres();
};

/**
 * Get all available tags from MangaDex
 */
export const getTags = async () => {
  return await mangaDexService.fetchTags();
};

/**
 * Get manga details by ID and source
 * Routes to appropriate API based on source
 * @param {string} id - Manga ID or slug
 * @param {string} source - 'mangadex' or 'lermanga'
 */
export const getMangaDetails = async (id, source = 'mangadex') => {
  if (source === 'lermanga') {
    const result = await lerMangaService.fetchMangaBySlug(id);
    console.log('[apiAdapter] getMangaDetails LerManga:', {
      title: result.title,
      hasDescription: !!result.description,
      description: result.description?.substring(0, 100)
    });
    return result;
  }
  
  return await mangaDexService.fetchMangaDetails(id);
};

/**
 * Get manga chapters
 * Routes to appropriate API based on source
 * @param {string} id - Manga ID or slug
 * @param {string} source - 'mangadex' or 'lermanga'
 * @param {string} language - Language code (only for MangaDex)
 */
export const getMangaChapters = async (id, source = 'mangadex', language = 'pt-br') => {
  if (source === 'lermanga') {
    // LerManga returns chapters within manga details
    const manga = await lerMangaService.fetchMangaBySlug(id);
    
    // Map chapters to include proper IDs
    return (manga.chapters || []).map(chapter => {
      // Extract chapter number from URL if not available
      let chapterNum = chapter.number;
      if (!chapterNum && chapter.url) {
        const match = chapter.url.match(/capitulo-(\d+(?:\.\d+)?)/);
        if (match) chapterNum = match[1];
      }
      
      return {
        id: chapterNum || chapter.title, // Use chapter number as ID
        number: chapterNum || 'N/A',
        title: chapter.title,
        date: chapter.release_date,
        url: chapter.url,
        slug: id // Store manga slug for later use
      };
    });
  }
  
  return await mangaDexService.fetchMangaChapters(id, language);
};

/**
 * Get chapter pages for reading
 * Routes to appropriate API based on source
 * @param {string} chapterId - Chapter ID or chapter number for lermanga
 * @param {string} source - 'mangadex' or 'lermanga'
 * @param {string} mangaId - Manga ID/slug (required for lermanga)
 */
export const getChapterPages = async (chapterId, source = 'mangadex', mangaId = null) => {
  if (source === 'lermanga') {
    if (!mangaId) {
      console.error('mangaId is required for lermanga chapters');
      return [];
    }
    
    // fetchChapterBySlugAndNumber now returns the images array directly
    return await lerMangaService.fetchChapterBySlugAndNumber(mangaId, chapterId);
  }
  
  return await mangaDexService.fetchChapterPages(chapterId);
};
