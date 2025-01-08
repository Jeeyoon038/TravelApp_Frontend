import { Box, Spinner, Text } from "@chakra-ui/react";
import MyGroupStoryScroll from "../components/MyGroupStoryScroll";
import GroupDetail from "../components/GroupDetail";
import { Group } from "../types/group";
import { useFetchGroups } from "../hooks/useFetchGroups"; // useFetchGroups 훅 추가
import { useState } from "react";

interface GroupStorySectionProps {
  userId: string; // 현재 로그인한 사용자의 Google ID
  isHeaderCollapsed: boolean;
}

export default function GroupStorySection({
  userId,
  isHeaderCollapsed,
}: GroupStorySectionProps) {
  // 데이터를 가져오는 훅 호출
  const { groups, loading, error } = useFetchGroups(userId);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // 그룹 선택 핸들러
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red.500">Error loading groups: {error.message}</Text>
      </Box>
    );
  }

  return (
    <>
      <Box bg="white" boxShadow="md" borderRadius="10" mt={2} mb={2} p={3}>
        <MyGroupStoryScroll
          groups={groups}
          selectedGroupId={selectedGroup?.trip_id}
          onSelectGroup={handleSelectGroup}
        />
      </Box>

      {selectedGroup && (
        <Box bg="white" boxShadow="md" borderRadius="lg">
          <GroupDetail group={selectedGroup} isHeaderCollapsed={isHeaderCollapsed} />
        </Box>
      )}
    </>
  );
}
