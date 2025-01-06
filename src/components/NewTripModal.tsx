import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes } from "react-icons/fa";
import { extractMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";
import { sendTripToBackend } from "../utils/tripUploader";

export interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (newTrip: {
    tripId: string;
    title: string;
    start_date: Date;
    end_date: Date;
    image_urls: string[];
    member_google_ids: string[];
  }) => Promise<void>;
}

interface ProcessingStatus {
  currentImage: number;
  totalImages: number;
  status: string;
}

export default function NewTripModal({
  isOpen,
  onClose,
  onCreateTrip,
}: NewTripModalProps) {
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });

  // File handling states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedMetadata, setProcessedMetadata] = useState<PhotoMetadata[]>([]);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  
  const toast = useToast();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
      setProcessedMetadata([]); // Clear processed metadata when new files are added
    },
  });

  // Process images
  const processImages = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    setProcessedMetadata([]);
    
    try {
      const metadata = await extractMetadata(
        selectedFiles,
        (current, total, status) => {
          setProcessingStatus({
            currentImage: current,
            totalImages: total,
            status,
          });
        }
      );

      // Verify image URLs
      const validMetadata = metadata.filter(meta => meta.image_url !== null);

      if (validMetadata.length === 0) {
        throw new Error('No images were successfully processed');
      }

      setProcessedMetadata(validMetadata);

      toast({
        title: "Images Processed",
        description: `Successfully processed ${validMetadata.length} out of ${selectedFiles.length} images.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process images",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  // Create trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (processedMetadata.length === 0) {
      toast({
        title: "No Processed Images",
        description: "Please process your images before creating the trip.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingTrip(true);
    try {
      const tripData = {
        title: formData.title,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        image_urls: processedMetadata.map(meta => meta.image_url).filter(Boolean) as string[],
        member_google_ids: []
      };

      const createdTrip = await sendTripToBackend(tripData);

      await onCreateTrip({
        tripId: createdTrip.id,
        ...tripData,
      });

      toast({
        title: "Trip Created",
        description: "Your new trip was successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating trip:", error);
      toast({
        title: "Trip Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create trip",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ title: "", start_date: "", end_date: "" });
    setSelectedFiles([]);
    setProcessedMetadata([]);
    setProcessingStatus(null);
  };

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setProcessedMetadata([]); // Clear processed metadata since files changed
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processedMetadata.forEach(metadata => {
        if (metadata.displaySrc) {
          URL.revokeObjectURL(metadata.displaySrc);
        }
      });
    };
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="xl" bgGradient="linear(to-r, white, #f2f2f2)">
        <ModalHeader>Create a New Trip</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleCreateTrip}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  name="title"
                  placeholder="Trip Title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Images</FormLabel>
                <Box
                  {...getRootProps()}
                  border="2px dashed"
                  borderColor={isDragActive ? "blue.500" : "gray.300"}
                  borderRadius="md"
                  p={4}
                  cursor="pointer"
                  transition="border-color 0.2s"
                  _hover={{ borderColor: "blue.500" }}
                >
                  <Input {...getInputProps()} />
                  <Text textAlign="center">
                    {isDragActive ? "Drop your images here" : "Click or drag images to upload"}
                  </Text>
                </Box>

                {selectedFiles.length > 0 && (
                  <Box mt={4}>
                    <Flex wrap="wrap" gap={2}>
                      {selectedFiles.map((file, index) => (
                        <Box key={index} position="relative">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                          <Button
                            position="absolute"
                            top={1}
                            right={1}
                            size="xs"
                            colorScheme="red"
                            onClick={() => removeFile(index)}
                          >
                            <FaTimes />
                          </Button>
                        </Box>
                      ))}
                    </Flex>

                    {/* Processing status and progress */}
                    {processingStatus && (
                      <Box mt={4}>
                        <Text fontSize="sm" mb={2}>
                          Processing image {processingStatus.currentImage} of {processingStatus.totalImages}:{" "}
                          {processingStatus.status}
                        </Text>
                        <Progress
                          value={(processingStatus.currentImage / processingStatus.totalImages) * 100}
                          size="sm"
                          colorScheme="blue"
                          borderRadius="full"
                        />
                      </Box>
                    )}

                    <Button
                      mt={4}
                      colorScheme="blue"
                      onClick={processImages}
                      isLoading={isProcessing}
                      loadingText="Processing..."
                      isDisabled={selectedFiles.length === 0}
                      width="full"
                    >
                      Process Images
                    </Button>
                  </Box>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Start Date</FormLabel>
                <Input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>End Date</FormLabel>
                <Input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <Button
                colorScheme="green"
                type="submit"
                width="full"
                isLoading={isCreatingTrip}
                loadingText="Creating Trip..."
                isDisabled={processedMetadata.length === 0 || isProcessing}
              >
                Create Trip
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}