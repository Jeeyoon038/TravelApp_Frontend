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
import { UIEvent, useEffect, useRef, useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import GroupStorySection from "../components/GroupStorySection";
import HomeHeader from "../components/HomeHeader";
import NewTripModal from "../components/NewTripModal";

import { Trip } from "../types/trip";

const API_BASE_URL = "http://localhost:3000/";

// Assuming you have a user object or context
const user = {
  profilePicture: "", // Replace with actual user profile picture
  name: "User" // Replace with actual user name
};

export default function Home() {
  const [groups, setGroups] = useState<Trip[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState<boolean>(false);
  const [scrollTop, setScrollTop] = useState<number>(0);

  const bigHeaderRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log("Fetching groups from backend...");
      const response = await axios.get(`${API_BASE_URL}trips`);
      console.log("Groups fetched successfully:", response.data);
      const fetchedGroups: Trip[] = response.data.map((trip: any) => ({
        trip_id: trip.trip_id,
        title: trip.title,
        start_date: new Date(trip.start_date),
        end_date: new Date(trip.end_date),
        image_urls: trip.image_urls || [],
        member_google_ids: trip.member_google_ids || [],
      }));

      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        setSelectedGroup(fetchedGroups[0]);
        console.log("Selected first group as default:", fetchedGroups[0]);
      }
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error fetching groups",
        description: error.message || "Failed to fetch groups",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      console.log("Finished fetching groups.");
    }
  };

  const handleCreateTrip = async (newTrip: {
      title: string;
      start_date: Date;
      end_date: Date;
      image_urls: string[];
      member_google_ids: string[];
    }) => {
    try {
      console.log("Creating trip in the backend...");
      const tripResponse = await fetch(`${API_BASE_URL}trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrip),
      });

      console.log("Trip creation response status:", tripResponse.status);

      if (tripResponse.status === 201) {
        console.log("Trip created successfully.");
        toast({
          title: "Trip Created",
          description: "Your trip has been created successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Refresh the group list after adding a new trip
        console.log("Refreshing group list...");
        fetchGroups();
      } else {
        let errorData;
        try {
          errorData = await tripResponse.json();
        } catch (parseError) {
          console.error("Failed to parse trip creation error response:", parseError);
          errorData = { message: "Unknown error occurred during trip creation." };
        }
        console.error("Failed to create trip:", errorData);
        toast({
          title: "Trip Creation Failed",
          description: `Failed to create the trip. Error: ${errorData.message || "Unknown error"}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
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
        <HomeHeader 
          user={user} 
          onCreateTrip={onOpen} 
        />

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
      />
    </Flex>
  );
}