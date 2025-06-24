
"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { ChatArea } from "./components/chat-area";
import type { Chat } from "@/contexts/auth-context";
import { getStoredItem, setStoredItem } from "@/lib/utils";
import type { Theme } from "@/lib/themes";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatWallpapers, setChatWallpapers] = useState<Record<string, string>>({});
  const [chatThemes, setChatThemes] = useState<Record<string, Theme>>({});

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
  }, []);

  const handleWallpaperChange = useCallback((chatId: string, newWallpaper: string) => {
    setChatWallpapers(prev => {
        const newWallpapers = { ...prev, [chatId]: newWallpaper };
        setStoredItem('chatWallpapers', newWallpapers);
        return newWallpapers;
    });
  }, []);

  const chatId = selectedChat ? (selectedChat.isGroup ? selectedChat.id : selectedChat.username) : null;
  const currentWallpaper = chatId ? chatWallpapers[chatId] : undefined;

  return (
    <div className="h-screen w-screen p-0 md:p-4 bg-background flex items-center justify-center">
      <main className="flex w-full h-full max-w-[1600px] bg-white shadow-2xl rounded-none md:rounded-lg overflow-hidden">
        <Sidebar onSelectChat={handleSelectChat} />
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
