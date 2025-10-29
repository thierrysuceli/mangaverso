import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import * as dbService from '../services/databaseService';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Star } from 'lucide-react';
import { useState } from 'react';

const Favorites = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState(null);
  
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => dbService.getFavorites(user.id),
    enabled: !!user,
  });
  
  // Mutation para remover favorito
  const removeMutation = useMutation({
    mutationFn: (mangaId) => dbService.removeFavorite(user.id, mangaId),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites', user.id]);
      setRemovingId(null);
    },
  });
  
  const handleRemove = async (e, mangaId) => {
    e.preventDefault(); // Previne navegação do Link
    e.stopPropagation();
    
    if (confirm('Remover este mangá dos favoritos?')) {
      setRemovingId(mangaId);
      removeMutation.mutate(mangaId);
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Heart size={32} className="fill-accent text-accent" />
            Meus Favoritos
          </h1>
          <p className="text-text-secondary">
            {favorites.length} {favorites.length === 1 ? 'mangá favoritado' : 'mangás favoritados'}
          </p>
        </div>
        
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && favorites.length === 0 && (
          <div className="text-center py-20">
            <Heart size={64} className="mx-auto mb-4 text-text-secondary/50" />
            <h3 className="text-xl font-bold mb-2 text-text-secondary">
              Nenhum favorito ainda
            </h3>
            <p className="text-text-secondary mb-6">
              Favorite mangás para vê-los aqui
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              Explorar Mangás
            </Link>
          </div>
        )}
        
        {/* Favorites Grid */}
        {!isLoading && favorites.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((fav) => {
              const manga = fav.mangas;
              const mangaId = manga.mangadex_id || manga.lermanga_slug;
              const source = manga.source;
              const isRemoving = removingId === manga.id;
              
              return (
                <div key={fav.id} className="group relative">
                  <Link
                    to={`/manga/${mangaId}?source=${source}`}
                    className="block"
                  >
                    {/* Card */}
                    <div className="relative overflow-hidden rounded-lg shadow-lg aspect-[2/3] bg-surface">
                      {/* Cover Image */}
                      <img
                        src={manga.cover_url}
                        alt={manga.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Title on Hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                        <h3 className="font-bold text-sm line-clamp-2 mb-1">
                          {manga.title}
                        </h3>
                        
                        {/* Source Badge */}
                        <span className="inline-block text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                          {source === 'mangadex' ? 'MangaDex' : 'LerManga'}
                        </span>
                      </div>
                      
                      {/* Favorite Badge (always visible) */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-accent/90 backdrop-blur-sm p-2 rounded-full">
                          <Heart size={16} className="fill-white text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, manga.id)}
                    disabled={isRemoving}
                    className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 backdrop-blur-sm p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Remover dos favoritos"
                  >
                    {isRemoving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={16} className="text-white" />
                    )}
                  </button>
                  
                  {/* Title below card (mobile) */}
                  <div className="mt-2 sm:hidden">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {manga.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
