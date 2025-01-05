// MyGroupStoryScroll.tsx
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Group } from "../types/group";

import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

  // State to map group IDs to their selected random images
  const [groupImages, setGroupImages] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const imagesMap: { [key: number]: string } = {};
    initialGroups.forEach((group) => {
      if (group.galleryImages && group.galleryImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * group.galleryImages.length);
        imagesMap[group.id] = group.galleryImages[randomIndex];
      } else {
        // Fallback image if galleryImages is empty
        imagesMap[group.id] = "/images/default-image.jpg"; // Ensure this fallback image exists
      }
    });
    setGroupImages(imagesMap);
  }, [initialGroups]);

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
          px={7}
          py={2}
          overflowX="scroll"
          bg="white"
          alignItems="center"
          css={{
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
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
              imageSrc={groupImages[group.id]}
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
  imageSrc: string; // Add imageSrc prop
}

function SortableGroupCard({
  group,
  isSelected,
  onSelectGroup,
  imageSrc, // Destructure imageSrc
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
        borderRadius="12"
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
          src={imageSrc} // Use the random image source from galleryImages
          alt={group.name}
          objectFit="cover"
          w="100%"
          h="100%"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/default-image.jpg"; // Fallback image
          }}
        />
        <Text
          position="absolute"
          bottom="15px"
          fontSize={12}
          fontWeight="bold"
          color="white"
          textAlign="left"
          zIndex="2"
          p={2}
          pb={1}
          width="100%"
        >
          {group.nickname}
        </Text>
        <Text
          position="absolute"
          bottom="0"
          fontSize={10}
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
