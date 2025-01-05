// components/PostCard.tsx

import { Box, Image as ChakraImage, Flex, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import { MapComponent } from "./MapComponent"; // MapComponent의 기본 내보내기 사용

interface Coordinates {
  lat: number;
  lng: number;
}

interface PostCardProps {
  profileImage: string;
  username: string;
  location: string;
  images: string[];
  onClick: () => void; // 클릭 이벤트 핸들러
}

const MotionBox = motion(Box);

const PostCard: FC<PostCardProps> = ({ profileImage, username, location, images, onClick }) => {
  const [imageMetadata, setImageMetadata] = useState<PhotoMetadata>({
    date: null,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    async function loadImageMetadata() {
      if (images && images.length > 0) {
        const metadata = await getPhotoMetadata(images[0]); // 첫 번째 이미지의 메타데이터 사용
        setImageMetadata(metadata);
      }
    }

    loadImageMetadata();
  }, [images]);

  const coordinates: Coordinates | undefined =
    imageMetadata.latitude && imageMetadata.longitude
      ? { lat: imageMetadata.latitude, lng: imageMetadata.longitude }
      : undefined;

  return (
    <MotionBox
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      p={4}
      cursor="pointer"
      whileHover={{ scale: 1.02, boxShadow: "lg" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} // 클릭 시 부모에게 전달
    >
      {/* 프로필 및 위치 */}
      <Flex alignItems="center" mb={4}>
        <ChakraImage src={profileImage} alt={username} boxSize="50px" borderRadius="full" mr={3} />
        <Box>
          <Text fontWeight="bold">{username}</Text>
          <Text fontSize="sm" color="gray.500">{location}</Text>
        </Box>
      </Flex>

      {/* 지도 (coordinates가 있을 때만 표시) */}
      {coordinates && (
        <Box
          mb={4}
          width="100%"
          borderRadius="20px"
          overflow="hidden" // 지도가 컨테이너를 벗어나지 않도록 설정
        >
          <MapComponent
            location={location}
            coordinates={coordinates}
            isInteractive={false}
            mapHeight="120px" // 원하는 높이로 설정
          />
        </Box>
      )}

      {/* 사진들 - 가로 스크롤 */}
      <Box
        height="250px"
        display="flex"
        mt={3}
        overflowX="auto"
        p={0}
        css={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {images.map((image, index) => (
          <Box
            key={index}
            flex="0 0 auto"
            width="300px"
            height="100%"
            mr={2}
            borderRadius="20px"
            overflow="hidden"
            scrollSnapAlign="start"
          >
            <ChakraImage
              src={image}
              alt={`Scrollable Image ${index + 1}`}
              objectFit="cover"
              width="100%"
              height="100%"
            />
          </Box>
        ))}
      </Box>
    </MotionBox>
  );
};

export default PostCard;
