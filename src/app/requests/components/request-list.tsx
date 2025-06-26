
"use client";

import { useState, useEffect } from "react";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function RequestList() {
  const { profile, acceptFriendRequest, rejectFriendRequest, getAllUsers } = useAuth();
  const [friendRequestProfiles, setFriendRequestProfiles] = useState<Profile[]>([]);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (profile && profile.friendRequests && profile.friendRequests.length > 0) {
        const allUsers = await getAllUsers();
        const requestProfiles = allUsers.filter(u => profile.friendRequests!.includes(u.username));
        setFriendRequestProfiles(requestProfiles);
      } else {
        setFriendRequestProfiles([]);
      }
      setIsLoading(false);
    };
    fetchRequests();
  }, [profile, getAllUsers]);

  const handleAccept = async (username: string) => {
    setIsProcessingRequest(username);
    await acceptFriendRequest(username);
    setIsProcessingRequest(null);
  };

  const handleReject = async (username: string) => {
    setIsProcessingRequest(username);
    await rejectFriendRequest(username);
    setIsProcessingRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (friendRequestProfiles.length === 0) {
    return (
        <Card className="w-full shadow-lg">
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Vous n'avez aucune demande d'ami en attente.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card className="w-full shadow-lg">
          <CardHeader>
              <CardTitle>Demandes en attente</CardTitle>
              <CardDescription>Vous avez {friendRequestProfiles.length} nouvelle(s) demande(s) d'ami.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                  {friendRequestProfiles.map(reqProfile => (
                      <div key={reqProfile.username} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                          <div className="flex items-center gap-3">
                              <button onClick={() => setViewingImage(reqProfile.profilePic)} className="outline-none">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={reqProfile.profilePic} alt={reqProfile.username} data-ai-hint="user avatar" />
                                    <AvatarFallback>{reqProfile.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </button>
                              <p className="font-semibold">{reqProfile.username}</p>
                          </div>
                          <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleAccept(reqProfile.username)} disabled={!!isProcessingRequest}>
                                  {isProcessingRequest === reqProfile.username ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 text-green-500"/>}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(reqProfile.username)} disabled={!!isProcessingRequest}>
                                  {isProcessingRequest === reqProfile.username ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4 text-red-500"/>}
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </CardContent>
      </Card>
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-auto h-auto p-0 bg-transparent border-0 shadow-none">
            <DialogHeader>
                <DialogTitle className="sr-only">Photo de profil</DialogTitle>
            </DialogHeader>
          {viewingImage && <img src={viewingImage} alt="Photo de profil en grand" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
