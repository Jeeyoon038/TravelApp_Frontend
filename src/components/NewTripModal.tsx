// src/components/NewTripModal.tsx

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
import React, { useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { FaTimes, FaUpload } from "react-icons/fa";
import { PhotoMetadata } from "../utils/getPhotoMetadata"; // Import PhotoMetadata
import { processFiles } from "../utils/heicToJpg"; // Updated import

export interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: {
    title: string;
    start_date: string;
    end_date: string;
    selectedFiles: File[];
    metadataList: PhotoMetadata[];
    created_by: string;
  }) => Promise<void>;
}

// 최대 파일 개수와 용량을 상수로 정의
const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

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
  const [metadataList, setMetadataList] = useState<PhotoMetadata[]>([]);
  const [isMetadataExtracting, setIsMetadataExtracting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const toast = useToast();

  // 파일 선택 핸들러
  const onDrop = async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // 현재 선택된 파일 수와 추가하려는 파일 수의 합이 최대 파일 수를 초과하는지 확인
    if (selectedFiles.length + acceptedFiles.length > MAX_FILES) {
      toast({
        title: "파일 개수 초과",
        description: `최대 ${MAX_FILES}개의 파일만 업로드할 수 있습니다.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // 파일 거부 시 각각의 에러 메시지 처리
    if (fileRejections.length > 0) {
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          let description = "";
          switch (error.code) {
            case "file-too-large":
              description = `파일 "${rejection.file.name}"의 크기가 ${MAX_SIZE_MB}MB를 초과했습니다.`;
              break;
            case "file-invalid-type":
              description = `파일 "${rejection.file.name}"은 지원되지 않는 파일 형식입니다. HEIC, JPEG, PNG 형식만 업로드할 수 있습니다.`;
              break;
            case "too-many-files":
              description = `한 번에 업로드할 수 있는 파일 수는 ${MAX_FILES}개입니다.`;
              break;
            default:
              description = `파일 "${rejection.file.name}"을 업로드하는 중 오류가 발생했습니다.`;
          }
          toast({
            title: "파일 업로드 오류",
            description: description,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        });
      });
    }

    // 허용된 파일이 없는 경우 종료
    if (acceptedFiles.length === 0) {
      return;
    }

    setIsMetadataExtracting(true);
    try {
      const processed = await processFiles(acceptedFiles);
      const jpgFiles = processed.map((img) => img.file);
      const metadata = processed.map((img) => img.metadata);
      setSelectedFiles((prev) => [...prev, ...jpgFiles]);
      setMetadataList((prev) => [...prev, ...metadata]);
    } catch (error) {
      console.error("파일 처리 중 오류 발생:", error);
      toast({
        title: "파일 처리 오류",
        description: "이미지 파일을 처리하는 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsMetadataExtracting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
      // 추가적인 이미지 형식이 필요하다면 여기에 추가
    },
    onDrop,
    multiple: true,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE_BYTES,
  });

  // 메타데이터 추출 후 미리보기 URL 해제
  useEffect(() => {
    // Create Object URLs for selected files
    const previews = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      fileName: file.name,
    }));

    return () => {
      // Revoke Object URLs on cleanup
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFiles]);

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrip((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 폼 제출 핸들러
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();


    const googleId = localStorage.getItem('user_google_id');

    if (!googleId) {
      toast({
        title: "인증 오류",
        description: "사용자 인증 정보를 찾을 수 없습니다. 다시 로그인해 주세요.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }


    // 필수 필드 검증
    if (!newTrip.title || !newTrip.start_date || !newTrip.end_date) {
      toast({
        title: "정보 누락",
        description: "모든 필수 항목을 작성해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "이미지 없음",
        description: "여행에 사용할 이미지를 최소 하나 이상 선택해주세요.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isMetadataExtracting) {
      toast({
        title: "메타데이터 추출 중",
        description: "메타데이터가 추출되는 동안 잠시만 기다려주세요.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // 업로드 진행 시뮬레이션 (실제 업로드 로직에 맞게 수정 필요)
    const startTime = Date.now();
    const minLoadingTime = 2000; // 최소 로딩 시간 2초

    try {
      // tripData 생성
      const tripData = {
        title: newTrip.title,
        start_date: newTrip.start_date,
        end_date: newTrip.end_date,
        selectedFiles: selectedFiles, // JPG 파일 배열
        metadataList: metadataList, // Metadata 배열
        created_by: googleId 
      };

      // 실제 업로드 시작
      const uploadPromise = onCreateTrip(tripData);

      // 프로그레스 업데이트 로직
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / minLoadingTime) * 90, 90); // 최대 90%까지 진행
        setUploadProgress(progress);
      }, 100);

      await uploadPromise;

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 최소 로딩 시간 만족 여부 확인
      const remainingTime = minLoadingTime - (Date.now() - startTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      // 폼 리셋
      setNewTrip({
        title: "",
        start_date: "",
        end_date: "",
      });
      setSelectedFiles([]);
      setMetadataList([]);
      setIsUploading(false);
      onClose();

      toast({
        title: "여행 생성 성공",
        description: "새로운 여행이 성공적으로 생성되었습니다!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error("여행 생성 오류:", error);
      toast({
        title: "여행 생성 실패",
        description: error.message || "예기치 않은 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl" bgGradient="linear(to-r, white, #f2f2f2)">
        <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
          새로운 여행을 시작하세요
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
            </Flex>
          ) : (
            <form onSubmit={handleCreateTrip}>
              <VStack spacing={4} align="stretch">
                {/* 그룹 이름 */}
                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    그룹 이름
                  </FormLabel>
                  <Input
                    name="title"
                    placeholder="여행을 떠날 그룹 이름을 지어주세요"
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

                {/* 사진 업로드 */}
                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    사진 업로드 하기
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
                          이곳을 클릭하거나 Drag & Drop 하세요
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                          (최대 {MAX_FILES}개, 각 파일 최대 {MAX_SIZE_MB}MB)
                        </Text>
                      </>
                    )}
                  </Box>
                  {isMetadataExtracting && (
                    <Flex alignItems="center" mt={2}>
                      <Spinner size="sm" mr={2} />
                      <Text fontSize="sm" color="gray.600">
                        이미지를 처리 중입니다...
                      </Text>
                    </Flex>
                  )}
                  {/* 이미지 미리보기 */}
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
                              onLoad={() => URL.revokeObjectURL(preview)} // 메모리 누수 방지
                            />
                            <Button
                              size="xs"
                              colorScheme="red"
                              position="absolute"
                              top="2px"
                              right="2px"
                              onClick={() => {
                                const updatedFiles = selectedFiles.filter((_, i) => i !== index);
                                const updatedMetadata = metadataList.filter((_, i) => i !== index);
                                setSelectedFiles(updatedFiles);
                                setMetadataList(updatedMetadata);
                              }}
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

                {/* 여행 첫 날 */}
                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    여행 첫 날
                  </FormLabel>
                  <Input
                    name="start_date"
                    type="date"
                    value={newTrip.start_date}
                    onChange={handleInputChange}
                    borderRadius="md"
                    bg="white"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "outline",
                    }}
                  />
                </FormControl>

                {/* 여행 마지막 날 */}
                <FormControl isRequired isDisabled={isUploading}>
                  <FormLabel fontWeight="600" color="gray.700">
                    여행 마지막 날
                  </FormLabel>
                  <Input
                    name="end_date"
                    type="date"
                    value={newTrip.end_date}
                    onChange={handleInputChange}
                    borderRadius="md"
                    bg="white"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "outline",
                    }}
                  />
                </FormControl>

                {/* 버튼들 */}
                <Flex justifyContent="flex-end" mt={4}>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    type="submit"
                    isLoading={isUploading}
                    loadingText="생성 중"
                    borderRadius="md"
                  >
                    여행 시작 하기
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
