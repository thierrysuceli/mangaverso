import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Header />
      
      <main className="flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Layout;
