// src/components/GroupLocationList.tsx

import { Box, Image as ChakraImage, Text, VStack } from "@chakra-ui/react";
import { Group } from "../types/group";

interface GroupLocationListProps {
  group: Group;
}

export default function GroupLocationList({ group }: GroupLocationListProps) {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Trip ID: {group.trip_id}
      </Text>
      <VStack spacing={2} align="start">
        {group.image_urls.map((url, idx) => (
          <ChakraImage key={idx} src={url} alt={`Trip ${group.trip_id} Image ${idx + 1}`} boxSize="150px" objectFit="cover" borderRadius="md" />
        ))}
      </VStack>
    </Box>
  );
}
