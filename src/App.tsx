import { ChakraProvider } from '@chakra-ui/react';
import { LoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import PhotoDetailPage from './pages/PhotoDetailPage';
import Search from './pages/Search';
import SearchResultPage from './pages/SearchResultPage';
//import LoginModal from './components/LoginModal';
import DiaryPage from './pages/DiaryPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    // Check localStorage for user info
    const accessToken = localStorage.getItem('access_token');
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');
    const profilePicture = localStorage.getItem('user_profile_picture');

    return accessToken && email && name 
      ? { 
          access_token: accessToken, 
          email, 
          name, 
          profilePicture: profilePicture || '/images/default-profile.jpg' 
        } 
      : null;
  });

  return (
    <ChakraProvider>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} loadingElement={<div>Loading...</div>}>
        <BrowserRouter>
          <Routes>
            {/* Root route redirects based on authentication */}
            <Route 
              path="/" 
              element={user ? <Navigate to="/home" /> : <LoginPage />} 
            />

            {/* Home route is protected */}
            <Route path="/home" element={<Home />}/>

            {/* Other routes */}
            <Route path="/photo-detail" element={<PhotoDetailPage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/search-result" element={<SearchResultPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            {/* <Route path="/create-trip" element={<CreateTripModal />} /> */}
          </Routes>
        </BrowserRouter>
      </LoadScript>
    </ChakraProvider>
  );
}