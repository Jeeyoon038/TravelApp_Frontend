import React from "react";
import { 
  Box, 
  Flex, 
  Text, 
  Image, 
  Button 
} from "@chakra-ui/react";

interface HomeHeaderProps {
  user: {
    profilePicture?: string;
    name?: string;
  };
  onCreateTrip: () => void;
}

export default function HomeHeader({ user, onCreateTrip }: HomeHeaderProps) {
  return (
    <Box bg="white" boxShadow="md" borderTopRadius={0} borderBottomRadius={10} p={4}>
      <Text fontWeight="bold" fontSize={24} mb={3}>
        My Travel Log
      </Text>

      <Flex alignItems="center">
        <Image
          src={user.profilePicture || "/images/default-profile.jpg"}
          alt="User Profile"
          boxSize="45px"
          borderRadius="full"
          objectFit="cover"
          mr={4}
        />
        <Text fontWeight={500} fontSize="sm" mr={2}>
          {user ? "여행을 함께 할 새로운 그룹을 생성하세요." : "로그인 해주세요."}
        </Text>
        <Button
          size="sm"
          bg="white"
          color="blue.500"
          border="1px"
          borderColor="blue.500"
          borderRadius="md"
          _hover={{ bg: "blue.50", color: "blue.600" }}
          boxShadow="sm"
          onClick={onCreateTrip}
        >
          + New Trip
        </Button>
      </Flex>
    </Box>
  );
}