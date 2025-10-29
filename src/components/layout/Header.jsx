import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Header = () => {
  const { isLoggedIn, profile, signOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-surface border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-center flex flex-col items-center justify-center -my-1">
          <div className="text-xs text-text-secondary -mb-1">コミュニティ</div>
          <div className="text-2xl font-bold tracking-wider text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            MANGAVERSO
          </div>
        </Link>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {isLoggedIn && profile && (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <User size={18} className="text-text-secondary" />
                <span className="text-sm text-text-secondary hidden sm:inline">
                  {profile.display_name || profile.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Sair"
              >
                <LogOut size={18} className="text-text-secondary" />
                <span className="text-sm text-text-secondary hidden sm:inline">
                  Sair
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
