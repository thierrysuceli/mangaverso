import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import MangaCard from '../components/ui/MangaCard';
import { searchMangas, filterByGenres, filterByTags, getGenres, getTags } from '../services/apiAdapter';

const Search = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTab, setActiveTab] = useState('lermanga'); // 'lermanga' or 'mangadex'
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Fetch genres for LerManga filters
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  // Fetch tags for MangaDex filters
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  // Search results
  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['search', query, selectedGenres, selectedTags, activeTab, searchTrigger],
    queryFn: async () => {
      if (activeTab === 'mangadex' && selectedTags.length > 0) {
        // Filter by MangaDex tags
        return await filterByTags({ includedTags: selectedTags });
      } else if (activeTab === 'lermanga' && selectedGenres.length > 0) {
        // Filter by LerManga genres
        return await filterByGenres({
          genres: selectedGenres.join(','),
          page: 1
        });
      } else if (query.trim()) {
        // Text search using both APIs
        return await searchMangas(query);
      }
      return [];
    },
    enabled: query.trim().length > 0 || selectedGenres.length > 0 || selectedTags.length > 0,
  });

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    setSearchTrigger(prev => prev + 1);
  };

  const toggleGenre = (genreSlug) => {
    setSelectedGenres(prev => 
      prev.includes(genreSlug)
        ? prev.filter(g => g !== genreSlug)
        : [...prev, genreSlug]
    );
    setSearchTrigger(prev => prev + 1);
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
    setSearchTrigger(prev => prev + 1);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    // Clear selections when switching tabs
    setSelectedGenres([]);
    setSelectedTags([]);
    setSearchTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Search Header */}
      <section className="bg-surface border-b border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Buscar Mangás</h1>
          <SearchBar 
            onSearch={handleSearch} 
            autoFocus={!initialQuery}
            placeholder="Buscar por título, autor..."
          />
        </div>
      </section>

      {/* Genre Filters */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <details className="mb-6">
          <summary className="cursor-pointer text-lg font-semibold mb-4 hover:text-accent">
            Filtrar por Tags/Gêneros ({selectedGenres.length + selectedTags.length} selecionados)
          </summary>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-800">
            <button
              onClick={() => switchTab('lermanga')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'lermanga'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Gêneros (LerManga)
            </button>
            <button
              onClick={() => switchTab('mangadex')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'mangadex'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Tags (MangaDex)
            </button>
          </div>

          {/* LerManga Genres */}
          {activeTab === 'lermanga' && (
            <div className="flex flex-wrap gap-2 mt-4">
              {genres.slice(0, 30).map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => toggleGenre(genre.slug)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedGenres.includes(genre.slug)
                      ? 'bg-accent border-accent text-white'
                      : 'bg-surface border-gray-700 hover:border-accent'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}

          {/* MangaDex Tags */}
          {activeTab === 'mangadex' && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.filter(tag => tag.group === 'genre').slice(0, 30).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-accent border-accent text-white'
                      : 'bg-surface border-gray-700 hover:border-accent'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </details>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Buscando...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center">
            <p className="text-red-400">Erro ao buscar mangás. Tente novamente.</p>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (query || selectedGenres.length > 0 || selectedTags.length > 0) && (
          <div className="text-center py-20">
            <p className="text-text-secondary text-lg">
              Nenhum resultado encontrado
            </p>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && !query && selectedGenres.length === 0 && selectedTags.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-secondary text-lg">
              Digite algo para buscar ou selecione gêneros/tags para filtrar
            </p>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-6">
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((manga) => (
                <MangaCard key={`${manga.source}-${manga.id || manga.slug}`} manga={manga} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Search;
