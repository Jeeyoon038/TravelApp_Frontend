// src/components/GroupGallery.tsx

import { Box, Image as ChakraImage, Spinner, Text } from "@chakra-ui/react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import "../styles/masonry.css";
import { Group } from "../types/trip";
import { extractMetadata, PhotoMetadata } from "../utils/getPhotoMetadata"; // Updated import
import { MapComponent } from "./MapComponent";

interface GalleryPhoto extends PhotoMetadata {
  originalSrc: string; // Retains the original source for potential future use
}

interface GroupGalleryProps {
  group: Group;
  isHeaderCollapsed: boolean;
}

interface PhotoGroup {
  dateKey: string;
  locationKey: string;
  photos: GalleryPhoto[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

const pastelColors = [
  '#f2f2f2', 'blue.50', 'pink.50', 'green.50', 'yellow.50',
  'purple.50', 'teal.50', 'orange.50', 'cyan.50', 'red.50',
];

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); 
  }
  return hash;
}

function getPastelColor(key: string): string {
  const index = Math.abs(hashString(key)) % pastelColors.length;
  return pastelColors[index];
}

const monthNames = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export default function GroupGallery({ group, isHeaderCollapsed }: GroupGalleryProps) {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadMetadata() {
      try {
        const metadataResults = await extractMetadata(group.image_urls);
        const array: GalleryPhoto[] = metadataResults.map((meta, index) => ({
          ...meta,
          originalSrc: typeof group.image_urls[index] === 'string' ? group.image_urls[index] : '', // Retain original source if available
        }));

        array.sort((a, b) => {
          if (a.taken_at && b.taken_at) return new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime();
          if (a.taken_at) return -1;
          if (b.taken_at) return 1;
          return 0;
        });

        if (isMounted) setPhotos(array);
      } catch (err) {
        console.error("Error loading metadata: ", err);
        if (isMounted) {
          setError("사진 데이터를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [group.image_urls]);

  useEffect(() => {
    if (isHeaderCollapsed && galleryRef.current) {
      const OFFSET = 80;
      const rect = galleryRef.current.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top - OFFSET;
      window.scrollTo({
        top: absoluteTop,
        behavior: "smooth",
      });
    }
  }, [isHeaderCollapsed]);

  function groupPhotosByDateAndLocation(photos: GalleryPhoto[]): PhotoGroup[] {
    const result: PhotoGroup[] = [];
    let currentGroup: PhotoGroup | null = null;

    for (const photo of photos) {
      const dateKey = photo.taken_at
        ? new Date(photo.taken_at).toISOString().slice(0, 10)
        : "Unknown Date";

      const latLonKey =
        photo.latitude && photo.longitude
          ? `${photo.latitude.toFixed(3)},${photo.longitude.toFixed(3)}`
          : "Unknown Location";

      if (
        !currentGroup ||
        currentGroup.dateKey !== dateKey ||
        currentGroup.locationKey !== latLonKey
      ) {
        if (currentGroup) {
          result.push(currentGroup);
        }
        currentGroup = {
          dateKey,
          locationKey: latLonKey,
          photos: [photo],
        };
      } else {
        currentGroup.photos.push(photo);
      }
    }

    if (currentGroup) {
      result.push(currentGroup);
    }

    return result;
  }

  const handleClickPhoto = (photo: GalleryPhoto) => {
    navigate("/photo-detail", { state: { photo } });
  };

  const breakpointColumnsObj = {
    default: 6,
    1200: 5,
    992: 4,
    768: 3,
    576: 2,
    0: 1,
  };

  const groupedPhotoData = groupPhotosByDateAndLocation(photos);

  const items = groupedPhotoData.flatMap((group) => {
    const arr: Array<
      { type: "dateHeader"; data: PhotoGroup } |
      { type: "locationHeader"; data: PhotoGroup } |
      { type: "image"; data: GalleryPhoto }
    > = [];

    arr.push({ type: "dateHeader", data: group });

    if (group.locationKey !== "Unknown Location") {
      arr.push({ type: "locationHeader", data: group });
    }

    group.photos.forEach((p) => {
      arr.push({ type: "image", data: p });
    });

    return arr;
  });

  // Clean up Blob URLs when component unmounts
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.displaySrc.startsWith('blob:')) {
          URL.revokeObjectURL(photo.displaySrc);
        }
      });
    };
  }, [photos]);

  return (
    <Box ref={galleryRef} px={4} mb={4}>
      {isLoading && (
        <Box textAlign="center" my={4}>
          <Spinner size="lg" />
          <Text mt={2}>데이터 로딩 중...</Text>
        </Box>
      )}
      {error && (
        <Box textAlign="center" my={4}>
          <Text color="red.500">{error}</Text>
        </Box>
      )}

      {!isLoading && !error && isLoaded && (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {items.map((item, idx) => {
            if (item.type === "dateHeader") {
              const group = item.data;
              const dateParts = group.dateKey.split("-");
              const year = dateParts[0];
              const monthIndex = parseInt(dateParts[1], 10) - 1;
              const day = dateParts[2];

              const monthName = monthNames[monthIndex] || "Unknown";
              const bgColor = getPastelColor(group.dateKey);

              return (
                <Box
                  key={`dateHeader-${idx}`}
                  p={4}
                  bg={bgColor}
                  borderRadius="md"
                  boxShadow="sm"
                  mb={4}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  {group.dateKey === "Unknown Date" ? (
                    <Text fontSize="lg" fontWeight="bold">
                      Unknown Date
                    </Text>
                  ) : (
                    <Box>
                      <Text fontSize={20} mb={-4} mt={6} ml={5} color="gray.600">
                        {monthName} {year}
                      </Text>
                      <Text fontSize={60} fontWeight="bold" mb={3}>
                        {day}일
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            } else if (item.type === "locationHeader") {
              const group = item.data;
              const [lat, lng] = group.locationKey.split(",").map(Number);

              let coordinates: Coordinates | null = null;
              let country: string | null = null;
              let city: string | null = null;
              let state: string | null = null;
              let postalCode: string | null = null;
              let street: string | null = null;

              if (!isNaN(lat) && !isNaN(lng)) {
                coordinates = { lat, lng };
                const firstPhoto = group.photos.find(
                  (p) => p.country || p.city || p.state || p.postalCode || p.street
                );
                if (firstPhoto) {
                  country = firstPhoto.country;
                  city = firstPhoto.city;
                  state = firstPhoto.state;
                  postalCode = firstPhoto.postalCode;
                  street = firstPhoto.street;
                }
              }

              const bgColor = getPastelColor(group.locationKey);

              return (
                <Box
                  key={`locationHeader-${idx}`}
                  p={4}
                  bg={bgColor}
                  borderRadius="md"
                  boxShadow="sm"
                  mb={4}
                >
                  {(country || city || state || postalCode || street) && (
                    <Box mb={2}>
                      {city && <Text fontWeight="bold" fontSize={24}>{city}</Text>}
                      {state && <Text fontSize={14}>{state}</Text>}
                      {country && <Text fontSize={14}>{country}</Text>}
                      {street && <Text>{street}</Text>}
                    </Box>
                  )}

                  {coordinates && (
                    <MapComponent
                      coordinates={coordinates}
                      country={country}
                      city={city}
                      state={state}
                      postalCode={postalCode}
                      street={street}
                    />
                  )}
                </Box>
              );
            } else {
              const photo = item.data;
              return (
                <Box
                  key={`image-${idx}`}
                  position="relative"
                  mb={4}
                  cursor="pointer"
                  onClick={() => handleClickPhoto(photo)}
                  borderRadius="md"
                  overflow="hidden"
                >
                  <ChakraImage
                    src={photo.displaySrc}
                    alt={`Gallery-${idx}`}
                    objectFit="cover"
                    width="100%"
                    height="auto"
                    loading="lazy"
                    borderRadius="md"
                    transition="transform 0.2s"
                    _hover={{ transform: "scale(1.05)" }}
                  />
                </Box>
              );
            }
          })}
        </Masonry>
      )}
    </Box>
  );
}
