// src/pages/ProfilePage.tsx
import {
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    HStack,
    Image,
    Spacer,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface ProfilePageProps {
  user: {
    access_token: string;
    email: string;
    name: string;
    profilePicture: string;
  };
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

const mockTrips = [
  {
    id: 1,
    title: "제주도 여행",
    imageUrl: "/images/image3.jpg",
  },
  {
    id: 2,
    title: "강원도 가족 여행",
    imageUrl: "/images/image5.jpg",
  },
  {
    id: 3,
    title: "서울 워크샵",
    imageUrl: "/images/image9.jpg",
  },
  {
    id: 4,
    title: "몰입캠프",
    imageUrl: "/images/image1.jpg",
  },
  // 추가적인 mock 데이터...
];

export default function ProfilePage({ user, setUser }: ProfilePageProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_profile_picture");

    // Update user state
    setUser(null);

    // Show logout toast
    toast({
      title: "로그아웃 완료",
      description: "성공적으로 로그아웃되었습니다.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    // Navigate to login page
    navigate("/");
  };

  return (
    <Flex direction="column" minH="100vh" bg="#F2F2F2">
      {/* Profile Header */}
      <Box bg="white" boxShadow="md" p={4}>
        <Flex align="center">
          <Image
            src={user.profilePicture}
            alt={`${user.name} 프로필`}
            boxSize="100px"
            borderRadius="full"
            objectFit="cover"
            mr={6}
          />
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">
              {user.name}
            </Text>
            <Text color="gray.500">{user.email}</Text>
            <HStack spacing={4}>
              <VStack>
                <Text fontWeight="bold">10</Text>
                <Text fontSize="sm" color="gray.500">
                  게시물
                </Text>
              </VStack>
              <VStack>
                <Text fontWeight="bold">50</Text>
                <Text fontSize="sm" color="gray.500">
                  팔로워
                </Text>
              </VStack>
              <VStack>
                <Text fontWeight="bold">30</Text>
                <Text fontSize="sm" color="gray.500">
                  팔로잉
                </Text>
              </VStack>
            </HStack>
          </VStack>
          <Spacer />
          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="outline"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </Flex>
      </Box>

      {/* User's Trips Grid */}
      <Box flex="1" p={4}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          여행 기록
        </Text>
        <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={4}>
          {mockTrips.map((trip) => (
            <GridItem key={trip.id} bg="white" borderRadius="md" overflow="hidden" boxShadow="sm">
              <Image src={trip.imageUrl} alt={trip.title} objectFit="cover" width="100%" height="100px" />
              <Box p={2}>
                <Text fontWeight="medium" noOfLines={1}>
                  {trip.title}
                </Text>
              </Box>
            </GridItem>
          ))}
        </Grid>
      </Box>
    </Flex>
  );
}
