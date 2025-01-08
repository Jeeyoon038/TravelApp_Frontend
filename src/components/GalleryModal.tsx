// src/components/GalleryModal.tsx

import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Image as ChakraImage,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import { MapComponent } from "./MapComponent";

// Interface representing geographical coordinates
interface Coordinates {
  lat: number;
  lng: number;
}

// Extends PhotoMetadata with the original image source
interface ExtendedPhoto extends PhotoMetadata {
  originalSrc: string;
}

// Represents a group of photos categorized by date and location
interface PhotoGroup {
  dateKey: string;
  locationKey: string;
  photos: ExtendedPhoto[];
}

// Props for the GalleryModal component
interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    profileImage: string;
    username: string;
    location: string;
    images: string[];
  } | null;
}

// Motion-enhanced Box component for animations
const MotionBox = motion(Box);

// Array of pastel colors for dynamic styling based on content
const pastelColors = [
  "#f2f2f2",
  "blue.50",
  "pink.50",
  "green.50",
  "yellow.50",
  "purple.50",
  "teal.50",
  "orange.50",
  "cyan.50",
  "red.50",
];

/**
 * Generates a hash from a given string.
 * @param str - The input string to hash.
 * @returns A numeric hash value.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return hash;
}

/**
 * Retrieves a pastel color based on a given key.
 * @param key - The key to hash and map to a color.
 * @returns A pastel color string.
 */
function getPastelColor(key: string): string {
  const index = Math.abs(hashString(key)) % pastelColors.length;
  return pastelColors[index];
}

// Array of abbreviated month names for display purposes
const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Groups photos by their date and location.
 * @param photos - Array of ExtendedPhoto objects to group.
 * @returns An array of PhotoGroup objects.
 */
function groupPhotosByDateAndLocation(photos: ExtendedPhoto[]): PhotoGroup[] {
  const result: PhotoGroup[] = [];
  let currentGroup: PhotoGroup | null = null;

  for (const photo of photos) {
    const dateKey = photo.date
      ? new Date(photo.date).toISOString().slice(0, 10)
      : "Unknown Date";

    const latLonKey =
      photo.latitude && photo.longitude
        ? `${photo.latitude.toFixed(3)},${photo.longitude.toFixed(3)}`
        : "Unknown Location";

    // Initialize a new group if the date or location changes
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

  // Push the last group if it exists
  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
}

/**
 * GalleryModal Component
 * Displays a modal with grouped photos by date and location.
 */
const GalleryModal: FC<GalleryModalProps> = ({ isOpen, onClose, post }) => {
  // State to manage the list of extended photos
  const [photos, setPhotos] = useState<ExtendedPhoto[]>([]);
  // State to indicate if photos are being loaded
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to capture any errors during photo loading
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect to fetch and process photos when the modal opens.
   */
  useEffect(() => {
    if (!post || !isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const loaded: ExtendedPhoto[] = [];
        for (const src of post.images) {
          const meta = await getPhotoMetadata(src);
          loaded.push({
            ...meta,
            originalSrc: src,
          });
        }

        // Sort photos by date in ascending order
        loaded.sort((a, b) => {
          if (a.date && b.date) return a.date.getTime() - b.date.getTime();
          if (a.date) return -1;
          if (b.date) return 1;
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

    // Cleanup to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [post, isOpen]);

  if (!post) return null;

  // Group photos by date and location
  const grouped = groupPhotosByDateAndLocation(photos);

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
          onClick={onClose} // Close modal when clicking outside the content
        >
          <MotionBox
            bg="white"
            borderRadius="md"
            width={["90%", "85%", "80%"]}
            maxHeight="90vh"
            overflowY="auto"
            p={4}
            onClick={(e: any) => e.stopPropagation()} // Prevent closing when clicking inside the content
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            position="relative"
          >
            {/* Close Icon */}
            <Box position="absolute" top="16px" right="16px" cursor="pointer">
              <CloseIcon onClick={onClose} />
            </Box>

            {/* User Profile Section */}
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

            {/* Loading Spinner */}
            {isLoading && (
              <Box textAlign="center" my={4}>
                <Spinner size="lg" />
                <Text mt={2}>로딩 중...</Text>
              </Box>
            )}

            {/* Error Message */}
            {error && (
              <Box textAlign="center" my={4}>
                <Text color="red.500">{error}</Text>
              </Box>
            )}

            {/* Display Grouped Photos */}
            {!isLoading && !error && (
              <>
                {grouped.map((group, groupIndex) => {
                  // Extract and format date information
                  const dateParts = group.dateKey.split("-");
                  const year = dateParts[0];
                  const monthIndex = parseInt(dateParts[1], 10) - 1;
                  const day = dateParts[2];
                  const monthName = monthNames[monthIndex] || "Unknown";
                  const dateColor = getPastelColor(group.dateKey);

                  // Extract location details if available
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
                      // Retrieve location details from the first photo with available data
                      const first = group.photos.find(
                        (p) =>
                          p.country ||
                          p.city ||
                          p.state ||
                          p.postalCode ||
                          p.street
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

                          {/* Map Component Displaying Location */}
                          {coordinates && (
                            <MapComponent
                              location={city ?? "Unknown"}
                              coordinates={coordinates}
                              isInteractive={false}
                              mapHeight="180px"
                            />
                          )}
                        </Box>
                      )}

                      {/* Photo Gallery */}
                      <Box>
                        {group.photos.map((photo, idx) => (
                          <Box key={idx} mb={4} borderRadius="md" overflow="hidden">
                            <ChakraImage
                              src={photo.displaySrc}
                              alt={`image-${idx}`}
                              objectFit="cover"
                              width="100%"
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
