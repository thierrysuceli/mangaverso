import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (formData.username.length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('O nome de usuário pode conter apenas letras, números e underscore');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.username,
        formData.displayName || formData.username
      );
      navigate('/profile/setup');
    } catch (err) {
      console.error('Signup error:', err);
      
      if (err.message.includes('User already registered')) {
        setError('Este email já está cadastrado');
      } else if (err.message.includes('unique')) {
        setError('Este nome de usuário já está em uso');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
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
            Crie sua conta para começar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
              Nome de Usuário *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="usuario123"
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Apenas letras, números e underscore. Mínimo 3 caracteres.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-2">
              Nome de Exibição (opcional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="Seu Nome"
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Mínimo 6 caracteres
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-surface border border-gray-800 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
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
                <span>Criando conta...</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Criar Conta</span>
              </>
            )}
          </button>

          {/* Link to Login */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                Entre aqui
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
