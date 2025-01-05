// src/pages/CallbackPage.tsx
import { Flex, Spinner, useToast } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const CallbackPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const access_token = urlParams.get("access_token");
      const email = urlParams.get("email");
      const name = urlParams.get("name");
      const profile_picture = urlParams.get("profile_picture");
      const error = urlParams.get("error");

      if (error) {
        toast({
          title: "로그인 오류",
          description: "인증 과정에서 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/login");
        return;
      }

      if (access_token && email && name) {
        try {
          setUser({
            access_token,
            email,
            name,
            profilePicture: profile_picture || "/images/default-profile.jpg",
          });

          localStorage.setItem("access_token", access_token);
          localStorage.setItem("user_email", email);
          localStorage.setItem("user_name", name);
          if (profile_picture) {
            localStorage.setItem("user_profile_picture", profile_picture);
          }

          toast({
            title: "로그인 성공",
            description: `환영합니다, ${name}!`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });

          // URL 파라미터 제거
          window.history.replaceState({}, document.title, "/home");

          // 홈으로 이동
          navigate("/home");
        } catch (error) {
          console.error("Login processing error:", error);
          toast({
            title: "로그인 오류",
            description: "로그인 중 오류가 발생했습니다.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          navigate("/login");
        }
      } else {
        toast({
          title: "로그인 실패",
          description: "로그인 중 필요한 정보가 없습니다.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, setUser, toast]);

  return (
    <Flex justify="center" align="center" height="100vh">
      <Spinner size="xl" />
    </Flex>
  );
};

export default CallbackPage;
