
"use client";

import React, { createContext, type ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getStoredItem, setStoredItem } from '@/lib/utils';
import * as actions from '@/app/actions';

export interface User {
  id: string;
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
  id: string;
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
  sender: string; // Keep as username for simplicity on client
  text: string;
  timestamp: string;
}

export interface AuthContextType {
  currentUser: string | null;
  profile: Profile | null;
  groups: Group[];
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  loading: boolean;
  register: typeof actions.registerUser;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; }>;
  logout: () => void;
  updateProfile: (newProfileData: Profile) => Promise<{ success: boolean; message: string }>;
  getAllUsers: typeof actions.getAllUsers;
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
  clearUnreadCount: (chatId: string) => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchInitialData = useCallback(async (username: string) => {
    setLoading(true);
    const data = await actions.getInitialData(username);
    if (data) {
      setProfile(data.profile);
      setGroups(data.groups);
      setMessages(data.messages);
      setUnreadCounts(data.unreadCounts);
    } else {
      // User might exist in localStorage but not in DB, force logout
      logout();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const user = getStoredItem<string | null>('currentUser', null);
    if (user) {
      setCurrentUser(user);
      fetchInitialData(user);
    } else {
      setLoading(false);
    }
  }, [fetchInitialData]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await actions.loginUser(username, password);
    if (result.success) {
      setStoredItem('currentUser', username);
      setCurrentUser(username);
      await fetchInitialData(username);
    }
    return result;
  }, [fetchInitialData]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setProfile(null);
    setGroups([]);
    setMessages({});
    setUnreadCounts({});
    window.localStorage.removeItem('currentUser');
    router.push('/login');
  }, [router]);

  const updateProfile = useCallback(async (newProfileData: Profile) => {
    const result = await actions.updateUserProfile(newProfileData);
    if (result.success) {
      setProfile(newProfileData);
      toast({ title: "Succès", description: "Profil mis à jour." });
    }
    return result;
  }, [toast]);

  const sendFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.sendFriendRequestAction(currentUser, friendUsername);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, sentRequests: [...(prev.sentRequests || []), friendUsername] } : null);
      toast({ title: "Succès", description: result.message });
    } else {
      toast({ variant: 'destructive', title: "Erreur", description: result.message });
    }
    return result;
  }, [currentUser, toast]);

  const acceptFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.acceptFriendRequestAction(currentUser, friendUsername);
    if (result.success && result.newFriend) {
      await fetchInitialData(currentUser); // Easiest way to refetch all data
      toast({ title: "Nouvel ami!", description: `Vous êtes maintenant ami avec ${friendUsername}.` });
    }
    return result;
  }, [currentUser, toast, fetchInitialData]);

  const rejectFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.rejectFriendRequestAction(currentUser, friendUsername);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, friendRequests: (prev.friendRequests || []).filter(u => u !== friendUsername) } : null);
      toast({ title: "Demande refusée", description: `Vous avez refusé la demande de ${friendUsername}.` });
    }
    return result;
  }, [currentUser, toast]);
  
  const createGroup = useCallback(async (name: string, memberUsernames: string[]) => {
      if (!currentUser) return { success: false, message: "Non connecté" };
      const result = await actions.createGroupAction(currentUser, name, memberUsernames);
      if (result.success && result.group) {
        setGroups(prev => [...prev, result.group!]);
        setProfile(prev => prev ? { ...prev, groups: [...(prev.groups || []), result.group!.id] } : null);
        toast({ title: "Succès", description: `Groupe "${name}" créé.` });
      }
      return result;
  }, [currentUser, toast]);

  const updateGroup = useCallback(async (groupId: string, data: Partial<Group>) => {
    const result = await actions.updateGroupAction(groupId, data);
    if (result.success) {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
        toast({ title: "Succès", description: "Groupe mis à jour." });
    }
    return result;
  }, [toast]);

  const addMembersToGroup = useCallback(async (groupId: string, newUsernames: string[]) => {
    const result = await actions.addMembersToGroupAction(groupId, newUsernames);
    if (result.success) {
        await fetchInitialData(currentUser!);
        toast({ title: "Succès", description: "Membres ajoutés au groupe." });
    }
    return result;
  }, [currentUser, fetchInitialData, toast]);

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.sendMessageAction(currentUser, chatId, text);
    if (result.success && result.newMessage) {
        const newMessage = result.newMessage;
        setMessages(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), newMessage]
        }));
    }
    return result;
  }, [currentUser]);

  const clearUnreadCount = useCallback(async (chatId: string) => {
    if (!currentUser) return;
    await actions.clearUnreadCountAction(currentUser, chatId);
    setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[chatId];
        return newCounts;
    });
  }, [currentUser]);

  const getGroupsForUser = useCallback(() => groups, [groups]);
  const getGroupById = useCallback((groupId: string) => groups.find(g => g.id === groupId) || null, [groups]);
  const getMessagesForChat = useCallback((chatId: string) => messages[chatId] || [], [messages]);
  
  const value = useMemo(() => ({
    currentUser, profile, loading, login, logout, updateProfile, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, sendMessage, getMessagesForChat, unreadCounts, clearUnreadCount,
    register: actions.registerUser,
    getAllUsers: actions.getAllUsers,
    groups,
    messages
  }), [currentUser, profile, loading, login, logout, updateProfile, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, sendMessage, getMessagesForChat, unreadCounts, clearUnreadCount, groups, messages]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
