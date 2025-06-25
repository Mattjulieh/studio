
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth, type Profile, type Group, type Chat, type Friend } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPrivateChatId } from "@/lib/utils";


interface ChatListProps {
  onSelectChat: (chat: Chat | null) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

export function ChatList({ onSelectChat, activeChatId, setActiveChatId }: ChatListProps) {
  const { profile, getAllUsers, sendFriendRequest, getGroupsForUser, unreadCounts, currentUser } = useAuth();
  
  const [contacts, setContacts] = useState<(Profile & { addedAt?: string })[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const groups = getGroupsForUser();

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

  const handleSelectChat = useCallback((chat: Chat) => {
    onSelectChat(chat);
    setActiveChatId(chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username));
    setSearchQuery("");
    setSearchResults([]);
  }, [onSelectChat, setActiveChatId, currentUser]);

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
      const unreadCount = unreadCounts[canonicalChatId] || 0;
      const chatWithDate = chat as Profile & { addedAt?: string };
      
      return (
        <button
          key={canonicalChatId}
          onClick={() => handleSelectChat(chat)}
          className={`flex items-center w-full text-left gap-4 px-4 py-3 transition-colors border-b border-sidebar-border ${
            activeChatId === canonicalChatId ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
          <div className="flex-grow overflow-hidden">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold truncate">{chat.isGroup ? chat.name : chat.username}</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground h-6 w-6 p-0 flex items-center justify-center text-xs rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
            </div>
            <p className="text-sm opacity-70 truncate">
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
            <p className="text-sm opacity-70 truncate">{user.status}</p>
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
    <aside className="w-full md:w-[400px] xl:w-[440px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-3 border-b border-sidebar-border flex-shrink-0">
        <Input 
            placeholder="Rechercher ou démarrer une discussion" 
            className="rounded-full bg-neutral-100 focus:bg-white"
            onChange={handleSearchChange}
            value={searchQuery}
        />
        </div>
        <ScrollArea className="flex-grow">
        <div className="py-2">
            {searchQuery.trim() !== "" ? (
            searchResults.length > 0 ? renderSearchResults() : <div className="p-4 text-center opacity-70">Aucun utilisateur trouvé.</div>
            ) : allChats.length > 0 ? (
            <>
                {groups.length > 0 && <div className="px-4 pt-2 pb-1 text-sm font-semibold opacity-60">GROUPES</div>}
                {renderChatList(groups)}
                {contacts.length > 0 && <div className="px-4 pt-2 pb-1 text-sm font-semibold opacity-60">DISCUSSIONS</div>}
                {renderChatList(contacts)}
            </>
            ) : (
            <div className="p-4 text-center opacity-70">Ajoutez des amis pour commencer à discuter.</div>
            )}
        </div>
        </ScrollArea>
    </aside>
  );
}
