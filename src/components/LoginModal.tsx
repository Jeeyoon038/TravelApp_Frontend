import {
    Box,
    Flex,
    Text,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
  } from "@chakra-ui/react";
  import { FaGoogle } from "react-icons/fa"; // 구글 아이콘
  import { useState } from "react";
  import axios from "axios"; // Axios를 사용하여 백엔드로부터 데이터 받기
  
  export default function LoginModal({ setUser }: any) {
    const { isOpen, onOpen, onClose } = useDisclosure();
  
    // 구글 로그인 클릭 시 실행되는 함수
    const handleGoogleLogin = async () => {
      // 구글 로그인 URL로 리디렉션 (백엔드의 /auth/google로 리디렉션)
      window.location.href = "http://localhost:3000/auth/google";
    };
  
    // 구글 로그인 후 받은 사용자 정보를 처리하는 함수
    const handleGoogleCallback = async () => {
      // 구글 로그인 후, 백엔드로부터 사용자 정보를 받아옵니다.
      interface GoogleCallbackResponse {
        access_token: string;
        email: string;
        name: string;
        profilePicture: string;
      }

      const response = await axios.get<GoogleCallbackResponse>("http://localhost:3000/auth/google/callback", {
        params: {
          code: new URLSearchParams(window.location.search).get("code"), // 구글 인증 후 받은 code
        },
      });
  
      // 백엔드에서 받은 사용자 정보 (이메일, 이름, 프로필 사진)
      const { access_token, email, name, profilePicture } = response.data;
  
      // JWT 토큰을 로컬 스토리지에 저장
      localStorage.setItem("access_token", access_token);
  
      // 사용자 정보를 상태로 저장
      setUser({
        email,
        name,
        profilePicture,
      });
    };
  
    return (
      <>
        {/* 로그인 아이콘 버튼 */}
        <Button
          colorScheme="gray"
          variant="solid"
          onClick={onOpen}
          position="absolute"
          top="10px"
          right="10px"
          borderRadius="10%" // 동그란 모양으로 만들기
          padding="10px" // 버튼 크기 조정
          fontSize="lg" // 텍스트 크기 조정
          _hover={{ bg: "blue.600", boxShadow: "md" }} // hover 상태 디자인
        >
          Login
        </Button>
  
        {/* 로그인 모달 */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent maxWidth="400px" width="100%" px={4}>
            <ModalHeader>Login</ModalHeader>
            <ModalBody>
              <Input placeholder="Email" mb={4} />
              <Input placeholder="Password" type="password" />
              {/* 구글 로그인 버튼 */}
              <Button
                colorScheme="red"
                variant="outline"
                leftIcon={<FaGoogle />}
                w="100%"
                onClick={handleGoogleLogin} // 구글 로그인 처리
                mt={4}
              >
                Login with Google
              </Button>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Login
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
  