import { Box, Image as ChakraImage, Heading, Text } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";


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

  useEffect(() => {
    if (!trip_id || !image_url) {
      setError("Invalid photo or trip information.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        
        // Fetch trip details to get creator information
        const tripResponse = await axios.get(`${apiUrl}/trips/${trip_id}`);
        setCreator((tripResponse.data as { created_by: string }).created_by);

        // Fetch diaries
        //const diariesResponse = await axios.get(
          //`${apiUrl}/trips/${trip_id}/diaries`,
          //{
            //params: {
              //image_url: image_url,
            //},
         // }
        //);
        //setDiaries(diariesResponse.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Failed to load photo information.");
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
        <Text>
          {new Date().toLocaleDateString()}
        </Text>
      </Box>

      <Box mb={4}>
        <Text fontWeight="bold">위치 정보</Text>
        <Text>
          위도: {/* Replace with actual latitude */} 
          경도: {/* Replace with actual longitude */}
        </Text>
      </Box>
    </Box>
  );
}