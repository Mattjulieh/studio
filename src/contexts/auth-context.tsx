"use client";

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface User {
  username: string;
  email: string;
  passwordHash: string;
}

export interface Profile {
  username: string;
  email: string;
  phone: string;
  status: string;
  profilePic: string;
}

export interface AuthContextType {
  currentUser: string | null;
  profile: Profile | null;
  loading: boolean;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (newProfile: Profile) => Promise<{ success: boolean; message: string }>;
  getAllUsers: () => Profile[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const getStoredItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const setStoredItem = <T,>(key: string, value: T): void => {
   if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const user = getStoredItem<string | null>('currentUser', null);
    if (user) {
      setCurrentUser(user);
      const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
      setProfile(profiles[user] || null);
    }
    setLoading(false);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const users = getStoredItem<Record<string, User>>('users', {});
    if (users[username]) {
      return { success: false, message: 'Utilisateur déjà enregistré.' };
    }
    const passwordHash = await hashPassword(password);
    users[username] = { username, email, passwordHash };
    setStoredItem('users', users);

    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const defaultProfilePic = `https://placehold.co/100x100.png`;
    profiles[username] = {
      username,
      email,
      phone: 'Non défini',
      status: 'En ligne',
      profilePic: defaultProfilePic
    };
    setStoredItem('profiles', profiles);

    return { success: true, message: 'Utilisateur enregistré avec succès !' };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const users = getStoredItem<Record<string, User>>('users', {});
    const user = users[username];
    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé.' };
    }
    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return { success: false, message: 'Mot de passe incorrect.' };
    }

    setStoredItem('currentUser', username);
    setCurrentUser(username);
    
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    setProfile(profiles[username] || null);
    
    return { success: true, message: 'Connexion réussie !' };
  }, []);
  
  const logout = useCallback(() => {
    setCurrentUser(null);
    setProfile(null);
    window.localStorage.removeItem('currentUser');
    router.push('/login');
  }, [router]);

  const updateProfile = useCallback(async (newProfileData: Profile) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    profiles[currentUser] = newProfileData;
    setStoredItem('profiles', profiles);
    setProfile(newProfileData);
    
    // Also update email in users object if it changed
    const users = getStoredItem<Record<string, User>>('users', {});
    if (users[currentUser] && users[currentUser].email !== newProfileData.email) {
      users[currentUser].email = newProfileData.email;
      setStoredItem('users', users);
    }

    toast({ title: "Succès", description: "Profil mis à jour." });
    return { success: true, message: "Profil mis à jour." };
  }, [currentUser, toast]);

  const getAllUsers = useCallback(() => {
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    return Object.values(profiles);
  }, []);

  const value = { currentUser, profile, loading, register, login, logout, updateProfile, getAllUsers };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
