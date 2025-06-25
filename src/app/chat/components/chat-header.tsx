
"use client";

import { useState } from 'react';
import Link from 'next/link';
import type { Chat } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Video, Wallpaper, Users, Palette, ArrowLeft } from "lucide-react";
import type { Theme } from '@/lib/themes';
import { ProfilePictureDialog } from './profile-picture-dialog';
import { UserInfoDialog } from './user-info-dialog';

interface ChatHeaderProps {
  chat: Chat;
  chatId: string | null;
  onWallpaperSelect: () => void;
  currentTheme: Theme;
  onThemeChange: (chatId: string, theme: Theme) => void;
  onBack?: () => void;
}

export function ChatHeader({ chat, chatId, onWallpaperSelect, currentTheme, onThemeChange, onBack }: ChatHeaderProps) {
  const [isProfilePicOpen, setProfilePicOpen] = useState(false);
  const [isUserInfoOpen, setUserInfoOpen] = useState(false);
  const isGroup = chat.isGroup;

  const handleColorChange = (color: string) => {
    if (color && chatId) onThemeChange(chatId, { ...currentTheme, color });
  };

  const handleModeChange = (mode: 'light' | 'dark') => {
    if (mode && chatId) onThemeChange(chatId, { ...currentTheme, mode });
  };

  const handleHeaderClick = () => {
    if (isGroup) {
      setProfilePicOpen(true);
    } else {
      setUserInfoOpen(true);
    }
  };

  const headerContent = (
    <button className="flex items-center gap-4 text-left" onClick={handleHeaderClick}>
      <Avatar className="h-10 w-10">
        <AvatarImage 
          src={chat.profilePic} 
          alt={isGroup ? chat.name : chat.username} 
          data-ai-hint={isGroup ? "group avatar" : "user avatar"} 
        />
        <AvatarFallback>
          {isGroup ? <Users className="h-5 w-5"/> : chat.username.charAt(0).toUpperCase()}
          </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="font-semibold text-lg">{isGroup ? chat.name : chat.username}</h2>
        <p className="text-sm text-secondary-foreground">{isGroup ? `${chat.members.length} membres` : chat.status}</p>
      </div>
    </button>
  );

  return (
    <>
      <header className="flex items-center justify-between p-3 border-b bg-background text-card-foreground flex-shrink-0">
        <div className="flex-1 flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
              <ArrowLeft />
              <span className="sr-only">Retour</span>
            </Button>
          )}
          {headerContent}
        </div>

        <div className="flex items-center gap-2">
          {!isGroup && (
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5 text-foreground" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isGroup && (
                <DropdownMenuItem asChild>
                  <Link href={`/group/${chat.id}`}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Infos du groupe</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Changer le thème</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuLabel>Couleur du thème</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={currentTheme.color} onValueChange={handleColorChange}>
                    <DropdownMenuRadioItem value="default">Défaut</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="blue">Bleu</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="black">Noir</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pink">Rose</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="yellow">Jaune</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="green">Vert</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="violet">Violet</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="white">Blanc</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Mode du thème</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={currentTheme.mode} onValueChange={handleModeChange}>
                    <DropdownMenuRadioItem value="light">Clair</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">Sombre</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={onWallpaperSelect}>
                <Wallpaper className="mr-2 h-4 w-4" />
                <span>Changer le fond d'écran</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <ProfilePictureDialog open={isProfilePicOpen} onOpenChange={setProfilePicOpen} chat={chat} />
      <UserInfoDialog open={isUserInfoOpen} onOpenChange={setUserInfoOpen} user={isGroup ? null : chat} />
    </>
  );
}
