import { Flex, IconButton } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiSearch, FiUser } from "react-icons/fi";

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Flex
      as="nav"
      justify="space-around"
      align="center"
      bg="white"
      boxShadow="md"
      py={2}
    >
      <IconButton
        aria-label="홈"
        icon={<FiHome />} // JSX를 통해 ReactNode 전달
        variant="ghost"
        color={location.pathname === "/" ? "brand.500" : "gray.500"}
        onClick={() => navigate("/")}
      />
      <IconButton
        aria-label="검색"
        icon={<FiSearch />} // JSX를 통해 ReactNode 전달
        variant="ghost"
        color={location.pathname === "/search" ? "brand.500" : "gray.500"}
        onClick={() => navigate("/search")}
      />
      <IconButton
        aria-label="프로필"
        icon={<FiUser />} // JSX를 통해 ReactNode 전달
        variant="ghost"
        color={location.pathname === "/profile" ? "brand.500" : "gray.500"}
        onClick={() => navigate("/profile")}
      />
    </Flex>
  );
}
