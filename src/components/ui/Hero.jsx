import { Link } from 'react-router-dom';
import { BookOpen, Star } from 'lucide-react';

const Hero = ({ manga }) => {
  if (!manga) return null;

  const { id, title, description, cover, genres = [], rating, source = 'mangadex', slug } = manga;
  
  // Determine the correct link
  const linkId = source === 'lermanga' ? slug : id;
  const linkPath = `/manga/${linkId}?source=${source}`;

  return (
    <section className="relative h-[500px] overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
        style={{ backgroundImage: `url(${cover})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            {title}
          </h1>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
              <span className="text-lg font-medium">{rating}</span>
            </div>
          )}

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.slice(0, 5).map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-accent/20 border border-accent/40 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-text-secondary line-clamp-3 mb-6 text-lg">
              {description}
            </p>
          )}

          {/* CTA Button */}
          <Link
            to={linkPath}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-lg font-medium transition-colors"
          >
            <BookOpen size={20} />
            <span>Ler Agora</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
