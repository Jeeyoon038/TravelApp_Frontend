// src/components/DiaryTab.tsx

import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
    Badge,
    Box,
    Button,
    Image as ChakraImage,
    Divider,
    HStack,
    IconButton,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Text,
    Textarea,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import BottomTabBar from "../components/BottomTabBar";
import GroupLocationList from "../components/GroupLocationList";
import { Diary, Trip } from "../types/trip";
import { createDiary, fetchAllDiaries, updateDiary } from "../utils/getDiaryApi";
  
  const MotionBox = motion(Box);
  
  const pastelColors = [
    "#f2f2f2",
    "#bee3f8", // blue.50
    "#fbb6ce", // pink.50
    "#c6f6d5", // green.50
    "#fff5b1", // yellow.50
    "#e9d8fd", // purple.50
    "#b2f5ea", // teal.50
    "#ffedcc", // orange.50
    "#c4f1f9", // cyan.50
    "#feb2b2", // red.50
  ];
  
  const DiaryTab: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [diaries, setDiaries] = useState<Diary[]>([]);
    const [tripPhotos, setTripPhotos] = useState<{ [trip_id: number]: string[] }>({});
  
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
    const [currentDiaryContent, setCurrentDiaryContent] = useState<string>("");
    const [currentDiaryDate, setCurrentDiaryDate] = useState<string>("");
    const [currentDiaryTripId, setCurrentDiaryTripId] = useState<number | null>(null);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  
    const toast = useToast();
    const apiUrl = import.meta.env.VITE_API_URL;
  
    // 현재 날짜 가져오기
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  
    // 여행 목록 로드
    useEffect(() => {
      async function fetchTrips() {
        try {
          setLoading(true);
          const response = await axios.get<Trip[]>(`${apiUrl}/trips`);
          setTrips(response.data);
        } catch (err: any) {
          console.error("여행 목록 로드 오류: ", err);
          setError("여행 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      }
  
      fetchTrips();
    }, [apiUrl]);
  
    // 일기 목록 로드
    useEffect(() => {
      async function fetchDiariesData() {
        try {
          const allDiaries = await fetchAllDiaries();
          setDiaries(allDiaries);
        } catch (err: any) {
          console.error("일기 목록 로드 오류: ", err);
          // 일기 로드 실패 시 에러를 표시하지 않아도 됩니다.
        }
      }
  
      fetchDiariesData();
    }, []);
  
    // 여행별 사진 로드 (trips 데이터에서 image_urls 추출)
    useEffect(() => {
      if (trips.length > 0) {
        const photosData: { [trip_id: number]: string[] } = {};
        trips.forEach((trip) => {
          photosData[trip.trip_id] = trip.image_urls;
        });
        setTripPhotos(photosData);
      }
    }, [trips]);
  
    // 일기 작성/수정 모달 열기
    const handleOpenDiaryModal = (tripId: number, date: string, diary?: Diary) => {
      setSelectedDiary(diary || null);
      setCurrentDiaryTripId(tripId);
      setCurrentDiaryDate(date);
      setCurrentDiaryContent(diary ? diary.content : "");
      setSelectedPhotoUrl(diary ? diary.image_url || null : null); // image_url 수정
      onOpen();
    };
  
    // 일기 삭제 핸들러
    const handleDeleteDiary = async (tripId: number, diaryId: string) => {
      try {
        await axios.delete(`${apiUrl}/trips/${tripId}/diaries/${diaryId}`);
        toast({
          title: "일기 삭제 완료",
          description: "일기가 성공적으로 삭제되었습니다.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // 일기 데이터 재로드
        const updatedDiaries = await fetchAllDiaries();
        setDiaries(updatedDiaries);
      } catch (err: any) {
        console.error("일기 삭제 오류:", err);
        toast({
          title: "일기 삭제 실패",
          description: err.response?.data?.message || "일기 삭제 중 오류가 발생했습니다.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
  
    // 일기 저장
    const handleSaveDiary = async () => {
        try {
          if (currentDiaryContent.trim() === "") {
            toast({
              title: "일기 내용 필요",
              description: "일기 내용을 입력해주세요.",
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
            return;
          }
      
          if (currentDiaryTripId === null || currentDiaryDate === "") {
            toast({
              title: "잘못된 요청",
              description: "일기를 저장할 수 없습니다.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            return;
          }
      
          if (selectedDiary) {
            // 기존 일기 수정
            await updateDiary(currentDiaryTripId, selectedDiary._id, {
              content: currentDiaryContent,
              image_url: selectedPhotoUrl || undefined, // image_url 포함
            });
            toast({
              title: "일기 수정 완료",
              description: "일기를 성공적으로 수정했습니다.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } else {
            // 새로운 일기 생성
            await createDiary(currentDiaryTripId, currentDiaryDate, currentDiaryContent, selectedPhotoUrl);
            toast({
              title: "일기 작성 완료",
              description: "일기를 성공적으로 작성했습니다.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          }
      
          // 일기 데이터 재로드
          const updatedDiaries = await fetchAllDiaries();
          setDiaries(updatedDiaries);
      
          onClose();
        } catch (err: any) {
          console.error("일기 저장 오류: ", err);
          toast({
            title: "일기 저장 실패",
            description: err.response?.data?.message || "일기를 저장하는 중 오류가 발생했습니다.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      };
  
    // 여행 데이터 분류
    const categorizeTrips = () => {
      const approachingDeadlineTrips: Trip[] = [];
      const availableTrips: Trip[] = [];
      const now = new Date();
  
      trips.forEach((trip) => {
        const endDate = new Date(trip.end_date);
        const deadline = new Date(endDate);
        deadline.setDate(deadline.getDate() + 7);
  
        if (now > deadline) {
          // 일기 작성 기한이 만료된 여행은 제외
          return;
        }
  
        const remainingTime = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
        if (remainingTime <= 7 && now > endDate) {
          // 일기 작성 기한이 일주일 남은 여행
          approachingDeadlineTrips.push(trip);
        } else if (now <= endDate) {
          // 현재 진행 중인 여행
          availableTrips.push(trip);
        }
      });
  
      // end_date 기준으로 내림차순 정렬
      approachingDeadlineTrips.sort(
        (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
      );
      availableTrips.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  
      return { approachingDeadlineTrips, availableTrips };
    };
  
    const { approachingDeadlineTrips, availableTrips } = categorizeTrips();
  
    // 모든 다이어리를 날짜순으로 정렬 (내림차순)
    const sortedDiaries = [...diaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
    // 날짜별로 다이어리를 그룹화
    const groupedDiaries = sortedDiaries.reduce<{ [date: string]: Diary[] }>((acc, diary) => {
      if (!acc[diary.date]) {
        acc[diary.date] = [];
      }
      acc[diary.date].push(diary);
      return acc;
    }, {});
  
    const sortedDates = Object.keys(groupedDiaries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
    return (
      <Box px={4} py={6}>
        {/* '일기 쓰기가 곧 만료되는 여행' 섹션 */}
        {approachingDeadlineTrips.length > 0 && (
          <Box mb={6}>
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              일기 쓰기가 곧 만료되는 여행
            </Text>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {approachingDeadlineTrips.map((trip) => (
                <MotionBox
                  key={trip.trip_id}
                  p={4}
                  bg={pastelColors[trip.trip_id % pastelColors.length]}
                  borderRadius="md"
                  boxShadow="sm"
                  whileHover={{ scale: 1.05 }}
                  cursor="pointer"
                  onClick={() => handleOpenDiaryModal(trip.trip_id, todayString)}
                >
                  <VStack align="start" spacing={2}>
                    <Text fontSize="lg" fontWeight="bold">
                      {trip.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(trip.start_date).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(trip.end_date).toLocaleDateString("ko-KR")}
                    </Text>
                    <Badge colorScheme="red">일기 작성 기한 임박</Badge>
                  </VStack>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Box>
        )}
  
        {/* '지금 나의 여행' 섹션 */}
        <Box mb={6}>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            지금 나의 여행
          </Text>
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {availableTrips.map((trip) => {
              const tripDiaries = diaries.filter((d) => d.trip_id === trip.trip_id);
              const sortedTripDiaries = tripDiaries.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );
  
              return (
                <MotionBox
                  key={trip.trip_id}
                  p={4}
                  bg={pastelColors[trip.trip_id % pastelColors.length]}
                  borderRadius="md"
                  boxShadow="sm"
                  initial="rest"
                  whileHover={{ scale: 1.02 }}
                >
                  <VStack align="start" spacing={3}>
                    <Text fontSize="lg" fontWeight="bold">
                      {trip.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(trip.start_date).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(trip.end_date).toLocaleDateString("ko-KR")}
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => handleOpenDiaryModal(trip.trip_id, todayString)}
                    >
                      오늘의 일기 쓰기
                    </Button>
                    {/* 일기 스택 */}
                    <Box width="100%">
                      <VStack spacing={1} align="stretch">
                        {sortedTripDiaries.map((diary) => (
                          <HStack key={diary._id} justify="space-between">
                            <MotionBox
                              bg="teal.400"
                              height="10px"
                              borderRadius="full"
                              cursor="pointer"
                              onClick={() => handleOpenDiaryModal(trip.trip_id, diary.date, diary)}
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.5 }}
                            />
                            <IconButton
                              aria-label="Edit Diary"
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => handleOpenDiaryModal(trip.trip_id, diary.date, diary)}
                            />
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </VStack>
                </MotionBox>
              );
            })}
          </SimpleGrid>
        </Box>
  
        {/* 모든 다이어리를 날짜별로 그룹화하여 표시 */}
        <Box mb={6}>
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            모든 다이어리 (날짜순)
          </Text>
          <VStack align="stretch" spacing={4}>
            {sortedDates.map((date) => (
              <Box key={date}>
                <Text fontSize="xl" fontWeight="bold" mb={2}>
                  {new Date(date).toLocaleDateString("ko-KR")}
                </Text>
                <VStack align="stretch" spacing={2} mb={4}>
                  {groupedDiaries[date].map((diary) => {
                    const trip = trips.find((t) => t.trip_id === diary.trip_id);
                    return (
                      <Box
                        key={diary._id}
                        p={4}
                        bg="gray.100"
                        borderRadius="md"
                        boxShadow="sm"
                      >
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="bold">
                            {trip ? trip.title : "알 수 없는 여행"}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(diary.date).toLocaleTimeString("ko-KR", { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </HStack>
                        <Text mb={2}>{diary.content}</Text>
                        {diary.image_url && (
                          <Box mb={2}>
                            <ChakraImage
                              src={diary.image_url}
                              alt="diary-image"
                              w="100%"
                              maxW="400px"
                              borderRadius="md"
                            />
                          </Box>
                        )}
                        <HStack justify="flex-end">
                          <Button
                            size="sm"
                            leftIcon={<EditIcon />}
                            onClick={() => handleOpenDiaryModal(diary.trip_id, diary.date, diary)}
                          >
                            수정
                          </Button>
                          <IconButton
                            aria-label="Delete Diary"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteDiary(diary.trip_id, diary._id)}
                          />
                        </HStack>
                        <Divider mt={4} />
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>
  
        {/* 오늘과 어제 사진 및 일기 표시 */}
        {availableTrips.length > 0 && (
          <Box mb={8}>
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              오늘과 어제의 사진
            </Text>
            <VStack spacing={4} align="stretch">
              {availableTrips.map((trip) => (
                <GroupLocationList key={trip.trip_id} group={{ trip_id: trip.trip_id, image_urls: trip.image_urls }} />
              ))}
            </VStack>
          </Box>
        )}
  
        {/* '내가 다녀온 여행' 섹션 */}
        <Box mb={6}>
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            내가 다녀온 여행
          </Text>
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {trips.map((trip) => {
              const tripEndDate = new Date(trip.end_date);
              const isPast = today > tripEndDate;
              if (!isPast) return null; // 현재 여행은 제외
  
              return (
                <MotionBox
                  key={trip.trip_id}
                  p={4}
                  bg={pastelColors[trip.trip_id % pastelColors.length]}
                  borderRadius="md"
                  boxShadow="sm"
                  whileHover={{ scale: 1.05 }}
                  cursor="pointer"
                  onClick={() => handleOpenDiaryModal(trip.trip_id, todayString)}
                >
                  <VStack align="start" spacing={2}>
                    <Text fontSize="lg" fontWeight="bold">
                      {trip.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(trip.start_date).toLocaleDateString("ko-KR")} ~{" "}
                      {new Date(trip.end_date).toLocaleDateString("ko-KR")}
                    </Text>
                  </VStack>
                </MotionBox>
              );
            })}
          </SimpleGrid>
        </Box>
  
        {/* 일기 작성/수정 모달 */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedDiary ? "일기 수정" : "일기 작성"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="start" spacing={4}>
                <Text>날짜: {currentDiaryDate}</Text>
                {/* 사진 선택 드롭다운 */}
                <Box width="100%">
                  <Text mb={2}>사진 선택 (선택 사항):</Text>
                  <Select
                    placeholder="사진을 선택하지 않으려면 선택하지 마세요."
                    value={selectedPhotoUrl || ""}
                    onChange={(e) => setSelectedPhotoUrl(e.target.value || null)}
                  >
                    {currentDiaryTripId !== null &&
                      tripPhotos[currentDiaryTripId] &&
                      tripPhotos[currentDiaryTripId].map((photoUrl, idx) => (
                        <option key={`photo-option-${idx}`} value={photoUrl}>
                          사진 {idx + 1}
                        </option>
                      ))}
                  </Select>
                </Box>
                <Textarea
                  placeholder="일기를 작성하세요..."
                  value={currentDiaryContent}
                  onChange={(e) => setCurrentDiaryContent(e.target.value)}
                  rows={6}
                />
              </VStack>
            </ModalBody>
  
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleSaveDiary}>
                저장
              </Button>
              <Button variant="ghost" onClick={onClose}>
                취소
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
  
        <Box mt={8}>
          <BottomTabBar />
        </Box>
      </Box>
    );
  };
  
  export default DiaryTab;
  