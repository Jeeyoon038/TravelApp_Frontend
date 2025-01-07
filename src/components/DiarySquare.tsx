// src/components/DiarySquare.tsx

import { Box, Text } from "@chakra-ui/react";
import React from "react";

interface DiarySquareProps {
  diary: {
    content: string;
    date: string;
  };
}

const DiarySquare: React.FC<DiarySquareProps> = ({ diary }) => {
  return (
    <Box
      width="100px"
      height="100px"
      bg="gray.200"
      borderRadius="md"
      boxShadow="sm"
      p={2}
      overflow="hidden"
      cursor="pointer"
      _hover={{ bg: "gray.300" }}
    >
      <Text fontSize="sm" noOfLines={3}>
        {diary.content}
      </Text>
      <Text fontSize="xs" color="gray.500" mt={2}>
        {diary.date}
      </Text>
    </Box>
  );
};

export default DiarySquare;
