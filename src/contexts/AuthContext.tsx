// src/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  access_token: string;
  email: string;
  name: string;
  profilePicture: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 로드
    const accessToken = localStorage.getItem("access_token");
    const email = localStorage.getItem("user_email");
    const name = localStorage.getItem("user_name");
    const profilePicture = localStorage.getItem("user_profile_picture");

    if (accessToken && email && name) {
      setUser({
        access_token: accessToken,
        email,
        name,
        profilePicture: profilePicture || "/images/default-profile.jpg",
      });
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_profile_picture");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};