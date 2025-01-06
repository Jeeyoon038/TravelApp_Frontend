// src/components/GalleryModal.tsx

import { CloseIcon } from "@chakra-ui/icons";
import { Box, Image as ChakraImage, Flex, Spinner, Text } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { extractMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import { MapComponent } from "./MapComponent";

interface Coordinates {
  lat: number;
  lng: number;
}

interface ExtendedPhoto extends PhotoMetadata {
  // Remove originalSrc to avoid redundancy
}

interface PhotoGroup {
  dateKey: string;
  locationKey: string;
  photos: ExtendedPhoto[];
}

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    profileImage: string;
    username: string;
    location: string;
    images: (string | Blob)[]; // Allow both strings and Blobs
  } | null;
}

const MotionBox = motion(Box);

// Pastel palette and hash function
const pastelColors = [
  "#f2f2f2", "blue.50", "pink.50", "green.50", "yellow.50",
  "purple.50", "teal.50", "orange.50", "cyan.50", "red.50",
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

function groupPhotosByDateAndLocation(photos: ExtendedPhoto[]): PhotoGroup[] {
  const result: PhotoGroup[] = [];
  let currentGroup: PhotoGroup | null = null;

  for (const photo of photos) {
    const dateKey = photo.taken_at
      ? new Date(photo.taken_at).toISOString().slice(0, 10)
      : "Unknown Date";

    const latLonKey =
      photo.latitude !== null && photo.longitude !== null
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

const GalleryModal: FC<GalleryModalProps> = ({ isOpen, onClose, post }) => {
  const [photos, setPhotos] = useState<ExtendedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post || !isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const metadataResults = await extractMetadata(post.images);
        const loaded: ExtendedPhoto[] = metadataResults.map((meta, index) => ({
          ...meta,
          // Rely on displaySrc from extractMetadata
          // No need to set originalSrc
        }));

        // Sort by taken_at ascending
        loaded.sort((a, b) => {
          if (a.taken_at && b.taken_at) return new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime();
          if (a.taken_at) return -1;
          if (b.taken_at) return 1;
          return 0;
        });

        if (isMounted) setPhotos(loaded);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("사진을 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [post, isOpen]);

  // Group photos by date and location
  const grouped = groupPhotosByDateAndLocation(photos);

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

  if (!post) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <MotionBox
          position="fixed"
          top="0"
          left="0"
          width="100vw"
          height="100vh"
          bg="rgba(0, 0, 0, 0.8)"
          display="flex"
          justifyContent="center"
          alignItems="center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          zIndex="1000"
          onClick={onClose}
        >
          <MotionBox
            bg="white"
            borderRadius="md"
            width={["90%", "85%", "80%"]}
            maxHeight="90vh"
            overflowY="auto"
            p={4}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            position="relative"
          >
            <Box position="absolute" top="16px" right="16px" cursor="pointer">
              <CloseIcon onClick={onClose} />
            </Box>

            <Flex alignItems="center" mb={6}>
              <Box mr={4}>
                <ChakraImage
                  src={post.profileImage}
                  alt={post.username}
                  boxSize="50px"
                  borderRadius="full"
                />
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {post.username}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {post.location}
                </Text>
              </Box>
            </Flex>

            {isLoading && (
              <Box textAlign="center" my={4}>
                <Spinner size="lg" />
                <Text mt={2}>로딩 중...</Text>
              </Box>
            )}
            {error && (
              <Box textAlign="center" my={4}>
                <Text color="red.500">{error}</Text>
              </Box>
            )}

            {!isLoading && !error && (
              <>
                {grouped.map((group, groupIndex) => {
                  const dateParts = group.dateKey.split("-");
                  const year = dateParts[0];
                  const monthIndex = parseInt(dateParts[1], 10) - 1;
                  const day = dateParts[2];
                  const monthName = monthNames[monthIndex] || "Unknown";
                  const dateColor = getPastelColor(group.dateKey);

                  let coordinates: Coordinates | null = null;
                  let country: string | null = null;
                  let city: string | null = null;
                  let state: string | null = null;
                  let postalCode: string | null = null;
                  let street: string | null = null;

                  if (group.locationKey !== "Unknown Location") {
                    const [lat, lng] = group.locationKey.split(",").map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      coordinates = { lat, lng };
                      const first = group.photos.find(
                        (p) =>
                          p.country || p.city || p.state || p.postalCode || p.street
                      );
                      if (first) {
                        country = first.country;
                        city = first.city;
                        state = first.state;
                        postalCode = first.postalCode;
                        street = first.street;
                      }
                    }
                  }
                  const locationColor = getPastelColor(group.locationKey);

                  return (
                    <Box key={groupIndex} mb={8}>
                      {/* Date Header */}
                      <Box
                        p={4}
                        bg={dateColor}
                        borderRadius="md"
                        boxShadow="sm"
                        mb={3}
                        textAlign="center"
                      >
                        {group.dateKey === "Unknown Date" ? (
                          <Text fontSize="lg" fontWeight="bold">
                            Unknown Date
                          </Text>
                        ) : (
                          <>
                            <Text fontSize="md" color="gray.600">
                              {monthName} {year}
                            </Text>
                            <Text fontSize="4xl" fontWeight="bold">
                              {day}일
                            </Text>
                          </>
                        )}
                      </Box>

                      {/* Location Header */}
                      {group.locationKey !== "Unknown Location" && (
                        <Box
                          p={4}
                          bg={locationColor}
                          borderRadius="md"
                          boxShadow="sm"
                          mb={3}
                        >
                          {(city || state || country || postalCode || street) && (
                            <Box mb={2}>
                              {city && (
                                <Text fontWeight="bold" fontSize="xl">
                                  {city}
                                </Text>
                              )}
                              {state && <Text fontSize="sm">{state}</Text>}
                              {country && <Text fontSize="sm">{country}</Text>}
                              {street && <Text fontSize="sm">{street}</Text>}
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
                              isInteractive={false}
                              mapHeight="180px"
                            />
                          )}
                        </Box>
                      )}

                      {/* Images */}
                      <Box>
                        {group.photos.map((photo, idx) => (
                          <Box key={idx} mb={4} borderRadius="md" overflow="hidden">
                            <ChakraImage
                              src={photo.displaySrc} // Use displaySrc instead of originalSrc
                              alt={`Photo taken at ${photo.taken_at || 'unknown date'}`}
                              objectFit="cover"
                              width="100%"
                              height="auto"
                              loading="lazy"
                              borderRadius="md"
                              transition="transform 0.2s"
                              _hover={{ transform: "scale(1.05)" }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </>
            )}
          </MotionBox>
        </MotionBox>
      )}
    </AnimatePresence>
  );
};

export default GalleryModal;
