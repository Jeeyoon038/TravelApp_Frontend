// pages/InstagramStylePage.tsx

import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Grid,
  GridItem,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import GalleryModal from "../components/GalleryModal";
import PostCard from "../components/PostCard";

export default function Search() {
  const posts = [
    {
      profileImage: "/images/image2.jpg",
      username: "jeeyoon38",
      location: "아테네",
      images: [
        "/images/image2.jpg",
        "/images/image3.jpg",
        "/images/image4.jpg",
        "/images/image2.jpg",
        "/images/image3.jpg",
        "/images/image4.jpg",
      ],
    },
    {
      profileImage: "/images/image2.jpg",
      username: "katie",
      location: "뉴욕",
      images: ["/images/image5.jpg", "/images/image6.jpg", "/images/image7.jpg"],
    },
    {
      profileImage: "/images/image2.jpg",
      username: "seoyoung",
      location: "서울",
      images: ["/images/image5.jpg", "/images/image6.jpg", "/images/image7.jpg"],
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCardClick = (post: typeof posts[0]) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const filteredPosts = posts.filter((post) =>
    post.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box h="100vh" display="flex" flexDirection="column" bg="#f5f5f5">
      {/* 헤더 */}
      <Box px={4} pt={6} pb={2}>
        <Text fontSize="2xl" fontWeight="bold">
          여행 일지 둘러보기
        </Text>
      </Box>

      {/* 검색창 */}
      <Box bg="white" px={4} pb={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="그룹명으로 검색하기"
            value={searchQuery}
            onChange={handleSearchChange}
            borderRadius="lg"
            bg="gray.100"
            border="none"
            fontSize="sm"
            _placeholder={{ color: "gray.400" }}
            _focus={{ outline: "none", boxShadow: "none" }}
          />
        </InputGroup>
      </Box>

      {/* 검색 결과 */}
      <Box
        flex="1"
        overflowY="auto"
        px={4}
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        }}
      >
        {filteredPosts.length > 0 ? (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {filteredPosts.map((post, index) => (
              <GridItem key={index}>
                <PostCard
                  profileImage={post.profileImage}
                  username={post.username}
                  location={post.location}
                  images={post.images}
                  onClick={() => handleCardClick(post)} // 클릭 이벤트 핸들러 전달
                />
              </GridItem>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" mt={10}>
            <Text fontSize="lg">결과가 없습니다.</Text>
          </Box>
        )}
      </Box>

      {/* 하단 네비게이션 바 */}
      <Box>
        <BottomTabBar />
      </Box>

      {/* 사진 갤러리 모달 */}
      <GalleryModal isOpen={isModalOpen} onClose={handleCloseModal} post={selectedPost} />
    </Box>
  );
}
