import { MethodsPage } from './pages/Methods';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/Auth';
import { CasesPage } from './pages/Cases';
import { AboutPage } from './pages/About';
import MainApp from './pages/MainApp';
import { IntelligencePage } from './pages/Intelligence';
import { SARLabPage } from './pages/SARLab';
import { ImpactPage } from './pages/Impact';
import { ReportPage } from './pages/Report';

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (path === '/methods') return <MethodsPage />;
  if (path === '/auth') return <AuthPage />;
  if (path === '/cases') return <CasesPage />;
  if (path === '/about') return <AboutPage />;
  if (path === '/intelligence') return <IntelligencePage />;
  if (path === '/sar-lab') return <SARLabPage />;
  if (path === '/impact') return <ImpactPage />;
  if (path === '/report') return <ReportPage />;
  if (path === '/app') return <MainApp />;
  return <Landing />;
}
