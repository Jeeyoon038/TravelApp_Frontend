// components/MapComponent.tsx

import { Box } from "@chakra-ui/react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { FC } from "react";

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  location: string;
  coordinates: Coordinates;
  isInteractive: boolean;
}

const MapComponent: FC<MapComponentProps> = ({ location, coordinates, isInteractive }) => {
  const mapStyles = {
    height: "100%",
    width: "100%",
    position: "relative" as const,
  };

  const defaultCenter = {
    lat: 37.5665, // 서울의 위도
    lng: 126.9780, // 서울의 경도
  };

  const isValidCoordinates = coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng);

  const mapOptions = {
    fullscreenControl: false,
    streetViewControl: false,
    disableDefaultUI: !isInteractive, // 기본 UI 비활성화 여부
    draggable: isInteractive, // 드래그 가능 여부
    scrollwheel: isInteractive, // 스크롤 휠 줌 가능 여부
    disableDoubleClickZoom: !isInteractive, // 더블 클릭 줌 비활성화 여부
    gestureHandling: isInteractive ? "auto" : "none", // 제스처 처리
  };

  return (
    <Box height="100%" width="100%" borderRadius="md" overflow="hidden">
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={13}
        center={isValidCoordinates ? coordinates : defaultCenter}
        options={mapOptions}
      >
        {isValidCoordinates && <Marker position={coordinates} />}
      </GoogleMap>
    </Box>
  );
};

export default MapComponent;
