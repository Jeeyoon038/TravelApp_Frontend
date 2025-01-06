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
  Spinner,
  Text,
  useToast,
  VStack
} from "@chakra-ui/react";
import heic2any from "heic2any"; // Import heic2any for HEIC conversion
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes } from "react-icons/fa";
import { getPhotoMetadata, PhotoMetadata } from "../utils/getPhotoMetadata";

export interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: {
    title: string;
    start_date: string;
    end_date: string;
    selectedFiles: File[];
    metadata: PhotoMetadata[];
  }) => Promise<void>;
}

const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
}) => {
  const [newTrip, setNewTrip] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileMetadata, setFileMetadata] = useState<PhotoMetadata[]>([]); // Metadata storage
  const [isCreatingTrip, setIsCreatingTrip] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0); // Progress tracking for uploads
  const [conversionProgress, setConversionProgress] = useState<number>(0); // Progress tracking for conversions
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrip((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
      "image/heic": [], // Allow HEIC files explicitly
      "image/heif": []
    },
    multiple: true,
    onDrop: async (acceptedFiles) => {
      const processedFiles: File[] = [];
      const filesWithPreview = acceptedFiles.map((file) => {
        (file as any).preview = URL.createObjectURL(file);
        return file;
      });

      setConversionProgress(0);
      const totalFiles = filesWithPreview.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = filesWithPreview[i];
        try {
          if (file.type === "image/heic" || file.type === "image/heif") {
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9,
            });
            const convertedFile = new File([convertedBlob], `${file.name}.jpg`, {
              type: "image/jpeg",
            });
            (convertedFile as any).preview = URL.createObjectURL(convertedBlob);
            processedFiles.push(convertedFile);
          } else {
            processedFiles.push(file);
          }
          setConversionProgress(Math.round(((i + 1) / totalFiles) * 100));
        } catch (error) {
          console.error("HEIC 변환 오류:", error);
          toast({
            title: "HEIC 변환 실패",
            description: `파일 ${file.name}을(를) 변환하는 중 오류가 발생했습니다.`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          continue;
        }
      }

      setSelectedFiles((prev) => [...prev, ...processedFiles]);

      // Extract metadata for all dropped files
      const metadataPromises = processedFiles.map((file) => getPhotoMetadata(file));
      try {
        const metadataResults = await Promise.all(metadataPromises);
        const mappedMetadata = metadataResults.map((metadata, index) => ({
          ...metadata,
          image_url: (processedFiles[index] as any).preview,
          image_id: `${processedFiles[index].name}-${Date.now()}`, // Generate a unique image ID
        }));
        setFileMetadata((prev) => [...prev, ...mappedMetadata]);
      } catch (error) {
        console.error("Error extracting metadata:", error);
        toast({
          title: "메타데이터 추출 실패",
          description: "이미지의 메타데이터를 가져오는 중 오류가 발생했습니다.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
  });

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTrip.title || !newTrip.start_date || !newTrip.end_date) {
      toast({
        title: "정보 누락",
        description: "모든 필드를 입력해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "이미지 없음",
        description: "이미지를 최소 1개 이상 업로드해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingTrip(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        // Simulate file upload progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));

        // Here you would handle the actual file upload logic
        // For example:
        // await uploadFile(selectedFiles[i]);
      }

      await onCreateTrip({
        ...newTrip,
        selectedFiles,
        metadata: fileMetadata, // Pass metadata along with files
      });

      setNewTrip({ title: "", start_date: "", end_date: "" });
      setSelectedFiles([]);
      setFileMetadata([]); // Clear metadata
      onClose();

      toast({
        title: "여행 생성 완료",
        description: "새로운 여행이 성공적으로 생성되었습니다.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("여행 생성 오류:", error);
      toast({
        title: "여행 생성 실패",
        description: error.message || "예기치 않은 오류가 발생했습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreatingTrip(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if ((file as any).preview) {
          URL.revokeObjectURL((file as any).preview);
        }
      });
    };
  }, [selectedFiles]);

  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    const updatedMetadata = [...fileMetadata];
    updatedFiles.splice(index, 1);
    updatedMetadata.splice(index, 1);
    setSelectedFiles(updatedFiles);
    setFileMetadata(updatedMetadata);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl" bgGradient="linear(to-r, white, #f2f2f2)">
        <ModalHeader>새로운 여행 시작</ModalHeader>
        <ModalCloseButton />
        {isCreatingTrip && (
          <Flex
            justify="center"
            align="center"
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(255, 255, 255, 0.8)"
            zIndex="10"
          >
            <Spinner size="xl" />
          </Flex>
        )}
        {conversionProgress > 0 && (
          <Box mt={4} mx="auto" width="80%">
            <Text mb={2}>변환 진행 상황: {conversionProgress}%</Text>
            <Progress value={conversionProgress} size="sm" colorScheme="green" />
          </Box>
        )}
        {uploadProgress > 0 && (
          <Box mt={4} mx="auto" width="80%">
            <Text mb={2}>업로드 진행 상황: {uploadProgress}%</Text>
            <Progress value={uploadProgress} size="sm" colorScheme="blue" />
          </Box>
        )}
        <ModalBody pb={6}>
          <form onSubmit={handleCreateTrip}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>여행 제목</FormLabel>
                <Input
                  name="title"
                  placeholder="여행 제목"
                  value={newTrip.title}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>사진 업로드</FormLabel>
                <Box {...getRootProps()} border="2px dashed gray" p={4}>
                  <Input {...getInputProps()} />
                  <Text>
                    {isDragActive
                      ? "파일을 여기에 드롭하세요"
                      : "클릭하거나 파일을 드래그하세요"}
                  </Text>
                </Box>
                {selectedFiles.length > 0 && (
                  <Flex mt={4} wrap="wrap">
                    {selectedFiles.map((file, index) => (
                      <Box key={index} w="80px" h="80px" position="relative">
                        <Image
                          src={(file as any).preview}
                          alt={`미리보기 ${index}`}
                          boxSize="full"
                          objectFit="cover"
                        />
                        <Button
                          position="absolute"
                          top="2"
                          right="2"
                          size="xs"
                          colorScheme="red"
                          onClick={() => removeFile(index)}
                        >
                          <FaTimes />
                        </Button>
                      </Box>
                    ))}
                  </Flex>
                )}
              </FormControl>
              <FormControl isRequired>
                <FormLabel>시작 날짜</FormLabel>
                <Input
                  name="start_date"
                  type="date"
                  value={newTrip.start_date}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>종료 날짜</FormLabel>
                <Input
                  name="end_date"
                  type="date"
                  value={newTrip.end_date}
                  onChange={handleInputChange}
                />
              </FormControl>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={isCreatingTrip}
              >
                여행 생성
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewTripModal;
