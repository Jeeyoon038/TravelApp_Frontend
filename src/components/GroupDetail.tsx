// GroupDetail.tsx

import { Box, Button, Image as ChakraImage, Flex, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Group } from "../types/group";
import GroupGallery from "./GroupGallery"; // ❶ GroupGallery 임포트

const MotionBox = motion.create(Box);

interface GroupDetailProps {
  group: Group;
  isHeaderCollapsed: boolean; // ❷
}

export default function GroupDetail({ group, isHeaderCollapsed }: GroupDetailProps) {
  // 아이콘 펼침/접힘 상태
  const [areIconsExpanded, setAreIconsExpanded] = useState(false);

  const handleIconToggle = () => {
    setAreIconsExpanded((prev) => !prev);
  };

  // 스크롤이 threshold를 넘어서면: 대표 이미지 높이를 줄이고,
  const coverImageHeight = isHeaderCollapsed ? "200px" : "300px";

  return (
    <Box w="100%" mb={4}>
      {/* 대표 이미지 영역 */}
      <Box
        position={isHeaderCollapsed ? "sticky" : "relative"}
        top={isHeaderCollapsed ? 0 : "auto"}
        overflow="hidden"
        zIndex={isHeaderCollapsed ? 10 : "auto"}
        bg={isHeaderCollapsed ? "black" : "transparent"}
      >
        {/* 메인 커버 이미지 */}
        <ChakraImage
          src={group.coverImage}
          alt={group.name}
          w="100%"
          h={coverImageHeight}
          objectFit="cover"
          transition="height 0.3s ease"
        />

        {/* 헤더가 축소된 상태일 때 → 이미지 위 오버레이 + 텍스트/버튼 */}
        {isHeaderCollapsed && (
          <>
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.2))"
              transition="all 0.3s ease"
              zIndex={1}
            />

            {/* 그룹 닉네임, 날짜, 멤버들 */}
            <Box
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
            </Box>

            {/* 멤버 프로필 + Invite 버튼 */}
            <Flex
              position="absolute"
              bottom="20px"
              left="20px"
              zIndex={2}
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
            </Flex>
          </>
        )}
      </Box>

      {/* 헤더가 펼쳐진 상태(스크롤 위): 이미지 아래에 상세정보 표시 */}
      {!isHeaderCollapsed && (
        <Box px={4} pt={4} textAlign="left">
          <Text fontSize={35} fontWeight="bold" color="black" mb={0}>
            {group.nickname}
          </Text>
          <Text fontSize={18} fontWeight="light" color="gray.600">
            {group.name}
          </Text>
          <Text fontSize={16} color="gray.600">
            {group.dates.join(", ")}
          </Text>

          {/* 멤버들 겹쳐 보여주기 */}
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

      {/* ❸ GroupGallery 컴포넌트 이동 */}
      <Box mb={10}></Box>
      <GroupGallery group={group} isHeaderCollapsed={isHeaderCollapsed} />

      <Box mb={100}></Box>
    </Box>
    
  );
}
