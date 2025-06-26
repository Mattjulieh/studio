
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
  description: string;
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
  description: string;
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
  editedTimestamp?: string;
  attachment?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
  };
  isTransferred?: boolean;
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
  updateUsername: (newUsername: string) => Promise<{ success: boolean; message: string; }>;
  getAllUsers: typeof actions.getAllUsers;
  sendFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  rejectFriendRequest: (friendUsername: string) => Promise<{ success: boolean; message: string }>;
  createGroup: (name: string, memberUsernames: string[]) => Promise<{ success: boolean; message: string; group?: Group }>;
  getGroupsForUser: () => Group[];
  getGroupById: (groupId: string) => Group | null;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<{ success: boolean, message: string }>;
  addMembersToGroup: (groupId: string, newUsernames: string[]) => Promise<{ success: boolean; message: string }>;
  leaveGroup: (groupId: string) => Promise<{ success: boolean; message: string; }>;
  sendMessage: (chatId: string, text: string | null, attachment?: { type: 'image' | 'video' | 'file'; url: string; name?: string }, options?: { isTransfer?: boolean }) => Promise<{ success: boolean; message: string; newMessage?: Message }>;
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

  const refreshData = useCallback(async (username: string) => {
    try {
      const data = await actions.getInitialData(username);
      if (data) {
        setProfile(data.profile);
        setGroups(data.groups);
        setMessages(data.messages);
        setUnreadCounts(data.unreadCounts);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [logout]);


  const fetchInitialData = useCallback(async (username: string) => {
    setLoading(true);
    await actions.setUserOnline(username); // Set user status to 'En ligne'
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

  useEffect(() => {
    const user = getStoredItem<string | null>('currentUser', null);
    if (user) {
      setCurrentUser(user);
      fetchInitialData(user);
    } else {
      setLoading(false);
    }
  }, [fetchInitialData]);

  useEffect(() => {
    if (!currentUser || loading) return;

    const intervalId = setInterval(() => {
      refreshData(currentUser);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [currentUser, loading, refreshData]);

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
  
  const updateUsername = useCallback(async (newUsername: string) => {
    if (!currentUser || !profile) return { success: false, message: "Non connecté" };
    const result = await actions.updateUsernameAction(profile.id, currentUser, newUsername);
    if (result.success) {
      setStoredItem('currentUser', newUsername);
      setCurrentUser(newUsername);
    }
    return result;
  }, [currentUser, profile]);

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
    }
    return result;
  }, [currentUser, refreshData]);

  const addMembersToGroup = useCallback(async (groupId: string, newUsernames: string[]) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.addMembersToGroupAction(groupId, newUsernames);
    if (result.success) {
        await refreshData(currentUser);
        toast({ title: "Succès", description: "Membres ajoutés au groupe." });
    }
    return result;
  }, [currentUser, refreshData, toast]);
  
  const leaveGroup = useCallback(async (groupId: string) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    const result = await actions.leaveGroupAction(groupId, currentUser);
    if (result.success) {
        await refreshData(currentUser);
        toast({ title: "Succès", description: result.message });
        router.push('/chat');
    } else {
        toast({ variant: 'destructive', title: 'Erreur', description: result.message });
    }
    return result;
  }, [currentUser, refreshData, toast, router]);

  const sendMessage = useCallback(async (chatId: string, text: string | null, attachment?: { type: 'image' | 'video' | 'file'; url: string; name?: string }, options?: { isTransfer?: boolean }) => {
    if (!currentUser) return { success: false, message: "Non connecté" };
    
    const result = await actions.sendMessageAction(currentUser, chatId, text, attachment, options);

    if (result.success && result.newMessage) {
        setMessages(prevMessages => {
            const newMessagesForChat = [...(prevMessages[chatId] || []), result.newMessage!];
            return {
              ...prevMessages,
              [chatId]: newMessagesForChat
            };
        });
    }
    
    return result;
  }, [currentUser]);
  
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUser) return;
    
    const result = await actions.deleteMessageAction(messageId, currentUser);
    
    if (result.success && result.editedTimestamp) {
      setMessages(prevMessages => {
          const newMessagesState = JSON.parse(JSON.stringify(prevMessages));
          for (const chatId in newMessagesState) {
              const messageIndex = newMessagesState[chatId].findIndex((m: Message) => m.id === messageId);
              if (messageIndex > -1) {
                  newMessagesState[chatId][messageIndex].text = 'message supprimer';
                  newMessagesState[chatId][messageIndex].attachment = undefined;
                  newMessagesState[chatId][messageIndex].editedTimestamp = result.editedTimestamp;
                  break;
              }
          }
          return newMessagesState;
      });
    } else if(!result.success) {
        toast({ variant: 'destructive', title: 'Erreur', description: result.message });
    }
  }, [currentUser, toast]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!currentUser) return;

    const result = await actions.updateMessageAction(messageId, newText, currentUser);
    
    if (result.success && result.editedTimestamp) {
       setMessages(prevMessages => {
            const newMessagesState = JSON.parse(JSON.stringify(prevMessages));
            for (const chatId in newMessagesState) {
                const messageIndex = newMessagesState[chatId].findIndex((m: Message) => m.id === messageId);
                if (messageIndex > -1) {
                    newMessagesState[chatId][messageIndex].text = newText;
                    newMessagesState[chatId][messageIndex].editedTimestamp = result.editedTimestamp;
                    break;
                }
            }
            return newMessagesState;
        });
    } else if(!result.success) {
        toast({ variant: 'destructive', title: 'Erreur', description: result.message });
    }
  }, [currentUser, toast]);


  const clearUnreadCount = useCallback(async (chatId: string) => {
    if (!currentUser) return;
    
    await actions.clearUnreadCountAction(currentUser, chatId);
    await refreshData(currentUser);
  }, [currentUser, refreshData]);

  const getGroupsForUser = useCallback(() => groups, [groups]);
  const getGroupById = useCallback((groupId: string) => groups.find(g => g.id === groupId) || null, [groups]);
  const getMessagesForChat = useCallback((chatId: string) => messages[chatId] || [], [messages]);
  
  const value = useMemo(() => ({
    currentUser, profile, loading, login, logout, updateProfile, updateUsername, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, leaveGroup, sendMessage, getMessagesForChat, unreadCounts, clearUnreadCount, deleteMessage, editMessage,
    register: actions.registerUser,
    getAllUsers: actions.getAllUsers,
    groups,
    messages
  }), [currentUser, profile, loading, groups, messages, unreadCounts, login, logout, updateProfile, updateUsername, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, createGroup, getGroupsForUser, getGroupById, updateGroup, addMembersToGroup, leaveGroup, sendMessage, getMessagesForChat, clearUnreadCount, deleteMessage, editMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
