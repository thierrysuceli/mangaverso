import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ onSearch, placeholder = 'Buscar mangás...', autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        // Navigate to search page if no onSearch provided
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        {/* Search Icon */}
        <Search 
          size={20} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" 
        />

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-12 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Limpar busca"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
