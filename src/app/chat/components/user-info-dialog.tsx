
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/hooks/use-auth";
import { Mail, Phone, Info } from "lucide-react";

interface UserInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
}

export function UserInfoDialog({ open, onOpenChange, user }: UserInfoDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-lg border-border/50 text-card-foreground">
        <DialogHeader className="items-center text-center pt-6">
          <Avatar className="h-24 w-24 border-4 border-primary/50 shadow-lg mb-4">
            <AvatarImage src={user.profilePic} alt={user.username} data-ai-hint="user avatar" />
            <AvatarFallback className="text-4xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-bold">{user.username}</DialogTitle>
          <DialogDescription>{user.status}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-1">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Description
                </h4>
                <p className="pl-6 text-sm">{user.description || 'Aucune description.'}</p>
            </div>
           <div className="space-y-1">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                </h4>
                <p className="pl-6 text-sm">{user.email}</p>
           </div>
           <div className="space-y-1">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                </h4>
                <p className="pl-6 text-sm">{user.phone || 'Non défini'}</p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
