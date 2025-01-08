import { AddIcon } from "@chakra-ui/icons";
import {
  Box, Button, Flex,
  Icon,
  Image,
  Modal,
  ModalBody, ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleProfile from "./GoogleProfile";
import ProfileImage, { UserProfile } from "./ProfileImage";

interface HomeHeaderProps {
  onCreateTrip: () => void;
}

export default function HomeHeader({ onCreateTrip }: HomeHeaderProps) {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  const fetchUserData = useCallback(async () => {
    const storedName = localStorage.getItem('user_displayName'); // Updated to match login storage
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

  const handleLogout = async () => {
    try {
      //const token = localStorage.getItem('access_token');

      // Close modal first
      onClose();

      // Clear all localStorage
      localStorage.clear();
      
      // Reset user state
      setUserData(null);

      // Revoke Google token if available
     // if (token && window.google?.accounts?.oauth2?.revoke) {
       // try {
         // await window.google.accounts.oauth2.revoke(token);
        //} catch (revokeError) {
          //console.error('Error revoking token:', revokeError);
       // }
      //}

      // Show success message
      toast({
        title: "로그아웃 성공",
        description: "성공적으로 로그아웃되었습니다.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Use a timeout to ensure toast is visible and prevent navigation throttling
      setTimeout(() => {
        // Use navigate instead of window.location for smoother transition
        navigate('/', { replace: true });
      }, 300);

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
    <Box 
      bg="white" 
      boxShadow="md" 
      borderTopRadius={0} 
      borderBottomRadius={10} 
      p={4}
      position="relative"
      zIndex={1}
    >
      <Flex alignItems="center" mb={3}>
      {/* 로고 이미지 추가 */}
      <Image 
        src="/logo.png" 
        alt="My Travel Log Logo"
        maxHeight="40px"
        maxWidth="200px"
        mr={3} 
      />

      
    </Flex>
 
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
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          isCentered
          motionPreset="slideInBottom"
        >
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
                  position="relative"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'md'
                  }}
                  transition="all 0.2s"
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