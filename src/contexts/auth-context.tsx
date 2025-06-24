
"use client";

import React, { createContext, type ReactNode, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getStoredItem, setStoredItem } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

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

export interface Friend {
  username: string;
  addedAt: string; // ISO 8601 date string
}

export interface Profile {
  username: string;
  email: string;
  phone: string;
  status: string;
  profilePic: string;
  friends?: Friend[];
  groups?: string[]; // array of group IDs
  friendRequests?: string[]; // Incoming friend requests
  sentRequests?: string[]; // Outgoing friend requests
  isGroup: false; // Type guard
}

export type Chat = Profile | Group;

export interface Message {
  id: string;
  chatId: string;
  sender: string;
  text: string;
  timestamp: string;
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
  sendFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  rejectFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  createGroup: (name: string, memberUsernames: string[]) => Promise<{ success: boolean; message: string; group?: Group }>;
  getGroupsForUser: () => Group[];
  getGroupById: (groupId: string) => Group | null;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<{ success: boolean, message: string }>;
  addMembersToGroup: (groupId: string, newUsernames: string[]) => Promise<{ success: boolean; message: string }>;
  sendMessage: (chatId: string, text: string) => Promise<{ success: boolean; message: string }>;
  getMessagesForChat: (chatId: string) => Message[];
  unreadCounts: Record<string, number>;
  clearUnreadCount: (chatId: string) => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [messages, setMessages] = React.useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const user = getStoredItem<string | null>('currentUser', null);
    if (user) {
      setCurrentUser(user);
      const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
      setProfile(profiles[user] || null);
      const allUnreadCounts = getStoredItem<Record<string, Record<string, number>>>('unreadCounts', {});
      setUnreadCounts(allUnreadCounts[user] || {});
    }
    const storedMessages = getStoredItem<Record<string, Message[]>>('chatMessages', {});
    setMessages(storedMessages);
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

  const sendFriendRequest = useCallback(async (friendUsername: string) => {
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

    if (userProfile.friends?.some(f => f.username === friendUsername)) {
      return { success: false, message: "Vous êtes déjà amis." };
    }

    if (userProfile.sentRequests?.includes(friendUsername)) {
      return { success: false, message: "Une demande a déjà été envoyée." };
    }
    
    const newTargetFriendRequests = [...(targetProfile.friendRequests || []), currentUser];
    const updatedTargetProfile: Profile = {
      ...targetProfile,
      friendRequests: newTargetFriendRequests,
    };

    const newSentRequests = [...(userProfile.sentRequests || []), friendUsername];
    const updatedUserProfile: Profile = {
      ...userProfile,
      sentRequests: newSentRequests,
    };

    profiles[friendUsername] = updatedTargetProfile;
    profiles[currentUser] = updatedUserProfile;

    setStoredItem('profiles', profiles);
    setProfile(updatedUserProfile);
    
    toast({ title: "Succès", description: `Demande d'ami envoyée à ${friendUsername}.` });
    return { success: true, message: "Demande d'ami envoyée." };
  }, [currentUser, toast]);

  const acceptFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const userProfile = { ...profiles[currentUser] };
    const friendProfile = { ...profiles[friendUsername] };

    if (!userProfile || !friendProfile) {
      return { success: false, message: "Profil non trouvé." };
    }
    
    const now = new Date().toISOString();
    const newFriendForUser: Friend = { username: friendUsername, addedAt: now };
    const newFriendForFriend: Friend = { username: currentUser, addedAt: now };

    const updatedUserFriends = [...(userProfile.friends || []).filter(f => f.username !== friendUsername), newFriendForUser];
    const updatedUserFriendRequests = (userProfile.friendRequests || []).filter(u => u !== friendUsername);
    const updatedUserProfile: Profile = {
      ...userProfile,
      friends: updatedUserFriends,
      friendRequests: updatedUserFriendRequests,
    };
    
    const updatedFriendFriends = [...(friendProfile.friends || []).filter(f => f.username !== currentUser), newFriendForFriend];
    const updatedFriendSentRequests = (friendProfile.sentRequests || []).filter(u => u !== currentUser);
    const updatedFriendProfile: Profile = {
      ...friendProfile,
      friends: updatedFriendFriends,
      sentRequests: updatedFriendSentRequests,
    };

    profiles[currentUser] = updatedUserProfile;
    profiles[friendUsername] = updatedFriendProfile;

    setStoredItem('profiles', profiles);
    setProfile(updatedUserProfile);

