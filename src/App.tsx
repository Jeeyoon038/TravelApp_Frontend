import { ChakraProvider } from '@chakra-ui/react';
import { LoadScript } from '@react-google-maps/api';
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Lazy load the pages
const Home = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const PhotoDetailPage = React.lazy(() => import('./pages/PhotoDetailPage'));
const Search = React.lazy(() => import('./pages/Search'));
const SearchResultPage = React.lazy(() => import('./pages/SearchResultPage'));

// Loading component with fixed position
const LoadingFallback = () => (
  <div style={{ 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'white',
    fontSize: '1.2rem',
    color: '#2D3748',
    zIndex: 1000
  }}>
    Loading...
  </div>
);

// Protected Route component with memoization
const ProtectedRoute = React.memo(({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = Boolean(
    localStorage.getItem('access_token') && 
    localStorage.getItem('user_email')
  );
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
});

// Root Route component with memoization
const RootRoute = React.memo(() => {
  const isAuthenticated = Boolean(
    localStorage.getItem('access_token') && 
    localStorage.getItem('user_email')
  );
  
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  
  return <LoginPage />;
});

// Google Maps libraries to load
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const checkConfig = async () => {
      if (clientId && mapsApiKey) {
        // Add a small delay to ensure smooth initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsInitialized(true);
      } else {
        console.error(
          'Missing environment variables:',
          !clientId ? 'VITE_GOOGLE_CLIENT_ID' : '',
          !mapsApiKey ? 'VITE_GOOGLE_MAPS_API_KEY' : ''
        );
      }
    };
    
    checkConfig();
  }, [clientId, mapsApiKey]);

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  if (!clientId || !mapsApiKey) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: 'white',
        color: 'red',
        textAlign: 'center'
      }}>
        Configuration Error: Missing required environment variables.
        Please check your .env file.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ChakraProvider>
        <LoadScript 
          googleMapsApiKey={mapsApiKey}
          loadingElement={<LoadingFallback />}
          libraries={GOOGLE_MAPS_LIBRARIES}
        >
          <BrowserRouter>
            <div style={{ height: '100vh', overflow: 'hidden' }}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<RootRoute />} />
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/photo-detail"
                    element={
                      <ProtectedRoute>
                        <PhotoDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search-result"
                    element={
                      <ProtectedRoute>
                        <SearchResultPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </BrowserRouter>
        </LoadScript>
      </ChakraProvider>
    </GoogleOAuthProvider>
  );
}