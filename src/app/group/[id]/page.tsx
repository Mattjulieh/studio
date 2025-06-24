"use client";

import { useState, useEffect, useRef, type ChangeEvent, useCallback } from "react";
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

export default function GroupProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const groupId = params.id as string;
  const { getGroupById, getAllUsers, updateGroup, profile, leaveGroup, currentUser } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setAddMemberOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [isLeaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGroupData = useCallback(async () => {
    if (groupId) {
      setIsLoading(true);
      const groupData = getGroupById(groupId);
      setGroup(groupData);
      if (groupData) {
        setDescription(groupData.description);
        const allUsers = await getAllUsers();
        const memberProfiles = allUsers.filter(u => groupData.members.includes(u.username));
        setMembers(memberProfiles);
      }
      setIsLoading(false);
    }
  }, [groupId, getGroupById, getAllUsers]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

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
    fetchGroupData(); // Re-fetch group data to show new members
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

  useEffect(() => {
    if(groupId) {
      const updatedGroup = getGroupById(groupId);
      setGroup(updatedGroup);
      if (updatedGroup) {
        setDescription(updatedGroup.description);
      } else {
        // If group becomes null (e.g., user left and it was deleted), redirect.
        router.push('/chat');
      }
    }
  }, [getGroupById, groupId, profile, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl text-center p-8 bg-card">
          <CardHeader>
            <CardTitle>Groupe non trouvé</CardTitle>
            <CardDescription>Ce groupe n'existe pas ou vous n'y avez pas accès.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="mt-6 text-white hover:text-white/90">
              <Link href="/chat">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au chat
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCreator = group.creator === currentUser;

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg bg-card border-2 border-white">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative group"
              >
                <Avatar className="w-28 h-28 border-4 border-white shadow-md">
                  <AvatarImage src={group.profilePic} alt={group.name} data-ai-hint="group avatar"/>
                  <AvatarFallback className="text-4xl">
                    <Users />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit size={24} />
                </div>
              </button>
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
                    className="prose prose-sm sm:prose-base text-black dark:text-black max-w-none min-h-[40px]"
                    dangerouslySetInnerHTML={{ __html: group.description || "<p>Aucune description de groupe.</p>" }}
                  />
                )}
            </div>

            <Separator className="my-6 bg-white" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-lg">Membres</h3>
                  
                    <Button variant="ghost" size="icon" onClick={() => setAddMemberOpen(true)}>
                        <UserPlus className="h-5 w-5" />
                        <span className="sr-only">Ajouter des membres</span>
                    </Button>
                  
              </div>
              <ScrollArea className="h-64 rounded-md border border-white">
                  <div className="p-4 space-y-4">
                      {members.map(member => (
                          <div key={member.username} className="flex items-center gap-4">
                              <Avatar>
                                  <AvatarImage src={member.profilePic} alt={member.username} data-ai-hint="user avatar" />
                                  <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-grow">
                                  <p className="font-semibold text-white">{member.username}</p>
                                  <p className="text-sm text-muted-foreground">{member.status}</p>
                              </div>
                              {group.creator === member.username && (
                                  <div className="flex items-center gap-1 text-sm text-amber-600">
                                      <Crown className="h-4 w-4" />
                                      <span>Créateur</span>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </div>

            <div className="mt-8 pt-6 border-t border-white">
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
        <Button asChild variant="ghost" className="mt-6 text-white hover:text-white/90">
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
    </>
  );
}
