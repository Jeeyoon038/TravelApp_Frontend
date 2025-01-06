import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Grid,
  GridItem,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Text
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

import BottomTabBar from "../components/BottomTabBar";
import GalleryModal from "../components/GalleryModal";
import PostCard from "../components/PostCard";

// Create motion-enabled Chakra UI components
const MotionBox = motion(Box);
const MotionText = motion(Text);

export default function Search() {
  const posts = [
    {
      profileImage: "/images/image2.jpg",
      username: "jeeyoon38",
      location: "아테네",
      images: ["/images/image2.jpg", "/images/image3.jpg","/images/image2.jpg", "/images/image3.jpg"],
    },
    {
      profileImage: "/images/image2.jpg",
      username: "katie",
      location: "뉴욕",
      images: ["/images/image5.jpg", "/images/image6.jpg"],
    },
    {
      profileImage: "/images/image2.jpg",
      username: "하하하",
      location: "서울",
      images: ["/images/image5.jpg", "/images/image6.jpg"],
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const lastScrollTopRef = useRef<number>(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    if (currentScrollTop === 0 && !isSearchMode) {
      setIsHeaderCollapsed(false);
    } else if (currentScrollTop > lastScrollTopRef.current) {
      setIsHeaderCollapsed(true);
    }
    lastScrollTopRef.current = currentScrollTop;
  };

  const handleSearchIconClick = () => {
    setIsSearchMode(true);
    setIsHeaderCollapsed(true);
  };

  const exitSearchMode = () => {
    setIsSearchMode(false);
    setSearchQuery("");
  };

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

  const headerVariants = {
    expanded: {
      height: "120px",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    collapsed: {
      height: "60px",
      transition: { type: "spring", stiffness: 500, damping: 50 },
    },
  };

  const titleVariants = {
    expanded: {
      fontSize: "24px",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    collapsed: {
      fontSize: isSearchMode ? "0px" : "16px",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const searchBarVariants = {
    visible: {
      opacity: 1,
      width: "100%",
      position: "absolute",
      top: "60%",
      transform: "translateY(-50%)",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    hidden: {
      opacity: 0,
      height: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const closeIconVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <Box h="100vh" display="flex" flexDirection="column" bg="#f5f5f5">
      <MotionBox
        position="sticky"
        top="0"
        zIndex="10"
        bg="white"
        borderBottomRadius={isHeaderCollapsed ? 0 : 10}
        variants={headerVariants}
        animate={isHeaderCollapsed && !isSearchMode ? "collapsed" : "expanded"}
        boxShadow={
          isHeaderCollapsed
            ? "0px 2px 4px rgba(0, 0, 0, 0.1)"
            : "0px 4px 6px rgba(0, 0, 0, 0.1)"
        }
        overflow="hidden"
      >
        <Box
          px={4}
          py={4}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <MotionText
            variants={titleVariants}
            animate={
              isHeaderCollapsed && !isSearchMode ? "collapsed" : "expanded"
            }
            fontWeight="bold"
          >
            {!isSearchMode && "여행 일지 둘러보기"}
          </MotionText>

          <AnimatePresence>
            {isHeaderCollapsed && (
              isSearchMode ? (
                <MotionBox
                  key="close-icon"
                  variants={closeIconVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <IconButton
                    aria-label="Exit Search"
                    icon={<CloseIcon />}
                    size="sm"
                    onClick={exitSearchMode}
                    variant="ghost"
                  />
                </MotionBox>
              ) : (
                <MotionBox
                  key="search-icon"
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <IconButton
                    aria-label="Search"
                    icon={<SearchIcon />}
                    size="sm"
                    onClick={handleSearchIconClick}
                    variant="ghost"
                  />
                </MotionBox>
              )
            )}
          </AnimatePresence>
        </Box>

        <AnimatePresence>
          {(isSearchMode || !isHeaderCollapsed) && (
            <MotionBox
              key="search-bar"
              px={4}
              pb={4}
              variants={searchBarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder="그룹명으로 검색하기"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  borderRadius={10}
                  bg="#f5f5f5"
                  border="none"
                  fontSize="sm"
                  _placeholder={{ color: "gray.400" }}
                  _focus={{ outline: "none", boxShadow: "none" }}
                />
              </InputGroup>
            </MotionBox>
          )}
        </AnimatePresence>
      </MotionBox>

      <Box
        flex="1"
        overflowY="auto"
        pt={2}
        onScroll={handleScroll}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        }}
      >
        
        {filteredPosts.length > 0 ? (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
            {filteredPosts.map((post, index) => (
              <GridItem key={index}>
                <PostCard
                  profileImage={post.profileImage}
                  username={post.username}
                  location={post.location}
                  images={post.images}
                  onClick={() => handleCardClick(post)}
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

      
      <Box>
        <BottomTabBar />
      </Box>

      <GalleryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
      />
      
    </Box>
  );
}