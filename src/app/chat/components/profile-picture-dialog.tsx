
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Chat } from "@/hooks/use-auth";
import { Phone, Users } from "lucide-react";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
}

export function ProfilePictureDialog({ open, onOpenChange, chat }: ProfilePictureDialogProps) {
  const { toast } = useToast();

  if (!chat) return null;

  const isGroup = chat.isGroup;
  const name = isGroup ? chat.name : chat.username;
  const profilePic = chat.profilePic;
  
  const handleUnavailableFeature = (featureName: string) => {
    toast({
      title: "Indisponible",
      description: `La fonction '${featureName}' n'est pas encore disponible.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-lg border-border/50">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-card-foreground">{name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-6">
          <Avatar className="h-48 w-48 border-4 border-primary/50 shadow-lg">
            <AvatarImage src={profilePic} alt={name} data-ai-hint={isGroup ? "group avatar" : "user avatar"} />
            <AvatarFallback className="text-6xl">
              {isGroup ? <Users /> : name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-full justify-center gap-4">
            {isGroup ? (
                <Link href={`/group/${chat.id}`} className="w-full">
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                        <Users className="mr-2 h-4 w-4" />
                        Infos du groupe
                    </Button>
                </Link>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => handleUnavailableFeature('Appel')}>
                  <Phone className="mr-2 h-4 w-4" />
                  Appel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
