// GroupDetail.tsx

import { Box, Button, Image as ChakraImage, Flex, Text } from "@chakra-ui/react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Group } from "../types/group";
import GroupGallery from "./GroupGallery";

const MotionBox = motion(Box);
const MotionImage = motion(ChakraImage);
const MotionHeader = motion(Box);

interface GroupDetailProps {
  group: Group;
  isHeaderCollapsed: boolean;
}

export default function GroupDetail({ group, isHeaderCollapsed }: GroupDetailProps) {
  // 아이콘 펼침/접힘 상태
  const [areIconsExpanded, setAreIconsExpanded] = useState(false);
  // galleryImages 슬라이드용 인덱스
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  // 슬라이드 방향 (오른쪽→왼쪽=1, 왼쪽→오른쪽=-1)
  const [slideDirection, setSlideDirection] = useState<number>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ------------------------------
  // (1) 자동 슬라이드 타이머
  // ------------------------------
  useEffect(() => {
    // galleryImages가 2장 이상일 때만 자동 슬라이드
    if (group.galleryImages && group.galleryImages.length > 1) {
      timerRef.current = setInterval(() => {
        moveToNext();
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.galleryImages]);

  // 다음 이미지로 이동
  const moveToNext = () => {
    setSlideDirection(1); // 오른쪽 → 왼쪽
    setCurrentGalleryIndex((prevIndex) => {
      if (!group.galleryImages) return prevIndex;
      return (prevIndex + 1) % group.galleryImages.length;
    });
  };

  // 이전 이미지로 이동
  const moveToPrev = () => {
    setSlideDirection(-1); // 왼쪽 → 오른쪽
    setCurrentGalleryIndex((prevIndex) => {
      if (!group.galleryImages) return prevIndex;
      return (prevIndex - 1 + group.galleryImages.length) % group.galleryImages.length;
    });
  };

  // ------------------------------
  // (2) 스와이프(드래그) 처리
  // ------------------------------
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offsetX = info.offset.x;
    // 오른쪽(+x) 드래그 => 이전 이미지
    if (offsetX > 100) {
      moveToPrev();
    }
    // 왼쪽(-x) 드래그 => 다음 이미지
    else if (offsetX < -100) {
      moveToNext();
    }
  };

  // ------------------------------
  // (3) 애니메이션 variants
  // ------------------------------
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

  // ------------------------------
  // (4) 표시할 이미지
  // ------------------------------
  // galleryImages 배열이 있으면 슬라이딩할 currentGalleryIndex 이미지를,
  // 없으면 fallback으로 coverImage를 보여줍니다.
  const currentCoverImage =
    group.galleryImages && group.galleryImages.length > 0
      ? group.galleryImages[currentGalleryIndex]
      : group.coverImage;

  // ------------------------------
  // (5) 기타 UI/레이아웃
  // ------------------------------
  const coverImageHeight = isHeaderCollapsed ? "200px" : "300px";

  const handleIconToggle = () => {
    setAreIconsExpanded((prev) => !prev);
  };

  // ------------------------------
  // (6) 헤더 애니메이션 variants
  // ------------------------------
  const headerVariants = {
    expanded: {
      height: "300px",
      borderRadius: "10px",
      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.10)",
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    collapsed: {
      height: "200px",
      borderTopLeftRadius:"0px",
      borderTopRightRadius:"0px",
      borderBottomLeftRadius: "7px",
      borderBottomRightRadius: "7px",
      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.10)",
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  // ------------------------------
  // (7) 오버레이 및 텍스트 애니메이션 variants
  // ------------------------------
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

  const textVariants = {
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hidden: {
      y: 20,
      opacity: 0,
      transition: { duration: 0.5, ease: "easeIn" },
    },
  };

  return (
    <Box w="100%" mb={4}>
      {/* 대표 이미지 영역 - MotionHeader로 애니메이션 적용 */}
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
        {/* 슬라이드 또는 페이드 애니메이션 적용 */}
        <Box position="relative" w="100%" h={coverImageHeight}>
          <AnimatePresence custom={slideDirection} mode="popLayout">
            <MotionImage
              key={currentGalleryIndex}
              src={currentCoverImage}
              alt={group.name}
              w="100%"
              h="100%"
              objectFit="cover"
              // 조건에 따라 슬라이드 또는 페이드 variants 적용
              variants={isHeaderCollapsed ? fadeVariants : slideVariants}
              custom={slideDirection}
              initial={isHeaderCollapsed ? "enter" : "enter"}
              animate="center"
              exit={isHeaderCollapsed ? "exit" : "exit"}
              // 드래그(스와이프) 설정
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
            />
          </AnimatePresence>
        </Box>

        {/* 헤더가 접힌 상태일 때 오버레이 및 텍스트/버튼 */}
        {isHeaderCollapsed && (
          <>
            {/* 오버레이 - AnimatePresence와 Motion을 활용 */}
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

            {/* 그룹 닉네임, 날짜 - 애니메이션 추가 */}
            <AnimatePresence>
              <MotionBox
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                position="absolute"
                bottom="90px"
                left="20px"
                right="20px"
                zIndex={2}
                display="flex"
                flexDirection="column"
                gap={2}
                color="white"
              >
                <Text fontSize="3xl" fontWeight="bold" mb={-3}>
                  {group.nickname}
                </Text>
                <Text fontSize="md" fontWeight="light" mb={-6}>
                  {group.dates.join(", ")}
                </Text>
              </MotionBox>
            </AnimatePresence>

            {/* 멤버 프로필 + Invite 버튼 - 애니메이션 추가 */}
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
                display="flex"
                alignItems="center"
                gap={3}
              >
                <Flex onClick={handleIconToggle} cursor="pointer">
                  {group.members.map((profileImage, index) => (
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
                      zIndex={group.members.length - index}
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

                <Button
                  size="sm"
                  borderRadius="full"
                  bg="white"
                  color="black"
                  fontWeight="bold"
                  leftIcon={<FiPlus />}
                  _hover={{ bg: "gray.200" }}
                >
                  Invite
                </Button>
              </MotionBox>
            </AnimatePresence>
          </>
        )}
      </MotionHeader>

      {/* 헤더 펼쳐진 상태일 때 표시되는 상세정보 */}
      {!isHeaderCollapsed && (
        <Box px={3} mt={2} textAlign="left">
          <Text fontSize={20} fontWeight="bold" color="black" mb={-1}>
            {group.nickname}
          </Text>
          <Text fontSize={12} fontWeight="light" color="gray.600" mb={-1}>
            {group.name}
          </Text>
          <Text fontSize={12} color="gray.600">
            {group.dates.join(", ")}
          </Text>

          {/* 멤버들 프로필 (겹쳐 보여주기) */}
          <Flex mt={3} alignItems="center">
            {group.members.map((profileImage, index) => (
              <Box
                key={index}
                position="relative"
                mr={index === group.members.length - 1 ? 0 : -4}
                zIndex={group.members.length - index}
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
              {group.members.join(", ")}
            </Text>
          </Flex>
        </Box>
      )}

      {/* 본문 아래 공간 + 갤러리 섹션 */}
      <Box mb={10} />
      <GroupGallery group={group} isHeaderCollapsed={isHeaderCollapsed} />
      <Box mb={100} />
    </Box>
  );
}
