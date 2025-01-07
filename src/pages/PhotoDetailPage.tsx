// src/pages/PhotoDetailPage.tsx

import { Box, Image as ChakraImage, Heading, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface Photo {
  originalSrc: string;
  displaySrc: string;
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
}

export default function PhotoDetailPage() {
  const location = useLocation();
  const { photo } = (location.state as { photo: Photo }) || {};

  console.log("Received photo object:", photo);

  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setLoading(false);
      return;
    }

    const { displaySrc } = photo;

    // 이미 GroupGallery에서 HEIC 이미지를 변환했으므로, 추가 변환은 필요하지 않습니다.
    setProcessedSrc(displaySrc);
    setLoading(false);
  }, [photo]);

  // 안전 처리
  if (!photo) {
    return (
      <Box p={4}>
        <Text>사진 정보가 존재하지 않습니다.</Text>
      </Box>
    );
  }

  const { date, latitude, longitude } = photo;

  // 날짜 / 위치 null 체크
  const hasDate = !!date;
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>
        사진 상세 정보
      </Heading>

      {/* 실제 이미지 */}
      {loading ? (
        <Spinner size="xl" />
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <ChakraImage
          src={processedSrc || photo.originalSrc}
          alt="detail-img"
          w="100%"
          maxW="500px"
          borderRadius="md"
          mb={4}
        />
      )}

      {/* 날짜 */}
      <Text fontWeight="bold">촬영 날짜</Text>
      {hasDate ? (
        <Text mb={2}>
          {date ? new Date(date).toLocaleString() : "날짜 정보가 존재하지 않습니다."}
        </Text>
      ) : (
        <Text color="gray.500" mb={2}>
          날짜 정보가 존재하지 않습니다.
        </Text>
      )}

      {/* 위치 */}
      <Text fontWeight="bold">위치 정보</Text>
      {hasLocation ? (
        <Text>
          위도: {latitude!.toFixed(6)}, 경도: {longitude!.toFixed(6)}
        </Text>
      ) : (
        <Text color="gray.500">위치 정보가 존재하지 않습니다.</Text>
      )}
    </Box>
  );
}
