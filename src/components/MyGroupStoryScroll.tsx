import React, { useState } from "react";
import { Box, Flex, HStack, Image, Text } from "@chakra-ui/react";
import { Group } from "../types/group";

import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragCancelEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MouseSensor, TouchSensor } from "@dnd-kit/core";

import { Button } from "@chakra-ui/react";
import { Spinner } from "@chakra-ui/icons";

// forwardRef를 react에서 직접 가져옵니다.
import { forwardRef } from "react";

interface MyGroupStoryScrollProps {
  groups: Group[];
  selectedGroupId: number;
  onSelectGroup: (group: Group) => void;
}

export default function MyGroupStoryScroll({
  groups: initialGroups,
  selectedGroupId,
  onSelectGroup,
}: MyGroupStoryScrollProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (_event: DragStartEvent) => {
    document.body.style.overflow = "hidden";
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.overflow = "auto";

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((g) => g.id === Number(active.id));
    const newIndex = groups.findIndex((g) => g.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const newGroups = arrayMove(groups, oldIndex, newIndex);
    setGroups(newGroups);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    document.body.style.overflow = "auto";
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={groups.map((g) => g.id.toString())}
        strategy={horizontalListSortingStrategy}
      >
        <Flex
  direction="row"
  gap={4}
  px={4}
  py={2}
  overflowX="scroll"
  bg="white"
  alignItems="center"
  css={{
    WebkitOverflowScrolling: "touch", // iOS 스크롤 부드럽게
    scrollbarWidth: "none", // Firefox
    "&::-webkit-scrollbar": {
      display: "none", // Chrome, Safari
    },
  }}
>
  {groups.map((group) => (
    <SortableGroupCard
      key={group.id}
      group={group}
      isSelected={group.id === selectedGroupId}
      onSelectGroup={onSelectGroup}
    />
  ))}
</Flex>


      </SortableContext>
    </DndContext>
  );
}

interface SortableGroupCardProps {
  group: Group;
  isSelected: boolean;
  onSelectGroup: (group: Group) => void;
}

function SortableGroupCard({
  group,
  isSelected,
  onSelectGroup,
}: SortableGroupCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: group.id.toString(),
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : "auto",
  };

  const startDate = group.dates[0].split(" ~ ")[0];
  const [year, month] = startDate.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = monthNames[monthIndex];
  const formattedDate = `${monthName} ${year}`;

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      direction="column"
      alignItems="center"
      cursor="pointer"
      onClick={() => onSelectGroup(group)}
      transition="transform 0.2s"
      transform={isSelected ? "scale(1.05)" : "scale(1.0)"}
    >
      <Box
        w="120px"
        h="160px"
        borderRadius="10"
        overflow="hidden"
        boxShadow={isSelected ? "0 0 0 3px #F56565" : "none"}
        transition="box-shadow 0.2s, transform 0.2s"
        position="relative"
        bg="gray.100"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.4)"
          zIndex="1"
        />
        <Image
          src={group.coverImage}
          alt={group.name}
          objectFit="cover"
          w="100%"
          h="100%"
        />
        <Text
          position="absolute"
          bottom="15px"
          fontSize="xs"
          fontWeight="bold"
          color="white"
          textAlign="left"
          zIndex="2"
          p={2}
          width="100%"
        >
          {group.nickname}
        </Text>
        <Text
          position="absolute"
          bottom="0"
          fontSize="xs"
          fontWeight="bold"
          color="white"
          textAlign="left"
          zIndex="2"
          p={2}
          width="100%"
        >
          {formattedDate}
        </Text>
      </Box>
    </Flex>
  );
}
