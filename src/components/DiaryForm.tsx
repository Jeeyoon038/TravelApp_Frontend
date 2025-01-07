import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface Diary {
  _id: string;
  content: string;
}

interface DiaryFormProps {
  photoId: string;
}

const DiaryList: React.FC<{ diaries: Diary[] }> = ({ diaries }) => {
  if (!Array.isArray(diaries) || diaries.length === 0) {
    return <Text>No diaries available for this photo.</Text>;
  }

  return (
    <VStack spacing={4}>
      {diaries.map((diary) => (
        <Box key={diary._id} p={4} borderWidth="1px" borderRadius="md" width="100%">
          <Text>{diary.content}</Text>
        </Box>
      ))}
    </VStack>
  );
};

const DiaryForm: React.FC<DiaryFormProps> = ({ photoId }) => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [newDiaryContent, setNewDiaryContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        const response = await axios.get(`/api/diaries?photoId=${photoId}`);
        setDiaries(Array.isArray(response.data) ? response.data : []); // Ensure data is an array
      } catch (error) {
        console.error("Error fetching diaries:", error);
        setDiaries([]);
      }
    };

    fetchDiaries();
  }, [photoId]);

  const handleAddDiary = async () => {
    if (!newDiaryContent.trim()) return;

    try {
      setIsLoading(true);
      const response = await axios.post("/api/diaries", {
        photoId,
        content: newDiaryContent,
      });
      setDiaries((prevDiaries) => [...prevDiaries, response.data]);
      setNewDiaryContent("");
    } catch (error) {
      console.error("Error adding diary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4}>
      <DiaryList diaries={diaries} />

      <VStack mt={4} spacing={4}>
        <Input
          placeholder="Write a new diary entry..."
          value={newDiaryContent}
          onChange={(e) => setNewDiaryContent(e.target.value)}
        />
        <Button onClick={handleAddDiary} isLoading={isLoading} colorScheme="blue">
          Add Diary
        </Button>
      </VStack>
    </Box>
  );
};

export default DiaryForm;
