
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
  friendRequests?: string[]; // Incoming friend requests
  sentRequests?: string[]; // Outgoing friend requests
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
  sendFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  rejectFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
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
      friendRequests: [],
      sentRequests: [],
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

  const sendFriendRequest = React.useCallback(async (friendUsername: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    if (friendUsername === currentUser) {
      return { success: false, message: "Vous ne pouvez pas vous envoyer une demande à vous-même." };
    }

    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const targetProfile = profiles[friendUsername];
    const userProfile = profiles[currentUser];

    if (!targetProfile) {
        return { success: false, message: "L'utilisateur n'existe pas." };
    }

    if (userProfile.friends?.includes(friendUsername)) {
      return { success: false, message: "Vous êtes déjà amis." };
    }

    if (userProfile.sentRequests?.includes(friendUsername)) {
      return { success: false, message: "Une demande a déjà été envoyée." };
    }

    const updatedTargetProfile: Profile = {
      ...targetProfile,
      friendRequests: [...(targetProfile.friendRequests || []), currentUser]
    };
    const updatedUserProfile: Profile = {
      ...userProfile,
      sentRequests: [...(userProfile.sentRequests || []), friendUsername]
    };

    profiles[friendUsername] = updatedTargetProfile;
    profiles[currentUser] = updatedUserProfile;

    setStoredItem('profiles', profiles);
    setProfile(updatedUserProfile);
    
    toast({ title: "Succès", description: `Demande d'ami envoyée à ${friendUsername}.` });
    return { success: true, message: "Demande d'ami envoyée." };
  }, [currentUser, toast]);

  const acceptFriendRequest = React.useCallback(async (friendUsername: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const userProfile = profiles[currentUser];
    const friendProfile = profiles[friendUsername];

    if (!userProfile || !friendProfile) {
      return { success: false, message: "Profil non trouvé." };
    }
    
    const updatedUserFriends = Array.from(new Set([...(userProfile.friends || []), friendUsername]));
    const updatedFriendFriends = Array.from(new Set([...(friendProfile.friends || []), currentUser]));

    const updatedUserProfile: Profile = {
      ...userProfile,
      friends: updatedUserFriends,
      friendRequests: (userProfile.friendRequests || []).filter(u => u !== friendUsername),
    };

    const updatedFriendProfile: Profile = {
      ...friendProfile,
      friends: updatedFriendFriends,
      sentRequests: (friendProfile.sentRequests || []).filter(u => u !== currentUser),
    };

    profiles[currentUser] = updatedUserProfile;
    profiles[friendUsername] = updatedFriendProfile;

    setStoredItem('profiles', profiles);
    setProfile(updatedUserProfile);

    toast({ title: "Nouvel ami!", description: `Vous êtes maintenant ami avec ${friendUsername}.` });
    return { success: true, message: "Demande d'ami acceptée." };
  }, [currentUser, toast]);

  const rejectFriendRequest = React.useCallback(async (friendUsername: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const userProfile = profiles[currentUser];
    const friendProfile = profiles[friendUsername];
    
    if (!userProfile || !friendProfile) {
      return { success: false, message: "Profil non trouvé." };
    }

    const updatedUserProfile: Profile = {
        ...userProfile,
        friendRequests: (userProfile.friendRequests || []).filter(u => u !== friendUsername)
    };
    const updatedFriendProfile: Profile = {
        ...friendProfile,
        sentRequests: (friendProfile.sentRequests || []).filter(u => u !== currentUser)
    };
    
    profiles[currentUser] = updatedUserProfile;
    profiles[friendUsername] = updatedFriendProfile;

    setStoredItem('profiles', profiles);
    setProfile(updatedUserProfile);

    toast({ title: "Demande refusée", description: `Vous avez refusé la demande de ${friendUsername}.` });
    return { success: true, message: "Demande d'ami refusée." };
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
            const userProfile = profiles[username];
            const updatedGroups = [...(userProfile.groups || []), groupId];
            profiles[username] = { ...userProfile, groups: updatedGroups };
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

    const updatedGroup = { ...group, members: [...group.members, ...membersToAdd] };
    groups[groupId] = updatedGroup;
    setStoredItem('groups', groups);

    membersToAdd.forEach(username => {
        if (profiles[username]) {
            const userProfile = profiles[username];
            const updatedGroups = [...(userProfile.groups || []), groupId];
            profiles[username] = { ...userProfile, groups: updatedGroups };
        }
    });
    setStoredItem('profiles', profiles);

    toast({ title: "Succès", description: "Membres ajoutés au groupe." });
    return { success: true, message: "Membres ajoutés avec succès." };
  }, [toast]);


  const value = React.useMemo(() => ({
    currentUser, profile, loading, register, login, logout, updateProfile, getAllUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup
  }), [currentUser, profile, loading, register, login, logout, updateProfile, getAllUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

    