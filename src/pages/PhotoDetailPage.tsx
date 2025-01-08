import { ArrowBackIcon } from "@chakra-ui/icons";
import { Box, Button, Image as ChakraImage, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapComponent } from "../components/MapComponent";
import { getPhotoMetadata } from "../utils/getPhotoMetadata"; // Metadata 함수 임포트


interface PhotoDetailLocationState {
  trip_id: number;
  image_url: string;
}

export default function PhotoDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trip_id, image_url } = (location.state as PhotoDetailLocationState) || {};

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    <Box h="100vh" overflowY="auto">
      {/* 뒤로가기 버튼 */}
      <Button
        top={4}
        mx={3}
        zIndex={10}
        onClick={() => navigate(-1)}
        bgColor="white"
        fontWeight={300}
        borderRadius="50%" // 버튼을 동그랗게 만듦
        w="50px" // 버튼의 너비를 50px로 설정
        h="50px" // 버튼의 높이를 50px로 설정
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0px 4px 4px rgba(0, 0, 0, 0.1)" // 그림자 추가
      >
        <ArrowBackIcon w={6} h={6} /> {/* 아이콘 크기를 설정 */}
      </Button>

      {/* 내용 */}
      <Box >
        <Box mt={5} mb={4} px={3}>
          <Text fontWeight="bold" ml={3} fontSize={40}>{date || "Unknown"}</Text>
          <Text fontWeight={300} mt={-2} ml={4} >멋있는 사진이네요!</Text>
        </Box>

        <ChakraImage
          src={image_url}
          alt="detail-img"
          w="90%" // 너비를 90%로 설정하여 화면에 여백을 추가
          maxW="400px" // 사진의 최대 너비를 400px로 설정
          borderRadius={20}
          boxShadow="0px 4px 4px rgba(0, 0, 0, 0.10)"
          mb={4}
          mx="auto" // 좌우 여백을 동일하게 추가
        />

        <Box mb={20} p={8} px={8} borderRadius={20} boxShadow="0px 4px 4px rgba(0, 0, 0, 0.10)">
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
    </Box>
  );
}
