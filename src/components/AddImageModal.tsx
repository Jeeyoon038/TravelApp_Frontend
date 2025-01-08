// src/components/AddImagesModal.tsx

import {
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  useToast
} from "@chakra-ui/react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes, FaUpload } from "react-icons/fa";

interface AddImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], tripId: string) => Promise<void>;
  tripId: string;
}

// Constants defining maximum allowed files and file size
const MAX_FILES = 15;
const MAX_SIZE_MB = 15;

const AddImagesModal = ({ isOpen, onClose, onUpload, tripId }: AddImagesModalProps) => {
  // State to manage selected files for upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // State to indicate if an upload is in progress
  const [isUploading, setIsUploading] = useState(false);
  // State to track upload progress percentage
  const [uploadProgress, setUploadProgress] = useState(0);
  // Chakra UI toast for user notifications
  const toast = useToast();

  /**
   * Configures the dropzone for file selection and drag-and-drop functionality.
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    multiple: true,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  });

  /**
   * Handles the upload process when the user initiates an upload.
   */
  const handleUpload = async () => {
    // Ensure there are files selected for upload
    if (selectedFiles.length === 0) {
      toast({
        title: "이미지 없음",
        description: "업로드할 이미지를 선택해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Set uploading state and reset progress
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Initiate the upload process using the provided onUpload function
      await onUpload(selectedFiles, tripId);
      // Notify the user of successful upload
      toast({
        title: "업로드 성공",
        description: "이미지가 성공적으로 업로드되었습니다.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Close the modal after successful upload
      onClose();
    } catch (error) {
      // Notify the user of any errors during upload
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Reset uploading state and clear selected files
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFiles([]);
    }
  };

  /**
   * Removes a selected file from the upload list based on its index.
   * @param index - The index of the file to remove.
   */
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader textAlign="center">이미지 추가하기</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isUploading ? (
            // Display upload progress indicator while uploading
            <Flex direction="column" align="center" justify="center" height="200px">
              <Text mb={4}>업로드 중...</Text>
              <Progress
                value={uploadProgress}
                size="lg"
                width="80%"
                borderRadius="full"
              />
            </Flex>
          ) : (
            <>
              {/* Dropzone area for selecting or dragging and dropping images */}
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
              >
                <input {...getInputProps()} />
                <Icon as={FaUpload} w={8} h={8} color="gray.500" mb={2} />
                <Text color="gray.500">사진을 선택하거나 Drag & Drop 하세요</Text>
                <Text color="gray.400" fontSize="sm">
                  (최대 {MAX_FILES}개, 각 {MAX_SIZE_MB}MB)
                </Text>
              </Box>

              {/* Display previews of selected images */}
              {selectedFiles.length > 0 && (
                <Flex mt={4} flexWrap="wrap" gap={2}>
                  {selectedFiles.map((file, index) => (
                    <Box key={index} position="relative">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        boxSize="80px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                      {/* Button to remove a selected image */}
                      <Button
                        size="xs"
                        position="absolute"
                        top={1}
                        right={1}
                        colorScheme="red"
                        borderRadius="full"
                        onClick={() => removeFile(index)}
                      >
                        <Icon as={FaTimes} />
                      </Button>
                    </Box>
                  ))}
                </Flex>
              )}

              {/* Action buttons for uploading or canceling */}
              <Flex justifyContent="flex-end" mt={4}>
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={handleUpload}
                  isLoading={isUploading}
                >
                  업로드
                </Button>
                <Button onClick={onClose}>취소</Button>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddImagesModal;
