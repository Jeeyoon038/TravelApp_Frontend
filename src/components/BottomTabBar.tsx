import { Flex, IconButton, Text } from "@chakra-ui/react";
import { FiHome, FiSearch, FiUser } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Define tab items with labels and paths
  const tabs = [
    { label: "홈", icon: <FiHome />, path: "/home" },
    { label: "검색", icon: <FiSearch />, path: "/search" },
    { label: "프로필", icon: <FiUser />, path: "/profile" },
  ];

  return (
    <Flex
      as="nav"
      justify="space-around"
      align="center"
      bg="white"
      boxShadow="md"
      py={2}
      position="fixed"
      bottom="0"
      width="100%"
      zIndex="1000"
    >
      {tabs.map((tab) => (
        <Flex
          key={tab.label}
          direction="column"
          align="center"
          onClick={() => navigate(tab.path)}
          cursor="pointer"
        >
          <IconButton
            aria-label={tab.label}
            icon={tab.icon}
            variant="ghost"
            color={location.pathname === tab.path ? "brand.500" : "gray.500"}
            fontSize={{ base: "24px", md: "28px" }}
          />
          {/* Show label only on medium screens and above */}
          <Text
            fontSize="sm"
            color={location.pathname === tab.path ? "brand.500" : "gray.500"}
            display={{ base: "none", md: "block" }}
          >
            {tab.label}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
