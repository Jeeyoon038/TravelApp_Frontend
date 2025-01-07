import { ChakraProvider } from '@chakra-ui/react';
import { LoadScript } from '@react-google-maps/api';
import { GoogleOAuthProvider } from "@react-oauth/google";
import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import PhotoDetailPage from './pages/PhotoDetailPage';
import Search from './pages/Search';
import SearchResultPage from './pages/SearchResultPage';



// interface User {
//   access_token: string;
//   email: string;
//   name: string;
//   profilePicture: string;
// }

// Move ProtectedRoute outside of the App component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('user_email');
  console.log('Auth status:', isAuthenticated); // Debug log
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default function App() {

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('Google Client ID not found');
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ChakraProvider >
        <LoadScript 
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
          loadingElement={<div>Loading...</div>}
        >
          <HashRouter>
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
          </HashRouter>
        </LoadScript>
      </ChakraProvider>
    </GoogleOAuthProvider>
  );
}