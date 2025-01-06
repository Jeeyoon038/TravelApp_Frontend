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
  selectedGroupId?: number;
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
      if (group.image_urls && group.image_urls.length > 0) {
        const randomIndex = Math.floor(Math.random() * group.image_urls.length);
        imagesMap[group.trip_id] = group.image_urls[randomIndex];
      } else {
        imagesMap[group.trip_id] = "/images/default-image.jpg";
      }
    });
    setGroupImages(imagesMap);
    setGroups(initialGroups);
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

    const oldIndex = groups.findIndex((g) => g.trip_id === Number(active.id));
    const newIndex = groups.findIndex((g) => g.trip_id === Number(over.id));
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
        items={groups.map((g) => g.trip_id.toString())}
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
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
            scrollbarWidth: "none", // Firefox
            "&::-webkit-scrollbar": {
              display: "none", // Chrome, Safari
            },
          }}
        >
          {groups.map((group) => (
            <SortableGroupCard
              key={group.trip_id}
              group={group}
              imageSrc={groupImages[group.trip_id]}
              isSelected={group.trip_id === selectedGroupId}
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
      id: group.trip_id.toString(),
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : "auto",
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthName = monthNames[date.getMonth()];
    return `${monthName} ${year}`;
  };
  
  // Then in your render function
  const formattedDate = formatDate(group.start_date);


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
          alt={group.title}
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
          {group.title}
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
