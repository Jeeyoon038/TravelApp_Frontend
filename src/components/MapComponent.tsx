// src/components/MapComponent.tsx

import { Box, Text } from "@chakra-ui/react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import React from "react";

// 좌표 타입
interface Coordinates {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  coordinates: Coordinates;
  location: string;  // 지도 하단 텍스트 (optional)
  isInteractive?: boolean; // 드래그/줌 허용 여부
  mapHeight?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  coordinates,
  location,
  isInteractive = true,
  mapHeight = "300px",
}) => {
  const defaultCenter = { lat: 37.5665, lng: 126.9780 };

  const isValid = coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng);

  return (
    <Box w="100%" h={mapHeight} borderRadius="md" overflow="hidden">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={isValid ? coordinates : defaultCenter}
        zoom={13}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          draggable: isInteractive,
          scrollwheel: isInteractive,
        }}
      >
        {isValid && <Marker position={coordinates} />}
      </GoogleMap>
      {/* location 텍스트 */}
      <Box mt={2}>
        <Text fontSize="sm" color="gray.500">
          {location}
        </Text>
      </Box>
    </Box>
  );
};

export { MapComponent };

