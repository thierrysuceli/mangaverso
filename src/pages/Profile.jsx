import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import * as dbService from '../services/databaseService';
import { User, Mail, Lock, Save, Edit2, X, Heart, MessageCircle, Book } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const Profile = () => {
  const { user, profile, updateProfile, updatePassword } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  // Buscar stats do usuário
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => dbService.getFavorites(user.id),
    enabled: !!user,
  });
  
  const { data: history = [] } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: () => dbService.getReadingHistory(user.id, 100),
    enabled: !!user,
  });
  
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateProfile(formData);
      setEditMode(false);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updatePassword(passwordData.newPassword);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Erro ao alterar senha' });
    } finally {
      setLoading(false);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <User size={32} className="text-accent" />
          Meu Perfil
        </h1>
        
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-600/20 text-green-400 border border-green-600/50' 
              : 'bg-red-600/20 text-red-400 border border-red-600/50'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* Profile Card */}
        <div className="bg-surface rounded-lg p-6 mb-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold text-white">
                {getInitials(profile?.display_name || profile?.username)}
              </span>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">
                {profile?.display_name || profile?.username}
              </h2>
              <p className="text-text-secondary text-sm mb-2">
                @{profile?.username}
              </p>
              <p className="text-text-secondary text-sm flex items-center gap-2">
                <Mail size={14} />
                {user?.email}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Heart size={20} className="text-accent fill-accent" />
                <p className="text-3xl font-bold text-accent">{favorites.length}</p>
              </div>
              <p className="text-sm text-text-secondary">Favoritos</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Book size={20} className="text-accent" />
                <p className="text-3xl font-bold text-accent">{history.length}</p>
              </div>
              <p className="text-sm text-text-secondary">Mangás Lidos</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MessageCircle size={20} className="text-accent" />
                <p className="text-3xl font-bold text-accent">0</p>
              </div>
              <p className="text-sm text-text-secondary">Comentários</p>
            </div>
          </div>
        </div>
        
        {/* Edit Profile */}
        <div className="bg-surface rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Informações do Perfil</h3>
            <button
              onClick={() => {
                setEditMode(!editMode);
                if (editMode) {
                  // Reset form on cancel
                  setFormData({
                    display_name: profile?.display_name || '',
                    bio: profile?.bio || '',
                  });
                }
              }}
              className="text-accent hover:text-accent/80 flex items-center gap-2"
            >
              {editMode ? (
                <>
                  <X size={18} />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit2 size={18} />
                  Editar
                </>
              )}
            </button>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={!editMode}
                placeholder="Como você quer ser chamado"
                className="w-full p-3 bg-background border border-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Biografia
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editMode}
                placeholder="Conte um pouco sobre você..."
                rows={4}
                maxLength={200}
                className="w-full p-3 bg-background border border-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:border-accent focus:outline-none transition-colors resize-none"
              />
              <p className="text-xs text-text-secondary mt-1">
                {formData.bio.length}/200 caracteres
              </p>
            </div>
            
            {editMode && (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar Alterações
                  </>
                )}
              </button>
            )}
          </form>
        </div>
        
        {/* Change Password */}
        <div className="bg-surface rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Lock size={24} />
            Alterar Senha
          </h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-3 bg-background border border-gray-800 rounded-lg focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                minLength={6}
                placeholder="Digite a senha novamente"
                className="w-full p-3 bg-background border border-gray-800 rounded-lg focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="px-6 py-3 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
