
"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { ChatArea } from "./components/chat-area";
import type { Chat } from "@/contexts/auth-context";
import { getStoredItem, setStoredItem } from "@/lib/utils";
import type { Theme } from "@/lib/themes";
import { useAuth } from "@/hooks/use-auth";
import { getPrivateChatId } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatWallpapers, setChatWallpapers] = useState<Record<string, string>>({});
  const [chatThemes, setChatThemes] = useState<Record<string, Theme>>({});
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
       <div className="h-screen w-screen bg-background">
         <main className="w-full h-full bg-white">
           {selectedChat ? (
             <ChatArea
               chat={selectedChat}
               wallpaper={currentWallpaper}
               onWallpaperChange={handleWallpaperChange}
               chatThemes={chatThemes}
               onThemeChange={handleThemeChange}
               onBack={handleBackToSidebar}
             />
           ) : (
             <Sidebar onSelectChat={handleSelectChat} activeChatId={activeChatId} setActiveChatId={setActiveChatId}/>
           )}
         </main>
       </div>
     );
  }

  return (
    <div className="h-screen w-screen p-0 md:p-4 bg-background flex items-center justify-center">
      <main className="flex w-full h-full max-w-[1600px] bg-white shadow-2xl rounded-none md:rounded-lg overflow-hidden">
        <Sidebar onSelectChat={handleSelectChat} activeChatId={activeChatId} setActiveChatId={setActiveChatId} />
        <ChatArea
          chat={selectedChat}
          wallpaper={currentWallpaper}
          onWallpaperChange={handleWallpaperChange}
          chatThemes={chatThemes}
          onThemeChange={handleThemeChange}
        />
      </main>
    </div>
  );
}
