import { MethodsPage } from './pages/Methods';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/Auth';
import { CasesPage } from './pages/Cases';
import { AboutPage } from './pages/About';
import MainApp from './pages/MainApp';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (path === '/methods') return <MethodsPage />;
  if (path === '/auth') return <AuthPage />;
  if (path === '/cases') return <CasesPage />;
  if (path === '/about') return <AboutPage />;
  if (path === '/app') return <MainApp />;
  return <Landing />;
}
