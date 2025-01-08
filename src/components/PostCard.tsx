// components/PostCard.tsx

import { Box, Image as ChakraImage, Flex, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import { MapComponent } from "./MapComponent";

interface Coordinates {
  lat: number;
  lng: number;
}

interface PostCardProps {
  profileImage: string;
  username: string;
  location: string;
  images: string[];
  //onClick: () => void; // 클릭 이벤트 핸들러
}

const MotionBox = motion(Box);

const PostCard: FC<PostCardProps> = ({ profileImage, username, location, images }) => {
  const [imageMetadata, setImageMetadata] = useState<PhotoMetadata>({
    date:  null,
    latitude: null,
  longitude: null,

  country: null,  // 역지오코딩 결과
  city: null,
  state: null,
  postalCode:  null,
  street: null,
  displaySrc: "",  // (HEIC 변환 시 사용) 최종 표시용 이미지 URL

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
      //onClick={onClick} // 클릭 시 부모에게 전달
    >
      {/* 프로필 및 위치 */}
      <Flex alignItems="center" mb={4}>
        <ChakraImage src={profileImage} alt={username} boxSize="50px" borderRadius="full" mr={3} />
        <Box>
          <Text fontWeight="bold">{username}</Text>
          <Text fontSize="sm" color="gray.500">{location}</Text>
        </Box>
      </Flex>

      {/* 사진들 - 가로 스크롤 */}
      <Box
        height="150px"
        display="flex"
        mb={5}
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
            borderRadius="md"
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
      {/* 지도 (비활성화) */}
      <Box mb={40} height="200px">
        {coordinates ? (
          <MapComponent location={location} coordinates={coordinates} isInteractive={false} />
        ) : (
          <ChakraImage
            src="/images/dummy_map_image.jpg" // 대체 지도 이미지
            alt="Dummy Map"
            objectFit="cover"
            w="100%"
            h="100%"
            borderRadius="md"
          />
        )}
      </Box>

      
    </MotionBox>
  );
};

export default PostCard;
