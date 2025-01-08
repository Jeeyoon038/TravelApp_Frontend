import { Flex, IconButton } from "@chakra-ui/react";
import { FiHome, FiSearch } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

export default function FloatingTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Define tab items with paths
  const tabs = [
    { label: "홈", icon: <FiHome />, path: "/home" },
    { label: "검색", icon: <FiSearch />, path: "/search" },
  ];

  return (
    <Flex
      as="nav"
      justify="center"
      align="center"
      position="fixed"
      bottom="50px" // 위치를 화면 중앙에 가깝게 띄움
      left="50%"
      transform="translate(-50%, 0)"
      zIndex="1000"
    >
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        p={2}
        borderRadius="full"
        backdropFilter="blur(10px)" // 배경 블러 효과 추가
        bg="transparent" // 투명 배경
        boxShadow="lg" // 약간의 그림자 추가로 입체감 부여
      >
        {tabs.map((tab) => (
          <Flex
            key={tab.label}
            align="center"
            justify="center"
            position="relative"
            onClick={() => navigate(tab.path)}
            cursor="pointer"
          >
            <IconButton
              aria-label={tab.label}
              icon={tab.icon}
              variant="ghost"
              color={location.pathname === tab.path ? "brand.700" : "gray.400"} // 더 진한 색상으로 변경
              fontSize="28px" // 아이콘 크기 확대
              _hover={{ color: "brand.700" }}
              _focus={{ boxShadow: "none" }}
              transition="color 0.2s ease-in-out"
            />
            {location.pathname === tab.path && (
              <Flex
                position="absolute"
                bottom="-8px"
                bg="brand.700"
                borderRadius="full"
                height="6px"
                width="30px"
                animation="slide 0.3s ease-in-out"
              />
            )}
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}
