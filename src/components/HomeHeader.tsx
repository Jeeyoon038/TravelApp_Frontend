// HomeHeader.tsx
// Add this to a .d.ts file or at the top of your HomeHeader.tsx
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          revoke: (token: string | null) => void;
        };
      };
    };
  }
}


import { Box, Button, Flex, Text, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalBody, ModalCloseButton, useDisclosure, 
  Icon, useToast} from "@chakra-ui/react";
import GoogleProfile from "./GoogleProfile";
import ProfileImage from "./ProfileImage";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "./ProfileImage";
import { AddIcon } from "@chakra-ui/icons";

interface HomeHeaderProps {
  onCreateTrip: () => void;
}

export default function HomeHeader({ onCreateTrip }: HomeHeaderProps) {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  const fetchUserData = useCallback(async () => {
    const storedName = localStorage.getItem('user_name');
    const storedPhoto = localStorage.getItem('user_photo');
    
    if (storedName && storedPhoto) {
      setUserData({
        displayName: storedName,
        photo: storedPhoto
      });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

// HomeHeader.tsx
const handleLogout = async () => {
  try {
    // 1. Clear all localStorage
    localStorage.clear();
    
    // 2. Reset user state
    setUserData(null);
    
    // 3. Close modal
    onClose();

    // 4. Show success message
    toast({
      title: "로그아웃 성공",
      description: "성공적으로 로그아웃되었습니다.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    
    // 5. Force reload the page while navigating to ensure clean state
    window.location.href = '/';

  } catch (error) {
    console.error('Error during logout:', error);
    toast({
      title: "로그아웃 실패",
      description: "로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};

  return (
    <Box bg="white" boxShadow="md" borderTopRadius={0} borderBottomRadius={10} p={4}>
      <Text fontWeight="bold" fontSize={24} mb={3}>
        My Travel Log
      </Text>
 
      <Flex alignItems="center">
        {userData ? (
          <ProfileImage 
            user={userData} 
            size={40} 
            onClick={onOpen}
          />
        ) : (
          <GoogleProfile />
        )}

        <Text fontSize="md" ml={3}>
          {userData?.displayName}
        </Text>

        <Button
          ml="auto"
          size="sm" 
          color="blue.500"
          bg="transparent"
          px={3}
          py={1}
          _hover={{ bg: "blue.50" }}
          _active={{ bg: "blue.500", color: "white" }}
          onClick={onCreateTrip}
          borderRadius="lg"
          border="0.5px solid"
          fontSize="sm"
          display="flex"
          alignItems="center"
        >
          <Icon as={AddIcon} boxSize={3} mr={1} />
          Add Your Story
        </Button>
      </Flex>

      {userData && (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader textAlign="center">Profile Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Flex direction="column" alignItems="center">
                <ProfileImage 
                  user={userData}
                  size={100}
                />
                <Text fontSize="lg" fontWeight="bold" my={4}>
                  {userData.displayName}
                </Text>
                <Button 
                  colorScheme="red" 
                  onClick={handleLogout}
                  mb={4}
                  width="full"
                >
                  Logout
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}