"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/contexts/auth-context";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import Image from "next/image";

interface ChatAreaProps {
  contact: Profile | null;
  wallpaper: string;
  onWallpaperChange: (newWallpaper: string) => void;
}

export function ChatArea({ contact, wallpaper, onWallpaperChange }: ChatAreaProps) {
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem('chatWallpaper');
    const initialWallpaper = savedWallpaper || "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png";
    setCurrentWallpaper(initialWallpaper);
    onWallpaperChange(initialWallpaper);
  }, [onWallpaperChange]);
  
  useEffect(() => {
    if (wallpaper) {
      setCurrentWallpaper(wallpaper);
    }
  }, [wallpaper]);

  const handleWallpaperSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCurrentWallpaper(imageUrl);
        localStorage.setItem('chatWallpaper', imageUrl);
        onWallpaperChange(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!contact) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-gray-100 text-center relative">
        <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{
                backgroundImage: `url(${currentWallpaper || ''})`,
                backgroundPosition: 'center',
            }}
        />
        <div className="relative z-10 p-8 rounded-lg bg-white/80 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-gray-700">Bienvenue sur ChatFamily</h2>
            <p className="text-gray-500 mt-2">Sélectionnez un contact pour commencer à discuter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col relative">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${currentWallpaper || ''})` }}
      />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <div className="relative z-10 flex flex-col h-full">
        <ChatHeader contact={contact} onWallpaperSelect={handleWallpaperSelect} />
        <ChatMessages contact={contact} />
        <ChatInput />
      </div>
    </div>
  );
}
