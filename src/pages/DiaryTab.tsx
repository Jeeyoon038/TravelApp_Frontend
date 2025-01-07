// src/components/DiaryTab.tsx

import {
    Box,
    Button,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useDisclosure,
    useToast,
    VStack
} from "@chakra-ui/react";
import axios from "axios";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import BottomTabBar from "../components/BottomTabBar";
import GroupLocationList from "../components/GroupLocationList"; // GroupLocationList import
import { Diary, Trip } from "../types/trip.ts";
import { createDiary, fetchAllDiaries, updateDiary } from "../utils/getDiaryApi";
  
  const MotionBox = motion(Box);
  
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
  
  const DiaryTab: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [diaries, setDiaries] = useState<Diary[]>([]);
  
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentDiaryTripId, setCurrentDiaryTripId] = useState<string | null>(null);
    const [currentDiaryContent, setCurrentDiaryContent] = useState<string>("");
    const [currentDiaryDate, setCurrentDiaryDate] = useState<string>("");
  
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
          const response = await axios.get(`${apiUrl}/trips`);
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
  
    // 일기 작성 모달 열기
    const handleOpenDiaryModal = (tripId: string, date: string) => {
      setCurrentDiaryTripId(tripId);
      setCurrentDiaryDate(date);
      const existingDiary = diaries.find(d => d.trip_id === tripId && d.date === date);
      setCurrentDiaryContent(existingDiary ? existingDiary.content : "");
      onOpen();
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
  
        // 기존 일기 여부 확인
        const existingDiary = diaries.find(d => d.trip_id === currentDiaryTripId && d.date === currentDiaryDate);
        if (existingDiary) {
          // 일기 수정
          await updateDiary(currentDiaryTripId, existingDiary._id, currentDiaryContent);
          toast({
            title: "일기 수정 완료",
            description: "일기를 성공적으로 수정했습니다.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          // 새로운 일기 생성
          await createDiary(currentDiaryTripId, currentDiaryDate, currentDiaryContent);
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
          description: "일기를 저장하는 중 오류가 발생했습니다.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
  
    // '지금 나의 여행'과 '내가 다녀온 여행' 분류
    const categorizeTrips = () => {
      const currentTrips: Trip[] = [];
      const pastTrips: { trip: Trip; remainingDays: number }[] = [];
      const now = new Date();
  
      trips.forEach(trip => {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
  
        if (now >= startDate && now <= endDate) {
          currentTrips.push(trip);
        } else if (now > endDate) {
          const oneWeekAfterEnd = new Date(endDate);
          oneWeekAfterEnd.setDate(oneWeekAfterEnd.getDate() + 7);
          const remainingTime = (oneWeekAfterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (remainingTime >= 0) {
            pastTrips.push({
              trip,
              remainingDays: Math.ceil(remainingTime),
            });
          }
        }
      });
  
      // 남은 시간이 적은 순으로 정렬
      pastTrips.sort((a, b) => a.remainingDays - b.remainingDays);
  
      return { currentTrips, pastTrips };
    };
  
    const { currentTrips, pastTrips } = categorizeTrips();
  
    return (
      <Box px={4} py={6}>
        {/* '지금 나의 여행' 섹션 */}
        <Box mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
            지금 나의 여행
          </Text>
          <Text fontSize="sm" color="gray.500">
            여행은 즐거우신가요?
          </Text>
        </Box>
  
        {/* 현재 여행 목록 */}
        {currentTrips.length > 0 && (
          <VStack spacing={4} align="stretch" mb={8}>
            {currentTrips.map(trip => (
              <Box
                key={trip._id}
                p={4}
                bg={pastelColors[parseInt(trip._id.slice(-1)) % pastelColors.length]}
                borderRadius="md"
                boxShadow="sm"
                width="100%"
              >
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold">{trip.title}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(trip.start_date).toLocaleDateString("ko-KR")} ~ {new Date(trip.end_date).toLocaleDateString("ko-KR")}
                    </Text>
                  </VStack>
                  <Button size="sm" colorScheme="teal" onClick={() => handleOpenDiaryModal(trip._id, todayString)}>
                    오늘의 일기 쓰기
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
  
        {/* 오늘과 어제 사진 및 일기 표시 */}
        {currentTrips.length > 0 && (
          <Box mb={8}>
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              오늘과 어제의 사진
            </Text>
            <VStack spacing={4} align="stretch">
              {currentTrips.map(trip => (
                <GroupLocationList key={trip._id} group={trip} />
              ))}
            </VStack>
          </Box>
        )}
  
        {/* '내가 다녀온 여행' 섹션 */}
        <Box mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
            내가 다녀온 여행
          </Text>
        </Box>
  
        {/* 과거 여행 목록 */}
        {pastTrips.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {pastTrips.map(({ trip, remainingDays }) => (
              <MotionBox
                key={trip._id}
                p={4}
                bg={pastelColors[parseInt(trip._id.slice(-1)) % pastelColors.length]}
                borderRadius="md"
                boxShadow="sm"
                animate={remainingDays <= 3 ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={remainingDays <= 3 ? { repeat: Infinity, duration: 1 } : {}}
              >
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold">{trip.title}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(trip.start_date).toLocaleDateString("ko-KR")} ~ {new Date(trip.end_date).toLocaleDateString("ko-KR")}
                    </Text>
                    {remainingDays <= 3 && (
                      <Text fontSize="sm" color="red.500">
                        일기를 작성할 수 있는 남은 시간: {remainingDays}일
                      </Text>
                    )}
                  </VStack>
                  <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={() => handleOpenDiaryModal(trip._id, todayString)}
                  >
                    일기 작성
                  </Button>
                </HStack>
              </MotionBox>
            ))}
          </VStack>
        ) : (
          <Text textAlign="center" color="gray.500">
            다녀온 여행이 없습니다.
          </Text>
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
                placeholder="오늘의 일기를 작성하세요..."
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
  
        <Box mt={8}>
          <BottomTabBar />
        </Box>
      </Box>
    );
  };
  
  export default DiaryTab;
  