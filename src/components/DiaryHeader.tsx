// src/components/DiaryHeader.tsx

import { Avatar, Flex, Text } from "@chakra-ui/react";

interface DiaryHeaderProps {
  user: {
    profilePicture: string;
    name: string;
  };
}

export default function DiaryHeader({ user }: DiaryHeaderProps) {
  return (
    <Flex align="center" mb={4}>
      <Avatar src={user.profilePicture} name={user.name} mr={3} />
      <Text fontSize="xl" fontWeight="bold">
        {user.name}님의 여행 일기
      </Text>
    </Flex>
  );
}
