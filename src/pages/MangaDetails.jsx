import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Star, Calendar, Download, Heart, MessageCircle, Send, User } from 'lucide-react';
import { getMangaDetails, getMangaChapters, getChapterPages } from '../services/apiAdapter';
import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAuthStore } from '../store/authStore';
import * as dbService from '../services/databaseService';

const MangaDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'mangadex';
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();

  // States
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [readingProgress, setReadingProgress] = useState(null);

  // Fetch manga details
  const { data: manga, isLoading: loadingManga } = useQuery({
    queryKey: ['manga', id, source],
    queryFn: () => getMangaDetails(id, source),
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ['chapters', id, source],
    queryFn: () => getMangaChapters(id, source),
    enabled: !!manga,
  });

  const isLoading = loadingManga || loadingChapters;
  
  // Check if manga is favorited, get stats, and reading progress
  useEffect(() => {
    const checkFavorite = async () => {
      if (user && id) {
        try {
          const favorited = await dbService.isFavorite(user.id, id, source);
          setIsFavorited(favorited);
          
          // Buscar progresso de leitura
          const mangaFromDb = await dbService.getMangaBySourceId(id, source);
          if (mangaFromDb) {
            const progress = await dbService.getReadingProgress(user.id, mangaFromDb.id);
            setReadingProgress(progress);
          }
        } catch (error) {
          console.error('Error checking favorite:', error);
        }
      }
      
      // Get stats
      try {
        const stats = await dbService.getMangaStats(id, source);
        setFavoritesCount(stats.favorites_count || 0);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    checkFavorite();
  }, [user, id, source]);
  
  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await dbService.getComments(id, source);
        setComments(data);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };
    
    loadComments();
  }, [id, source]);
  
  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!user || !manga) return;
    
    try {
      const mangaData = {
        source,
        id,
        title: manga.title,
        description: manga.description,
        cover: manga.cover,
      };
      
      if (isFavorited) {
        const mangaDb = await dbService.getMangaBySourceId(id, source);
        if (mangaDb) {
          await dbService.removeFavorite(user.id, mangaDb.id);
          setIsFavorited(false);
          setFavoritesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        await dbService.addFavorite(user.id, mangaData);
        setIsFavorited(true);
        setFavoritesCount(prev => prev + 1);
      }
      
      // Invalidate favorites query
      queryClient.invalidateQueries(['favorites', user.id]);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Erro ao favoritar mangá');
    }
  };
  
  // Submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !manga) return;
    
    setLoadingComment(true);
    try {
      const mangaData = {
        source,
        id,
        title: manga.title,
        description: manga.description,
        cover: manga.cover,
      };
      
      const comment = await dbService.addComment(user.id, mangaData, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Erro ao adicionar comentário');
    } finally {
      setLoadingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center">
          <p className="text-red-400">Mangá não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header with Cover */}
      <div className="relative h-96 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-lg scale-110"
          style={{ backgroundImage: `url(${manga.cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors backdrop-blur-sm"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </Link>

        {/* Content */}
        <div className="relative h-full max-w-4xl mx-auto px-4 flex items-end pb-8">
          <div className="flex gap-6 items-end">
            {/* Cover Image */}
            <img
              src={manga.cover}
              alt={manga.title}
              className="w-48 h-72 object-cover rounded-lg shadow-2xl hidden sm:block"
            />

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                {manga.title}
              </h1>

              {manga.author && (
                <p className="text-text-secondary mb-2">por {manga.author}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm items-center">
                {manga.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span>{manga.rating}</span>
                  </div>
                )}

                {manga.status && (
                  <div className="px-3 py-1 bg-accent/20 border border-accent/40 rounded-full">
                    {manga.status}
                  </div>
                )}
                
                {/* Favorite Button */}
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                    isFavorited
                      ? 'bg-accent text-white'
                      : 'bg-surface/80 text-text-secondary hover:bg-surface border border-gray-800'
                  }`}
                  title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
                  <span className="font-medium">{favoritesCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Genres */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Gêneros</h2>
            <div className="flex flex-wrap gap-2">
              {manga.genres.map((genre, index) => (
                <span
                  key={`genre-${index}-${genre}`}
                  className="px-3 py-1 bg-surface border border-gray-800 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {manga.description && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Sinopse</h2>
            <p className="text-text-secondary leading-relaxed">{manga.description}</p>
          </div>
        )}

        {/* Chapters */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Capítulos ({chapters.length})
          </h2>

          {chapters.length === 0 ? (
            <div className="bg-surface border border-gray-800 rounded-lg p-6 text-center">
              <p className="text-text-secondary">Nenhum capítulo disponível</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  mangaId={id}
                  source={source}
                  isCurrentlyReading={readingProgress?.last_chapter_number === chapter.number}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Comments Section */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-2xl font-bold mb-6 text-accent hover:text-accent/80 transition-colors"
          >
            <MessageCircle size={28} />
            Comentários ({comments.length})
          </button>
          
          {showComments && (
            <div className="space-y-6">
              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="bg-surface rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center flex-shrink-0">
                    {profile ? (
                      <span className="text-white font-bold">
                        {(profile.display_name || profile.username)[0].toUpperCase()}
                      </span>
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Compartilhe sua opinião sobre este mangá..."
                      maxLength={1000}
                      rows={4}
                      className="w-full p-3 bg-background border border-gray-800 rounded-lg resize-none focus:border-accent focus:outline-none transition-colors"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-text-secondary">
                        {newComment.length}/1000 caracteres
                      </span>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || loadingComment}
                        className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {loadingComment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Comentar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              
              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-surface rounded-lg border border-gray-800">
                    <MessageCircle size={48} className="mx-auto mb-3 text-text-secondary/50" />
                    <p className="text-text-secondary">
                      Seja o primeiro a comentar sobre este mangá!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-surface rounded-lg p-5">
                      <div className="flex gap-3">
                        {comment.profiles.avatar_url ? (
                          <img
                            src={comment.profiles.avatar_url}
                            alt={comment.profiles.username}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-accent/50"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {comment.profiles.username[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-bold text-lg">
                              {comment.profiles.display_name || comment.profiles.username}
                            </span>
                            <span className="text-sm text-text-secondary">
                              @{comment.profiles.username}
                            </span>
                            <span className="text-text-secondary">•</span>
                            <span className="text-sm text-text-secondary">
                              {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {comment.edited && (
                              <>
                                <span className="text-text-secondary">•</span>
                                <span className="text-xs text-text-secondary italic">
                                  editado
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Chapter Item Component
const ChapterItem = ({ chapter, mangaId, source, isCurrentlyReading = false }) => {
  const { number, title, date, id } = chapter;
  const linkPath = `/reader/${id}?source=${source}&manga=${mangaId}`;
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Função para baixar uma imagem com retry em caso de erro de rede
  const downloadImageWithRetry = async (url, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.blob();
      } catch (error) {
        const isNetworkError = error.message.includes('network') || 
                               error.message.includes('ERR_NETWORK') ||
                               error.name === 'TypeError';
        
        if (isNetworkError && attempt < maxRetries) {
          console.log(`Tentativa ${attempt} falhou para ${url}, tentando novamente...`);
          // Aguardar 1 segundo antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        throw error;
      }
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setDownloading(true);
      setProgress(0);

      // Fetch all chapter pages
      const pages = await getChapterPages(id, source, mangaId);
      
      if (!pages || pages.length === 0) {
        alert('Nenhuma página encontrada para este capítulo');
        return;
      }

      // Create ZIP file
      const zip = new JSZip();
      const folder = zip.folder(`Capitulo_${number}`);

      // Download all images
      for (let i = 0; i < pages.length; i++) {
        const pageUrl = pages[i];
        
        try {
          const blob = await downloadImageWithRetry(pageUrl);
          
          // Add image to ZIP with padded number (001, 002, etc.)
          const paddedNum = String(i + 1).padStart(3, '0');
          const extension = pageUrl.split('.').pop().split('?')[0] || 'jpg';
          folder.file(`page_${paddedNum}.${extension}`, blob);

          // Update progress
          setProgress(Math.round(((i + 1) / pages.length) * 100));
        } catch (error) {
          console.error(`Erro ao baixar página ${i + 1}:`, error);
          alert(`Erro ao baixar página ${i + 1}. Download cancelado.`);
          setDownloading(false);
          setProgress(0);
          return;
        }
      }

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Capitulo_${number}.zip`);

      setProgress(100);
      setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Erro ao baixar capítulo:', error);
      alert('Erro ao baixar capítulo. Tente novamente.');
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg group ${
      isCurrentlyReading 
        ? 'bg-accent/10 border-accent' 
        : 'bg-surface border-gray-800'
    }`}>
      <Link
        to={linkPath}
        className="flex-1 flex items-center gap-3"
      >
        <BookOpen size={20} className={isCurrentlyReading ? "text-accent" : "text-accent"} />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium group-hover:text-accent transition-colors">
              Capítulo {number}
            </p>
            {isCurrentlyReading && (
              <span className="text-xs px-2 py-0.5 bg-accent text-background rounded-full font-medium">
                Lendo
              </span>
            )}
          </div>
          {title && (
            <p className="text-sm text-text-secondary line-clamp-1">{title}</p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {date && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar size={16} />
            <span>{date}</span>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`p-2 rounded-lg transition-colors ${
            downloading
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-accent hover:text-white'
          }`}
          title="Baixar capítulo"
          aria-label="Baixar capítulo"
        >
          {downloading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">{progress}%</span>
            </div>
          ) : (
            <Download size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default MangaDetails;
