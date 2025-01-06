// src/components/DiaryEditor.tsx

import { Box, Button, Flex, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { DiaryEntry, Photo } from "../types/trip";

interface DiaryEditorProps {
  photo: Photo;
  existingEntry?: DiaryEntry;
  onSave: (entry: DiaryEntry) => void;
  onCancel: () => void;
}

export default function DiaryEditor({
  photo,
  existingEntry,
  onSave,
  onCancel,
}: DiaryEditorProps) {
  const [content, setContent] = useState<string>(existingEntry?.content || "");

  useEffect(() => {
    setContent(existingEntry?.content || "");
  }, [existingEntry]);

  const handleSave = () => {
    if (content.trim() === "") {
      alert("일기 내용을 입력해주세요.");
      return;
    }
    const entry: DiaryEntry = {
      photo_id: photo.photo_id,
      content,
      date: new Date().toISOString(),
    };
    onSave(entry);
  };

  return (
    <Box p={4} bg="white" boxShadow="md" borderRadius="md">
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        사진 ID: {photo.photo_id}에 대한 일기 작성
      </Text>
      <Textarea
        placeholder="일기 내용을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        mb={4}
        rows={6}
      />
      <Flex justifyContent="flex-end" gap={2}>
        <Button onClick={onCancel}>취소</Button>
        <Button colorScheme="blue" onClick={handleSave}>
          저장
        </Button>
      </Flex>
    </Box>
  );
}
