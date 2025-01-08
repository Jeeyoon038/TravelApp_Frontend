import { Box, Image as ChakraImage, Heading, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapComponent } from "../components/MapComponent";
import { getPhotoMetadata } from "../utils/getPhotoMetadata"; // Metadata 함수 임포트


interface PhotoDetailLocationState {
  trip_id: number;
  image_url: string;
}

export default function PhotoDetailPage() {
  const location = useLocation();
  const { trip_id, image_url } = (location.state as PhotoDetailLocationState) || {};

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    if (!trip_id || !image_url) {
      setError("Invalid photo or trip information.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 메타데이터 가져오기
        const metadata = await getPhotoMetadata(image_url);
        setDate(metadata.date ? new Date(metadata.date).toLocaleDateString() : null);
        setLatitude(metadata.latitude);
        setLongitude(metadata.longitude);

        // Trip 정보 가져오기 (예: 작성자 정보)
        // 실제 API 호출이 필요하다면 이 부분 추가
        setCreator("Unknown Author"); // 예제: Unknown으로 표시
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setError("Failed to load photo metadata.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trip_id, image_url]);

  if (!trip_id || !image_url) {
    return (
      <Box p={4}>
        <Text>Invalid photo or trip information.</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={4}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>
        사진 상세 정보
      </Heading>

      <ChakraImage
        src={image_url}
        alt="detail-img"
        w="100%"
        maxW="500px"
        borderRadius="md"
        mb={4}
      />

      <Box mb={4}>
        <Text fontWeight="bold">작성자</Text>
        <Text>{creator || "Unknown"}</Text>
      </Box>

      <Box mb={4}>
        <Text fontWeight="bold">촬영 날짜</Text>
        <Text>{date || "Unknown"}</Text>
      </Box>

      <Box mb={4}>
        <Text fontWeight="bold">위치 정보</Text>
        <Text>
          위도: {latitude || "Unknown"}, 경도: {longitude || "Unknown"}
        </Text>
        {latitude && longitude && (
          <MapComponent
            coordinates={{ lat: latitude, lng: longitude }}
            location="촬영 위치"
            isInteractive={false}
            mapHeight="300px"
          />
        )}
      </Box>
    </Box>
  );
}
