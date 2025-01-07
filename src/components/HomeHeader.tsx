//HomeHeader.tsx
import { Box, Button, Flex, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from "@chakra-ui/react";
import GoogleProfile from "./GoogleProfile";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

interface HomeHeaderProps {
  onCreateTrip: () => void;
}

interface UserData {
  displayName: string;
  photo: string;
}

export default function HomeHeader({ onCreateTrip }: HomeHeaderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.clear();
      setUserData(null);
      onClose();
      navigate('/'); // This will redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = localStorage.getItem('user_name');
        const storedPhoto = localStorage.getItem('user_photo');
        
        console.log('Stored data:', { storedName, storedPhoto }); // Debug log

        if (storedName && storedPhoto) {
          setUserData({
            displayName: storedName,
            photo: storedPhoto
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  

  return (
    <Box bg="white" boxShadow="md" borderTopRadius={0} borderBottomRadius={10} p={4}>
      <Text fontWeight="bold" fontSize={24} mb={3}>
        My Travel Log
      </Text>

      <Flex alignItems="center">
        <Box 
          boxSize="45px" 
          borderRadius="full" 
          overflow="hidden" 
          mr={4}
          cursor={userData ? "pointer" : "default"}
          onClick={userData ? onOpen : undefined}
        >
          {userData?.photo ? (
            <img
              src={userData.photo}
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '0%'
              }}
            />
          ) : (
            <GoogleProfile />
          )}
        </Box>

        <Text fontWeight={500} fontSize="sm" mr={2}>
          {userData?.displayName
            ? `${userData.displayName}님, 여행을 함께 할 새로운 그룹을 생성하세요.`
            : "로그인 해주세요."}
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

      {userData && (  // Only render modal if userData exists
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader textAlign="center">Profile Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Flex direction="column" alignItems="center">
                <Box 
                  boxSize="100px" 
                  borderRadius="full" 
                  overflow="hidden" 
                  mb={4}
                >
                  {userData.photo && (
                    <img
                      src={userData.photo}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                </Box>
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  {userData.displayName}
                </Text>
                <Button 
                  colorScheme="red" 
                  onClick={handleLogout}
                  mb={4}
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