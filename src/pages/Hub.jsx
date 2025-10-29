import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useRef } from 'react';
import Hero from '../components/ui/Hero';
import MangaCard from '../components/ui/MangaCard';
import SearchBar from '../components/ui/SearchBar';
import { getPopularMangas } from '../services/apiAdapter';
import { getContinueReading } from '../services/databaseService';
import { useAuthStore } from '../store/authStore';

const Hub = () => {
  const { user } = useAuthStore();
  
  const { data: mangas = [], isLoading, error } = useQuery({
    queryKey: ['popularMangas'],
    queryFn: getPopularMangas,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query para "Continue Reading"
  const { data: continueReading = [], isLoading: loadingContinue } = useQuery({
    queryKey: ['continueReading', user?.id],
    queryFn: () => getContinueReading(user?.id),
    enabled: !!user?.id, // Só roda se tiver usuário logado
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Separate mangas for hero and carousels
  const heroManga = mangas[0];
  const trendingMangas = mangas.slice(1, 11);
  const recentMangas = mangas.slice(11);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {!isLoading && heroManga && <Hero manga={heroManga} />}

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <SearchBar />
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Carregando mangás...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center">
            <p className="text-red-400">Erro ao carregar mangás. Tente novamente.</p>
          </div>
        </div>
      )}

      {/* Carousels */}
      {!isLoading && !error && (
        <>
          {/* Continue Reading Carousel */}
          {continueReading.length > 0 && !loadingContinue && (
            <MangaCarousel 
              title="Continue Lendo" 
              mangas={continueReading}
              icon={<BookOpen size={24} className="text-accent" />}
              showProgress={true}
            />
          )}

          {/* Trending Carousel */}
          {trendingMangas.length > 0 && (
            <MangaCarousel title="Em Alta" mangas={trendingMangas} />
          )}

          {/* Recent Updates Carousel */}
          {recentMangas.length > 0 && (
            <MangaCarousel title="Atualizados Recentemente" mangas={recentMangas} />
          )}
        </>
      )}
    </div>
  );
};

// Carousel Component
const MangaCarousel = ({ title, mangas, icon, showProgress = false }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        
        {/* Navigation Buttons (Desktop) */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 bg-surface hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 bg-surface hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto carousel-scrollbar-hide scroll-smooth"
      >
        {mangas.map((manga) => (
          <MangaCard 
            key={manga.id || manga.mangadex_id || manga.lermanga_slug} 
            manga={manga} 
            showProgress={showProgress}
          />
        ))}
      </div>
    </section>
  );
};

export default Hub;
