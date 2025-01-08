// ./pages/LoginPage.tsx
import { Box, Button, Center, Image, Text, useToast } from "@chakra-ui/react";
import { TokenResponse, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { GoogleUser } from '../types/googleuser'; // Adjust the import path as necessary
import { GoogleUserInfo } from '../types/googleUserInfo'; // Import the new interface

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (response: TokenResponse) => {
      console.log('Google OAuth success response:', response);
      setIsLoading(true);

      try {
        if (!response.access_token) {
          throw new Error("No access token received from Google.");
        }

        // Fetch user info from Google using the correct interface
        const userInfoResponse = await axios.get<GoogleUserInfo>(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );

        console.log('Google user info received:', userInfoResponse.data);

        // Destructure the necessary fields from GoogleUserInfo
        const {
          sub: googleId,
          email,
          name: displayName,
          picture: photo,
          given_name: firstName = '',
          family_name: lastName = '',
        } = userInfoResponse.data;

        // Construct the GoogleUser object
        const user: GoogleUser = {
          _id: '', // Will be populated by the backend
          googleId,
          email,
          firstName,
          displayName,
          lastName,
          photo,
          accessToken: response.access_token,
          createdAt: '', // Will be populated by the backend
          updatedAt: '', // Will be populated by the backend
          __v: 0,        // Will be populated by the backend
        };

        // Store user data in localStorage (only frontend-relevant fields)
        localStorage.setItem('user_google_id', user.googleId);
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_firstName', user.firstName);
        localStorage.setItem('user_displayName', user.displayName);
        localStorage.setItem('user_lastName', user.lastName);
        localStorage.setItem('user_photo', user.photo);
        localStorage.setItem('access_token', user.accessToken);

        try {
          // Send user data to backend
          const backendResponse = await axios.post(
            `${apiBaseUrl}/auth/google/callback`,
            {
              googleId: user.googleId,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              displayName: user.displayName,
              photo: user.photo,
              accessToken: user.accessToken,
            }
          );

          console.log('Backend response:', backendResponse);
        } catch (backendError) {
          console.error('Backend error:', backendError);
          // Optionally, handle backend errors here (e.g., notify the user)
        }

        // Show success toast
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Navigate to Home page
        navigate('/home', { replace: true });

      } catch (error: any) {
        console.error('Login error:', error);
        localStorage.clear();
        
        toast({
          title: "로그인 실패",
          description: error.message || "로그인 중 오류가 발생했습니다. 다시 시도해 주세요.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: error => {
      console.error('Google Login Failed:', error);
      
      toast({
        title: "로그인 실패",
        description: "Google 로그인 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  return (
    <Center h="100vh" bgGradient="linear(to-r, blue.200, purple.200)">
      <Box bg="white" p={8} rounded="xl" shadow="2xl" textAlign="center" minW="300px">
        <Image src="/logo.png" alt="Logo" mx="auto" mb={6} boxSize="100px" />
        <Text fontSize="2xl" fontWeight="bold" mb={6}>
          Welcome to Our App
        </Text>
        <Button
          onClick={() => {
            console.log('Login button clicked');
            login();
            if (!localStorage.getItem("first_login")) {
              localStorage.setItem("first_login", "true"); // 첫 로그인 여부 저장
            }
          }}
          colorScheme="blue"
          size="lg"
          leftIcon={
            <Image src="/google-icon.png" alt="Google" boxSize="20px" />
          }
          isLoading={isLoading}
          loadingText="로그인 중"
        >
          Sign in with Google
        </Button>
      </Box>
    </Center>
  );
}
