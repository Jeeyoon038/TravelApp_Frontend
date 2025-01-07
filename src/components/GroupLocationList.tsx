// src/components/GroupLocationList.tsx

import {
    Box,
    Button,
    Image as ChakraImage,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Textarea,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Group } from "../types/group";
import { Diary } from "../types/trip.ts";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import DiarySquare from "./DiarySquare"; // DiarySquare import
  
  const pastelColors = [
    '#f2f2f2',
    '#bee3f8', // blue.50
    '#fbb6ce', // pink.50
    '#c6f6d5', // green.50
    '#fff5b1', // yellow.50
    '#e9d8fd', // purple.50
    '#b2f5ea', // teal.50
    '#ffedcc', // orange.50
    '#c4f1f9', // cyan.50
    '#feb2b2', // red.50
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
  
  interface GalleryPhoto {
    originalSrc: string;
    displaySrc: string;
    date: Date | null;
    latitude: number | null;
    longitude: number | null;
    country: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    street: string | null;
  }
  
  interface PhotoGroup {
    dateKey: string;
    photos: GalleryPhoto[];
    diary?: Diary;
  }
  
  interface GroupLocationListProps {
    group: Group;
  }
  
  const GroupLocationList: React.FC<GroupLocationListProps> = ({ group }) => {
    const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [groupedPhotoData, setGroupedPhotoData] = useState<PhotoGroup[]>([]);
    const [diaries, setDiaries] = useState<Diary[]>([]);
  
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentDiaryDate, setCurrentDiaryDate] = useState<string>("");
    const [currentDiaryContent, setCurrentDiaryContent] = useState<string>("");
  
    const apiUrl = import.meta.env.VITE_API_URL;
  
    // 사진 메타데이터 로드
    useEffect(() => {
      let isMounted = true;
      setIsLoading(true);
      setError(null);
  
      async function loadMetadata() {
        try {
          const array: GalleryPhoto[] = [];
  
          for (const src of group.image_urls) {
            // getPhotoMetadata는 EXIF, HEIC, 역지오코딩을 처리합니다.
            const meta: PhotoMetadata = await getPhotoMetadata(src);
  
            array.push({
              originalSrc: src,
              displaySrc: meta.displaySrc,
              date: meta.date,
              latitude: meta.latitude,
              longitude: meta.longitude,
              country: meta.country,
              city: meta.city,
              state: meta.state,
              postalCode: meta.postalCode,
              street: meta.street,
            });
          }
  
          // 날짜 기준 오름차순 정렬 (날짜 없는 사진은 마지막에 배치)
          array.sort((a, b) => {
            if (a.date && b.date) return a.date.getTime() - b.date.getTime();
            if (a.date) return -1;
            if (b.date) return 1;
            return 0;
          });
  
          if (isMounted) setPhotos(array);
        } catch (err) {
          console.error("메타데이터 로드 오류: ", err);
          if (isMounted) {
            setError("사진 데이터를 로드하는 중 오류가 발생했습니다.");
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
  
      loadMetadata();
  
      return () => {
        isMounted = false;
      };
    }, [group.image_urls]);
  
    // 일기 데이터 로드
    useEffect(() => {
      async function fetchDiaries() {
        try {
          const response = await axios.get(`${apiUrl}/trips/${group._id}/diaries`);
          setDiaries(response.data);
        } catch (err: any) {
          console.error("일기 데이터 로드 오류: ", err);
          setError("일기 데이터를 로드하는 중 오류가 발생했습니다.");
        }
      }
  
      fetchDiaries();
    }, [group._id, apiUrl]);
  
    // 날짜별로 사진 그룹화
    function groupPhotosByDate(photos: GalleryPhoto[]): PhotoGroup[] {
      const result: PhotoGroup[] = [];
      let currentDateGroup: PhotoGroup | null = null;
  
      photos.forEach((photo) => {
        const dateKey = photo.date
          ? new Date(photo.date).toISOString().slice(0, 10)
          : "Unknown Date";
  
        if (!currentDateGroup || currentDateGroup.dateKey !== dateKey) {
          currentDateGroup = {
            dateKey,
            photos: [photo],
            diary: diaries.find(d => d.date === dateKey),
          };
          result.push(currentDateGroup);
        } else {
          currentDateGroup.photos.push(photo);
        }
      });
  
      return result;
    }
  
    // 그룹화된 데이터를 상태로 관리
    useEffect(() => {
      const grouped = groupPhotosByDate(photos);
      setGroupedPhotoData(grouped);
    }, [photos, diaries]);
  
    // 일기 작성 모달 열기
    const handleOpenDiaryModal = (date: string, existingContent?: string) => {
      setCurrentDiaryDate(date);
      setCurrentDiaryContent(existingContent || "");
      onOpen();
    };
  
    // 일기 저장
    const handleSaveDiary = async () => {
      try {
        if (currentDiaryContent.trim() === "") {
          alert("일기 내용을 입력해주세요.");
          return;
        }
  
        // 기존 일기 여부 확인
        const existingDiary = diaries.find(d => d.date === currentDiaryDate);
        if (existingDiary) {
          // 일기 수정
          await axios.put(`${apiUrl}/trips/${group._id}/diaries/${existingDiary._id}`, {
            content: currentDiaryContent,
          });
        } else {
          // 새로운 일기 생성
          await axios.post(`${apiUrl}/trips/${group._id}/diaries`, {
            trip_id: group._id,
            date: currentDiaryDate,
            content: currentDiaryContent,
          });
        }
  
        // 일기 데이터 재로드
        const response = await axios.get(`${apiUrl}/trips/${group._id}/diaries`);
        setDiaries(response.data);
  
        onClose();
      } catch (err: any) {
        console.error("일기 저장 오류: ", err);
        alert("일기를 저장하는 중 오류가 발생했습니다.");
      }
    };
  
    // DiaryCard 컴포넌트
    const DiaryCard: React.FC<{ group: PhotoGroup }> = ({ group }) => {
      // 첫 번째 사진의 날짜 및 시간 가져오기
      const firstPhoto = group.photos[0];
      const date = firstPhoto.date
        ? new Date(firstPhoto.date)
        : null;
  
      const dateString = date
        ? date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "알 수 없는 날짜";
  
      const timeString = date
        ? date.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "알 수 없는 시간";
  
      return (
        <Box
          bg={getPastelColor(group.dateKey)}
          borderRadius="lg"
          boxShadow="md"
          p={6}
          mb={6}
          width="100%"
        >
          <VStack align="start" spacing={4}>
            {/* 날짜 및 시간 */}
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                {dateString} {timeString}
              </Text>
            </Box>
  
            {/* 일기 내용 */}
            <Box width="100%">
              {group.diary ? (
                <>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>
                    일기
                  </Text>
                  <Box p={4} bg="gray.100" borderRadius="md" width="100%">
                    <Text whiteSpace="pre-wrap">{group.diary.content}</Text>
                  </Box>
                  <Button mt={2} size="sm" onClick={() => handleOpenDiaryModal(group.dateKey, group.diary?.content)}>
                    일기 수정
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => handleOpenDiaryModal(group.dateKey)}>
                  일기 작성
                </Button>
              )}
            </Box>
  
            {/* 사진 및 일기 정사각형 배열 */}
            <HStack spacing={4} overflowX="auto" width="100%">
              {/* 사진 */}
              {group.photos.map((photo, idx) => (
                <Box key={`photo-${idx}`} flex="0 0 auto">
                  <ChakraImage
                    src={photo.displaySrc}
                    alt={`Photo ${idx + 1}`}
                    boxSize="150px"
                    objectFit="cover"
                    borderRadius="md"
                    boxShadow="sm"
                  />
                </Box>
              ))}
  
              {/* 일기 정사각형 */}
              {group.diary && (
                <DiarySquare
                  diary={{
                    content: group.diary.content,
                    date: group.dateKey,
                  }}
                />
              )}
            </HStack>
          </VStack>
        </Box>
      );
    };
  
    return (
      <Box px={4} mb={8}>
        <Text fontSize="3xl" fontWeight="bold" mb={6}>
          여행 일정
        </Text>
  
        {/* 로딩 및 에러 표시 */}
        {isLoading && (
          <Box textAlign="center" my={4}>
            <Spinner size="lg" />
            <Text mt={2}>일정 데이터를 로드 중...</Text>
          </Box>
        )}
        {error && (
          <Box textAlign="center" my={4}>
            <Text color="red.500">{error}</Text>
          </Box>
        )}
  
        {/* 일정 리스트 */}
        {!isLoading && !error && groupedPhotoData.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {groupedPhotoData.map((group, idx) => (
              <DiaryCard key={`diary-${idx}`} group={group} />
            ))}
          </VStack>
        ) : (
          !isLoading && !error && (
            <Text textAlign="center" color="gray.500">
              표시할 일정 데이터가 없습니다.
            </Text>
          )
        )}
  
        {/* 일기 작성/수정 모달 */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>일기 작성</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={2}>날짜: {currentDiaryDate}</Text>
              <Textarea
                placeholder="일기를 작성하세요..."
                value={currentDiaryContent}
                onChange={(e) => setCurrentDiaryContent(e.target.value)}
                rows={6}
              />
            </ModalBody>
  
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleSaveDiary}>
                저장
              </Button>
              <Button variant="ghost" onClick={onClose}>취소</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    );
  };
  
  export default GroupLocationList;
  