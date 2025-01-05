// src/components/PrivateRoute.tsx
import { Flex, Spinner } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
