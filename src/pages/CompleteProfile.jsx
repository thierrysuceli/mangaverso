import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getProfileByUsername } from '../services/databaseService';
import { supabase } from '../lib/supabase';
import { User, CheckCircle2, AlertCircle, ImagePlus } from 'lucide-react';
import AvatarSelector from '../components/ui/AvatarSelector';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: user?.user_metadata?.name || '',
    bio: '',
    avatarUrl: user?.user_metadata?.avatar_url || '/avatars/08b31a014301262d4cfb4790cc77b803cfc6cfad008aec6a0b3b69400274abdb.jpg'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const validateUsername = async (username) => {
    if (!username) {
      return 'Username é obrigatório';
    }
    
    if (username.length < 3) {
      return 'Username deve ter pelo menos 3 caracteres';
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username deve conter apenas letras, números e underscores';
    }

    // Verificar se username já existe
    try {
      const exists = await getProfileByUsername(username);
      if (exists) {
        return 'Este username já está em uso';
      }
    } catch (error) {
      console.error('Error checking username:', error);
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // Validar username
      const usernameError = await validateUsername(formData.username);
      if (usernameError) {
        setErrors({ username: usernameError });
        setLoading(false);
        return;
      }

      // Criar ou atualizar perfil completo
      const profileData = {
        id: user.id,
        email: user.email,
        username: formData.username.toLowerCase(),
        display_name: formData.displayName || formData.username,
        bio: formData.bio || null,
        avatar_url: formData.avatarUrl || null,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log('[COMPLETE PROFILE] Saving profile:', profileData);

      // UPSERT: Criar se não existir, atualizar se existir
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id' // Se id já existe, atualiza
        })
        .select()
        .single();

      if (error) {
        console.error('[COMPLETE PROFILE] Error:', error);
        throw error;
      }

      console.log('[COMPLETE PROFILE] Profile saved successfully:', data);

      // Atualizar store com perfil atualizado
      await refreshProfile();

      setMessage({
        type: 'success',
        text: 'Perfil criado com sucesso! Redirecionando...'
      });

      // Redirecionar para home após 1.5s
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Error creating profile:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao criar perfil. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete seu Perfil
          </h1>
          <p className="text-gray-400">
            Olá, <span className="text-purple-400">{user?.email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sua assinatura está ativa! Complete seu perfil para começar.
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Avatar
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarSelector(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <ImagePlus size={18} />
                  Escolher Avatar
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-900 border ${
                  errors.username ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                placeholder="seu_username"
                disabled={loading}
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Apenas letras, números e underscores. Mínimo 3 caracteres.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Nome de Exibição
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Como você quer ser chamado"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Opcional. Se não preencher, usaremos seu username.
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Conte um pouco sobre você..."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 text-right">
                {formData.bio.length}/200
              </p>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-900/30 border border-green-700 text-green-400'
                  : 'bg-red-900/30 border border-red-700 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando perfil...
                </>
              ) : (
                'Completar Cadastro'
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Após completar o perfil, você terá acesso a todos os recursos da plataforma.
          </p>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={formData.avatarUrl}
          onSelect={(avatar) => {
            setFormData(prev => ({ ...prev, avatarUrl: avatar }));
          }}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
}
