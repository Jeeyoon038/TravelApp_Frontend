// src/components/RootRedirect.tsx
import { Flex, Spinner } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return <Navigate to={user ? "/home" : "/login"} />;
};

export default RootRedirect;