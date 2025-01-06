import React from "react";
import { 
  Box, 
  Text 
} from "@chakra-ui/react";
import MyGroupStoryScroll from "../components/MyGroupStoryScroll";
import GroupDetail from "../components/GroupDetail";
import { Group } from "../types/group";

interface GroupStorySectionProps {
  groups: Group[];
  selectedGroup: Group | null;
  onSelectGroup: (group: Group) => void;
  isHeaderCollapsed: boolean;
}

export default function GroupStorySection({ 
  groups, 
  selectedGroup, 
  onSelectGroup,
  isHeaderCollapsed 
}: GroupStorySectionProps) {
  return (
    <>
      <Box bg="white" boxShadow="md" borderRadius="10" mt={2} mb={2} p={3}>
        <MyGroupStoryScroll
          groups={groups}
          selectedGroupId={selectedGroup?.trip_id}
          onSelectGroup={onSelectGroup}
        />
      </Box>

      {selectedGroup && (
        <Box bg="white" boxShadow="md" borderRadius="lg">
          <GroupDetail 
            group={selectedGroup} 
            isHeaderCollapsed={isHeaderCollapsed} 
          />
        </Box>
      )}
    </>
  );
}