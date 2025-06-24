
"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextType, type Profile, type Group, type Chat, type Friend, type Message, type User } from "@/contexts/auth-context";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export type { Profile, Group, Chat, Friend, Message, User };
