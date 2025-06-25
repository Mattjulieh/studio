
"use client";

import { useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Chat } from "@/contexts/auth-context";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { getThemeCssProperties, type Theme } from "@/lib/themes";
import { getPrivateChatId } from "@/lib/utils";
import { StarryBackground } from './starry-background';

interface ChatAreaProps {
  chat: Chat | null;
  wallpaper: string | undefined;
  onWallpaperChange: (chatId: string, newWallpaper: string) => void;
  chatThemes: Record<string, Theme>;
  onThemeChange: (chatId: string, theme: Theme) => void;
  onBack?: () => void;
}

export function ChatArea({ chat, wallpaper, onWallpaperChange, chatThemes, onThemeChange, onBack }: ChatAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { clearUnreadCount, currentUser } = useAuth();

  const handleWallpaperSelect = () => {
    fileInputRef.current?.click();
  };

  const chatId = chat ? (chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username)) : null;

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
      <div className="relative flex-grow flex flex-col items-center justify-center text-center bg-background p-8">
        <StarryBackground />
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold font-headline tracking-wider">Bienvenue sur ChatFamily</h2>
          <p className="mt-4 text-lg max-w-md">Sélectionnez une discussion pour commencer à communiquer avec vos proches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col relative h-full" style={themeStyle}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : 'none' }}
      />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <div className="relative z-10 flex flex-col h-full">
        <ChatHeader 
          chat={chat} 
          chatId={chatId}
          onWallpaperSelect={handleWallpaperSelect}
          currentTheme={themeConfig}
          onThemeChange={onThemeChange}
          onBack={onBack}
        />
        <ChatMessages chat={chat} />
        <ChatInput chat={chat} />
      </div>
    </div>
  );
}
