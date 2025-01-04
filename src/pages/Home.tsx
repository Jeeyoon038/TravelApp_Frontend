import {
  Box,
  Flex,
  Image,
  Text
} from "@chakra-ui/react";
import { UIEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomTabBar from "../components/BottomTabBar";
import GroupDetail from "../components/GroupDetail";
import LoginModal from "../components/LoginModal";
import MyGroupStoryScroll from "../components/MyGroupStoryScroll";
import { Group } from "../types/group";

const mockGroups: Group[] = [
  {
    id: 1,
    name: "친구들과의 제주도 여행",
    nickname: "제주 불주먹",
    coverImage: "/images/image1.jpg",
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
  const [user, setUser] = useState<any>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const bigHeaderRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedEmail = localStorage.getItem("user_email");
    const storedName = localStorage.getItem("user_name");
    const storedProfilePicture = localStorage.getItem("user_profile_picture");

    if (storedToken && storedEmail && storedName) {
      setUser({
        access_token: storedToken,
        email: storedEmail,
        name: storedName,
        profilePicture: storedProfilePicture,
      });
    }
  }, []);

  // Get user info from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("access_token");
    const email = params.get("email");
    const name = params.get("name");
    const profilePicture = params.get("profile_picture");

    console.log('Received User Info:', { email, name, profilePicture });

    if (accessToken && email && name) {
      setUser({
        access_token: accessToken,
        email,
        name,
        profilePicture,
      });

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", name);
      if (profilePicture) {
        localStorage.setItem("user_profile_picture", profilePicture);
      }
    }
  }, [location.search]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setShowCollapsedHeader(newScrollTop > 250);
  };

  // Updated handleSelectGroup function
  function handleSelectGroup(group: Group): void {
    setSelectedGroup(group);
  }

  return (
    <Flex direction="column" h="100vh" bg="#F2F2F2">
      <LoginModal setUser={setUser} />

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
        <Box ref={bigHeaderRef} bg="white" pb={4}>
          <Flex alignItems="center" ml={5} pt={6} pb={2}>
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
            <Text fontWeight="bold" fontSize={30}>
              {user ? user.name : "My Travel Log"}
            </Text>
          </Flex>
          
          <Box
            bg="white"
            boxShadow="md"
            pt={4}
            pb={4}
            mb={2}
            style={{
              transition: "all 0.3s ease",
              transform: showCollapsedHeader ? "scale(0.9)" : "scale(1)",
              opacity: showCollapsedHeader ? 0.8 : 1,
            }}
          >
            <MyGroupStoryScroll
              groups={mockGroups}
              selectedGroupId={selectedGroup.id}
              onSelectGroup={handleSelectGroup}
            />
          </Box>
        </Box>

        <GroupDetail group={selectedGroup} isHeaderCollapsed={showCollapsedHeader} />
      </Box>

      <Box position="sticky" bottom="0" zIndex="10">
        <BottomTabBar />
      </Box>
    </Flex>
  );
}