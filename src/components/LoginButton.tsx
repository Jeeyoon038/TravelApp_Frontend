import { Button } from '@chakra-ui/react';
import { FaGoogle } from 'react-icons/fa'; // 구글 아이콘

const LoginButton = () => {
  const handleGoogleLogin = () => {
    // 구글 로그인 API 엔드포인트로 리디렉션
    
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <Button
      colorScheme="blue"
      leftIcon={<FaGoogle />}
      onClick={handleGoogleLogin}
      size="lg"
      w="100%"
    >
      Login with Google
    </Button>
  );
};

export default LoginButton;
