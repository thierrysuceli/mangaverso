import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Send, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getChapterPages, getMangaChapters, getMangaDetails } from '../services/apiAdapter';
import { useAuthStore } from '../store/authStore';
import * as dbService from '../services/databaseService';

const Reader = () => {
  const { chapterId } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'mangadex';
  const mangaId = searchParams.get('manga');
  const { user, profile } = useAuthStore();

  const [showControls, setShowControls] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const pageRefs = useRef([]);

  // Fetch chapter pages
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['chapterPages', chapterId, source, mangaId],
    queryFn: () => getChapterPages(chapterId, source, mangaId),
  });

  // Fetch manga details for saving progress
  const { data: manga } = useQuery({
    queryKey: ['manga', mangaId, source],
    queryFn: () => getMangaDetails(mangaId, source),
    enabled: !!mangaId,
  });

  // Fetch all chapters for navigation
  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', mangaId, source],
    queryFn: () => getMangaChapters(mangaId, source),
    enabled: !!mangaId,
  });
  
  // Fetch chapter comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await dbService.getChapterComments(chapterId);
        setComments(data);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };
    loadComments();
  }, [chapterId]);

  // Find current chapter index
  const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const currentChapter = chapters[currentIndex];

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleControls = () => {
    setShowControls(!showControls);
  };
  
  // Track scroll position and update current page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      for (let i = pageRefs.current.length - 1; i >= 0; i--) {
        const pageEl = pageRefs.current[i];
        if (pageEl && pageEl.offsetTop <= scrollPosition) {
          const newPage = i + 1;
          if (newPage !== currentPage) {
            setCurrentPage(newPage);
          }
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pages.length, currentPage]);
  
  // Save reading progress when page changes
  useEffect(() => {
    if (!user || !manga || !currentChapter || currentPage === 1) return;
    
    const saveProgress = async () => {
      try {
        await dbService.saveReadingProgress(
          user.id,
          {
            source,
            id: mangaId,
            title: manga.title,
            description: manga.description,
            cover: manga.cover,
          },
          {
            id: chapterId,
            number: currentChapter.number,
          },
          currentPage
        );
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    };
    
    // Debounce: save after 2 seconds of staying on the same page
    const timer = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timer);
  }, [user, manga, currentChapter, chapterId, currentPage, mangaId, source]);
  
  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !currentChapter) return;
    
    setLoadingComment(true);
    try {
      const comment = await dbService.addChapterComment(
        user.id,
        {
          id: chapterId,
          title: currentChapter.title,
          number: currentChapter.number,
        },
        newComment
      );
      
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Carregando capítulo...</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
          <p className="text-red-400">Capítulo não encontrado ou sem páginas</p>
          {mangaId && (
            <Link
              to={`/manga/${mangaId}?source=${source}`}
              className="mt-4 inline-block text-accent hover:underline"
            >
              Voltar para o mangá
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="reader-page bg-black" onClick={handleToggleControls}>
      {/* Top Controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent transition-transform duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to={mangaId ? `/manga/${mangaId}?source=${source}` : '/'}
            className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors backdrop-blur-sm"
            aria-label="Voltar"
          >
            <ArrowLeft size={24} />
          </Link>

          <div className="text-sm text-text-secondary">
            Página {currentPage} de {pages.length}
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="max-w-4xl mx-auto space-y-2">
        {pages.map((pageUrl, index) => (
          <PageImage 
            key={index} 
            pageUrl={pageUrl} 
            index={index}
            pageRef={(el) => (pageRefs.current[index] = el)}
          />
        ))}
      </div>
      
      {/* Comments Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 bg-background">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-lg font-bold mb-4 text-accent hover:text-accent/80"
        >
          <MessageCircle size={24} />
          Comentários ({comments.length})
        </button>
        
        {showComments && (
          <div className="space-y-6">
            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="bg-surface rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-accent" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário sobre este capítulo..."
                    maxLength={1000}
                    rows={3}
                    className="w-full p-3 bg-background border border-gray-800 rounded-lg resize-none focus:border-accent focus:outline-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-text-secondary">
                      {newComment.length}/1000
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || loadingComment}
                      className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {loadingComment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
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
                <p className="text-center text-text-secondary py-8">
                  Seja o primeiro a comentar este capítulo!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-surface rounded-lg p-4">
                    <div className="flex gap-3">
                      {comment.profiles.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.username}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-accent/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent font-bold">
                            {comment.profiles.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {comment.profiles.display_name || comment.profiles.username}
                          </span>
                          <span className="text-xs text-text-secondary">
                            @{comment.profiles.username}
                          </span>
                          <span className="text-xs text-text-secondary">•</span>
                          <span className="text-xs text-text-secondary">
                            {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-text-secondary whitespace-pre-wrap">
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

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          {/* Previous Chapter */}
          {prevChapter ? (
            <Link
              to={`/reader/${prevChapter.id}?source=${source}&manga=${mangaId}`}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Cap. {prevChapter.number}</span>
            </Link>
          ) : (
            <div className="w-24" />
          )}

          {/* Chapter Info */}
          <div className="text-center">
            <p className="font-medium">Capítulo {currentChapter?.number}</p>
            {currentChapter?.title && (
              <p className="text-sm text-text-secondary line-clamp-1">
                {currentChapter.title}
              </p>
            )}
          </div>

          {/* Next Chapter */}
          {nextChapter ? (
            <Link
              to={`/reader/${nextChapter.id}?source=${source}&manga=${mangaId}`}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">Cap. {nextChapter.number}</span>
              <ChevronRight size={20} />
            </Link>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para carregar cada página com skeleton loading
const PageImage = ({ pageUrl, index, pageRef }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative min-h-[600px] bg-surface rounded-lg overflow-hidden">
      {/* Skeleton Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-text-secondary">Carregando página {index + 1}...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <p className="text-red-400 mb-2">Erro ao carregar página {index + 1}</p>
          <button 
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="text-sm text-accent hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Image */}
      <img
        ref={pageRef}
        src={pageUrl}
        alt={`Página ${index + 1}`}
        className={`w-full h-auto block transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading="eager"
        decoding="async"
        fetchPriority={index < 3 ? 'high' : 'auto'}
      />
    </div>
  );
};

export default Reader;
