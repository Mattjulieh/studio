
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth, type Profile } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Save, KeyRound, Loader2, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { CropImageDialog } from "./components/crop-image-dialog";

export default function ProfilePage() {
  const { profile, updateProfile, acceptFriendRequest, rejectFriendRequest, getAllUsers, updateUsername } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<Profile | null>(null);
  const [editState, setEditState] = useState({
    username: false,
    email: false,
    phone: false,
    description: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [friendRequestProfiles, setFriendRequestProfiles] = useState<Profile[]>([]);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    // Only set formData from profile if not editing to avoid overwriting user input
    if (profile && !Object.values(editState).some(s => s)) {
      setFormData(profile);
    }
  }, [profile, editState]);

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (formData) {
      if (name === "description" && value.length > 150) {
        return; // Prevent typing more than 150 chars
      }
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async (field: keyof typeof editState) => {
    if (!formData) return;

    if (field === 'username') {
      if (formData.username !== profile?.username && formData.username.trim() !== '') {
        setNewUsername(formData.username);
        setIsConfirmOpen(true);
      }
    } else {
      await updateProfile(formData);
      setEditState(prev => ({ ...prev, [field]: false }));
    }
  };
  
  const handleCancelEdit = (field: keyof typeof editState) => {
      setEditState(prev => ({...prev, [field]: false}));
      if (profile) {
          setFormData(profile); // Reset form data to original profile data on cancel
      }
  };

  const handleToggleEdit = (field: keyof typeof editState) => {
    setEditState(prev => ({...prev, [field]: !prev[field]}));
  };

  const handleConfirmUsernameChange = async () => {
    if (!newUsername || !profile) return;
    setIsUpdatingUsername(true);
    const result = await updateUsername(newUsername);
    setIsUpdatingUsername(false);
    setIsConfirmOpen(false);

    if (result.success) {
        toast({
            title: "Succès",
            description: "Votre nom d'utilisateur a été mis à jour. Vous allez être reconnecté.",
        });
        router.push('/chat');
    } else {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: result.message,
        });
        if (profile) setFormData(profile); // Revert form data on failure
    }
    setEditState(prev => ({...prev, username: false}));
  };


  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveCroppedImage = (croppedImageUrl: string) => {
    if (formData) {
        const updatedProfile = { ...formData, profilePic: croppedImageUrl };
        setFormData(updatedProfile);
        updateProfile(updatedProfile);
    }
    setImageToCrop(null);
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
    <>
      <div className="flex h-screen w-screen bg-background">
        <AppSidebar activePage="profile" />
        <main className="flex-grow min-h-screen flex flex-col items-center p-4 overflow-y-auto pb-20 md:pb-4">
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
                                    <button onClick={() => setViewingImage(reqProfile.profilePic)}>
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
                <div className="relative group">
                  <button onClick={() => setViewingImage(formData.profilePic)}>
                      <Avatar className="w-28 h-28 border-4 border-border shadow-md">
                      <AvatarImage src={formData.profilePic} alt={formData.username} data-ai-hint="profile avatar"/>
                      <AvatarFallback className="text-4xl">
                          {formData.username.charAt(0).toUpperCase()}
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
                <h2 className="text-3xl font-bold mt-4 text-foreground">{profile?.username}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>

              <div className="space-y-6">
                <ProfileField
                  label="Nom d'utilisateur"
                  field="username"
                  value={formData.username}
                  isEditing={editState.username}
                  onToggleEdit={() => editState.username ? handleSave('username') : handleToggleEdit('username')}
                  onCancel={() => handleCancelEdit('username')}
                  onInputChange={handleInputChange}
                />
                <ProfileField
                  label="Email"
                  field="email"
                  type="email"
                  value={formData.email}
                  isEditing={editState.email}
                  onToggleEdit={() => editState.email ? handleSave('email') : handleToggleEdit('email')}
                  onCancel={() => handleCancelEdit('email')}
                  onInputChange={handleInputChange}
                />
                <ProfileField
                  label="Téléphone"
                  field="phone"
                  type="tel"
                  value={formData.phone}
                  isEditing={editState.phone}
                  onToggleEdit={() => editState.phone ? handleSave('phone') : handleToggleEdit('phone')}
                  onCancel={() => handleCancelEdit('phone')}
                  onInputChange={handleInputChange}
                />
                 <div className="flex items-center justify-between border-b pb-4">
                  <Label className="font-bold text-muted-foreground w-1/4">Statut</Label>
                  <div className="flex-grow mx-4">
                    <span className="text-foreground text-base">{formData.status}</span>
                  </div>
                  <div className="w-24"></div>
                </div>
                <div className="space-y-2 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="font-bold text-muted-foreground">Description</Label>
                     {!editState.description && (
                        <Button
                          variant='outline'
                          size="sm"
                          onClick={() => handleToggleEdit('description')}
                          className="w-24"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                     )}
                  </div>
                  {editState.description ? (
                    <div>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="text-base"
                        maxLength={150}
                      />
                      <p className="text-right text-sm text-muted-foreground mt-1">
                        {formData.description.length} / 150
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" onClick={() => handleCancelEdit('description')}>Annuler</Button>
                        <Button onClick={() => handleSave('description')}>
                          <Save className="mr-2 h-4 w-4" />
                          Sauver
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground text-base whitespace-pre-wrap pt-2">{formData.description || "Aucune description."}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                  <div className="space-y-4">
                      <Button
                          variant="outline"
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => toast({ title: "Info", description: "Fonctionnalité non implémentée." })}
                      >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Changer le mot de passe
                      </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmer le changement de nom d'utilisateur ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Attention : Changer votre nom d'utilisateur mettra à jour votre identifiant dans toute l'application. 
                    Cela peut affecter la manière dont vos amis vous trouvent et l'historique de vos conversations. 
                    Cette action est irréversible.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFormData(profile)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmUsernameChange} disabled={isUpdatingUsername}>
                    {isUpdatingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmer
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-auto h-auto p-0 bg-transparent border-0 shadow-none">
            <DialogHeader>
                <DialogTitle className="sr-only">Photo de profil</DialogTitle>
            </DialogHeader>
            {viewingImage && <img src={viewingImage} alt="Photo de profil en grand" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
      <CropImageDialog 
        imageSrc={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onSave={handleSaveCroppedImage}
      />
    </>
  );
}

interface ProfileFieldProps {
  label: string;
  field: keyof Omit<Profile, 'status' | 'description'>;
  value: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onCancel: () => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

function ProfileField({ label, field, value, isEditing, onToggleEdit, onCancel, onInputChange, type = "text" }: ProfileFieldProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <Label htmlFor={field} className="font-bold text-muted-foreground w-1/4">{label}</Label>
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
          <span className="text-foreground text-base">{value}</span>
        )}
      </div>
      {isEditing ? (
         <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
            <Button size="sm" onClick={onToggleEdit} className="w-24">
                <Save className="mr-2 h-4 w-4" />
                Sauver
            </Button>
         </div>
      ) : (
        <Button
            variant='outline'
            size="sm"
            onClick={onToggleEdit}
            className="w-24"
        >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
        </Button>
      )}
    </div>
  );
}
