// src/components/GalleryModal.tsx

import { CloseIcon } from "@chakra-ui/icons";
import { Box, Image as ChakraImage, Flex, IconButton, Spinner, Text } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import { MapComponent } from "./MapComponent";

// 좌표 타입
interface Coordinates {
  lat: number;
  lng: number;
}

interface ExtendedPhoto extends PhotoMetadata {
  originalSrc: string;
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
    images: string[];
  } | null;
}

const MotionBox = motion(Box);

// 파스텔 팔레트 + 해시
const pastelColors = [
  "#f2f2f2",
  "#ebf8ff", // blue.50
  "#fff5f7", // pink.50
  "#f0fff4", // green.50
  "#fffff0", // yellow.50
  "#faf5ff", // purple.50
  "#e6fffa", // teal.50
  "#fffaf0", // orange.50
  "#e0f7fa", // cyan.50
  "#fff5f5", // red.50
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

// 월 이름
const monthNames = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

// 날짜+위치로 그룹화
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
        const loaded: ExtendedPhoto[] = [];
        for (const src of post.images) {
          const meta = await getPhotoMetadata(src);
          loaded.push({
            ...meta,
            originalSrc: src,
          });
        }

        // 날짜 오름차순
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

    return () => {
      isMounted = false;
    };
  }, [post, isOpen]);

  if (!post) return null;

  // 날짜+위치로 묶기
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
          onClick={onClose} // 모달 바깥 클릭 -> 닫힘
        >
          <MotionBox
            bg="white"
            borderRadius="md"
            width={["90%", "85%", "80%"]}
            maxHeight="90vh"
            overflowY="auto"
            p={4}
            onClick={(e) => e.stopPropagation()} // 내부 클릭 -> 닫힘 방지
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            position="relative"
          >
            {/* 닫기 아이콘 */}
            <IconButton
              icon={<CloseIcon />}
              position="absolute"
              top="16px"
              right="16px"
              onClick={onClose}
              variant="ghost"
              aria-label="Close Gallery"
            />

            {/* 프로필 */}
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

            {/* 로딩/에러 */}
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
                  // 날짜 헤더
                  const dateParts = group.dateKey.split("-");
                  const year = dateParts[0];
                  const monthIndex = parseInt(dateParts[1], 10) - 1;
                  const day = dateParts[2];
                  const monthName = monthNames[monthIndex] || "Unknown";
                  const dateColor = getPastelColor(group.dateKey);

                  // 위치
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
                      // 해당 그룹 내 첫 사진의 위치 정보
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
                    <Box key={groupIndex} mb={2}>
                      {/* 날짜 헤더 */}
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
                            <Text fontSize="md" color="gray.600" mb={-2}>
                              {monthName} {year}
                            </Text>
                            <Text fontSize="4xl" fontWeight="bold">
                              {day}일
                            </Text>
                          </>
                        )}
                      </Box>

                      {/* 위치 헤더 */}
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
                              location={city ?? "Unknown"}
                              coordinates={coordinates}
                              isInteractive={false}
                              mapHeight="180px"
                            />
                          )}
                        </Box>
                      )}

                      {/* 사진 갤러리: 인스타그램 스타일 스와이프 */}
                      <Box position="relative" mb={4}>
                        <SwipeableGallery photos={group.photos} />
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

// ------------------------------
// SwipeableGallery 컴포넌트
// ------------------------------

import { motion as framerMotion } from "framer-motion";

interface SwipeableGalleryProps {
  photos: ExtendedPhoto[];
}

const SwipeableGallery: FC<SwipeableGalleryProps> = ({ photos }) => {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);

  const imageIndex = page;

  const paginate = (newDirection: number) => {
    const newPage = page + newDirection;
    if (newPage < 0 || newPage >= photos.length) return; // 루프 방지
    setPage([newPage, newDirection]);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <Box width="100%" height="300px" overflow="hidden" position="relative">
      <AnimatePresence initial={false} custom={direction}>
        <framerMotion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold && imageIndex < photos.length - 1) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold && imageIndex > 0) {
              paginate(-1);
            }
          }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          <ChakraImage
            src={photos[imageIndex].displaySrc}
            alt={`Photo ${imageIndex + 1}`}
            objectFit="cover"
            width="100%"
            height="100%"
            draggable="false"
            loading="lazy"
            fallbackSrc="/images/placeholder.png"
          />
        </framerMotion.div>
      </AnimatePresence>

      {/* 사진 인디케이터 */}
      {photos.length > 1 && (
        <Box
          position="absolute"
          bottom="10px"
          left="50%"
          transform="translateX(-50%)"
          display="flex"
          gap={2}
          zIndex="2" // 인디케이터가 사진 위에 표시되도록 zIndex 설정
        >
          {photos.map((_, idx) => (
            <Box
              key={idx}
              width="5px"
              height="5px"
              borderRadius="full"
              bg={idx === imageIndex ? "white" : "gray.300"}
              boxShadow={idx === imageIndex ? "0 0 4px rgba(0,0,0,0.5)" : "none"}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

