
//LoginPage.tsx
import { Box, Button, HStack, Icon, IconProps, Text, VStack } from "@chakra-ui/react";
import { SVGProps, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { JSX } from "react/jsx-runtime";

// 구글 공식 SVG 아이콘을 인라인으로 정의
const GoogleIcon = (props: JSX.IntrinsicAttributes & Omit<SVGProps<SVGSVGElement>, "as" | "translate" | keyof IconProps> & { htmlTranslate?: "yes" | "no" | undefined; } & IconProps & { as?: "svg" | undefined; }) => (
  <Icon viewBox="0 0 533.5 544.3" {...props}>
    <path
      fill="#4285F4"
      d="M533.5 278.4c0-17.4-1.5-34-4.4-50.2H272v95.1h146.9c-6.3 34-25 62.8-53.3 82.1v68h86.2c50.4-46.4 79.6-114.6 79.6-194.9z"
    />
    <path
      fill="#34A853"
      d="M272 544.3c72.8 0 133.8-24.1 178.5-65.3l-86.2-68c-24 16.1-54.6 25.6-92.3 25.6-70.8 0-130.8-47.9-152-112.3H34.3v70.3c45.6 90.3 138.2 152 237.7 152z"
    />
    <path
      fill="#FBBC05"
      d="M120 324.6c-10.4-30.8-10.4-64.3 0-95.1v-70.3H34.3c-35.1 69.9-35.1 152.4 0 222.3l85.7-70.3z"
    />
    <path
      fill="#EA4335"
      d="M272 107.7c39.5 0 75.1 13.6 103 40.3l77.2-77.2C403.8 24.1 344.8 0 272 0 172.5 0 80 61.7 34.3 152l85.7 70.3c21.2-64.4 81.2-112.3 152-112.3z"
    />
  </Icon>
);

export default function LoginPage() {
  const navigate = useNavigate();
  //const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const name = params.get('name');
    const photo = params.get('photo');
    //const googleId = params.get('googleId');
  
    console.log('LoginPage: Parameters:', { email, name, photo });
  
    if (email && name && photo) {
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_photo', photo);
      //localStorage.setItem('user_google_id', googleId);
      console.log('LoginPage: Data saved to localStorage');
      navigate('/home');
    } else {
      // Check if already logged in
      const storedEmail = localStorage.getItem('user_email');
      //const storedGoogleId = localStorage.getItem('user_google_id');
      if (storedEmail ) {
        console.log('LoginPage: Found existing login');
        navigate('/home');
      }
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    // 백엔드 구글 OAuth 엔드포인트로 리디렉션
    console.log("Starting Google Login");


    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google`;
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
        p={6} 
        borderWidth={1} 
        borderRadius={10}
        boxShadow="lg" 
        bg="white"
        width="90%"
        maxW="400px"
        height="20%"
      >
        <VStack spacing={6}>
          <Text 
            fontSize="2xl" 
            textAlign="center" 
            fontFamily="Roboto, sans-serif"
            fontWeight="500"
            mt={2}
          >
           Login to Travel Log
          </Text>
          
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            width="full"
            height="50px"
            borderRadius={20}
            borderColor="gray.300"
            bg="white"
            boxShadow= {"0px 4px 4px rgba(0, 0, 0, 0.10)"}
            _hover={{ bg: 'gray.50' }}
            _active={{ bg: 'gray.100' }}
            aria-label="구글로 로그인하기"
          >
            <HStack spacing={3}>
              <GoogleIcon boxSize={5} />
              <Text 
                fontSize={16} 
                fontWeight="500" 
                color="gray.700"
                fontFamily="Roboto, sans-serif"
              >
                Google 계정으로 로그인 하기
              </Text>
            </HStack>
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}
