import { Box, Flex, Image as ChakraImage, Heading, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { getPhotoMetadata } from "../utils/getPhotoMetadata"; // Assuming this function is imported correctly

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  location: string;
  coordinates: Coordinates;
}

interface PostCardProps {
  profileImage: string;
  username: string;
  location: string;
  images: string[];
  coordinates?: Coordinates;
}

const MapComponent = ({ location, coordinates }: MapComponentProps) => {
  const mapStyles = {
    height: "100%",
    width: "100%",
    position: "relative" as const
  };

  const defaultCenter = {
    lat: 37.5665,
    lng: 126.9780
  };

  const isValidCoordinates = coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng);

  return (
    <Box height="100%" width="100%">
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={13}
        center={isValidCoordinates ? coordinates : defaultCenter}
        options={{
          fullscreenControl: false,
          streetViewControl: false
        }}
      >
        {isValidCoordinates && <Marker position={coordinates} />}
      </GoogleMap>
    </Box>
  );
};

export default function PostCard({
  profileImage,
  username,
  location,
  images,
}: PostCardProps) {
  const [imageCoordinates, setImageCoordinates] = useState<Coordinates | null>(null);

  useEffect(() => {
    async function loadImageLocation() {
      if (images && images.length > 0) {
        try {
          const imagePath = images[0]; // Using the first image in the images array
          const coordinates = await getPhotoMetadata(imagePath); // Get the metadata from the image
          console.log('Coordinates from EXIF:', coordinates);  // Debug: Log the coordinates

          // If coordinates are found, update the state
          if (coordinates && coordinates.latitude && coordinates.longitude) {
            setImageCoordinates({
              lat: coordinates.latitude,
              lng: coordinates.longitude,
            });
          } else {
            // Fallback to default if no coordinates found
            setImageCoordinates({ lat: 37.5665, lng: 126.9780 });
          }
        } catch (error) {
          console.error('Error loading image location:', error);
          // Fallback if an error occurs
          setImageCoordinates({ lat: 37.5665, lng: 126.9780 });
        }
      }
    }

    loadImageLocation();
  }, [images]);  // Ensure to re-run this effect if the `images` array changes

  return (
    <Box height="60vh" display="flex" flexDirection="column">
      <Flex alignItems="center" p={4} gap={4} bg="white">
        <ChakraImage src={profileImage} alt={username} boxSize="50px" borderRadius="full" />
        <Box>
          <Heading size="sm">{username}</Heading>
          <Text fontSize="sm" color="gray.500">{location}</Text>
        </Box>
      </Flex>

      <Box height="200px" overflow="hidden" position="relative">
        {imageCoordinates ? (
          <MapComponent location={location} coordinates={imageCoordinates} />
        ) : (
          <ChakraImage
            src="/images/dummy_map_image.jpg" // Dummy fallback image
            alt="Dummy Map"
            objectFit="cover"
            w="100%"
            h="100%"
          />
        )}
      </Box>

      {/* Below scrollable images */}
      <Box
        height="300px"
        display="flex"
        overflowX="auto"
        p={0}
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {images.map((image, index) => (
          <Box
            key={index}
            flex="0 0 50%"
            height="100%"
            overflow="hidden"
          >
            <ChakraImage
              src={image}
              alt={`Scrollable Image ${index + 1}`}
              objectFit="cover"
              w="100%"
              h="100%"
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
