"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, MoreVertical, LogOut, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddFriendDialog } from "./add-friend-dialog";

interface SidebarProps {
  onSelectContact: (contact: Profile | null) => void;
}

export function Sidebar({ onSelectContact }: SidebarProps) {
  const { profile, getAllUsers, logout } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      const allUsers = getAllUsers();
      const friendUsernames = profile.friends || [];
      const friendProfiles = allUsers.filter(u => friendUsernames.includes(u.username));
      setContacts(friendProfiles);

      const activeContactIsFriend = friendProfiles.some(f => f.username === activeContact);

      if (friendProfiles.length > 0) {
        if (!activeContactIsFriend) {
          onSelectContact(friendProfiles[0]);
          setActiveContact(friendProfiles[0].username);
        }
      } else {
        if (activeContact !== null) {
          onSelectContact(null);
          setActiveContact(null);
        }
      }
    }
  }, [profile, getAllUsers, onSelectContact, activeContact]);


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
          <Button variant="ghost" size="icon" onClick={() => setIsAddFriendOpen(true)}>
            <UserPlus className="h-5 w-5 text-gray-600" />
          </Button>
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
      <AddFriendDialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen} />
    </aside>
  );
}
