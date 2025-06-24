
"use client";

import { useState, useEffect, useRef, type ChangeEvent, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth, type Group, type Profile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Edit, Users, Crown, Loader2, UserPlus } from "lucide-react";
import { AddMemberDialog } from "../components/add-member-dialog";

export default function GroupProfilePage() {
  const params = useParams();
  const groupId = params.id as string;
  const { getGroupById, getAllUsers, updateGroup, profile } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setAddMemberOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGroupData = useCallback(async () => {
    if (groupId) {
      setIsLoading(true);
      const groupData = getGroupById(groupId);
      setGroup(groupData);
      if (groupData) {
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
        // The group state will be updated via context
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMembersAdded = () => {
    fetchGroupData(); // Re-fetch group data to show new members
  };

  useEffect(() => {
    // This effect listens for changes in the group object from the context
    if(groupId) {
      const updatedGroup = getGroupById(groupId);
      setGroup(updatedGroup);
    }
  }, [getGroupById, groupId, profile]); // Depend on profile to refetch when context updates

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-2xl text-center p-8">
          <CardHeader>
            <CardTitle>Groupe non trouvé</CardTitle>
            <CardDescription>Ce groupe n'existe pas ou vous n'y avez pas accès.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" className="mt-6 text-primary hover:text-primary">
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
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
            <h2 className="text-3xl font-bold mt-4">{group.name}</h2>
            <p className="text-gray-500">Groupe · {group.members.length} membres</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-lg">Membres</h3>
                <Button variant="ghost" size="icon" onClick={() => setAddMemberOpen(true)}>
                    <UserPlus className="h-5 w-5" />
                    <span className="sr-only">Ajouter des membres</span>
                </Button>
            </div>
            <ScrollArea className="h-64 rounded-md border">
                <div className="p-4 space-y-4">
                    {members.map(member => (
                        <div key={member.username} className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={member.profilePic} alt={member.username} data-ai-hint="user avatar" />
                                <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="font-semibold">{member.username}</p>
                                <p className="text-sm text-gray-500">{member.status}</p>
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

        </CardContent>
      </Card>
      <Button asChild variant="ghost" className="mt-6 text-primary hover:text-primary">
        <Link href="/chat">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au chat
        </Link>
      </Button>
      {group && <AddMemberDialog open={isAddMemberOpen} onOpenChange={setAddMemberOpen} group={group} onMembersAdded={handleMembersAdded} />}
    </div>
  );
}
