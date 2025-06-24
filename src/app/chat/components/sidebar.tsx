"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MoreVertical, LogOut, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  onSelectContact: (contact: Profile | null) => void;
}

export function Sidebar({ onSelectContact }: SidebarProps) {
  const { profile, getAllUsers, logout, addFriend } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeContact, setActiveContact] = useState<string | null>(null);

  // States for search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isAddingFriend, setIsAddingFriend] = useState<string | null>(null);

  const allUsers = useMemo(() => {
    if (profile) {
      return getAllUsers().filter((u) => u.username !== profile.username);
    }
    return [];
  }, [getAllUsers, profile]);

  // Update contacts list when friends change
  useEffect(() => {
    if (profile?.friends) {
      const friendProfiles = allUsers.filter((u) =>
        profile.friends!.includes(u.username)
      );
      setContacts(friendProfiles);
    } else {
      setContacts([]);
    }
  }, [profile?.friends, allUsers]);

  // Handle active contact selection
  useEffect(() => {
    // Don't change active contact if searching
    if (searchQuery) return;

    const activeContactIsFriend = contacts.some(
      (f) => f.username === activeContact
    );

    if (contacts.length > 0) {
      // If no active contact, or active contact is not a friend anymore, select the first friend
      if (!activeContact || !activeContactIsFriend) {
        onSelectContact(contacts[0]);
        setActiveContact(contacts[0].username);
      }
    } else {
      // If no friends, no active contact
      onSelectContact(null);
      setActiveContact(null);
    }
  }, [contacts, activeContact, onSelectContact, searchQuery]);

  const handleSelectContact = useCallback(
    (contact: Profile) => {
      onSelectContact(contact);
      setActiveContact(contact.username);
      setSearchQuery("");
      setSearchResults([]);
    },
    [onSelectContact]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = allUsers.filter((user) =>
      user.username.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleAddFriend = async (username: string) => {
    setIsAddingFriend(username);
    const result = await addFriend(username);
    if (result.success) {
      // Let useEffects handle the state update
      setSearchQuery("");
      setSearchResults([]);
    }
    setIsAddingFriend(null);
  };

  const renderContactList = () =>
    contacts.map((contact) => (
      <button
        key={contact.username}
        onClick={() => handleSelectContact(contact)}
        className={`flex items-center w-full text-left gap-4 px-4 py-3 hover:bg-gray-100 transition-colors ${
          activeContact === contact.username ? "bg-gray-100" : ""
        }`}
      >
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={contact.profilePic}
            alt={contact.username}
            data-ai-hint="user avatar"
          />
          <AvatarFallback>
            {contact.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow border-t border-border pt-3">
          <h3 className="font-semibold">{contact.username}</h3>
          <p className="text-sm text-gray-500 truncate">Dernier message...</p>
        </div>
      </button>
    ));

  const renderSearchResults = () =>
    searchResults.map((user) => {
      const isFriend = contacts.some((c) => c.username === user.username);
      return (
        <div
          key={user.username}
          className="flex items-center w-full text-left gap-4 px-4 py-3"
        >
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={user.profilePic}
              alt={user.username}
              data-ai-hint="user avatar"
            />
            <AvatarFallback>
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <h3 className="font-semibold">{user.username}</h3>
            <p className="text-sm text-gray-500 truncate">{user.status}</p>
          </div>
          {isFriend ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectContact(user)}
            >
              Voir le profil
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleAddFriend(user.username)}
              disabled={isAddingFriend === user.username}
            >
              {isAddingFriend === user.username && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ajouter
            </Button>
          )}
        </div>
      );
    });

  return (
    <aside className="flex flex-col w-full max-w-xs xl:max-w-sm border-r border-border bg-white">
      <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <Link href="/profile" className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={profile?.profilePic}
              alt={profile?.username}
              data-ai-hint="profile avatar"
            />
            <AvatarFallback>
              {profile?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex items-center gap-1">
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
        <Input
          placeholder="Rechercher un utilisateur..."
          className="rounded-full"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <ScrollArea className="flex-grow">
        <div className="py-2">
          {searchQuery.trim() !== "" ? (
            searchResults.length > 0 ? (
              renderSearchResults()
            ) : (
              <div className="p-4 text-center text-gray-500">
                Aucun utilisateur trouvé.
              </div>
            )
          ) : contacts.length > 0 ? (
            renderContactList()
          ) : (
            <div className="p-4 text-center text-gray-500">
              Ajoutez des amis pour commencer à discuter.
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
