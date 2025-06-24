"use client";

import React, { createContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export interface User {
  username: string;
  email: string;
  passwordHash: string;
}

export interface Group {
  id: string;
  name: string;
  creator: string;
  members: string[]; // array of usernames
  profilePic: string;
  isGroup: true;
}

export interface Profile {
  username: string;
  email: string;
  phone: string;
  status: string;
  profilePic: string;
  friends?: string[];
  groups?: string[]; // array of group IDs
  isGroup: false; // Type guard
}

export type Chat = Profile | Group;


export interface AuthContextType {
  currentUser: string | null;
  profile: Profile | null;
  loading: boolean;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (newProfile: Profile) => Promise<{ success: boolean; message: string }>;
  getAllUsers: () => Profile[];
  addFriend: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  createGroup: (name: string, memberUsernames: string[]) => Promise<{ success: boolean; message: string; group?: Group }>;
  getGroupsForUser: () => Group[];
  getGroupById: (groupId: string) => Group | null;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<{ success: boolean, message: string }>;
  addMembersToGroup: (groupId: string, newUsernames: string[]) => Promise<{ success: boolean; message: string }>;
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
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const user = getStoredItem<string | null>('currentUser', null);
    if (user) {
      setCurrentUser(user);
      const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
      setProfile(profiles[user] || null);
    }
    setLoading(false);
  }, []);

  const register = React.useCallback(async (username: string, email: string, password: string) => {
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
      profilePic: defaultProfilePic,
      friends: [],
      groups: [],
      isGroup: false,
    };
    setStoredItem('profiles', profiles);

    return { success: true, message: 'Utilisateur enregistré avec succès !' };
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
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
  
  const logout = React.useCallback(() => {
    setCurrentUser(null);
    setProfile(null);
    window.localStorage.removeItem('currentUser');
    router.push('/login');
  }, [router]);

  const updateProfile = React.useCallback(async (newProfileData: Profile) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    profiles[currentUser] = newProfileData;
    setStoredItem('profiles', profiles);
    setProfile(newProfileData);
    
    const users = getStoredItem<Record<string, User>>('users', {});
    if (users[currentUser] && users[currentUser].email !== newProfileData.email) {
      users[currentUser].email = newProfileData.email;
      setStoredItem('users', users);
    }

    toast({ title: "Succès", description: "Profil mis à jour." });
    return { success: true, message: "Profil mis à jour." };
  }, [currentUser, toast]);

  const getAllUsers = React.useCallback(() => {
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    return Object.values(profiles);
  }, []);

  const addFriend = React.useCallback(async (friendUsername: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    if (friendUsername === currentUser) {
      return { success: false, message: "Vous ne pouvez pas vous ajouter vous-même." };
    }

    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    
    if (!profiles[friendUsername]) {
        return { success: false, message: "L'utilisateur n'existe pas." };
    }

    const userProfile = profiles[currentUser];
    if (!userProfile.friends) {
      userProfile.friends = [];
    }

    if (userProfile.friends.includes(friendUsername)) {
        return { success: true, message: "Cet utilisateur est déjà votre ami." };
    }

    userProfile.friends.push(friendUsername);
    
    const friendProfile = profiles[friendUsername];
    if (!friendProfile.friends) {
        friendProfile.friends = [];
    }
    if (!friendProfile.friends.includes(currentUser)) {
      friendProfile.friends.push(currentUser);
    }

    setStoredItem('profiles', profiles);
    setProfile({...userProfile});
    
    toast({ title: "Succès", description: `${friendUsername} a été ajouté à vos amis.` });
    return { success: true, message: "Ami ajouté avec succès." };
  }, [currentUser, toast]);

  const createGroup = React.useCallback(async (name: string, memberUsernames: string[]) => {
    if (!currentUser) {
        return { success: false, message: "Aucun utilisateur connecté." };
    }
    
    const groups = getStoredItem<Record<string, Group>>('groups', {});
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});

    const groupId = `group_${Date.now()}`;
    const allMembers = Array.from(new Set([currentUser, ...memberUsernames]));

    const newGroup: Group = {
        id: groupId,
        name,
        creator: currentUser,
        members: allMembers,
        profilePic: `https://placehold.co/100x100.png`,
        isGroup: true,
    };

    groups[groupId] = newGroup;
    setStoredItem('groups', groups);

    allMembers.forEach(username => {
        if (profiles[username]) {
            if (!profiles[username].groups) {
                profiles[username].groups = [];
            }
            profiles[username].groups!.push(groupId);
        }
    });

    setStoredItem('profiles', profiles);
    
    setProfile(prev => prev ? {...profiles[currentUser]} : null);

    toast({ title: "Succès", description: `Groupe "${name}" créé.` });
    return { success: true, message: "Groupe créé avec succès.", group: newGroup };
  }, [currentUser, toast]);

  const getGroupsForUser = React.useCallback(() => {
    if (!currentUser) return [];
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const userProfile = profiles[currentUser];
    if (!userProfile?.groups) return [];
    const allGroups = getStoredItem<Record<string, Group>>('groups', {});
    return userProfile.groups.map(groupId => allGroups[groupId]).filter(Boolean);
  }, [currentUser]);

  const getGroupById = React.useCallback((groupId: string): Group | null => {
    const groups = getStoredItem<Record<string, Group>>('groups', {});
    return groups[groupId] || null;
  }, []);

  const updateGroup = React.useCallback(async (groupId: string, data: Partial<Group>) => {
    const groups = getStoredItem<Record<string, Group>>('groups', {});
    if (!groups[groupId]) {
      return { success: false, message: "Groupe non trouvé." };
    }
    
    groups[groupId] = { ...groups[groupId], ...data };
    setStoredItem('groups', groups);
    
    toast({ title: "Succès", description: "Groupe mis à jour." });
    return { success: true, message: "Groupe mis à jour." };
  }, [toast]);
  
  const addMembersToGroup = React.useCallback(async (groupId: string, newUsernames: string[]) => {
    const groups = getStoredItem<Record<string, Group>>('groups', {});
    const group = groups[groupId];

    if (!group) {
        return { success: false, message: "Groupe non trouvé." };
    }

    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});

    const membersToAdd = newUsernames.filter(username => !group.members.includes(username));
    
    if (membersToAdd.length === 0) {
        return { success: true, message: "Aucun nouveau membre à ajouter." };
    }

    group.members.push(...membersToAdd);
    groups[groupId] = group;
    setStoredItem('groups', groups);

    membersToAdd.forEach(username => {
        if (profiles[username]) {
            if (!profiles[username].groups) {
                profiles[username].groups = [];
            }
            profiles[username].groups!.push(groupId);
        }
    });
    setStoredItem('profiles', profiles);

    toast({ title: "Succès", description: "Membres ajoutés au groupe." });
    return { success: true, message: "Membres ajoutés avec succès." };
  }, [toast]);


  const value = { currentUser, profile, loading, register, login, logout, updateProfile, getAllUsers, addFriend, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
