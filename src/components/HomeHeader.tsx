// HomeHeader.tsx
import { Box, Button, Flex, Text, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalBody, ModalCloseButton, useDisclosure, 
  Icon} from "@chakra-ui/react";
import GoogleProfile from "./GoogleProfile";
import ProfileImage from "./ProfileImage";
import { useEffect, useState } from "react";
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

  const handleLogout = async () => {
    try {
      // Clear all local storage items
      localStorage.clear();
      
      // Reset user data state
      setUserData(null);
      
      // Close the modal
      onClose();
      
      // Navigate to root (login) page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedName = localStorage.getItem('user_name');
        const storedPhoto = localStorage.getItem('user_photo');
        
        if (storedName && storedPhoto) {
          setUserData({
            displayName: storedName,
            photo: storedPhoto
          });
        } else {
          // If no user data is found, redirect to login
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/', { replace: true });
      }
    };

    fetchUserData();
  }, [navigate]);

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

  <Text  fontSize="md" ml={3}>
    {userData?.displayName && `${userData.displayName}`}
  </Text>

  <Button
    ml="auto"  // This will push the button to the right
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