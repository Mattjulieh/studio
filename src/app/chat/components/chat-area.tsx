
"use client";

import { useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Chat } from "@/contexts/auth-context";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { getThemeCssProperties, type Theme } from "@/lib/themes";

interface ChatAreaProps {
  chat: Chat | null;
  wallpaper: string | undefined;
  onWallpaperChange: (chatId: string, newWallpaper: string) => void;
  chatThemes: Record<string, Theme>;
  onThemeChange: (chatId: string, theme: Theme) => void;
}

export function ChatArea({ chat, wallpaper, onWallpaperChange, chatThemes, onThemeChange }: ChatAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { clearUnreadCount } = useAuth();

  const displayWallpaper = wallpaper || "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png";

  const handleWallpaperSelect = () => {
    fileInputRef.current?.click();
  };

  const chatId = chat ? (chat.isGroup ? chat.id : chat.username) : null;

  useEffect(() => {
    if (chatId) {
      clearUnreadCount(chatId);
    }
  }, [chatId, clearUnreadCount]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && chatId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        onWallpaperChange(chatId, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const themeConfig = chatId && chatThemes[chatId] 
    ? chatThemes[chatId]
    : { color: "default", mode: "light" };
  
  const themeStyle = getThemeCssProperties(themeConfig.color, themeConfig.mode);

  if (!chat) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-gray-100 text-center relative">
        <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
                backgroundImage: `url(${displayWallpaper})`,
                backgroundPosition: 'center',
            }}
        />
        <div className="relative z-10 p-8 rounded-lg bg-white/80 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-gray-700">Bienvenue sur ChatFamily</h2>
            <p className="text-gray-500 mt-2">Sélectionnez une discussion pour commencer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col relative" style={themeStyle}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${displayWallpaper})` }}
      />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <div className="relative z-10 flex flex-col h-full">
        <ChatHeader 
          chat={chat} 
          onWallpaperSelect={handleWallpaperSelect}
          currentTheme={themeConfig}
          onThemeChange={onThemeChange}
        />
        <ChatMessages chat={chat} />
        <ChatInput chat={chat} />
      </div>
    </div>
  );
}
