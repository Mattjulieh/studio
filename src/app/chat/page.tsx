
"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./components/sidebar";
import { ChatArea } from "./components/chat-area";
import type { Chat } from "@/contexts/auth-context";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [wallpaper, setWallpaper] = useState<string>("");

  const handleSelectChat = useCallback((chat: Chat | null) => {
    setSelectedChat(chat);
  }, []);

  const handleWallpaperChange = useCallback((newWallpaper: string) => {
    setWallpaper(newWallpaper);
  }, []);

  return (
    <div className="h-screen w-screen p-0 md:p-4 bg-background flex items-center justify-center">
      <main className="flex w-full h-full max-w-[1600px] bg-white shadow-2xl rounded-none md:rounded-lg overflow-hidden">
        <Sidebar onSelectChat={handleSelectChat} />
        <ChatArea
          chat={selectedChat}
          wallpaper={wallpaper}
          onWallpaperChange={handleWallpaperChange}
        />
      </main>
    </div>
  );
}
