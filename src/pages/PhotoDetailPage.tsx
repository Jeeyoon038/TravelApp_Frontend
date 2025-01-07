// src/pages/PhotoDetailPage.tsx

import {
  Box,
  Button,
  Image as ChakraImage,
  Heading,
  Spinner,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface Photo {
  originalSrc: string;
  displaySrc: string;
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
  trip_id: number; // trip_id 추가 (number)
  image_url: string; // image_url 추가
}

export default function PhotoDetailPage() {
  const location = useLocation();
  const { photo } = (location.state as { photo: Photo }) || {};

  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [diaryContent, setDiaryContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    if (!photo) {
      setLoading(false);
      setError("사진 정보가 존재하지 않습니다.");
      return;
    }

    const { displaySrc } = photo;

    // 이미 GroupGallery에서 HEIC 이미지를 변환했으므로, 추가 변환은 필요하지 않습니다.
    setProcessedSrc(displaySrc);
    setLoading(false);
  }, [photo]);

  // 다이어리 제출 핸들러
  const handleSubmitDiary = async () => {
    if (!photo) {
      toast({
        title: "사진 정보 없음",
        description: "다이어리를 작성할 사진 정보가 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!photo.trip_id || photo.trip_id <= 0) { // trip_id 검증 추가
      toast({
        title: "여행 정보 없음",
        description: "다이어리를 작성할 여행 정보가 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!photo.image_url || photo.image_url.trim() === "") { // image_url 검증 추가
      toast({
        title: "이미지 정보 없음",
        description: "다이어리를 첨부할 이미지 정보가 없습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (diaryContent.trim() === "") {
      toast({
        title: "내용 없음",
        description: "다이어리 내용을 입력해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 다이어리 생성 API 호출
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/trips/${photo.trip_id}/diaries`, {
        trip_id: photo.trip_id, // Trip의 trip_id (number) 사용
        date: photo.date ? new Date(photo.date).toISOString().split("T")[0] : undefined,
        content: diaryContent,
        image_url: photo.image_url, // image_url 포함
      });

      toast({
        title: "다이어리 작성 완료",
        description: "다이어리가 성공적으로 작성되었습니다.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // 다이어리 작성 후 폼 초기화
      setDiaryContent("");
    } catch (err: any) {
      console.error("다이어리 작성 오류:", err);
      toast({
        title: "작성 실패",
        description: err.response?.data?.message || "다이어리 작성 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* 다이어리 작성 섹션 */}
      <Box mt={8}>
        <Heading size="md" mb={4}>
          다이어리 작성
        </Heading>
        <Textarea
          placeholder="여기에 다이어리를 작성하세요..."
          value={diaryContent}
          onChange={(e) => setDiaryContent(e.target.value)}
          mb={4}
          rows={6}
        />
        <Button
          colorScheme="teal"
          onClick={handleSubmitDiary}
          isLoading={isSubmitting}
        >
          저장
        </Button>
      </Box>
    </Box>
  );
}
