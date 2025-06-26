
"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatList } from "./components/chat-list";
import { ChatArea } from "./components/chat-area";
import type { Chat } from "@/contexts/auth-context";
import { getStoredItem, setStoredItem } from "@/lib/utils";
import type { Theme } from "@/lib/themes";
import { useAuth } from "@/hooks/use-auth";
import { getPrivateChatId } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatWallpapers, setChatWallpapers] = useState<Record<string, string>>({});
  const [chatThemes, setChatThemes] = useState<Record<string, Theme>>({});
  const { currentUser } = useAuth();

  useEffect(() => {
    const storedThemes = getStoredItem('chatThemes', {});
    setChatThemes(storedThemes);
    const storedWallpapers = getStoredItem('chatWallpapers', {});
    setChatWallpapers(storedWallpapers);
  }, []);

  const handleThemeChange = useCallback((chatId: string, theme: Theme) => {
    setChatThemes(prevThemes => {
      const newThemes = { ...prevThemes, [chatId]: theme };
      setStoredItem('chatThemes', newThemes);
      return newThemes;
    });
  }, []);

  const handleSelectChat = useCallback((chat: Chat | null) => {
    setSelectedChat(chat);
    if (chat && currentUser) {
      setActiveChatId(chat.isGroup ? chat.id : getPrivateChatId(currentUser, chat.username));
    } else {
      setActiveChatId(null);
    }
  }, [currentUser]);

  const handleWallpaperChange = useCallback((chatId: string, newWallpaper: string) => {
    setChatWallpapers(prev => {
        const newWallpapers = { ...prev, [chatId]: newWallpaper };
        setStoredItem('chatWallpapers', newWallpapers);
        return newWallpapers;
    });
  }, []);

  const currentWallpaper = activeChatId ? chatWallpapers[activeChatId] : undefined;

  const handleBackToSidebar = () => {
    setSelectedChat(null);
    setActiveChatId(null);
  }

  return (
    <div className="h-screen w-screen bg-background flex">
      <AppSidebar activePage="chat" />
      <main className="flex-grow flex flex-row overflow-hidden pb-20 md:pb-0">
        <div className={cn("w-full md:w-[400px] xl:w-[440px] h-full flex-shrink-0", selectedChat ? "hidden md:flex" : "flex")}>
            <ChatList onSelectChat={handleSelectChat} activeChatId={activeChatId} setActiveChatId={setActiveChatId}/>
        </div>
        <div className={cn("flex-grow h-full", !selectedChat ? "hidden md:flex" : "flex")}>
            <ChatArea
              chat={selectedChat}
              wallpaper={currentWallpaper}
              onWallpaperChange={handleWallpaperChange}
              chatThemes={chatThemes}
              onThemeChange={handleThemeChange}
              onBack={handleBackToSidebar}
            />
        </div>
      </main>
    </div>
  );
}
