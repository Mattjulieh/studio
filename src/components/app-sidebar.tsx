
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
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  activePage: 'home' | 'chat' | 'profile' | 'private';
}

const DesktopNavLink = ({ href, active, icon: Icon, label }: { href: string; active: boolean; icon: React.ElementType, label: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Link href={href}>
                    <Button variant="ghost" className={cn("h-14 w-14 rounded-2xl hover:bg-neutral-700", active ? 'bg-neutral-800' : '')}>
                        <Icon className="h-7 w-7" />
                    </Button>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right"><p>{label}</p></TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const MobileNavLink = ({ href, active, icon: Icon, label }: { href: string; active: boolean; icon: React.ElementType, label: string }) => (
    <Link href={href} className="flex flex-col items-center justify-center text-xs w-1/5 h-full">
        <div className={cn("flex flex-col items-center justify-center p-2 rounded-lg w-full", active ? 'text-white' : 'text-neutral-400')}>
            <Icon className="h-6 w-6 mb-1" />
            <span>{label}</span>
        </div>
    </Link>
);

export function AppSidebar({ activePage }: AppSidebarProps) {
    const { profile, logout } = useAuth();
    const [isAddFriendOpen, setAddFriendOpen] = useState(false);
    const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Accueil", icon: Home, page: "home" },
        { href: "/chat", label: "Messages", icon: MessageSquare, page: "chat" },
        { href: "/private-space", label: "Privé", icon: Heart, page: "private" },
        { href: "/profile", label: "Profil", icon: CircleUser, page: "profile" },
    ];
    
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col items-center justify-between w-24 flex-shrink-0 p-4 bg-black text-white border-r border-neutral-800">
                <div className="flex flex-col items-center gap-4">
                    {navLinks.map(link => (
                         <DesktopNavLink key={link.href} href={link.href} active={activePage === link.page} icon={link.icon} label={link.label} />
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-neutral-700">
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
                                <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
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
            </aside>
            
            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-800 flex justify-around items-center h-20 px-1 z-50">
                 {navLinks.map(link => (
                    <MobileNavLink key={link.href} href={link.href} active={activePage === link.page} icon={link.icon} label={link.label} />
                ))}
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex flex-col items-center justify-center text-xs w-1/5 h-full text-neutral-400 cursor-pointer">
                           <div className="flex flex-col items-center justify-center p-2 rounded-lg w-full">
                               <PlusCircle className="h-6 w-6 mb-1" />
                               <span>Plus</span>
                           </div>
                       </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="mb-2">
                        <DropdownMenuItem onSelect={() => setCreateGroupOpen(true)}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>Créer un groupe</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAddFriendOpen(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Ajouter un ami</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Déconnexion</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>


            <AddFriendDialog open={isAddFriendOpen} onOpenChange={setAddFriendOpen} />
            <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen} />
        </>
    );
}
