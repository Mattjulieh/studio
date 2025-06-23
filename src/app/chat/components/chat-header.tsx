"use client";

import type { Profile } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Video, Wallpaper } from "lucide-react";

interface ChatHeaderProps {
  contact: Profile;
  onWallpaperSelect: () => void;
}

export function ChatHeader({ contact, onWallpaperSelect }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.profilePic} alt={contact.username} data-ai-hint="user avatar" />
          <AvatarFallback>{contact.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{contact.username}</h2>
          <p className="text-sm text-gray-500">{contact.status}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5 text-gray-600" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
