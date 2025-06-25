
"use client";

import { useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Chat } from "@/contexts/auth-context";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { getThemeCssProperties, type Theme } from "@/lib/themes";
import { getPrivateChatId } from "@/lib/utils";

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
      <div className="flex-grow flex flex-col items-center justify-center text-center bg-background p-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rocket mb-4 text-primary animate-pulse"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.18 2.18 0 0 0-3.11-.1z"/><path d="M12 15.5V13a6 6 0 0 0-3-5.24c-1.4.52-2.93.42-4.14-.38a2.18 2.18 0 0 1-.1-3.1 2.18 2.18 0 0 1 3.1.1c.8.8.9 2.24.38 4.14A6 6 0 0 0 11 13v2.5"/><path d="M12 15.5a3.5 3.5 0 0 0 5-5.24c.48-1.45.38-2.93-.38-4.14a2.18 2.18 0 0 1 .1-3.1 2.18 2.18 0 0 1 3.1.1c.8.8.9 2.24.38 4.14a3.5 3.5 0 0 0-5.24 5z"/><path d="M12 15.5L14 14"/><path d="M15 11l1.5-1.5"/></svg>
        <h2 className="text-4xl font-bold font-headline tracking-wider text-foreground">Bienvenue sur ChatFamily</h2>
        <p className="text-muted-foreground mt-4 text-lg max-w-md">Sélectionnez une discussion pour commencer à communiquer avec vos proches.</p>
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
