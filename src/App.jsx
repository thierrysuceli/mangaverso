import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import Hub from './pages/Hub';
import MangaDetails from './pages/MangaDetails';
import Reader from './pages/Reader';
import Search from './pages/Search';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import History from './pages/History';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Protected Route Component - Checks authentication and profile completion
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isLoading, profileCompleted } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Se está em /complete-profile, deixa passar
  if (location.pathname === '/complete-profile') {
    return children;
  }

  // Se não completou o perfil, redireciona
  if (!profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }
  
  return children;
};

function App() {
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    // Initialize auth once on mount
    useAuthStore.getState().initialize();
    
    // SEGURANÇA: Se não terminar em 3 segundos, força terminar
    const safetyTimer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.error('FORCE STOP LOADING - timeout 3s');
        useAuthStore.setState({ isLoading: false });
      }
    }, 3000);
    
    // Setup listener for auth changes
    const { data: listener } = useAuthStore.getState().setupAuthListener();
    
    return () => {
      clearTimeout(safetyTimer);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Complete Profile Route - Requires auth but redirects if already completed */}
          <Route 
            path="/complete-profile" 
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes (requires authentication AND completed profile) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Hub />} />
            <Route path="manga/:id" element={<MangaDetails />} />
            <Route path="reader/:chapterId" element={<Reader />} />
            <Route path="search" element={<Search />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<Profile />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;