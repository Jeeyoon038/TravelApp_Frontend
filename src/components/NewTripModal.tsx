import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from 'axios';
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes, FaUpload } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';
import { Group } from "../types/group";
import { ImageData } from "../types/imagedata";
import { extractMetadataFromUrls } from "../utils/exifMetadataExtractor";

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};

// Constants for file uploads
const MAX_FILES = 15;
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface ImageDataPayload {
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  image_url: string;
  image_id: string;
}

export interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: Group) => Promise<void>;
  member_google_ids?: string[];
}

const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
  member_google_ids = [],
}) => {
  const [newTrip, setNewTrip] = useState<Group>({
    _id: "",
    trip_id: 0,
    title: "",
    start_date: "",
    end_date: "",
    image_urls: [],
    member_google_ids: member_google_ids,
    createdAt: "",
    updatedAt: "",
    created_by: "",
    __v: 0,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMetadataExtracting, setIsMetadataExtracting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const toast = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setSelectedFiles(acceptedFiles);
    } catch (error: any) {
      toast({
        title: "파일 처리 오류",
        description: "이미지 파일을 처리하는 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    onDrop,
    multiple: true,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE_BYTES,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrip((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error("Authentication token not found");
    }

    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData();
        formData.append("file", files[i]);
        
        setUploadProgress((prev) => prev + (50 / files.length));

        const response = await axios.post(
          `${API_CONFIG.baseURL}/upload/image`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data?.imageUrl) {
          imageUrls.push(response.data.imageUrl);
        }

        setUploadProgress((prev) => prev + (50 / files.length));
      } catch (error: any) {
        console.error('Image upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    }

    return imageUrls;
  };

  const sendImageMetadata = async (images: ImageData[]): Promise<void> => {
    const token = localStorage.getItem('access_token');

    console.log('Metadata Upload Debug:', {
      imagesCount: images.length,
      firstImage: images[0],
      endpoint: `${API_CONFIG.baseURL}/api/image-metadata`,
      hasToken: !!token
    });

    if (!token) {
      throw new Error("Authentication token not found");
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/image-metadata`,
        images,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Metadata upload successful:', response.data);
    } catch (error: any) {
      console.error('Metadata Upload Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
  
      // Throw a more informative error
      throw new Error(
        error.response?.data?.message || 
        'Failed to upload metadata to server. Please try again.'
      );
    }
  };
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const googleId = localStorage.getItem('user_google_id');
    if (!googleId) {
      toast({
        title: "Authentication Error",
        description: "User ID not found. Please log in again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
        title: "No Images",
        description: "Please select at least one image.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload images
      const imageUrls = await uploadImages(selectedFiles);
      if (imageUrls.length === 0) throw new Error("No images were uploaded");

      setUploadProgress(50);
      setIsMetadataExtracting(true);
      
      // 2. Extract metadata with progress
      const metadata = await extractMetadataFromUrls(imageUrls);
      setIsMetadataExtracting(false);
      setUploadProgress(60);

      // 3. Create trip
      const tripData: Group = {
        ...newTrip,
        image_urls: imageUrls,
        created_by: googleId,
      };

      await onCreateTrip(tripData);
      setUploadProgress(80);

      // 4. Upload metadata with more time for processing
      const imageDataList = metadata.map(meta => ({
        latitude: meta.latitude,
        longitude: meta.longitude,
        taken_at: meta.taken_at,
        image_url: meta.image_url,
        image_id: uuidv4(),
      }));

      console.log('Preparing to upload metadata:', {
        count: imageDataList.length,
        firstItem: imageDataList[0]
      });

      await sendImageMetadata(imageDataList);
      setUploadProgress(100);

      // Success cleanup
      setNewTrip({
        _id: "",
        trip_id: 0,
        title: "",
        start_date: "",
        end_date: "",
        image_urls: [],
        member_google_ids: member_google_ids,
        created_by: "",
        createdAt: "",
        updatedAt: "",
        __v: 0
      });
      setSelectedFiles([]);
      
      toast({
        title: "Success",
        description: "Trip created successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error: any) {
      console.error('Trip creation failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setIsUploading(false);
      setUploadProgress(0);
      setIsMetadataExtracting(false);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create trip",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl" bgGradient="linear(to-r, white, #f2f2f2)">
        <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
          여행 기록을 시작해보세요!
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isUploading ? (
            <Flex direction="column" align="center" justify="center" height="200px">
              <Text mb={4} fontSize="lg" fontWeight="semibold">
                여행을 생성 중입니다...
              </Text>
              <Progress
                value={uploadProgress}
                size="lg"
                width="80%"
                transition="width 0.2s ease-in-out"
              />
              <Text mt={2} fontSize="sm" color="gray.600">
                {Math.round(uploadProgress)}%
              </Text>
              {isMetadataExtracting && (
                <Flex alignItems="center" mt={2}>
                  <Spinner size="sm" mr={2} />
                  <Text fontSize="sm" color="gray.600">
                    이미지를 처리 중입니다...
                  </Text>
                </Flex>
              )}
            </Flex>
          ) : (
            <form onSubmit={handleCreateTrip}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    그룹 이름
                  </FormLabel>
                  <Input
                    name="title"
                    placeholder="그룹의 이름을 입력해주세요"
                    value={newTrip.title}
                    onChange={handleInputChange}
                    borderRadius="md"
                    bg="white"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "outline",
                    }}
                  />
                </FormControl>

                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    여행 시작 날짜
                  </FormLabel>
                  <Input
                    name="start_date"
                    type="date"
                    value={newTrip.start_date instanceof Date ? newTrip.start_date.toISOString().split('T')[0] : newTrip.start_date}
                    onChange={handleInputChange}
                    borderRadius="md"
                    bg="white"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "outline",
                    }}
                  />
                </FormControl>

                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    여행 종료 날짜
                  </FormLabel>
                  <Input
                    name="end_date"
                    type="date"
                    value={newTrip.end_date instanceof Date ? newTrip.end_date.toISOString().split('T')[0] : newTrip.end_date}
                    onChange={handleInputChange}
                    borderRadius="md"
                    bg="white"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "outline",
                    }}
                  />
                </FormControl>

                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    사진 업로드
                  </FormLabel>
                  <Box
                    {...getRootProps()}
                    p={6}
                    borderWidth={2}
                    borderColor={isDragActive ? "blue.500" : "gray.200"}
                    borderStyle="dashed"
                    borderRadius="md"
                    bg={isDragActive ? "blue.50" : "gray.50"}
                    textAlign="center"
                    cursor="pointer"
                    transition="background-color 0.3s, border-color 0.3s"
                  >
                    <Input {...getInputProps()} />
                    <Icon as={FaUpload} w={8} h={8} color="gray.500" mb={2} />
                    {isDragActive ? (
                      <Text color="blue.500">파일을 여기로 드롭하세요...</Text>
                    ) : (
                      <>
                        <Text color="gray.500">
                          사진을 선택하거나 Drag & Drop 하세요
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                          (최대 {MAX_FILES}개, 각 파일 최대 {MAX_SIZE_MB}MB)
                        </Text>
                      </>
                    )}
                  </Box>
                  {selectedFiles.length > 0 && (
                    <Flex mt={4} flexWrap="wrap">
                      {selectedFiles.map((file, index) => {
                        const preview = URL.createObjectURL(file);
                        return (
                          <Box
                            key={index}
                            w="80px"
                            h="80px"
                            mr={2}
                            mb={2}
                            position="relative"
                            borderRadius="md"
                            overflow="hidden"
                            boxShadow="sm"
                          >
                            <Image
                              src={preview}
                              alt={`미리보기 ${index + 1}`}
                              objectFit="cover"
                              w="100%"
                              h="100%"
                              onLoad={() => {
                                URL.revokeObjectURL(preview);
                              }}
                            />
                            <Button
                              size="xs"
                              colorScheme="red"
                              position="absolute"
                              top="2px"
                              right="2px"
                              onClick={() => removeFile(index)}
                              borderRadius="full"
                            >
                              <Icon as={FaTimes} />
                            </Button>
                          </Box>
                        );
                      })}
                    </Flex>
                  )}
                </FormControl>

                <Flex justifyContent="flex-end" mt={4}>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    type="submit"
                    isLoading={isUploading}
                    loadingText="생성 중"
                    borderRadius="md"
                  >
                    여행 기록 생성
                  </Button>
                  <Button
                    onClick={onClose}
                    borderRadius="md"
                    backgroundColor={"white"}
                    isDisabled={isUploading}
                  >
                    취소
                  </Button>
                </Flex>
              </VStack>
            </form>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewTripModal;