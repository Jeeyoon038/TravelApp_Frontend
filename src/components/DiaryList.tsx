// src/components/DiaryList.tsx

import { Box, Text, VStack } from "@chakra-ui/react";
import { Diary } from "../types/diary";

interface DiaryListProps {
  diaries: Diary[];
}

export default function DiaryList({ diaries }: DiaryListProps) {
  if (diaries.length === 0) {
    return (
      <Box mt={4}>
        <Text>No diary entries for this photo yet.</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={4} mt={4}>
      {diaries.map((diary) => (
        <Box key={diary._id} p={4} bg="white" borderRadius="md" boxShadow="sm">
          <Text fontWeight="bold" mb={2}>
            {diary.date}
          </Text>
          <Text>{diary.content}</Text>
        </Box>
      ))}
    </VStack>
  );
}
