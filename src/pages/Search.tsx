import { Box, Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import PostCard from "../components/PostCard";

export default function InstagramStylePage() {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredPosts = posts.filter((post) =>
    post.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box h="100vh" display="flex" flexDirection="column" bg="white">
      {/* 검색창 */}
      <Box bg="white" px={4} pt={6} pb={2}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="검색 (username)"
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
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        }}
      >
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <Box key={index} mb={4}>
              <PostCard {...post} />
            </Box>
          ))
        ) : (
          <Box textAlign="center" mt={10}>
            <p>결과가 없습니다.</p>
          </Box>
        )}
      </Box>

      {/* 하단 네비게이션 바 */}
      <Box position="sticky" bottom="0" zIndex="10">
        <BottomTabBar />
      </Box>
    </Box>
  );
}