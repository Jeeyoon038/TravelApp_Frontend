//import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { Group } from "../types/group";


interface MyGroupStoryScrollProps {
  groups: Group[];
  selectedGroupId?: number;
  onSelectGroup: (group: Group) => void;
}

const MyGroupStoryScroll=({groups,
  selectedGroupId,
  onSelectGroup,
}: MyGroupStoryScrollProps)=> {
  return (
    <Flex
      direction="row"
      gap={4}
      px={4}
      py={2}
      overflowX="scroll"
      bg="white"
      alignItems="center"
      css={{
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {groups.map((group) => (
        <Box
          key={group.trip_id}
          onClick={() => onSelectGroup(group)}
          cursor="pointer"
          bg={group.trip_id === selectedGroupId ? "blue.50" : "white"}
          border="1px solid"
          borderColor={group.trip_id === selectedGroupId ? "blue.500" : "gray.200"}
          borderRadius="10px"
          p={3}
          boxShadow="sm"
          transition="all 0.2s ease-in-out"
          _hover={{ boxShadow: "md", transform: "scale(1.05)" }}
        >
          <Text fontWeight="bold">{group.title}</Text>
        </Box>
      ))}
    </Flex>
  );
}


export default MyGroupStoryScroll;