import { MethodsPage } from './pages/Methods';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/Auth';
import MainApp from './pages/MainApp';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (path === '/methods') return <MethodsPage />;
  if (path === '/auth') return <AuthPage />;
  if (path === '/app') return <MainApp />;
  return <Landing />;
}
