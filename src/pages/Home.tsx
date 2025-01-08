// src/pages/Home.tsx
import {
  Box,
  Flex,
  Spinner,
  Text,
  useDisclosure,
  useToast
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import GroupStorySection from "../components/GroupStorySection";
import HomeHeader from "../components/HomeHeader";
import NewTripModal from "../components/NewTripModal";
import { Group } from "../types/group";


// Define API_BASE_URL correctly
const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  console.error('VITE_API_URL is not defined in environment variables');
}

const API_BASE_URL = apiUrl ? (apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl) : 'http://localhost:3000';

interface TripCreationResponse {
  message?: string;
  // Add other properties as needed
}


export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState<boolean>(false);
  const [, setScrollTop] = useState<number>(0);
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState<boolean>(
    localStorage.getItem("first_login") !== "false"
  );

  /**
   * Fetches groups from the backend.
   */
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/trips`, { // Ensure single slash
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const fetchedGroups: Group[] = (response.data as any[]).map((trip: any) => ({
        _id: trip._id,
        trip_id: trip.trip_id,
        title: trip.title,
        start_date: new Date(trip.start_date).toISOString(),
        end_date: new Date(trip.end_date).toISOString(),
        image_urls: trip.image_urls || [],
        member_google_ids: trip.member_google_ids || [],
        created_by: trip.created_by,
        createdAt: new Date(trip.createdAt).toISOString(),
        updatedAt: new Date(trip.updatedAt).toISOString(),
        __v: trip.__v,
      }));

      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        setSelectedGroup(fetchedGroups[0]);
      }
    } catch (error: any) {
      let errorMessage = "Failed to fetch groups";
      //if (axios.isAxiosError(error)) {
        //errorMessage = error.response?.data?.message || error.message;
        //if (error.code === 'ERR_NETWORK') {
          //errorMessage = 'Unable to connect to the server. Please check if the server is running.';
        //}
      //}
      console.error('Error fetching groups:', error);
      toast({
        title: "Error fetching groups",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showWelcomeAnimation) {
      setTimeout(() => {
        setShowWelcomeAnimation(false);
        localStorage.setItem("first_login", "false");
      }, 6000);
    }
    fetchGroups();
  }, []);

  /**
   * Handles the creation of a new trip by sending trip data to the backend.
   */
  const handleCreateTrip = async (tripData: Group) => {
    try {
      // Retrieve googleId from localStorage
      const googleId = localStorage.getItem('user_google_id');
      
      if (!googleId) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a trip",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Prepare trip creation data
      const tripCreationData = {
        title: tripData.title,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        image_urls: tripData.image_urls,
        member_google_ids: tripData.member_google_ids,
        created_by: googleId,
      };



      // Send trip creation request to backend
      const response = await axios.post<TripCreationResponse>(`${API_BASE_URL}/trips`, tripCreationData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Include token if required
        },
      });

      if (response.status === 201 || response.status === 200) {
        //toast({
          //title: "Trip Created",
          //description: "Your trip has been created successfully.",
          //status: "success",
          //duration: 3000,
          //isClosable: true,
        //});
        fetchGroups(); // Refresh the trips list
        onClose(); // Close the modal
      } else {
        throw new Error(response.data.message || "Failed to create trip.");
      }
    } catch (error: any) {
      console.error('Error creating trip:', error);
      
      //let errorMessage = "An unexpected error occurred";
      //if (axios.isAxiosError(error)) {
        //errorMessage = error.response?.data?.message || error.message;
      //}

      //toast({
        //title: "Trip Creation Error",
        //description: errorMessage,
        //status: "error",
        //duration: 5000,
        //isClosable: true,
      //});
    }
  };

  /**
   * Handles scrolling to manage header state.
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setShowCollapsedHeader(newScrollTop > 300);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
        <Text ml={4}>Loading...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="100vh" bg="#F2F2F2">
      {showWelcomeAnimation && (
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="white"
          justify="center"
          align="center"
          zIndex="100"
        >
          <img
            src="/animations/travelmonster.gif"
            alt="Welcome Animation"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </Flex>
      )}
      <Box
        flex="1"
        overflowY="auto"
        onScroll={handleScroll}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <HomeHeader onCreateTrip={onOpen} />
        <GroupStorySection
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          isHeaderCollapsed={showCollapsedHeader}
        />
      </Box>

      <Box position="sticky" bottom="0" zIndex="10">
        <BottomTabBar />
      </Box>

      <NewTripModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onCreateTrip={handleCreateTrip} 
        member_google_ids={selectedGroup?.member_google_ids}
      />
    </Flex>
  );
}
