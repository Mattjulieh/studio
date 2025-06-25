
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, type Group, type Profile } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Edit, Users, Crown, Loader2, UserPlus, LogOut, ShieldAlert, Save } from "lucide-react";
import { AddMemberDialog } from "../components/add-member-dialog";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GroupProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const groupId = params.id as string;
  const { getGroupById, getAllUsers, updateGroup, leaveGroup, currentUser } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setAddMemberOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [isLeaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getAllUsers()
      .then(users => {
        setAllUsers(users);
      })
      .catch(error => {
        console.error("Failed to fetch users:", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger les utilisateurs."
        });
      })
      .finally(() => {
          setIsLoading(false);
      });
  }, [getAllUsers, toast]);

  useEffect(() => {
    const groupData = getGroupById(groupId);
    
    if (groupData) {
      setGroup(groupData);
      
      if (!isEditingDescription) {
        setDescription(groupData.description || "");
      }

      if (allUsers.length > 0) {
        const memberProfiles = allUsers.filter(u => groupData.members.includes(u.username));
        setMembers(memberProfiles);
      }

    } else if (!isLoading && allUsers.length > 0) {
      toast({
        variant: "destructive",
        title: "Groupe non trouvé",
        description: "Ce groupe n'existe pas ou vous n'y avez plus accès.",
      });
      router.push('/chat');
    }
  }, [groupId, getGroupById, allUsers, isLoading, isEditingDescription, router, toast]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && group) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        updateGroup(group.id, { profilePic: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMembersAdded = () => {
    // Data will be refreshed automatically by the context update,
    // which will trigger the main useEffect. No action needed here.
  };

  const handleSaveDescription = () => {
    if (group) {
        updateGroup(group.id, { description: description });
        setIsEditingDescription(false);
        toast({ title: "Description mise à jour" });
    }
  };

  const handleLeaveGroup = async () => {
    if (group) {
        await leaveGroup(group.id);
    }
    setLeaveConfirmOpen(false);
  };

  const handleReportGroup = () => {
    toast({
        title: "Groupe signalé",
        description: "Merci. Notre équipe examinera la situation.",
    });
  };

  if (isLoading || !group) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCreator = group.creator === currentUser;

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg bg-card">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <div className="relative group">
                <button onClick={() => setViewingImage(group.profilePic)}>
                    <Avatar className="w-28 h-28 border-4 border-border shadow-md">
                    <AvatarImage src={group.profilePic} alt={group.name} data-ai-hint="group avatar"/>
                    <AvatarFallback className="text-4xl">
                        <Users />
                    </AvatarFallback>
                    </Avatar>
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Edit size={24} />
                </button>
              </div>
              <h2 className="text-3xl font-bold mt-4 text-foreground">{group.name}</h2>
              <p className="text-muted-foreground">Groupe · {group.members.length} membres</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Description</h3>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (isEditingDescription) {
                      handleSaveDescription();
                  } else {
                      setIsEditingDescription(true);
                  }
                }}>
                  {isEditingDescription ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                </Button>
              </div>
               {isEditingDescription ? (
                  <RichTextEditor
                    content={description}
                    onChange={setDescription}
                  />
                ) : (
                  <div
                    className="prose prose-sm sm:prose-base max-w-none min-h-[40px] text-foreground"
                    dangerouslySetInnerHTML={{ __html: group.description || "<p>Aucune description de groupe.</p>" }}
                  />
                )}
            </div>

            <Separator className="my-6 bg-border" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-lg">Membres</h3>
                  
                    <Button variant="ghost" size="icon" onClick={() => setAddMemberOpen(true)}>
                        <UserPlus className="h-5 w-5" />
                        <span className="sr-only">Ajouter des membres</span>
                    </Button>
                  
              </div>
              <ScrollArea className="h-64 rounded-md border border-border">
                  <div className="p-4 space-y-4">
                      {members.map(member => (
                          <div key={member.username} className="flex items-center gap-4">
                              <button onClick={() => setViewingImage(member.profilePic)}>
                                <Avatar>
                                    <AvatarImage src={member.profilePic} alt={member.username} data-ai-hint="user avatar" />
                                    <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </button>
                              <div className="flex-grow">
                                  <p className="font-semibold text-foreground">{member.username}</p>
                                  <p className="text-sm text-muted-foreground">{member.status}</p>
                              </div>
                              {group.creator === member.username && (
                                  <div className="flex items-center gap-1 text-sm text-amber-500">
                                      <Crown className="h-4 w-4" />
                                      <span>Créateur</span>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
                <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setLeaveConfirmOpen(true)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Quitter le groupe
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleReportGroup}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Signaler le groupe
                    </Button>
                </div>
            </div>

          </CardContent>
        </Card>
        <Button asChild variant="ghost" className="mt-6 text-foreground hover:text-foreground/90">
          <Link href="/chat">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au chat
          </Link>
        </Button>
        {group && <AddMemberDialog open={isAddMemberOpen} onOpenChange={setAddMemberOpen} group={group} onMembersAdded={handleMembersAdded} />}
      </div>
      <AlertDialog open={isLeaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
                Êtes-vous sûr de vouloir quitter "{group.name}" ? Vous ne recevrez plus les messages de ce groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={handleLeaveGroup}
            >
                Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-auto h-auto p-0 bg-transparent border-0 shadow-none">
            <DialogHeader>
                <DialogTitle className="sr-only">Image en grand</DialogTitle>
            </DialogHeader>
          {viewingImage && <img src={viewingImage} alt="Image en grand" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
