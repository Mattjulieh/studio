
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
  sender: string;
  text: string | null;
  timestamp: string;
  attachment?: {
    type: 'image' | 'video';
    url: string;
  };
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
  sendMessage: (chatId: string, text: string | null, attachment?: { type: 'image' | 'video'; url: string }) => Promise<{ success: boolean; message: string }>;
  getMessagesForChat: (chatId: string) => Message[];
  clearUnreadCount: (chatId: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
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

  const logout = useCallback(() => {
    setCurrentUser(null);
    setProfile(null);
    setGroups([]);
    setMessages({});
    setUnreadCounts({});
    window.localStorage.removeItem('currentUser');
    router.push('/login');
  }, [router]);

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
  }, [logout]);

  const refreshData = useCallback(async (username: string) => {
    const data = await actions.getInitialData(username);
    if (data) {
      setProfile(data.profile);
      setGroups(data.groups);
      setMessages(data.messages);
      setUnreadCounts(data.unreadCounts);
    } else {
      // User might have been deleted from DB, or session is invalid
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const user = getStoredItem<string | null>('currentUser', null);
    if (user) {
      setCurrentUser(user);
      fetchInitialData(user);
    } else {
      setLoading(false);
    }
  }, [fetchInitialData]);

  // Polling mechanism to refresh data periodically
  useEffect(() => {
    if (loading || !currentUser) {
      return;
    }

    const intervalId = setInterval(() => {
      refreshData(currentUser);
    }, 3000); // Refresh data every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [loading, currentUser, refreshData]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await actions.loginUser(username, password);
    if (result.success) {
      setStoredItem('currentUser', username);
      setCurrentUser(username);
      await fetchInitialData(username);
    }
    return result;
  }, [fetchInitialData]);

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
      await refreshData(currentUser); // Refresh to show sent request
      toast({ title: "Succès", description: result.message });
    } else {
      toast({ variant: 'destructive', title: "Erreur", description: result.message });
    }
    return result;
  }, [currentUser, toast, refreshData]);

  const acceptFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.acceptFriendRequestAction(currentUser, friendUsername);
    if (result.success && result.newFriend) {
      await refreshData(currentUser); // Refresh to show new friend
      toast({ title: "Nouvel ami!", description: `Vous êtes maintenant ami avec ${friendUsername}.` });
    }
    return result;
  }, [currentUser, toast, refreshData]);

  const rejectFriendRequest = useCallback(async (friendUsername: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.rejectFriendRequestAction(currentUser, friendUsername);
    if (result.success) {
      await refreshData(currentUser); // Refresh to remove request
      toast({ title: "Demande refusée", description: `Vous avez refusé la demande de ${friendUsername}.` });
    }
    return result;
  }, [currentUser, toast, refreshData]);
  
  const createGroup = useCallback(async (name: string, memberUsernames: string[]) => {
      if (!currentUser) return { success: false, message: "Non connecté" };
      const result = await actions.createGroupAction(currentUser, name, memberUsernames);
      if (result.success && result.group) {
        await refreshData(currentUser);
        toast({ title: "Succès", description: `Groupe "${name}" créé.` });
      }
      return result;
  }, [currentUser, toast, refreshData]);

  const updateGroup = useCallback(async (groupId: string, data: Partial<Group>) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.updateGroupAction(groupId, data);
    if (result.success) {
        await refreshData(currentUser);
        toast({ title: "Succès", description: "Groupe mis à jour." });
    }
    return result;
  }, [currentUser, refreshData, toast]);

  const addMembersToGroup = useCallback(async (groupId: string, newUsernames: string[]) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.addMembersToGroupAction(groupId, newUsernames);
    if (result.success) {
        await refreshData(currentUser);
        toast({ title: "Succès", description: "Membres ajoutés au groupe." });
    }
    return result;
  }, [currentUser, refreshData, toast]);

  const sendMessage = useCallback(async (chatId: string, text: string | null, attachment?: { type: 'image' | 'video'; url: string }) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.sendMessageAction(currentUser, chatId, text, attachment);
    if (result.success && result.newMessage) {
        const newMessage = result.newMessage;
        setMessages(prev => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), newMessage]
        }));
    }
    return result;
  }, [currentUser]);
  
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUser) return;
    const result = await actions.deleteMessageAction(messageId, currentUser);
    if (result.success) {
        setMessages(prev => {
            const newMessages = { ...prev };
            for (const chatId in newMessages) {
                const msgIndex = newMessages[chatId].findIndex(msg => msg.id === messageId);
                if (msgIndex !== -1) {
                    newMessages[chatId][msgIndex] = { ...newMessages[chatId][msgIndex], text: 'message supprimer', attachment: undefined };
                    newMessages[chatId] = [...newMessages[chatId]];
                }
            }
            return newMessages;
        });
    } else {
        toast({ variant: 'destructive', title: 'Erreur', description: result.message });
    }
  }, [currentUser, toast]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
      if (!currentUser) return;
      const result = await actions.updateMessageAction(messageId, newText, currentUser);
      if (result.success) {
           setMessages(prev => {
              const newMessages = { ...prev };
              for (const chatId in newMessages) {
                  const msgIndex = newMessages[chatId].findIndex(msg => msg.id === messageId);
                  if (msgIndex !== -1) {
                      newMessages[chatId][msgIndex] = { ...newMessages[chatId][msgIndex], text: newText };
                      // Create a new array to trigger re-render
                      newMessages[chatId] = [...newMessages[chatId]];
                  }
              }
              return newMessages;
          });
      } else {
          toast({ variant: 'destructive', title: 'Erreur', description: result.message });
      }
  }, [currentUser, toast]);

  const clearUnreadCount = useCallback(async (chatId: string) => {
    if (!currentUser) return;
    
    // Optimistic update for instant feedback
    setUnreadCounts(prev => {
        if (!prev[chatId] || prev[chatId] === 0) return prev;
        const newCounts = { ...prev };
        newCounts[chatId] = 0;
        return newCounts;
    });

    await actions.clearUnreadCountAction(currentUser, chatId);
  }, [currentUser]);

  const getGroupsForUser = useCallback(() => groups, [groups]);
  const getGroupById = useCallback((groupId: string) => groups.find(g => g.id === groupId) || null, [groups]);
  const getMessagesForChat = useCallback((chatId: string) => messages[chatId] || [], [messages]);
  
  const value = useMemo(() => ({
    currentUser, profile, loading, login, logout, updateProfile, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, sendMessage, getMessagesForChat, unreadCounts, clearUnreadCount, deleteMessage, editMessage,
    register: actions.registerUser,
    getAllUsers: actions.getAllUsers,
    groups,
    messages
  }), [currentUser, profile, loading, groups, messages, unreadCounts]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
