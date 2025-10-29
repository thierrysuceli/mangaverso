import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, isLoggedIn, profileCompleted, isLoading } = useAuthStore();
  
  // Se já está logado, redireciona
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      if (profileCompleted) {
        navigate('/');
      } else {
        navigate('/complete-profile');
      }
    }
  }, [isLoggedIn, profileCompleted, isLoading, navigate]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // O useEffect vai cuidar do redirecionamento quando o estado atualizar
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-surface to-background">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <div className="text-xs text-text-secondary">コミュニティ</div>
            <div className="text-4xl font-bold tracking-wider text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              MANGAVERSO
            </div>
          </Link>
          <p className="mt-4 text-text-secondary">
            Entre para continuar lendo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900 rounded-lg text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Entrar</span>
              </>
            )}
          </button>

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-text-secondary">
              Não tem uma assinatura?{' '}
              <a 
                href="https://seusite.com/assinaturas" 
                className="text-accent hover:text-accent/80 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Adquira aqui
              </a>
            </p>
            <Link to="/forgot-password" className="block text-sm text-text-secondary hover:text-accent">
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
