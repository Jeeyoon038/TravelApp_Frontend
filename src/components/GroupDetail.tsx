// src/components/GroupDetail.tsx

import {
  Box,
  Button,
  Image as ChakraImage,
  Flex,
  Text,
  useToast,
} from "@chakra-ui/react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Group } from "../types/group";
//import { PhotoMetadata } from "../utils/getPhotoMetadata";
import { processFiles } from "../utils/heicToJpg";
import AddImagesModal from "./AddImageModal";
import AddMemberModal from "./AddMemberModal"; // Import for member invitation modal
import GroupGallery from "./GroupGallery";

// Environment variables and API base URL configuration
const apiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${apiUrl}/`;

// Motion-enhanced Chakra UI components for animations
const MotionBox = motion.create(Box);
const MotionImage = motion.create(ChakraImage);
const MotionHeader = motion.create(Box);

/**
 * Interface representing geographical coordinates.
 */
//interface Coordinates {
  //lat: number;
  //lng: number;
//}

/**
 * Extends PhotoMetadata with the original image source URL.
 */
//interface ExtendedPhoto extends PhotoMetadata {
  //originalSrc: string;
//}

/**
 * Represents a group of photos categorized by date and location.
 */
//interface PhotoGroup {
  //dateKey: string;
  //locationKey: string;
  //photos: ExtendedPhoto[];
//}

/**
 * Props for the GroupDetail component.
 */
interface GroupDetailProps {
  group: Group;
  isHeaderCollapsed: boolean;
}

/**
 * GroupDetail Component
 * Displays detailed information about a specific group, including photos and members.
 * Provides functionality to upload images and invite new members.
 */
export default function GroupDetail({ group, isHeaderCollapsed }: GroupDetailProps) {
  // State to manage the expansion of member icons
  const [areIconsExpanded, setAreIconsExpanded] = useState(false);
  // State to track the current image index in the gallery
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  // State to determine the direction of slide animation
  const [slideDirection, setSlideDirection] = useState<number>(1);
  // State to control the visibility of the image upload modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  // State to control the visibility of the member invitation modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  // Reference to hold the interval timer for automatic image sliding
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Chakra UI toast for user notifications
  const toast = useToast();

  /**
   * Effect hook to initiate automatic image sliding when multiple images are present.
   * Cleans up the interval timer on component unmount or when dependencies change.
   */
  useEffect(() => {
    if (group.image_urls && group.image_urls.length > 1) {
      timerRef.current = setInterval(() => {
        moveToNext();
      }, 5000); // Slide every 5 seconds
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [group.image_urls]);

  /**
   * Advances the gallery to the next image.
   */
  const moveToNext = () => {
    setSlideDirection(1);
    setCurrentGalleryIndex((prevIndex) => {
      if (!group.image_urls) return prevIndex;
      return (prevIndex + 1) % group.image_urls.length;
    });
  };

  /**
   * Moves the gallery to the previous image.
   */
  const moveToPrev = () => {
    setSlideDirection(-1);
    setCurrentGalleryIndex((prevIndex) => {
      if (!group.image_urls) return prevIndex;
      return (prevIndex - 1 + group.image_urls.length) % group.image_urls.length;
    });
  };

  /**
   * Handles the end of a drag gesture to navigate through the gallery.
   * @param _e - The event object.
   * @param info - Information about the drag gesture.
   */
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offsetX = info.offset.x;
    if (offsetX > 100) {
      moveToPrev();
    } else if (offsetX < -100) {
      moveToNext();
    }
  };

  /**
   * Toggles the expansion state of member icons.
   */
  const handleIconToggle = () => {
    setAreIconsExpanded((prev) => !prev);
  };

  // Modal open and close handlers for image upload
  const onOpenImageModal = () => setIsImageModalOpen(true);
  const onCloseImageModal = () => setIsImageModalOpen(false);

  // Modal open and close handlers for member invitation
  const onOpenMemberModal = () => setIsMemberModalOpen(true);
  const onCloseMemberModal = () => setIsMemberModalOpen(false);

  /**
   * Uploads image files to the backend and retrieves their URLs.
   * @param files - Array of image files to upload.
   * @returns Promise resolving to an array of image URLs.
   */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${process.env.VITE_API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      const data = await response.json();
      imageUrls.push(data.imageUrl);
    }
    return imageUrls;
  };

  /**
   * Handles the image upload process, including processing files, uploading them,
   * and sending metadata to the backend.
   * @param files - Array of image files to upload.
   */
  const handleImageUpload = async (files: File[]) => {
    try {
      // Convert HEIC files to JPEG and extract metadata
      const processed = await processFiles(files);
      const jpgFiles = processed.map((img) => img.file);
      const metadata = processed.map((img) => img.metadata);

      // Upload processed images and retrieve their URLs
      const uploadedImageUrls = await uploadImages(jpgFiles);

      // Send image URLs and metadata to the backend
      const response = await fetch(`${API_BASE_URL}trips/${group.trip_id}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrls: uploadedImageUrls,
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update trip images");
      }

      // Notify user of successful upload
      toast({
        title: "이미지 업로드 성공",
        description: "새로운 이미지가 추가되었습니다.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      // Notify user of upload failure
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  /**
   * Handles inviting a new member to the group via email.
   * @param email - The email address of the member to invite.
   */
  const handleAddMember = async (email: string) => {
    try {
      // Send invitation request to the backend API
      const response = await fetch(`${API_BASE_URL}trips/${group.trip_id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to invite member");
      }

      // Notify user of successful invitation
      toast({
        title: "초대 성공",
        description: `${email}님을 그룹에 초대했습니다.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error inviting member:", error);
      // Notify user of invitation failure
      toast({
        title: "초대 실패",
        description: "멤버 초대 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  /**
   * Variants for slide animations using Framer Motion.
   */
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      transition: { duration: 0.5 },
    }),
  };

  /**
   * Variants for fade animations using Framer Motion.
   */
  const fadeVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
      transition: { duration: 1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 1 },
    },
  };

  /**
   * Variants for header expansion and collapse animations.
   */
  const headerVariants = {
    expanded: {
      height: "300px",
      borderRadius: "10px",
      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.10)",
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    collapsed: {
      height: "250px",
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "0px",
      borderBottomLeftRadius: "7px",
      borderBottomRightRadius: "7px",
      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.10)",
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  /**
   * Variants for overlay fade animations using Framer Motion.
   */
  const overlayVariants = {
    visible: {
      opacity: 1,
      transition: { duration: 0.5, ease: "easeInOut" },
    },
    hidden: {
      opacity: 0,
      transition: { duration: 0.5, ease: "easeInOut" },
    },
  };

  /**
   * Determines the current cover image based on the gallery index.
   */
  const currentCoverImage =
    group.image_urls && group.image_urls.length > 0
      ? group.image_urls[currentGalleryIndex]
      : group.image_urls[0];

  /**
   * Sets the height of the cover image based on the header's collapsed state.
   */
  const coverImageHeight = isHeaderCollapsed ? "250px" : "300px";

  return (
    <Box w="100%" mb={4}>
      {/* Animated Header Section */}
      <MotionHeader
        variants={headerVariants}
        animate={isHeaderCollapsed ? "collapsed" : "expanded"}
        initial={false}
        position={isHeaderCollapsed ? "sticky" : "relative"}
        top={isHeaderCollapsed ? 0 : "auto"}
        overflow="hidden"
        zIndex={isHeaderCollapsed ? 10 : "auto"}
        bg={isHeaderCollapsed ? "#FFFFFF" : "transparent"}
      >
        {/* Cover Image with Slide/Fade Animations */}
        <Box position="relative" w="100%" h={coverImageHeight}>
          <AnimatePresence custom={slideDirection} mode="popLayout">
            <MotionImage
              key={currentGalleryIndex}
              src={currentCoverImage}
              alt={group.title}
              w="100%"
              h="100%"
              objectFit="cover"
              variants={isHeaderCollapsed ? fadeVariants : slideVariants}
              custom={slideDirection}
              initial={isHeaderCollapsed ? "enter" : "enter"}
              animate="center"
              exit={isHeaderCollapsed ? "exit" : "exit"}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
            />
          </AnimatePresence>
        </Box>

        {/* Overlay and Action Buttons when Header is Collapsed */}
        {isHeaderCollapsed && (
          <>
            {/* Overlay for aesthetic fade effect */}
            <AnimatePresence>
              <MotionBox
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.2))"
                zIndex={1}
              />
            </AnimatePresence>

            {/* Action Buttons and Member Icons */}
            <AnimatePresence>
              <MotionBox
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                position="absolute"
                bottom="20px"
                left="20px"
                zIndex={2}
              >
                {/* Title and Date Information */}
                <Text fontSize="lg" fontWeight="bold" color="white" mb={1}>
                  {group.title}
                </Text>
                <Text fontSize="sm" color="white" opacity={0.9} mb={3}>
                  {group.start_date instanceof Date
                    ? group.start_date.toDateString()
                    : group.start_date}
                </Text>
                {/* Group End Date */}
                <Text fontSize="sm" color="white" opacity={0.9} mb={3}>
            {   group.end_date instanceof Date
                ? group.end_date.toDateString()
              : group.end_date}
            </Text>

                {/* Buttons for Image Upload and Member Invitation */}
                <Flex alignItems="center" gap={3}>
                  <Button
                    size="sm"
                    borderRadius="full"
                    bg="whiteAlpha.800"
                    color="black"
                    fontWeight="bold"
                    leftIcon={<FiPlus />}
                    _hover={{ bg: "whiteAlpha.900" }}
                    onClick={onOpenImageModal}
                  >
                    Image
                  </Button>

                  <Button
                    size="sm"
                    borderRadius="full"
                    bg="whiteAlpha.800"
                    color="black"
                    fontWeight="bold"
                    leftIcon={<FiPlus />}
                    _hover={{ bg: "whiteAlpha.900" }}
                    onClick={onOpenMemberModal}
                  >
                    Invite
                  </Button>

                  {/* Member Icons with Expand/Collapse Functionality */}
                  <Flex onClick={handleIconToggle} cursor="pointer">
                    {group.member_google_ids.map((profileImage, index) => (
                      <MotionBox
                        key={index}
                        position="relative"
                        animate={{
                          marginLeft:
                            index === 0
                              ? "0px"
                              : areIconsExpanded
                              ? "10px"
                              : "-16px",
                        }}
                        transition={{ duration: 0.3 }}
                        zIndex={group.member_google_ids.length - index}
                      >
                        <ChakraImage
                          src={`/images/${profileImage}`}
                          alt={profileImage}
                          boxSize="32px"
                          objectFit="cover"
                          borderRadius="full"
                          border="2px solid white"
                        />
                      </MotionBox>
                    ))}
                  </Flex>
                </Flex>
              </MotionBox>
            </AnimatePresence>
          </>
        )}
      </MotionHeader>

      {/* Expanded Header Content when not collapsed */}
      {!isHeaderCollapsed && (
        <Box px={3} mt={2} textAlign="left">
          {/* Group Title */}
          <Text fontSize={20} fontWeight="bold" color="black" mb={-1}>
            {group.title}
          </Text>

          {/* Group Start Date */}
          <Text fontSize={12} color="gray.600">
                  {group.start_date instanceof Date
                    ? group.start_date.toDateString()
                    : group.start_date}
                </Text>
          {/* Group End Date */}
          <Text fontSize={12} color="gray.600">
            {group.end_date instanceof Date
              ? group.end_date.toDateString()
              : group.end_date}
          </Text>

          {/* Member Avatars and Names */}
          <Flex mt={3} alignItems="center">
            {group.member_google_ids.map((profileImage, index) => (
              <Box
                key={index}
                position="relative"
                mr={index === group.member_google_ids.length - 1 ? 0 : -4}
                zIndex={group.member_google_ids.length - index}
              >
                <ChakraImage
                  src={`/images/${profileImage}`}
                  alt={profileImage}
                  boxSize="32px"
                  borderRadius="full"
                  border="2px solid white"
                />
              </Box>
            ))}
            <Text ml={1.5} fontSize="sm" color="gray.500">
              {group.member_google_ids.join(", ")}
            </Text>
          </Flex>
        </Box>
      )}

      {/* Spacer for layout consistency */}
      <Box mb={10} />

      {/* Gallery of Group Photos */}
      <GroupGallery group={group} isHeaderCollapsed={isHeaderCollapsed} />
      <Box mb={100} />

      {/* Modal for Uploading Images */}
      <AddImagesModal
        isOpen={isImageModalOpen}
        onClose={onCloseImageModal}
        onUpload={handleImageUpload}
        tripId={group.trip_id.toString()}
      />

      {/* Modal for Inviting Members */}
      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={onCloseMemberModal}
        onAddMember={handleAddMember}
      />
    </Box>
  );};
