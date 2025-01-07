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
import { UIEvent, useEffect, useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import GroupStorySection from "../components/GroupStorySection";
import HomeHeader from "../components/HomeHeader";
import NewTripModal from "../components/NewTripModal";

import { Group } from "../types/group";
import { extractMetadataFromUrls, Metadata } from "../utils/ExifMetadataExtractor";

const API_BASE_URL = "${process.env.VITE_API_URL}/";

// Assuming you have a user object or context
// const user = {
//   profilePicture: "", // Replace with actual user profile picture
//   name: "User" // Replace with actual user name
// };

export default function Home() {
  // State Hooks - Consistently ordered at the top
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState<boolean>(false);
  const [, setScrollTop] = useState<number>(0);
const handleScrollPosition = (position: number) => {
  setScrollTop(position);
};
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [, setImageUrls] = useState<string[]>([]);
  const [, setExtractedMetadata] = useState<Metadata[]>([]);
  const [isMetadataExtracting, setIsMetadataExtracting] = useState<boolean>(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Ref Hooks
  //const bigHeaderRef = useRef<HTMLDivElement>(null);

  // Chakra UI and other third-party hooks
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch groups from backend API on component mount
  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * Fetches trip groups from the backend API.
   * Logs the fetched groups and handles errors gracefully.
   */
  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log("Fetching groups from backend...");
      const response = await axios.get(`${API_BASE_URL}trips`);
      console.log("Groups fetched successfully:", response.data);
      const fetchedGroups: Group[] = (response.data as any[]).map((trip: any) => ({
        _id: trip._id,
        trip_id: trip.trip_id,
        title: trip.title,
        start_date: new Date(trip.start_date),
        end_date: new Date(trip.end_date),
        image_urls: trip.image_urls || [],
        member_google_ids: trip.member_google_ids || [],
        createdAt: new Date(trip.createdAt).toISOString(),
        updatedAt: new Date(trip.updatedAt).toISOString(),
        __v: trip.__v,
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

  /**
   * Uploads an array of images to the backend (which presumably uploads them to S3).
   * Logs each upload attempt, success, and failure.
   * @param files Array of File objects to upload.
   * @returns Promise resolving to an array of uploaded image URLs.
   */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        console.log(`Uploading image ${i + 1}/${files.length}:`, file.name);
        const response = await fetch(`${API_BASE_URL}upload/image`, {
          method: "POST",
          body: formData,
        });

        console.log(`Upload Response Status for image ${i + 1}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`Uploaded Image URL for image ${i + 1}:`, data.imageUrl);
          imageUrls.push(data.imageUrl);
        } else {
          // Attempt to parse error message from response
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error(`Failed to parse error response for image ${i + 1}:`, parseError);
            errorData = { message: "Unknown error occurred during image upload." };
          }
          console.error(`Image upload failed for image ${i + 1}:`, errorData);
          toast({
            title: "Image Upload Failed",
            description: `Failed to upload image: ${file.name}. Error: ${errorData.message || "Unknown error"}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error: any) {
        console.error(`Error uploading image ${i + 1}:`, error);
        toast({
          title: "Image Upload Error",
          description: error.message || `An error occurred while uploading image ${file.name}.`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
    console.log("All image uploads completed. Uploaded URLs:", imageUrls);
    return imageUrls;
  };

  /**
   * Uploads metadata for each image to the backend.
   * Logs the payload being sent, the response status, and any errors encountered.
   * @param metadataArray Array of Metadata objects to upload.
   */
  const uploadMetadata = async (metadataArray: Metadata[]) => {
    for (let i = 0; i < metadataArray.length; i++) {
      const metadata = metadataArray[i];

      // Only send metadata if all required fields are available
      if (metadata.latitude !== null && metadata.longitude !== null && metadata.taken_at !== null) {
        const payload = {
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          taken_at: metadata.taken_at,
          image_url: metadata.image_url,
          image_id: metadata.image_id,
        };

        // **Debugging Step 1: Log the Payload**
        console.log(`Sending metadata for image ${i + 1}:`, payload);

        try {
          const metadataResponse = await fetch(`${API_BASE_URL}image-metadata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          // **Debugging Step 2: Log the Response Status**
          console.log(`Metadata POST Response Status for image ${i + 1}:`, metadataResponse.status);

          if (metadataResponse.status === 201) {
            console.log(`Metadata for image ${i + 1} saved successfully.`);
            toast({
              title: "Image Metadata Saved",
              description: `Metadata for image ${i + 1} has been saved.`,
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          } else {
            // **Debugging Step 3: Log the Response Body for Errors**
            let errorData;
            try {
              errorData = await metadataResponse.json();
            } catch (parseError) {
              console.error(`Failed to parse error response for metadata of image ${i + 1}:`, parseError);
              errorData = { message: "Unknown error occurred during metadata upload." };
            }
            console.error(`Failed to save metadata for image ${i + 1}:`, errorData);
            toast({
              title: "Metadata Save Failed",
              description: `Failed to save metadata for image ${i + 1}. Error: ${errorData.message || "Unknown error"}`,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (error: any) {
          // **Debugging Step 4: Log Network or Parsing Errors**
          console.error(`Error saving metadata for image ${i + 1}:`, error);
          toast({
            title: "Metadata Upload Error",
            description:
              error.message || `An error occurred while uploading metadata for image ${i + 1}.`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        console.warn(`Metadata for image ${i + 1} is incomplete and was not saved.`);
        toast({
          title: "Incomplete Metadata",
          description: `Metadata for image ${i + 1} is incomplete and was not saved.`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    }
    console.log("All metadata uploads completed.");
  };

  /**
   * Handles the creation of a new trip.
   * Steps:
   * 1. Upload selected images.
   * 2. Extract metadata from uploaded image URLs.
   * 3. Create the trip in the backend.
   * 4. Upload metadata for all images.
   * 5. Refresh the group list.
   * @param tripData Object containing trip details and selected files.
   */
  const handleCreateTrip = async (tripData: {
    title: string;
    start_date: string;
    end_date: string;
    selectedFiles: File[];
    //created_by: string;

 
  }) => {
    try {
      console.log("Starting trip creation process with data:", tripData);
      
      // Step 1: Upload selected images and get their URLs
      const uploadedImageUrls = await uploadImages(tripData.selectedFiles);
      setImageUrls(uploadedImageUrls);

      if (!uploadedImageUrls || uploadedImageUrls.length === 0) {
        toast({
          title: "No Images Uploaded",
          description: "Please upload at least one image for the trip.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Step 2: Extract metadata from image URLs
      setIsMetadataExtracting(true);
      setMetadataError(null);

      let metadata: Metadata[] = [];
      try {
        console.log("Extracting metadata from image URLs...");
        metadata = await extractMetadataFromUrls(uploadedImageUrls);
        setExtractedMetadata(metadata);
        console.log("Metadata extraction completed:", metadata);
      } catch (error: any) {
        console.error("Error extracting metadata:", error);
        toast({
          title: "Metadata Extraction Failed",
          description: error.message || "Failed to extract metadata from images.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setMetadataError(error.message || "Metadata extraction failed.");
        setIsMetadataExtracting(false);
        return;
      }

      setIsMetadataExtracting(false);

      // Step 3: Create the trip in the Trip Database
      console.log("Creating trip in the backend...");
      const tripResponse = await fetch(`${API_BASE_URL}trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tripData.title,
          start_date: new Date(tripData.start_date).toISOString(),
          end_date: new Date(tripData.end_date).toISOString(),
          image_urls: uploadedImageUrls,
          member_google_ids: [],
          //created_by: tripData.created_by,
        }),
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

        // Step 4: Upload metadata for all images
        console.log("Uploading metadata for all images...");
        await uploadMetadata(metadata);

        // Step 5: Refresh the group list after adding a new trip
        console.log("Refreshing group list...");
        fetchGroups();
      } else {
        // **Debugging Step 1: Log the Response Body for Errors**
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
      setIsMetadataExtracting(false);
      setMetadataError(error.message || "Metadata extraction failed.");
    }
  };

  /**
   * Handles file selection from the NewTripModal.
   * Logs the selected files for debugging.
   * @param files Array of selected File objects.
   */
  const handleFileSelection = (files: File[]) => {
    console.log("Files selected for upload:", files);
    setSelectedFiles(files);
  };

  /**
   * Handles metadata extraction callback.
   * Not used currently as extraction is handled within handleCreateTrip.
   * @param metadataArray Array of extracted Metadata objects.
   */
  // const handleMetadataExtracted = (metadataArray: Metadata[]) => {
  //   console.log('Extracted metadata:', metadataArray);
  //   setExtractedMetadata(metadataArray);
  // };

  /**
   * Handles scroll behavior to show/hide the collapsed header.
   * @param e UIEvent from the scroll.
   */
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    handleScrollPosition(newScrollTop);
    setShowCollapsedHeader(newScrollTop > 300);
  };

  // Show loading screen if fetching data
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
          //user={user} 
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
        onFileChange={handleFileSelection}
        selectedFiles={selectedFiles}
      />

      {/* Optionally, display a spinner or message during metadata extraction */}
      {isMetadataExtracting && (
        <Box position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" bg="white" p={4} borderRadius="md" boxShadow="lg">
          <Flex align="center">
            <Spinner size="lg" mr={2} />
            <Text>Extracting metadata...</Text> 
          </Flex>
        </Box>
      )}

      {/* Optionally, display an error message if metadata extraction failed */}
      {metadataError && (
        <Box position="fixed" top="10%" left="50%" transform="translateX(-50%)" bg="red.100" p={4} borderRadius="md">
          <Text color="red.500">Error extracting metadata: {metadataError}</Text>
        </Box>
      )}

      {/* ExifMetadataExtractor is no longer needed as extraction is handled within handleCreateTrip */}
      {/* <ErrorBoundary>
        <ExifMetadataExtractor
          files={selectedFiles}
          imageUrls={imageUrls}
          onMetadataExtracted={handleMetadataExtracted}
        />
      </ErrorBoundary> */}
    </Flex>
  );
}

// function setImageUrls(uploadedImageUrls: string[]) {
//   throw new Error("Function not implemented.");
// }

// function setExtractedMetadata(_metadata: Metadata[]) {
//   throw new Error("Function not implemented.");
// }

// function setImageUrls(_uploadedImageUrls: string[]) {
//   throw new Error("Function not implemented.");
// }
// function setImageUrls(uploadedImageUrls: string[]) {
//   throw new Error("Function not implemented.");
// }

// function setExtractedMetadata(metadata: Metadata[]) {
//   throw new Error("Function not implemented.");
// }

