import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, VStack, Text, Box, useToast } from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Check for access token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const email = urlParams.get("email");
    const name = urlParams.get("name");
    const profilePicture = urlParams.get("profile_picture");

    console.log('Login Page - Received Parameters:', {
      accessToken,
      email,
      name,
      profilePicture
    });

    // Ensure all required parameters are present
    if (accessToken && email && name) {
      try {
        // Save user info to localStorage
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_name", name);
        if (profilePicture) {
          localStorage.setItem("user_profile_picture", profilePicture);
        }

        // Show success toast
        toast({
          title: "Login Successful",
          description: `Welcome, ${name}!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Clear URL parameters
        window.history.replaceState({}, document.title, "/");

        // Immediately navigate to home
        navigate("/home", {
          state: {
            user: {
              access_token: accessToken,
              email,
              name,
              profilePicture
            }
          }
        });
      } catch (error) {
        console.error("Login processing error:", error);
        toast({
          title: "Login Error",
          description: "An error occurred during login",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [navigate, toast]);

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    console.log("Initiating Google Login");
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <VStack 
      spacing={6} 
      align="center" 
      justify="center" 
      height="100vh" 
      bg="#F2F2F2"
    >
      <Box 
        p={8} 
        borderWidth={1} 
        borderRadius={8} 
        boxShadow="lg" 
        bg="white"
        width="300px"
      >
        <VStack spacing={4}>
          <Text fontSize="2xl" textAlign="center">
            Travel Log Login
          </Text>
          
          <Button
            leftIcon={<FaGoogle />}
            colorScheme="red"
            variant="outline"
            width="full"
            onClick={handleGoogleLogin}
          >
            Sign in with Google
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}