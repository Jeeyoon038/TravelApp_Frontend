import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { LoadScript } from '@react-google-maps/api'; // Import LoadScript
import Home from './pages/Home';
import PhotoDetailPage from './pages/PhotoDetailPage';
import Search from './pages/Search';
import SearchResultPage from './pages/SearchResultPage';
import LoginModal from './components/LoginModal';
import CreateTripForm from './components/CreateTripForm';

export default function App() {
  return (
    <ChakraProvider>
      {/* Use async loading for the Google Maps script */}
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} loadingElement={<div>Loading...</div>}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/photo-detail" element={<PhotoDetailPage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/search-result" element={<SearchResultPage />} />
            <Route path="/create-trip" element={<CreateTripForm />} />
            <Route path="/login" element={<LoginModal />} />
          </Routes>
        </BrowserRouter>
      </LoadScript>
    </ChakraProvider>
  );
}
