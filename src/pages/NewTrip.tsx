// NewTrip.tsx
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Icon,
    Image,
    Input,
    Spinner,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import heic2any from "heic2any";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaTimes, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
  
  export default function NewTrip() {
    const [newTrip, setNewTrip] = useState({
      title: "",
      start_date: "",
      end_date: "",
    });
  
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
  
    const convertHeicToJpg = async (file: File): Promise<File> => {
      if (file.type !== "image/heic" && file.type !== "image/heif") {
        return file; // HEIC가 아니면 원본 파일 반환
      }
  
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8, // 품질 설정 (0.0 ~ 1.0)
        });
  
        // 변환된 Blob을 File 객체로 변환
        const convertedFile = new File(
          [convertedBlob],
          file.name.replace(/\.[^/.]+$/, ".jpg"),
          {
            type: "image/jpeg",
          }
        );
  
        return convertedFile;
      } catch (error) {
        console.error("HEIC 변환 오류:", error);
        toast({
          title: "이미지 변환 오류",
          description: `${file.name} 파일을 JPG로 변환하는 데 실패했습니다.`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return file; // 변환 실패 시 원본 파일 반환
      }
    };
  
    const uploadImages = async (files: File[]): Promise<string[]> => {
      const imageUrls: string[] = [];
  
      for (const file of files) {
        let uploadFile = file;
  
        // HEIC 파일인지 확인하고 변환
        if (file.type === "image/heic" || file.type === "image/heif") {
          uploadFile = await convertHeicToJpg(file);
        }
  
        const formData = new FormData();
        formData.append("file", uploadFile);
  
        try {
          const response = await fetch("http://localhost:3000/upload/image", {
            method: "POST",
            body: formData,
          });
  
          if (response.ok) {
            const data = await response.json();
            imageUrls.push(data.imageUrl);
          } else {
            console.error("Image upload failed:", uploadFile.name);
            toast({
              title: "업로드 실패",
              description: `${uploadFile.name} 파일을 업로드하는 데 실패했습니다.`,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error("Image upload error:", error);
          toast({
            title: "업로드 오류",
            description: `${uploadFile.name} 파일을 업로드하는 중 오류가 발생했습니다.`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
  
      return imageUrls;
    };
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setNewTrip((prev) => ({
        ...prev,
        [name]: value,
      }));
    };
  
    const handleCreateTrip = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const imageUrls = await uploadImages(selectedFiles);
  
        const response = await fetch("http://localhost:3000/trips", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newTrip.title,
            start_date: new Date(newTrip.start_date).toISOString(),
            end_date: new Date(newTrip.end_date).toISOString(),
            image_urls: imageUrls,
            member_google_ids: [],
          }),
        });
  
        if (response.ok) {
          toast({
            title: "여행 생성 완료",
            description: "새로운 여행이 성공적으로 생성되었습니다.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          // 필요 시 상태 초기화
          setNewTrip({
            title: "",
            start_date: "",
            end_date: "",
          });
          setSelectedFiles([]);
          navigate("/home"); // 생성 후 홈으로 이동
        } else {
          throw new Error("Failed to create trip.");
        }
      } catch (error) {
        console.error("Error creating trip:", error);
        toast({
          title: "여행 생성 오류",
          description: "여행을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    // 드래그 앤 드롭을 위한 설정
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        "image/*": [],
        "image/heic": [],
        "image/heif": [],
      },
      maxSize: 5 * 1024 * 1024, // 5MB 제한
      onDrop: async (acceptedFiles, fileRejections) => {
        // 파일 거부 처리
        if (fileRejections.length > 0) {
          fileRejections.forEach((rejection) => {
            rejection.errors.forEach((error) => {
              toast({
                title: "파일 업로드 오류",
                description: `${rejection.file.name} 파일은 ${error.message}`,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            });
          });
        }
  
        // 허용된 파일 처리
        if (acceptedFiles.length > 0) {
          setIsLoading(true);
          try {
            const convertedFiles = await Promise.all(
              acceptedFiles.map(async (file) => {
                if (file.type === "image/heic" || file.type === "image/heif") {
                  return await convertHeicToJpg(file);
                }
                return file;
              })
            );
            setSelectedFiles((prev) => [...prev, ...convertedFiles]);
  
            // 파일 미리보기 URL 생성
            // 각 파일에 대한 preview URL을 생성하여 메모리 누수 방지
            convertedFiles.forEach((file) => {
              (file as any).preview = URL.createObjectURL(file);
            });
          } catch (error) {
            console.error("파일 변환 오류:", error);
            toast({
              title: "파일 변환 오류",
              description: "이미지 파일을 처리하는 중 오류가 발생했습니다.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          } finally {
            setIsLoading(false);
          }
        }
      },
    });
  
    // 메모리 누수 방지를 위해 미리보기 URL 해제
    useEffect(() => {
      return () => {
        selectedFiles.forEach((file) => {
          if ((file as any).preview) {
            URL.revokeObjectURL((file as any).preview);
          }
        });
      };
    }, [selectedFiles]);
  
    return (
      <Flex direction="column" h="100vh" bg="#F2F2F2" p={4}>
        <Box
          bg="white"
          boxShadow="md"
          borderRadius="lg"
          p={6}
          mb={4}
          w="100%"
          maxW="600px"
          mx="auto"
        >
          <Text fontWeight="bold" fontSize={24} mb={3} textAlign="center">
            새로운 여행을 시작하세요
          </Text>
          <form onSubmit={handleCreateTrip}>
            <VStack spacing={4} align="stretch">
              {/* Trip Title */}
              <FormControl isRequired>
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
  
              {/* Image Upload */}
              <FormControl isRequired>
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
                    <Text color="blue.500">파일을 이곳에 드롭하세요...</Text>
                  ) : (
                    <Text color="gray.500">
                      이곳을 클릭하거나 파일을 드래그 앤 드롭 하세요
                    </Text>
                  )}
                </Box>
                {isLoading && (
                  <Flex alignItems="center" mt={2}>
                    <Spinner size="sm" mr={2} />
                    <Text fontSize="sm" color="gray.600">
                      이미지를 처리 중입니다...
                    </Text>
                  </Flex>
                )}
                {/* Image Previews */}
                {selectedFiles.length > 0 && (
                  <Flex mt={4} flexWrap="wrap">
                    {selectedFiles.map((file, index) => (
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
                          src={(file as any).preview}
                          alt={`Preview ${index}`}
                          objectFit="cover"
                          w="100%"
                          h="100%"
                        />
                        <Button
                          size="xs"
                          colorScheme="red"
                          position="absolute"
                          top="2px"
                          right="2px"
                          onClick={() => {
                            const updatedFiles = [...selectedFiles];
                            updatedFiles.splice(index, 1);
                            setSelectedFiles(updatedFiles);
                          }}
                          borderRadius="full"
                        >
                          <Icon as={FaTimes} />
                        </Button>
                      </Box>
                    ))}
                  </Flex>
                )}
              </FormControl>
  
              {/* Start Date */}
              <FormControl isRequired>
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
  
              {/* End Date */}
              <FormControl isRequired>
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
  
              {/* Buttons */}
              <Flex justifyContent="flex-end" mt={4}>
                <Button
                  colorScheme="blue"
                  mr={3}
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Creating"
                  borderRadius="md"
                >
                  여행 시작 하기
                </Button>
                <Button
                  onClick={() => navigate("/home")}
                  borderRadius="md"
                  backgroundColor={"white"}
                >
                  취소
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </Flex>
    );
  }
  