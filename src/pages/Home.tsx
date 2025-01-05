import React, { useState, UIEvent, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomTabBar from "../components/BottomTabBar";
import GroupDetail from "../components/GroupDetail";
import MyGroupStoryScroll from "../components/MyGroupStoryScroll";
import { Group } from "../types/group";

const mockGroups: Group[] = [
  {
    id: 1,
    name: "친구들과의 제주도 여행",
    nickname: "제주 불주먹",
    coverImage: "/images/image3.jpg",
    members: ["profile1.jpg", "profile2.jpg", "profile3.jpg"],
    places: ["제주도", "우도", "성산일출봉"],
    dates: ["2024-10-12 ~ 2024-10-15"],
    galleryImages: [
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
    ],
  },
  {
    id: 2,
    name: "가족 여행",
    nickname: "우리집 최고",
    coverImage: "/images/image5.jpg",
    members: ["profile1.jpg", "profile3.jpg"],
    places: ["강원도", "주문진", "속초"],
    dates: ["2025-01-01 ~ 2025-01-05"],
    galleryImages: [
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
    ],
  },
  {
    id: 3,
    name: "회사 워크샵",
    nickname: "열정 가득 우리팀",
    coverImage: "/images/image9.jpg",
    members: ["profile2.jpg", "profile1.jpg", "profile3.jpg"],
    places: ["서울", "분당", "수원"],
    dates: ["2025-03-10 ~ 2025-03-12"],
    galleryImages: [
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
    ],
  },
  {
    id: 4,
    name: "몰입캠프",
    nickname: "열정 가득 우리팀",
    coverImage: "/images/image1.jpg",
    members: ["홍길동", "김코딩", "박해커"],
    places: ["서울", "분당", "수원"],
    dates: ["2025-03-10 ~ 2025-03-12"],
    galleryImages: [
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
    ],
  },
  {
    id: 6,
    name: "이얍얍",
    nickname: "열정 가득 우리팀",
    coverImage: "/images/image1.jpg",
    members: ["홍길동", "김코딩", "박해커"],
    places: ["서울", "분당", "수원"],
    dates: ["2025-03-10 ~ 2025-03-12"],
    galleryImages: [
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
      "/images/image2.jpg",
      "/images/image3.jpg",
      "/images/image4.jpg",
    ],
  },
];

export default function Home() {
  const [selectedGroup, setSelectedGroup] = useState<Group>(mockGroups[0]);
  
  // Initialize user with a mock logged-in user
  const [user, setUser] = useState<any>({
    access_token: "mock_token_12345",
    email: "johndoe@example.com",
    name: "여행의신",
    profilePicture: "/images/default-profile.jpg",
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newTrip, setNewTrip] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
  
      const response = await fetch("http://localhost:3000/upload/image", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        imageUrls.push(data.imageUrl);
      } else {
        console.error("Image upload failed:", file.name);
      }
    }
    return imageUrls;
  };

  const [scrollTop, setScrollTop] = useState(0);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const bigHeaderRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setShowCollapsedHeader(newScrollTop > 300);
  };

  function handleSelectGroup(group: Group): void {
    setSelectedGroup(group);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrip(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imageUrls = await uploadImages(selectedFiles);

      const response = await fetch('http://localhost:3000/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTrip.title,
          start_date: new Date(newTrip.start_date).toISOString(),
          end_date: new Date(newTrip.end_date).toISOString(),  
          image_urls: imageUrls,
          member_google_ids: []
        }),
      });
  
      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  return (
    <Flex direction="column" h="100vh" bg="#F2F2F2">
      <Box
        flex="1"
        overflowY="auto"
        onScroll={handleScroll}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        }}
      >
        <Box
          bg="white"
          boxShadow="md"
          borderTopRadius={0}
          borderBottomRadius={10}
          p={4}
        >
          <Text fontWeight="bold" fontSize={24} mb={3}>
            My Travel Log
          </Text>
          
          <Flex alignItems="center">
            {user && (
              <Image
                src={user.profilePicture || "/images/default-profile.jpg"}
                alt="User Profile"
                boxSize="45px"
                borderRadius="full"
                objectFit="cover"
                mr={4}
              />
            )}
            <Text fontWeight={500} fontSize="sm" mr={2}>
              {user
                ? "여행을 함께 할 새로운 그룹을 생성하세요."
                : "로그인 해주세요."}
            </Text>
            <Button
              size="sm"
              bg="white"
              color="blue.500"
              border="1px"
              borderColor="blue.500"
              borderRadius="md"
              _hover={{
                bg: "blue.50",
                color: "blue.600"
              }}
              boxShadow="sm"
              onClick={onOpen}
            >
              + New Trip
            </Button>
          </Flex>
        </Box>

        <Box
          bg="white"
          boxShadow="md"
          borderRadius={10}
          mt={2}
          mb={2}
          p={3}
          pr={-3}
          style={{
            transition: "all 0.3s ease",
            transform: showCollapsedHeader ? "scale(0.95)" : "scale(1)",
            opacity: showCollapsedHeader ? 0.9 : 1,
          }}
        >
          <MyGroupStoryScroll
            groups={mockGroups}
            selectedGroupId={selectedGroup.id}
            onSelectGroup={handleSelectGroup}
          />
        </Box>

        <Box
          bg="white"
          boxShadow="md"
          borderRadius="lg"
        >
          <GroupDetail
            group={selectedGroup}
            isHeaderCollapsed={showCollapsedHeader}
          />
        </Box>
      </Box>

      <Box position="sticky" bottom="0" zIndex="10">
        <BottomTabBar />
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Trip</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateTrip}>
              <FormControl mb={4}>
                <FormLabel>Trip Title</FormLabel>
                <Input
                  name="title"
                  placeholder="Enter trip title"
                  value={newTrip.title}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Images</FormLabel>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Start Date</FormLabel>
                <Input
                  name="start_date"
                  type="date"
                  value={newTrip.start_date}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>End Date</FormLabel>
                <Input
                  name="end_date"
                  type="date"
                  value={newTrip.end_date}
                  onChange={handleInputChange}
                  required
                />
              </FormControl>

              <Button colorScheme="blue" mr={3} type="submit">
                Create Trip
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}