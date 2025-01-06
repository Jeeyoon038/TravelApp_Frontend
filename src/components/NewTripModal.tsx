// src/components/NewTripModal.tsx

import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Flex,
  Box,
  Text,
  Image,
  Spinner,
  useToast,
} from "@chakra-ui/react";

// Removed 'selectedFiles' and 'onFileChange' from props as they are managed internally

export interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: {
    title: string;
    start_date: string;
    end_date: string;
    selectedFiles: File[];
  }) => Promise<void>;
}

const NewTripModal: React.FC<NewTripModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateTrip 
}) => {
  const [newTrip, setNewTrip] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMetadataExtracting, setIsMetadataExtracting] = useState<boolean>(false);
  const toast = useToast();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      // Reset metadata when new files are selected
      // Since metadata extraction is handled in Home.tsx, no need to manage it here
      if (filesArray.length > 0) {
        setIsMetadataExtracting(true);
        // Simulate metadata extraction completion
        // In reality, metadata extraction is handled in Home.tsx after upload
        setTimeout(() => {
          setIsMetadataExtracting(false);
        }, 1000); // Adjust as needed
      } else {
        setIsMetadataExtracting(false);
      }
    }
  };

  // Handle input changes for trip details
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrip((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission to create a new trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input fields
    if (!newTrip.title || !newTrip.start_date || !newTrip.end_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please select at least one image for the trip.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isMetadataExtracting) {
      toast({
        title: "Metadata Extracting",
        description: "Please wait while metadata is being extracted.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await onCreateTrip({
        ...newTrip,
        selectedFiles,
      });

      // Reset form after successful trip creation
      setNewTrip({
        title: "",
        start_date: "",
        end_date: "",
      });
      setSelectedFiles([]);
      onClose();
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast({
        title: "Trip Creation Failed",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Trip</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Display a spinner or message during metadata extraction */}
          {isMetadataExtracting && (
            <Flex align="center" mb={4}>
              <Spinner size="sm" mr={2} />
              <Text>Preparing your trip...</Text>
            </Flex>
          )}

          {/* Display Image Previews */}
          {selectedFiles.length > 0 && (
            <Box mb={4}>
              <Text mb={2}>Selected Images:</Text>
              <Flex wrap="wrap">
                {selectedFiles.map((file, index) => (
                  <Image
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Selected Image ${index + 1}`}
                    boxSize="100px"
                    objectFit="cover"
                    mr={2}
                    mb={2}
                    borderRadius="md"
                  />
                ))}
              </Flex>
            </Box>
          )}

          <form onSubmit={handleCreateTrip}>
            <FormControl mb={4} isRequired>
              <FormLabel>Trip Title</FormLabel>
              <Input
                name="title"
                placeholder="Enter trip title"
                value={newTrip.title}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Images</FormLabel>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Start Date</FormLabel>
              <Input
                name="start_date"
                type="date"
                value={newTrip.start_date}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>End Date</FormLabel>
              <Input
                name="end_date"
                type="date"
                value={newTrip.end_date}
                onChange={handleInputChange}
              />
            </FormControl>

            <Flex alignItems="center" justifyContent="space-between">
              <Button
                colorScheme="blue"
                mr={3}
                type="submit"
                isLoading={isMetadataExtracting}
                loadingText="Creating"
              >
                Create Trip
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </Flex>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default NewTripModal;
