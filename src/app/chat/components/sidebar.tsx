"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, MoreVertical, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  onSelectContact: (contact: Profile) => void;
}

export function Sidebar({ onSelectContact }: SidebarProps) {
  const { profile, currentUser, getAllUsers, logout } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeContact, setActiveContact] = useState<string | null>(null);

  useEffect(() => {
    const allUsers = getAllUsers();
    const otherUsers = allUsers.filter(u => u.username !== currentUser);
    setContacts(otherUsers);
    if(otherUsers.length > 0) {
      onSelectContact(otherUsers[0]);
      setActiveContact(otherUsers[0].username);
    }
  }, [getAllUsers, currentUser, onSelectContact]);

  const handleSelectContact = (contact: Profile) => {
    onSelectContact(contact);
    setActiveContact(contact.username);
  };

  return (
    <aside className="flex flex-col w-full max-w-xs xl:max-w-sm border-r border-border bg-white">
      <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <Link href="/profile" className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.profilePic} alt={profile?.username} data-ai-hint="profile avatar" />
            <AvatarFallback>{profile?.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <MessageSquarePlus className="h-5 w-5 text-gray-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="p-3 border-b border-border">
        <Input placeholder="Rechercher ou démarrer une discussion" className="rounded-full" />
      </div>
      <ScrollArea className="flex-grow">
        <div className="py-2">
          {contacts.map((contact) => (
            <button
              key={contact.username}
              onClick={() => handleSelectContact(contact)}
              className={`flex items-center w-full text-left gap-4 px-4 py-3 hover:bg-gray-100 transition-colors ${activeContact === contact.username ? 'bg-gray-100' : ''}`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.profilePic} alt={contact.username} data-ai-hint="user avatar" />
                <AvatarFallback>{contact.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-grow border-t border-border pt-3">
                <h3 className="font-semibold">{contact.username}</h3>
                <p className="text-sm text-gray-500 truncate">Dernier message...</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
