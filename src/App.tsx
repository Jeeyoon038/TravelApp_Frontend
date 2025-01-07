import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { LoadScript } from '@react-google-maps/api';
import { GoogleOAuthProvider } from "@react-oauth/google";
import Home from './pages/Home';
import PhotoDetailPage from './pages/PhotoDetailPage';
import Search from './pages/Search';
import SearchResultPage from './pages/SearchResultPage';
import LoginPage from './pages/LoginPage';

interface User {
  access_token: string;
  email: string;
  name: string;
  profilePicture: string;
}

// Move ProtectedRoute outside of the App component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('user_email');
  console.log('Auth status:', isAuthenticated); // Debug log
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const accessToken = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');
    const profilePicture = localStorage.getItem('user_photo'); // Changed to match other components

    return accessToken && email && name
      ? {
          access_token: accessToken,
          email,
          name,
          profilePicture: profilePicture || '/images/default-profile.jpg'
        }
      : null;
  });

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('Google Client ID not found');
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ChakraProvider>
        <LoadScript 
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
          loadingElement={<div>Loading...</div>}
        >
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  localStorage.getItem('user_email') ? 
                  <Navigate to="/home" /> : 
                  <LoginPage />
                } 
              />
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
            </Routes>
          </BrowserRouter>
        </LoadScript>
      </ChakraProvider>
    </GoogleOAuthProvider>
  );
}