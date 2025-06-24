
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Save, KeyRound, Loader2, Check, X } from "lucide-react";

export default function ProfilePage() {
  const { profile, updateProfile, acceptFriendRequest, rejectFriendRequest, getAllUsers } = useAuth();
  const [formData, setFormData] = useState<Profile | null>(null);
  const [editState, setEditState] = useState({
    username: false,
    email: false,
    phone: false,
    status: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [friendRequestProfiles, setFriendRequestProfiles] = useState<Profile[]>([]);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (profile && profile.friendRequests && profile.friendRequests.length > 0) {
        const allUsers = await getAllUsers();
        const requestProfiles = allUsers.filter(u => profile.friendRequests!.includes(u.username));
        setFriendRequestProfiles(requestProfiles);
      } else {
        setFriendRequestProfiles([]);
      }
    };
    fetchRequests();
  }, [profile, getAllUsers]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const toggleEdit = (field: keyof typeof editState) => {
    const isCurrentlyEditing = editState[field];
    if (isCurrentlyEditing && formData) {
      updateProfile(formData);
    }
    setEditState((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const updatedProfile = { ...formData, profilePic: imageUrl };
        setFormData(updatedProfile);
        updateProfile(updatedProfile);
      };
      reader.readAsDataURL(file);
    }
  };
  
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

  if (!formData) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {friendRequestProfiles.length > 0 && (
        <Card className="w-full max-w-2xl shadow-lg mb-6">
            <CardHeader>
                <CardTitle>Demandes d'ami en attente</CardTitle>
                <CardDescription>Vous avez {friendRequestProfiles.length} nouvelle(s) demande(s) d'ami.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {friendRequestProfiles.map(reqProfile => (
                        <div key={reqProfile.username} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={reqProfile.profilePic} alt={reqProfile.username} data-ai-hint="user avatar" />
                                    <AvatarFallback>{reqProfile.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
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
      )}
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
                <AvatarImage src={formData.profilePic} alt={formData.username} data-ai-hint="profile avatar"/>
                <AvatarFallback className="text-4xl">
                  {formData.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit size={24} />
              </div>
            </button>
            <h2 className="text-3xl font-bold mt-4">{profile?.username}</h2>
            <p className="text-gray-500">{profile?.email}</p>
          </div>

          <div className="space-y-6">
            <ProfileField
              label="Nom d'utilisateur"
              field="username"
              value={formData.username}
              isEditing={editState.username}
              onToggleEdit={toggleEdit}
              onInputChange={handleInputChange}
            />
            <ProfileField
              label="Email"
              field="email"
              type="email"
              value={formData.email}
              isEditing={editState.email}
              onToggleEdit={toggleEdit}
              onInputChange={handleInputChange}
            />
            <ProfileField
              label="Téléphone"
              field="phone"
              type="tel"
              value={formData.phone}
              isEditing={editState.phone}
              onToggleEdit={toggleEdit}
              onInputChange={handleInputChange}
            />
            <ProfileField
              label="Statut"
              field="status"
              value={formData.status}
              isEditing={editState.status}
              onToggleEdit={toggleEdit}
              onInputChange={handleInputChange}
            />
          </div>

          <div className="text-center mt-10">
            <Button
              variant="outline"
              onClick={() => toast({ title: "Info", description: "Fonctionnalité non implémentée." })}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Changer le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>
      <Button asChild variant="ghost" className="mt-6 text-primary hover:text-primary">
        <Link href="/chat">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au chat
        </Link>
      </Button>
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  field: keyof Profile;
  value: string;
  isEditing: boolean;
  onToggleEdit: (field: keyof Profile) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

function ProfileField({ label, field, value, isEditing, onToggleEdit, onInputChange, type = "text" }: ProfileFieldProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <Label htmlFor={field} className="font-bold text-gray-600 w-1/4">{label}</Label>
      <div className="flex-grow mx-4">
        {isEditing ? (
          <Input
            id={field}
            name={field}
            type={type}
            value={value}
            onChange={onInputChange}
            className="text-base"
          />
        ) : (
          <span className="text-gray-800 text-base">{value}</span>
        )}
      </div>
      <Button
        variant={isEditing ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggleEdit(field)}
        className="w-24"
        disabled={field === 'username'} // Disable editing username
      >
        {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
        {isEditing ? 'Sauver' : 'Modifier'}
      </Button>
    </div>
  );
}
