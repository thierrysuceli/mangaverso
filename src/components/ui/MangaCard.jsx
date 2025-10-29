import { Link } from 'react-router-dom';
import { Star, BookmarkCheck, ImageOff } from 'lucide-react';
import { useState } from 'react';

const MangaCard = ({ manga, showProgress = false }) => {
  const { id, title, cover, rating, source = 'mangadex', slug, progress } = manga;
  const [imageError, setImageError] = useState(false);
  
  // Determine the correct link path
  const linkId = source === 'lermanga' ? slug : id;
  const linkPath = `/manga/${linkId}?source=${source}`;

  return (
    <Link
      to={linkPath}
      className="group block min-w-[140px] sm:min-w-[160px] flex-shrink-0"
    >
      <div className="relative w-full h-[210px] sm:h-[240px] rounded-lg overflow-hidden bg-gray-800">
        {/* Cover Image */}
        {!imageError ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => {
              console.error(`[MangaCard] Failed to load image: ${cover}`);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
            <ImageOff size={32} className="mb-2" />
            <p className="text-xs px-2 text-center">Imagem indisponível</p>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge (if available) */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded-md">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium">{rating}</span>
          </div>
        )}

        {/* Progress Badge (if showProgress and has progress) */}
        {showProgress && progress && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
            <div className="flex items-center gap-2 text-accent">
              <BookmarkCheck size={14} />
              <span className="text-xs font-medium">
                Cap. {progress.chapter_number}
                {progress.last_page > 1 && ` - Pág. ${progress.last_page}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">
        {title}
      </h3>
    </Link>
  );
};

export default MangaCard;
