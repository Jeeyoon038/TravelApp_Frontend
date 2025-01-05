// components/GalleryModal.tsx

import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import MapComponent from "./MapComponent";

interface Coordinates {
  lat: number;
  lng: number;
}

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

const MotionBox = motion(Box);

const GalleryModal: FC<GalleryModalProps> = ({ isOpen, onClose, post }) => {
  const [imageMetadata, setImageMetadata] = useState<PhotoMetadata>({
    date: null,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    async function loadImageMetadata() {
      if (post && post.images && post.images.length > 0) {
        const metadata = await getPhotoMetadata(post.images[0]); // 첫 번째 이미지의 메타데이터 사용
        setImageMetadata(metadata);
      }
    }

    if (isOpen) {
      loadImageMetadata();
    }
  }, [post, isOpen]);

  const coordinates: Coordinates | undefined =
    imageMetadata.latitude && imageMetadata.longitude
      ? { lat: imageMetadata.latitude, lng: imageMetadata.longitude }
      : undefined;

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
          onClick={onClose} // 외부 클릭 시 모달 닫힘
        >
          <MotionBox
            bg="white"
            borderRadius="md"
            width={["90%", "80%", "60%"]}
            maxHeight="80vh"
            overflowY="auto"
            p={6}
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            {/* 프로필 및 위치 */}
            <Flex alignItems="center" mb={4}>
              <Image
                src={post.profileImage}
                alt={post.username}
                boxSize="50px"
                borderRadius="full"
                mr={3}
              />
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {post.username}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {post.location}
                </Text>
              </Box>
            </Flex>

            {/* 지도 (인터랙티브) */}
            <Box mb={4} height="300px">
              {coordinates ? (
                <MapComponent location={post.location} coordinates={coordinates} isInteractive={true} />
              ) : (
                <Image
                  src="/images/dummy_map_image.jpg" // 대체 지도 이미지
                  alt="Dummy Map"
                  objectFit="cover"
                  w="100%"
                  h="100%"
                  borderRadius="md"
                />
              )}
            </Box>

            {/* 전체 사진 갤러리 - 가로 스크롤 */}
            <Box
              height="300px"
              display="flex"
              overflowX="auto"
              p={0}
              css={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {post.images.map((img, idx) => (
                <Box
                  key={idx}
                  flex="0 0 auto"
                  width="300px"
                  height="100%"
                  mr={2}
                  borderRadius="md"
                  overflow="hidden"
                  scrollSnapAlign="start"
                >
                  <Image
                    src={img}
                    alt={`Gallery image ${idx + 1}`}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                </Box>
              ))}
            </Box>
          </MotionBox>
        </MotionBox>
      )}
    </AnimatePresence>
  );
};

export default GalleryModal;
