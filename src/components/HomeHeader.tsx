import {
  Box,
  Button,
  Flex,
  Image,
  Text
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
          ml={2}
          size="sm"
          color="blue.500"
          bg="transparent"
          px={1}
          py={2}
          fontSize="sm"
          _hover={{ bg: "blue.50" }}
          _active={{ bg: "blue.500", color: "white" }}
          boxShadow={"0px 4px 6px rgba(0, 0, 0, 0.1)"}
          onClick={onCreateTrip}
        >
          + New Trip
        </Button>
      </Flex>
    </Box>
  );
}