"use client";

import Link from 'next/link';
import type { Chat } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Video, Wallpaper, Users } from "lucide-react";

interface ChatHeaderProps {
  chat: Chat;
  onWallpaperSelect: () => void;
}

export function ChatHeader({ chat, onWallpaperSelect }: ChatHeaderProps) {
  const isGroup = chat.isGroup;

  const headerContent = (
    <div className="flex items-center gap-4">
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
        <p className="text-sm text-gray-500">{isGroup ? `${chat.members.length} membres` : chat.status}</p>
      </div>
    </div>
  );

  return (
    <header className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
      <div className="flex-1">
        {headerContent}
      </div>

      <div className="flex items-center gap-2">
        {!isGroup && (
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5 text-gray-600" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5 text-gray-600" />
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
            <DropdownMenuItem onSelect={onWallpaperSelect}>
              <Wallpaper className="mr-2 h-4 w-4" />
              <span>Changer le fond d'écran</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
