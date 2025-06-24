
"use client";

import { useState, useEffect } from "react";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFriendDialog({ open, onOpenChange }: AddFriendDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { sendFriendRequest, getAllUsers, profile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [requestingUsername, setRequestingUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    if (searchQuery.trim() === "" || !profile) {
      setSearchResults([]);
      return;
    }

    const allUsers = getAllUsers();
    const friendsUsernames = profile.friends || [];
    const sentRequestsUsernames = profile.sentRequests || [];
    const friendRequestsUsernames = profile.friendRequests || [];
    
    const results = allUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        user.username !== profile.username &&
        !friendsUsernames.includes(user.username) &&
        !sentRequestsUsernames.includes(user.username) &&
        !friendRequestsUsernames.includes(user.username)
    );
    setSearchResults(results);
  }, [searchQuery, getAllUsers, profile, open]);

  const handleSendRequest = async (username: string) => {
    setRequestingUsername(username);
    setIsLoading(true);
    const result = await sendFriendRequest(username);
    setIsLoading(false);
    setRequestingUsername(null);

    if (result.success) {
      toast({
        title: "Succès!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.message,
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
    onOpenChange(isOpen);
  };

  const hasSentRequest = (username: string) => {
    return profile?.sentRequests?.includes(username);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un ami</DialogTitle>
          <DialogDescription>
            Recherchez un utilisateur pour lui envoyer une demande d'ami.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-username" className="text-right">
              Nom d'utilisateur
            </Label>
            <Input
              id="search-username"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="space-y-2">
            {searchResults.length > 0 && (
              <p className="text-sm font-medium text-muted-foreground">Résultats de la recherche</p>
            )}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((user) => {
                const sent = hasSentRequest(user.username);
                return (
                  <div key={user.username} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePic} alt={user.username} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold">{user.username}</p>
                    </div>
                    <Button size="sm" onClick={() => handleSendRequest(user.username)} disabled={isLoading && requestingUsername === user.username || sent}>
                      {isLoading && requestingUsername === user.username ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : sent ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Envoyée
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
              {searchQuery.trim() !== "" && searchResults.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Aucun utilisateur trouvé.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
