import { Box, Text } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";

export default function SearchResultPage() {
  const posts = [
    {
      profileImage: "/images/image2.jpg",
      username: "jeeyoon38",
      location: "아테네",
      images: ["/images/image2.jpg", "/images/image3.jpg", "/images/image4.jpg"],
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

  const [searchParams] = useSearchParams();
  const query = searchParams.get("query")?.toLowerCase() || "";

  const filteredPosts = posts.filter(
    (post) =>
      post.username.toLowerCase().includes(query) ||
      post.location.toLowerCase().includes(query)
  );

  return (
    <Box p={4}>
      <Text fontSize="xl" mb={4}>
        검색 결과: "{query}"
      </Text>
      {filteredPosts.length > 0 ? (
        filteredPosts.map((post, index) => (
          <Box key={index} mb={10}>
            <PostCard {...post} />
          </Box>
        ))
      ) : (
        <Text>결과가 없습니다.</Text>
      )}
    </Box>
  );
}