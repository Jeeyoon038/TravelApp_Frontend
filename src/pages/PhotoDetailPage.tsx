// src/pages/PhotoDetailPage.tsx

import { Box, Image as ChakraImage, Heading, Spinner, Text, useToast } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DiaryForm from "../components/DiaryForm";
import DiaryList from "../components/DiaryList";
import { Diary } from "../types/diary";

interface PhotoDetailLocationState {
  trip_id: number;
  image_url: string;
}

export default function PhotoDetailPage() {
  const location = useLocation();
  const { trip_id, image_url } = (location.state as PhotoDetailLocationState) || {};

  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    if (!trip_id || !image_url) {
      setError("Invalid photo or trip information.");
      setLoading(false);
      return;
    }

    const fetchDiaries = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(
          `${apiUrl}/trips/${trip_id}/diaries`,
          {
            params: {
              image_url: image_url,
            },
          }
        );
        setDiaries(response.data);
      } catch (err: any) {
        console.error("Error fetching diaries:", err);
        setError("Failed to load diary entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, [trip_id, image_url]);

  const handleDiaryCreated = (newDiary: Diary) => {
    setDiaries((prevDiaries) => [newDiary, ...prevDiaries]);
  };

  // Safe handling
  if (!trip_id || !image_url) {
    return (
      <Box p={4}>
        <Text>Invalid photo or trip information.</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>
        사진 상세 정보
      </Heading>

      {/* Actual Image */}
      <ChakraImage
        src={image_url}
        alt="detail-img"
        w="100%"
        maxW="500px"
        borderRadius="md"
        mb={4}
      />

      {/* Date */}
      <Box mb={4}>
        <Text fontWeight="bold">촬영 날짜</Text>
        <Text>
          {new Date().toLocaleDateString()} {/* Replace with actual date if available */}
        </Text>
      </Box>

      {/* Location */}
      <Box mb={4}>
        <Text fontWeight="bold">위치 정보</Text>
        <Text>
          위도: {/* Replace with actual latitude if available */} 경도: {/* Replace with actual longitude if available */}
        </Text>
      </Box>

      {/* Diaries Section */}
      <Box mt={8}>
        <Heading size="lg" mb={4}>
          Diary Entries
        </Heading>

        {loading ? (
          <Box textAlign="center" my={4}>
            <Spinner size="lg" />
            <Text mt={2}>Loading diaries...</Text>
          </Box>
        ) : error ? (
          <Box textAlign="center" my={4}>
            <Text color="red.500">{error}</Text>
          </Box>
        ) : (
          <DiaryList diaries={diaries} />
        )}

        {/* Diary Form */}
        <DiaryForm
          tripId={trip_id}
          imageUrl={image_url}
          onDiaryCreated={handleDiaryCreated}
        />
      </Box>
    </Box>
  );
}
