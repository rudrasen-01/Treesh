import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/useAuth.tsx';
import { MainApp } from './components/MainApp';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage, TermsPage, PrivacyPage, SupportPage } from './components/StaticPages';
import Footer from './components/Footer';

const queryClient = new QueryClient();

const ScrollRestorationManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = `treesh:scroll:${location.pathname}${location.search}`;

    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const y = Number(saved);
        if (!Number.isNaN(y)) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: 'auto' });
          });
          return;
        }
      }
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.search, navigationType]);

  useEffect(() => {
    const key = `treesh:scroll:${location.pathname}${location.search}`;
    let timer: number | undefined;

    const savePosition = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    const onScroll = () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(savePosition, 120);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      savePosition();
      window.removeEventListener('scroll', onScroll);
    };
  }, [location.pathname, location.search]);

  return null;
};

// Static Page Wrapper Component
const StaticPageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <div className="flex-1">
        {children}
      </div>
      <Footer variant="compact" />
    </div>
  );
};

const App = () => {
  const [showAdmin, setShowAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Prevent hydration mismatch
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <ScrollRestorationManager />
              <Routes>
                <Route 
                  path="/" 
                  element={
                    showAdmin ? (
                      <AdminDashboard onClose={() => setShowAdmin(false)} />
                    ) : (
                      <MainApp />
                    )
                  } 
                />
                <Route 
                  path="/admin" 
                  element={<AdminDashboard onClose={() => setShowAdmin(false)} />} 
                />
                <Route 
                  path="/about" 
                  element={
                    <StaticPageLayout>
                      <AboutPage />
                    </StaticPageLayout>
                  } 
                />
                <Route 
                  path="/terms" 
                  element={
                    <StaticPageLayout>
                      <TermsPage />
                    </StaticPageLayout>
                  } 
                />
                <Route 
                  path="/privacy" 
                  element={
                    <StaticPageLayout>
                      <PrivacyPage />
                    </StaticPageLayout>
                  } 
                />
                <Route 
                  path="/support" 
                  element={
                    <StaticPageLayout>
                      <SupportPage />
                    </StaticPageLayout>
                  } 
                />
                <Route 
                  path="*" 
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-primary mb-4 font-treesh">404</h1>
                        <p className="text-muted-foreground font-inter">Page not found</p>
                      </div>
                    </div>
                  } 
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;