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

        <Text fontWeight={500} fontSize="s" ml={3} mr={2}>
          {userData?.displayName
            ? `${userData.displayName}, Add Your Travel Story`
            : "Please Sign In to Continue"}
        </Text>

        <Button
            ml="auto"  // Changed from ml={2} to ml="auto" to push it to the right
            mr={4}     // Added margin-right for some spacing from the edge
            size="sm"
            color="blue.500"
            bg="transparent"
            p={2}
            minW="32px"
            h="32px"
            _hover={{ bg: "blue.50" }}
            _active={{ bg: "blue.500", color: "white" }}
            boxShadow={"0px 4px 6px rgba(0, 0, 0, 0.1)"}
            onClick={onCreateTrip}
            borderRadius="full"
          >
            <Icon as={AddIcon} boxSize={4} />
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