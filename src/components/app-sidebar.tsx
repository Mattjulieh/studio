
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Users, PlusCircle, Home, MessageSquare, CircleUser, UserPlus, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddFriendDialog } from "@/app/chat/components/add-friend-dialog";
import { CreateGroupDialog } from "@/app/chat/components/create-group-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppSidebarProps {
  activePage: 'home' | 'chat' | 'profile' | 'private';
}

export function AppSidebar({ activePage }: AppSidebarProps) {
    const { profile, logout } = useAuth();
    const [isAddFriendOpen, setAddFriendOpen] = useState(false);
    const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col items-center justify-between w-24 flex-shrink-0 p-4 bg-background text-foreground border-r border-border">
                <div className="flex flex-col items-center gap-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/">
                                    <Button variant={activePage === 'home' ? 'secondary' : 'ghost'} size="icon" className="h-14 w-14 rounded-2xl">
                                        <Home className="h-7 w-7" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Accueil</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/chat">
                                    <Button variant={activePage === 'chat' ? 'secondary' : 'ghost'} size="icon" className="h-14 w-14 rounded-2xl">
                                        <MessageSquare className="h-7 w-7" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Messages</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/private-space">
                                    <Button variant={activePage === 'private' ? 'secondary' : 'ghost'} size="icon" className="h-14 w-14 rounded-2xl">
                                        <Heart className="h-7 w-7" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Espace Privé</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/profile">
                                    <Button variant={activePage === 'profile' ? 'secondary' : 'ghost'} size="icon" className="h-14 w-14 rounded-2xl">
                                        <CircleUser className="h-7 w-7" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Profil</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full">
                          <PlusCircle className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="end">
                        <DropdownMenuItem onSelect={() => setCreateGroupOpen(true)}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>Créer un groupe</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAddFriendOpen(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Ajouter un ami</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-12 w-12 cursor-pointer">
                                <AvatarImage src={profile?.profilePic} alt={profile?.username} data-ai-hint="profile avatar" />
                                <AvatarFallback>{profile?.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="end">
                            <DropdownMenuItem onSelect={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Déconnexion</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <AddFriendDialog open={isAddFriendOpen} onOpenChange={setAddFriendOpen} />
            <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen} />
        </>
    );
}
