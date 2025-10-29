import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import * as dbService from '../services/databaseService';
import { Link } from 'react-router-dom';
import { Clock, Book, ArrowRight } from 'lucide-react';

const History = () => {
  const { user } = useAuthStore();
  
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: () => dbService.getReadingHistory(user.id, 30),
    enabled: !!user,
  });
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Clock size={32} className="text-accent" />
            Histórico de Leitura
          </h1>
          <p className="text-text-secondary">
            Seus mangás lidos recentemente
          </p>
        </div>
        
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && history.length === 0 && (
          <div className="text-center py-20">
            <Book size={64} className="mx-auto mb-4 text-text-secondary/50" />
            <h3 className="text-xl font-bold mb-2 text-text-secondary">
              Nenhum histórico ainda
            </h3>
            <p className="text-text-secondary mb-6">
              Comece a ler mangás para ver seu histórico aqui
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              Explorar Mangás
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
        
        {/* History List */}
        {!isLoading && history.length > 0 && (
          <div className="grid gap-4">
            {history.map((item) => {
              // Construir URL baseado na source
              const mangaId = item.mangas?.mangadex_id || item.mangas?.lermanga_slug;
              const source = item.mangas?.source;
              
              return (
                <Link
                  key={item.id}
                  to={`/manga/${mangaId}?source=${source}`}
                  className="flex gap-4 p-4 bg-surface rounded-lg hover:bg-surface/80 transition-all group"
                >
                  {/* Cover */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.mangas?.cover_url}
                      alt={item.manga_title}
                      className="w-24 h-36 object-cover rounded shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-lg mb-1 truncate group-hover:text-accent transition-colors">
                        {item.manga_title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-accent mb-2">
                        <Book size={16} />
                        <span className="text-sm font-medium">
                          Capítulo {item.last_chapter_number}
                        </span>
                        <span className="text-text-secondary">•</span>
                        <span className="text-sm text-text-secondary">
                          Página {item.last_page}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(item.last_read_at)}
                      </p>
                      
                      <span className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full font-medium">
                        {source === 'mangadex' ? 'MangaDex' : 'LerManga'}
                      </span>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="flex items-center">
                    <button className="px-6 py-2 bg-accent/10 group-hover:bg-accent text-text-secondary group-hover:text-white rounded-lg transition-all flex items-center gap-2">
                      Continuar
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
