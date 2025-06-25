
"use client";

import { useState } from "react";
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
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-lg border-border/50 text-card-foreground">
          <DialogHeader className="items-center text-center pt-6">
            <button onClick={() => setViewingImage(user.profilePic)} className="outline-none rounded-full">
              <Avatar className="h-24 w-24 border-4 border-primary/50 shadow-lg mb-4">
                <AvatarImage src={user.profilePic} alt={user.username} data-ai-hint="user avatar" />
                <AvatarFallback className="text-4xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
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
      
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-auto h-auto p-0 bg-transparent border-0 shadow-none">
            <DialogHeader>
                <DialogTitle className="sr-only">Photo de profil en grand</DialogTitle>
            </DialogHeader>
          {viewingImage && <img src={viewingImage} alt="Photo de profil en grand" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
