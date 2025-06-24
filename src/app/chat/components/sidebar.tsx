
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth, type Profile, type Group, type Chat, type Friend } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MoreVertical, LogOut, Loader2, Users, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AddFriendDialog } from "./add-friend-dialog";
import { CreateGroupDialog } from "./create-group-dialog";
import { Badge } from "@/components/ui/badge";
import { getPrivateChatId } from "@/lib/utils";

interface SidebarProps {
  onSelectChat: (chat: Chat | null) => void;
}

export function Sidebar({ onSelectChat }: SidebarProps) {
  const { profile, getAllUsers, logout, sendFriendRequest, getGroupsForUser, unreadCounts, currentUser } = useAuth();
  
  const [contacts, setContacts] = useState<(Profile & { addedAt?: string })[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const groups = getGroupsForUser();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [isAddFriendOpen, setAddFriendOpen] = useState(false);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isAddingFriend, setIsAddingFriend] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getAllUsers();
      setAllUsers(users.filter(u => u.username !== profile?.username));
    };
    fetchUsers();
  }, [getAllUsers, profile]);

  useEffect(() => {
    if (profile && allUsers.length > 0) {
      const friendData: Friend[] = profile.friends || [];
      const friendUsernames = friendData.map(f => f.username);
      
      const friendProfiles = allUsers
        .filter(u => friendUsernames.includes(u.username))
        .map(u => {
            const friendInfo = friendData.find(f => f.username === u.username);
            return {
                ...u,
                addedAt: friendInfo?.addedAt,
            };
        });

      setContacts(friendProfiles);
    } else {
      setContacts([]);
    }
  }, [profile, allUsers]);

  const allChats = useMemo(() => [...groups, ...contacts], [contacts, groups]);

  useEffect(() => {
    if (searchQuery) return;

    const activeChatExists = allChats.some(c => (c.isGroup ? c.id : c.username) === activeChatId);
    
    if (allChats.length > 0 && (!activeChatId || !activeChatExists)) {
      onSelectChat(allChats[0]);
      setActiveChatId(allChats[0].isGroup ? allChats[0].id : allChats[0].username);
    } else if (allChats.length === 0) {
      onSelectChat(null);
      setActiveChatId(null);
    }
  }, [allChats, activeChatId, onSelectChat, searchQuery]);

  const handleSelectChat = useCallback((chat: Chat) => {
    onSelectChat(chat);
    setActiveChatId(chat.isGroup ? chat.id : chat.username);
    setSearchQuery("");
    setSearchResults([]);
  }, [onSelectChat]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const results = allUsers.filter(user => user.username.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = async (username: string) => {
    setIsAddingFriend(username);
    await sendFriendRequest(username);
    // State updates will be handled by context
    setSearchQuery("");
    setSearchResults([]);
    setIsAddingFriend(null);
  };

  const renderChatList = (chats: Chat[]) =>
    chats.map((chat) => {
      const canonicalChatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);
      const unreadCount = unreadCounts[canonicalChatId];
      const chatWithDate = chat as Profile & { addedAt?: string };
      const clientSideChatId = chat.isGroup ? chat.id : chat.username;
      
      return (
        <button
          key={clientSideChatId}
          onClick={() => handleSelectChat(chat)}
          className={`flex items-center w-full text-left gap-4 px-4 py-3 hover:bg-gray-100 transition-colors ${
            activeChatId === clientSideChatId ? "bg-gray-100" : ""
          }`}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={chat.profilePic}
              alt={chat.isGroup ? chat.name : chat.username}
              data-ai-hint={chat.isGroup ? "group avatar" : "user avatar"}
            />
            <AvatarFallback>
              {chat.isGroup ? <Users/> : chat.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow border-t border-border pt-3">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">{chat.isGroup ? chat.name : chat.username}</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                    {unreadCount}
                  </Badge>
                )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {chat.isGroup 
                  ? `${chat.members.length} membres` 
                  : (chatWithDate.addedAt ? `Ami depuis le ${new Date(chatWithDate.addedAt).toLocaleDateString('fr-FR')}` : "Dernier message...")
              }
            </p>
          </div>
        </button>
      );
    });

  const renderSearchResults = () =>
    searchResults.map((user) => {
      const isFriend = contacts.some((c) => c.username === user.username);
      return (
        <div key={user.username} className="flex items-center w-full text-left gap-4 px-4 py-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePic} alt={user.username} data-ai-hint="user avatar" />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <h3 className="font-semibold">{user.username}</h3>
            <p className="text-sm text-gray-500 truncate">{user.status}</p>
          </div>
          {isFriend ? (
            <Button variant="outline" size="sm" onClick={() => handleSelectChat(user)}>Discuter</Button>
          ) : (
            <Button size="sm" onClick={() => handleAddFriend(user.username)} disabled={isAddingFriend === user.username}>
              {isAddingFriend === user.username && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          )}
        </div>
      );
    });

  return (
    <>
      <aside className="flex flex-col w-full max-w-xs xl:max-w-sm border-r border-border bg-white">
        <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
          <Link href="/profile" className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.profilePic} alt={profile?.username} data-ai-hint="profile avatar" />
              <AvatarFallback>{profile?.username.charAt(0).toUpperCase()}</AvatarFallback>
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
                <DropdownMenuItem onSelect={() => setCreateGroupOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Créer un groupe</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setAddFriendOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Ajouter un ami</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="p-3 border-b border-border">
          <Input placeholder="Rechercher ou démarrer une discussion" className="rounded-full" value={searchQuery} onChange={handleSearchChange} />
        </div>
        <ScrollArea className="flex-grow">
          <div className="py-2">
            {searchQuery.trim() !== "" ? (
              searchResults.length > 0 ? renderSearchResults() : <div className="p-4 text-center text-gray-500">Aucun utilisateur trouvé.</div>
            ) : allChats.length > 0 ? (
              <>
                {groups.length > 0 && <div className="px-4 pt-2 pb-1 text-sm font-semibold text-gray-500">GROUPES</div>}
                {renderChatList(groups)}
                {contacts.length > 0 && <div className="px-4 pt-2 pb-1 text-sm font-semibold text-gray-500">DISCUSSIONS</div>}
                {renderChatList(contacts)}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">Ajoutez des amis pour commencer à discuter.</div>
            )}
          </div>
        </ScrollArea>
      </aside>
      <AddFriendDialog open={isAddFriendOpen} onOpenChange={setAddFriendOpen} />
      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen} />
    </>
  );
}
