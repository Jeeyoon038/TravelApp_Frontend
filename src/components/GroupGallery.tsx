// src/components/GroupGallery.tsx

import { Box, Image as ChakraImage, Spinner, Text } from "@chakra-ui/react";
// import { useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import "../styles/masonry.css"; // Existing Masonry layout styles
import { Group } from "../types/group";
import { getPhotoMetadata } from "../utils/getPhotoMetadata"; // Integrated function
import { MapComponent } from "./MapComponent"; // Small map component

interface GalleryPhoto {
  originalSrc: string;
  displaySrc: string;
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  street: string | null;
}

interface GroupGalleryProps {
  group: Group;
  isHeaderCollapsed: boolean;
}

// Grouped sections
interface PhotoGroup {
  dateKey: string;
  locationKey: string;
  photos: GalleryPhoto[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Pastel color palette + hashing
const pastelColors = [
  '#f2f2f2',
  'blue.50',
  'pink.50',
  'green.50',
  'yellow.50',
  'purple.50',
  'teal.50',
  'orange.50',
  'cyan.50',
  'red.50',
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

// Helper function to calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); 
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default function GroupGallery({ group, isHeaderCollapsed }: GroupGalleryProps) {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);

  // Google Maps API load
  // const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  // const { isLoaded, loadError } = useJsApiLoader({
  //   googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  // });

  // 1) Load photo metadata
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadMetadata() {
      try {
        const array: GalleryPhoto[] = [];

        for (const src of group.image_urls) {
          // getPhotoMetadata already handles EXIF + HEIC + reverse geocoding
          const meta = await getPhotoMetadata(src);

          array.push({
            originalSrc: src,
            displaySrc: meta.displaySrc,
            date: meta.date,
            latitude: meta.latitude,
            longitude: meta.longitude,
            country: meta.country,
            city: meta.city,
            state: meta.state,
            postalCode: meta.postalCode,
            street: meta.street,
          });
        }

        // Sort by date ascending (photos without dates go to the end)
        array.sort((a, b) => {
          if (a.date && b.date) return a.date.getTime() - b.date.getTime();
          if (a.date) return -1;
          if (b.date) return 1;
          return 0;
        });

        if (isMounted) setPhotos(array);
      } catch (err) {
        console.error("Error loading metadata: ", err);
        if (isMounted) {
          setError("An error occurred while loading photo data.");
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

  // 2) Scroll to gallery when header is collapsed
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

  // 3) Group photos by date and location with 3km constraint
  function groupPhotosByDateAndLocation(photos: GalleryPhoto[]): PhotoGroup[] {
    const result: PhotoGroup[] = [];
    let currentDateGroup: PhotoGroup | null = null;
    let lastLocation: Coordinates | null = null;

    photos.forEach((photo) => {
      const dateKey = photo.date
        ? new Date(photo.date).toISOString().slice(0, 10)
        : "Unknown Date";

      const lat = photo.latitude;
      const lng = photo.longitude;

      const hasLocation = lat !== null && lng !== null;
      let locationKey = "Unknown Location";

      if (hasLocation && lastLocation) {
        const distance = getDistanceFromLatLonInKm(
          lastLocation.lat,
          lastLocation.lng,
          lat,
          lng
        );

        if (distance > 3) {
          locationKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
          lastLocation = { lat, lng };
        }
      } else if (hasLocation) {
        locationKey = `${lat!.toFixed(3)},${lng!.toFixed(3)}`;
        lastLocation = { lat: lat!, lng: lng! };
      }

      if (!currentDateGroup || currentDateGroup.dateKey !== dateKey) {
        currentDateGroup = {
          dateKey,
          locationKey: hasLocation ? `${lat!.toFixed(3)},${lng!.toFixed(3)}` : "Unknown Location",
          photos: [photo],
        };
        result.push(currentDateGroup);
        lastLocation = hasLocation ? { lat: lat!, lng: lng! } : null;
      } else {
        // Same date, check if a new location group should be created
        if (locationKey !== currentDateGroup.locationKey) {
          currentDateGroup = {
            dateKey,
            locationKey,
            photos: [photo],
          };
          result.push(currentDateGroup);
        } else {
          currentDateGroup.photos.push(photo);
        }
      }
    });

    return result;
  }

  // 4) Click on image to navigate
  const handleClickPhoto = (photo: GalleryPhoto) => {
    navigate("/photo-detail", { state: { trip_id: group.trip_id, image_url: photo.originalSrc } });
  };

  // 5) Masonry breakpoints
  const breakpointColumnsObj = {
    default: 6,
    1200: 5,
    992: 4,
    768: 3,
    576: 2,
    0: 1,
  };

  // 6) Month names array
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  // Grouped data with updated logic
  const groupedPhotoData = groupPhotosByDateAndLocation(photos);

  // Items array: dateHeader → locationHeader → images
  const items = groupedPhotoData.flatMap((group, groupIdx) => {
    const arr: Array<
      { type: "dateHeader"; data: PhotoGroup } |
      { type: "locationHeader"; data: PhotoGroup } |
      { type: "image"; data: GalleryPhoto }
    > = [];

    // For each date group, add a dateHeader once
    if (groupIdx === 0 || groupedPhotoData[groupIdx - 1].dateKey !== group.dateKey) {
      arr.push({ type: "dateHeader", data: group });
    }

    // Add locationHeader
    arr.push({ type: "locationHeader", data: group });

    // Add images
    group.photos.forEach((p) => {
      arr.push({ type: "image", data: p });
    });

    return arr;
  });

  return (
    <Box ref={galleryRef} px={4} mb={4}>
      {/* Loading/Error Display */}
      {isLoading && (
        <Box textAlign="center" my={4}>
          <Spinner size="lg" />
          <Text mt={2}>Loading data...</Text>
        </Box>
      )}
      {error && (
        <Box textAlign="center" my={4}>
          <Text color="red.500">{error}</Text>
        </Box>
      )}

      {/* Actual Masonry Layout */}
      {!isLoading && !error && (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {items.map((item, idx) => {
            if (item.type === "dateHeader") {
              const group = item.data;
              if (group.dateKey === "Unknown Date") {
                return (
                  <Box
                    key={`dateHeader-${idx}`}
                    p={4}
                    bg={getPastelColor(group.dateKey)}
                    borderRadius="md"
                    boxShadow="sm"
                    mb={4}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="lg" fontWeight="bold">
                      Unknown Date
                    </Text>
                  </Box>
                );
              } else {
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
                    <Box>
                      <Text fontSize={20} mb={-4} mt={6} ml={5} color="gray.600">
                        {monthName} {year}
                      </Text>
                      <Text fontSize={60} fontWeight="bold" mb={3}>
                        {day}일
                      </Text>
                    </Box>
                  </Box>
                );
              }
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
                // Use the first photo's location info
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
                      location={`${city}, ${state}, ${country}`}
                      isInteractive={true}
                      mapHeight="300px"
                    />
                  )}
                </Box>
              );
            } else {
              // image
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
