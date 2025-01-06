// src/pages/DiaryPage.tsx

import {
  Box,
  Flex,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import DiaryEditor from "../components/DiaryEditor";
import DiaryHeader from "../components/DiaryHeader"; // 가정: 별도의 헤더 컴포넌트
import GroupStorySection from "../components/GroupStorySection";
import PhotoGallery from "../components/diaryPhotoGallery";

import { DiaryEntry, Photo, Trip } from "../types/trip";

const API_BASE_URL = "http://localhost:3000/";

export default function DiaryPage() {
  const [groups, setGroups] = useState<Trip[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Trip | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // 가정: 새로운 기능 추가 시 사용

  // 사용자 정보 (예시)
  const user = {
    profilePicture: "", // 실제 사용자 프로필 사진으로 대체
    name: "User", // 실제 사용자 이름으로 대체
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 여행 목록을 가져오는 함수
  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log("Fetching groups from backend...");
      const response = await axios.get(`${API_BASE_URL}trips`);
      console.log("Groups fetched successfully:", response.data);
      const fetchedGroups: Trip[] = response.data.map((trip: any) => ({
        trip_id: trip.trip_id,
        title: trip.title,
        start_date: trip.start_date,
        end_date: trip.end_date,
        image_urls: trip.image_urls || [],
        member_google_ids: trip.member_google_ids || [],
      }));

      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        setSelectedGroup(fetchedGroups[0]);
        console.log("Selected first group as default:", fetchedGroups[0]);
        fetchPhotos(fetchedGroups[0].trip_id);
      }
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error fetching groups",
        description: error.message || "Failed to fetch groups",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      console.log("Finished fetching groups.");
    }
  };

  // 선택된 여행의 사진들을 가져오는 함수
  const fetchPhotos = async (trip_id: number) => {
    try {
      setLoading(true);
      console.log(`Fetching photos for trip_id: ${trip_id}`);
      const response = await axios.get(`${API_BASE_URL}trips/${trip_id}/photos`);
      console.log("Photos fetched successfully:", response.data);
      const fetchedPhotos: Photo[] = response.data.map((photo: any) => ({
        photo_id: photo.photo_id,
        trip_id: photo.trip_id,
        url: photo.url,
        description: photo.description || "",
      }));
      setPhotos(fetchedPhotos);
    } catch (error: any) {
      console.error("Error fetching photos:", error);
      toast({
        title: "Error fetching photos",
        description: error.message || "Failed to fetch photos",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      console.log("Finished fetching photos.");
    }
  };

  // 여행 선택 핸들러
  const handleSelectGroup = (group: Trip) => {
    setSelectedGroup(group);
    fetchPhotos(group.trip_id);
    setDiaryEntries([]); // 선택 변경 시 기존 일기 초기화
    setSelectedPhoto(null);
  };

  // 사진 선택 핸들러
  const handleSelectPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    const existingEntry = diaryEntries.find(
      (entry) => entry.photo_id === photo.photo_id
    );
    if (existingEntry) {
      // 기존 일기 로드 (필요 시 상태 업데이트)
    }
  };

  // 일기 저장 핸들러
  const handleSaveDiary = async (entry: DiaryEntry) => {
    try {
      // 서버에 일기 저장 요청 (예시)
      const response = await axios.post(`${API_BASE_URL}diaries`, entry);
      if (response.status === 201) {
        setDiaryEntries((prevEntries) => {
          const existingIndex = prevEntries.findIndex(
            (e) => e.photo_id === entry.photo_id
          );
          if (existingIndex >= 0) {
            const updatedEntries = [...prevEntries];
            updatedEntries[existingIndex] = entry;
            return updatedEntries;
          } else {
            return [...prevEntries, entry];
          }
        });
        toast({
          title: "Diary Saved",
          description: "Your diary entry has been saved successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setSelectedPhoto(null); // 저장 후 선택 해제
      } else {
        throw new Error("Failed to save diary entry.");
      }
    } catch (error: any) {
      console.error("Error saving diary:", error);
      toast({
        title: "Error saving diary",
        description: error.message || "Failed to save diary entry.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
        <Text ml={4}>Loading...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="100vh" bg="#F2F2F2">
      <Box flex="1" overflowY="auto" p={4}>
        <DiaryHeader user={user} /> {/* 가정: 별도의 헤더 컴포넌트 */}

        <GroupStorySection
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={handleSelectGroup}
          isHeaderCollapsed={false} // 필요에 따라 조정
        />

        {selectedGroup && (
          <Box mt={6}>
            <Text fontSize="xl" fontWeight="semibold" mb={3}>
              {selectedGroup.title}의 사진들
            </Text>
            <PhotoGallery
              photos={photos}
              selectedPhoto={selectedPhoto}
              onSelectPhoto={handleSelectPhoto}
            />
          </Box>
        )}

        {selectedPhoto && (
          <Box mt={6}>
            <DiaryEditor
              photo={selectedPhoto}
              existingEntry={diaryEntries.find(
                (entry) => entry.photo_id === selectedPhoto.photo_id
              )}
              onSave={handleSaveDiary}
              onCancel={() => setSelectedPhoto(null)}
            />
          </Box>
        )}

        {/* 일기 목록 표시 */}
        {diaryEntries.length > 0 && (
          <Box mt={6}>
            <Text fontSize="xl" fontWeight="semibold" mb={3}>
              작성한 일기들
            </Text>
            <Flex direction="column" gap={4}>
              {diaryEntries.map((entry) => (
                <Box
                  key={entry.photo_id}
                  p={4}
                  bg="white"
                  boxShadow="md"
                  borderRadius="md"
                >
                  <Text fontWeight="bold" mb={2}>
                    사진 ID: {entry.photo_id}
                  </Text>
                  <Text>{entry.content}</Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    {new Date(entry.date).toLocaleString()}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>
        )}
      </Box>

      <Box position="sticky" bottom="0" zIndex="10">
        <BottomTabBar />
      </Box>
    </Flex>
  );
}