    toast({ title: "Nouvel ami!", description: `Vous êtes maintenant ami avec ${friendUsername}. Ajouté le ${new Date(now).toLocaleString('fr-FR')}` });
    return { success: true, message: "Demande d'ami acceptée." };
  }, [currentUser, toast]);

  const rejectFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const userProfile = { ...profiles[currentUser] };
    const friendProfile = { ...profiles[friendUsername] };
    
    if (!userProfile || !friendProfile) {
      return { success: false, message: "Profil non trouvé." };
    }
    
    const updatedUserFriendRequests = (userProfile.friendRequests || []).filter(u => u !== friendUsername);
    const updatedUserProfile: Profile = {
        ...userProfile,
        friendRequests: updatedUserFriendRequests
    };
    
    const updatedFriendSentRequests = (friendProfile.sentRequests || []).filter(u => u !== currentUser);
    const updatedFriendProfile: Profile = {
        ...friendProfile,
        sentRequests: updatedFriendSentRequests
    };
    
    profiles[currentUser] = updatedUserProfile;
    profiles[friendUsername] = updatedFriendProfile;

    setStoredItem('profiles', profiles);
    setProfile(updatedUserProfile);

    toast({ title: "Demande refusée", description: `Vous avez refusé la demande de ${friendUsername}.` });
    return { success: true, message: "Demande d'ami refusée." };
  }, [currentUser, toast]);

  const createGroup = useCallback(async (name: string, memberUsernames: string[]) => {
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

  const getGroupsForUser = useCallback(() => {
    if (!currentUser) return [];
    const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
    const userProfile = profiles[currentUser];
    if (!userProfile?.groups) return [];
    const allGroups = getStoredItem<Record<string, Group>>('groups', {});
    return userProfile.groups.map(groupId => allGroups[groupId]).filter(Boolean);
  }, [currentUser]);

  const getGroupById = useCallback((groupId: string): Group | null => {
    const groups = getStoredItem<Record<string, Group>>('groups', {});
    return groups[groupId] || null;
  }, []);

  const updateGroup = useCallback(async (groupId: string, data: Partial<Group>) => {
    const groups = getStoredItem<Record<string, Group>>('groups', {});
    if (!groups[groupId]) {
      return { success: false, message: "Groupe non trouvé." };
    }
    
    groups[groupId] = { ...groups[groupId], ...data };
    setStoredItem('groups', groups);
    
    toast({ title: "Succès", description: "Groupe mis à jour." });
    return { success: true, message: "Groupe mis à jour." };
  }, [toast]);
  
  const addMembersToGroup = useCallback(async (groupId: string, newUsernames: string[]) => {
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
  
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (!currentUser) {
      return { success: false, message: "Aucun utilisateur connecté." };
    }

    const newMessage: Message = {
        id: uuidv4(),
        chatId,
        sender: currentUser,
        text,
        timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => {
        const newMessagesForChat = [...(prevMessages[chatId] || []), newMessage];
        const updatedMessages = { ...prevMessages, [chatId]: newMessagesForChat };
        setStoredItem('chatMessages', updatedMessages);
        return updatedMessages;
    });

    const allUnreadCounts = getStoredItem<Record<string, Record<string, number>>>('unreadCounts', {});
    const allGroups = getStoredItem<Record<string, Group>>('groups', {});
    const isGroupChat = !!allGroups[chatId];

    if (isGroupChat) {
        const group = allGroups[chatId];
        group.members.forEach(memberUsername => {
            if (memberUsername !== currentUser) {
                if (typeof allUnreadCounts[memberUsername] !== 'object' || allUnreadCounts[memberUsername] === null) {
                    allUnreadCounts[memberUsername] = {};
                }
                const senderIdForGroup = chatId;
                allUnreadCounts[memberUsername][senderIdForGroup] = (allUnreadCounts[memberUsername][senderIdForGroup] || 0) + 1;
            }
        });
    } else { 
        const recipientUsername = chatId;
        const profiles = getStoredItem<Record<string, Profile>>('profiles', {});
        if (profiles[recipientUsername]) {
            if (typeof allUnreadCounts[recipientUsername] !== 'object' || allUnreadCounts[recipientUsername] === null) {
                allUnreadCounts[recipientUsername] = {};
            }
            const senderIdForPrivate = currentUser;
            allUnreadCounts[recipientUsername][senderIdForPrivate] = (allUnreadCounts[recipientUsername][senderIdForPrivate] || 0) + 1;
        }
    }
    setStoredItem('unreadCounts', allUnreadCounts);

    return { success: true, message: "Message envoyé." };
  }, [currentUser]);

  const getMessagesForChat = useCallback((chatId: string) => {
    return messages[chatId] || [];
  }, [messages]);

  const clearUnreadCount = useCallback((chatId: string) => {
    if (!currentUser) return;

    setUnreadCounts(prev => {
      if (!prev[chatId]) {
        return prev;
      }
      
      const allUnreadCounts = getStoredItem<Record<string, Record<string, number>>>('unreadCounts', {});
      if (allUnreadCounts[currentUser] && allUnreadCounts[currentUser][chatId]) {
        delete allUnreadCounts[currentUser][chatId];
        setStoredItem('unreadCounts', allUnreadCounts);
      }
      
      const newCounts = { ...prev };
      delete newCounts[chatId];
      return newCounts;
    });
  }, [currentUser]);


  const value = useMemo(() => ({
    currentUser, profile, loading, register, login, logout, updateProfile, getAllUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, sendMessage, getMessagesForChat, unreadCounts, clearUnreadCount
  }), [currentUser, profile, loading, register, login, logout, updateProfile, getAllUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, sendMessage, getMessagesForChat, unreadCounts, clearUnreadCount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
