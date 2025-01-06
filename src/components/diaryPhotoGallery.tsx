// src/components/PhotoGallery.tsx

import { Box, Flex, Image } from "@chakra-ui/react";
import { Photo } from "../types/trip";

interface PhotoGalleryProps {
  photos: Photo[];
  selectedPhoto: Photo | null;
  onSelectPhoto: (photo: Photo) => void;
}

export default function PhotoGallery({
  photos,
  selectedPhoto,
  onSelectPhoto,
}: PhotoGalleryProps) {
  return (
    <Flex wrap="wrap" gap={4}>
      {photos.map((photo) => (
        <Box
          key={photo.photo_id}
          borderRadius="md"
          overflow="hidden"
          boxShadow={
            selectedPhoto?.photo_id === photo.photo_id
              ? "0 0 0 3px #3182CE"
              : "md"
          }
          cursor="pointer"
          onClick={() => onSelectPhoto(photo)}
          position="relative"
        >
          <Image
            src={photo.url}
            alt={`Photo ${photo.photo_id}`}
            objectFit="cover"
            w="200px"
            h="200px"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/default-image.jpg";
            }}
          />
          {selectedPhoto?.photo_id === photo.photo_id && (
            <Box
              position="absolute"
              top="0"
              left="0"
              w="100%"
              h="100%"
              bg="rgba(0, 0, 0, 0.3)"
            />
          )}
        </Box>
      ))}
    </Flex>
  );
}
