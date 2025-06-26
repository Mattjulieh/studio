
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as actions from "@/app/actions";
import type { PrivatePost } from "@/app/actions";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Paperclip, Image, Video, FileText, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { HeartsBackground } from './components/hearts-background';

const PASSWORD = "mon namoureuse";

const colorClasses = [
    "text-rose-400",
    "text-sky-400",
    "text-emerald-400",
    "text-amber-400",
    "text-violet-400",
    "text-cyan-400",
    "text-orange-400",
];

const getUserColorClass = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const index = Math.abs(hash % colorClasses.length);
    return colorClasses[index];
};


export default function PrivateSpacePage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [error, setError] = useState("");

  const [posts, setPosts] = useState<PrivatePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<PrivatePost | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);


  useEffect(() => {
    const unlockedInSession = sessionStorage.getItem("privateSpaceUnlocked");
    if (unlockedInSession === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    try {
        const userPosts = await actions.getPrivateSpacePosts();
        setPosts(userPosts);
    } catch (e) {
        console.error("Failed to fetch private space posts", e);
    } finally {
        if (isLoading) {
            setIsLoading(false);
        }
    }
  }, [currentUser, isLoading]);

  useEffect(() => {
    if (isUnlocked && currentUser) {
      fetchPosts();
      const intervalId = setInterval(fetchPosts, 2000); 

      return () => clearInterval(intervalId);
    }
  }, [isUnlocked, currentUser, fetchPosts]);

  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
            if (viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
            }
        }, 100);
    }
  }, [posts]);

  const handleUnlock = () => {
    if (passwordAttempt === PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem("privateSpaceUnlocked", "true");
      setError("");
    } else {
      setError("Mot de passe incorrect.");
    }
  };

  const handlePostSubmit = async (text: string | null, attachment?: { type: 'image' | 'video' | 'file'; url: string; name?: string }) => {
    if (!currentUser) return;
    if (!text && !attachment) return;

    setIsPosting(true);
    const result = await actions.addPrivateSpacePost(currentUser, text, attachment);
    if (result.success && result.newPost) {
      setInputValue("");
      setPosts(prev => [...prev, result.newPost!]);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.message || "Impossible de publier.",
      });
    }
    setIsPosting(false);
  };
  
  const handleDeleteClick = (post: PrivatePost) => {
    setPostToDelete(post);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete || !currentUser) return;

    const result = await actions.deletePrivateSpacePost(postToDelete.id, currentUser);

    if (result.success) {
      toast({ title: "Succès", description: "Message supprimé." });
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.message || "Impossible de supprimer le message.",
      });
    }
    setIsConfirmOpen(false);
    setPostToDelete(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePostSubmit(inputValue.trim(), undefined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target?.result as string;
      await handlePostSubmit(null, { type, url: dataUri, name: file.name });
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de lire le fichier.' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };


  const renderContent = () => {
    if (!isUnlocked) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <Card className="w-full max-w-sm bg-neutral-900 border-neutral-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock /> Matteo et Jade discussion
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Cette section est protégée par un mot de passe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Entrez le mot de passe"
                value={passwordAttempt}
                onChange={(e) => setPasswordAttempt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                 className="bg-neutral-800 border-neutral-600 placeholder:text-neutral-500"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleUnlock} className="w-full bg-neutral-200 text-black hover:bg-neutral-300">
                Déverrouiller
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col h-full">
        <HeartsBackground />
        <div className="relative z-10 flex flex-col h-full bg-black/50 backdrop-blur-sm">
            <header className="p-4 border-b border-white/20 bg-black/50 text-center">
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2"><Lock className="h-5 w-5" /> Matteo et Jade discussion</h2>
            </header>
            <ScrollArea className="flex-grow p-4" viewportRef={viewportRef}>
              <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white mx-auto my-10" />
                ) : posts.length > 0 ? (
                  posts.map((post) => {
                    const isSent = post.senderUsername === currentUser;
                    const userColor = isSent ? 'text-white' : getUserColorClass(post.senderUsername);
                    return (
                        <div key={post.id} className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'}`}>
                             <div className={`group flex flex-col max-w-xs md:max-w-md lg:max-w-lg rounded-lg border border-white/30 ${isSent ? 'bg-black/80' : 'bg-black/60'}`}>
                                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewingImage(post.senderProfilePic)} className="outline-none">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={post.senderProfilePic} alt={post.senderUsername} data-ai-hint="user avatar" />
                                                <AvatarFallback>{post.senderUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </button>
                                        <p className={`text-sm font-bold ${userColor}`}>{post.senderUsername}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-white/70">{new Date(post.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        {isSent && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white opacity-0 group-hover:opacity-100" onClick={() => handleDeleteClick(post)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className={`px-3 pb-2 ${post.attachment && !post.text ? 'pt-1' : ''}`}>
                                    {post.attachment && (
                                        <div className="mt-1 rounded-lg overflow-hidden max-w-md">
                                            {post.attachment.type === 'image' && (
                                                <button onClick={() => setViewingImage(post.attachment.url)} className="block outline-none">
                                                    <img src={post.attachment.url} alt="Pièce jointe" className="max-w-full h-auto cursor-pointer rounded-md" />
                                                </button>
                                            )}
                                            {post.attachment.type === 'video' && (
                                                <video src={post.attachment.url} controls className="max-w-full h-auto rounded-md" />
                                            )}
                                            {post.attachment.type === 'file' && (
                                                <a href={post.attachment.url} download={post.attachment.name} className="flex items-center gap-3 p-3 rounded-lg bg-black/50 hover:bg-black/80 transition-colors w-full cursor-pointer text-white">
                                                    <FileText className="h-10 w-10 text-neutral-400 flex-shrink-0" />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-semibold truncate">{post.attachment.name}</span>
                                                        <span className="text-xs opacity-70">Fichier</span>
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {post.text && (
                                        <p className="whitespace-pre-wrap break-words text-white mt-1">{post.text}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
                ) : (
                  <div className="text-center py-10 text-neutral-300">
                    <p>Votre espace de discussion est vide.</p>
                    <p className="text-sm">Commencez par envoyer un message.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/20 bg-black/50">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
                    <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-white hover:bg-white/10">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-neutral-900 border-neutral-700">
                            <div className="grid gap-2">
                                 <Button variant="ghost" className="justify-start text-white hover:bg-white/10" onClick={() => imageInputRef.current?.click()}>
                                    <Image className="mr-2 h-4 w-4" /> Image
                                </Button>
                                <Button variant="ghost" className="justify-start text-white hover:bg-white/10" onClick={() => videoInputRef.current?.click()}>
                                    <Video className="mr-2 h-4 w-4" /> Vidéo
                                </Button>
                                <Button variant="ghost" className="justify-start text-white hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                                    <FileText className="mr-2 h-4 w-4" /> Fichier
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Input
                        placeholder="Écrivez quelque chose..."
                        className="flex-grow bg-white/10 border-white/20 text-white placeholder:text-neutral-400 focus-visible:ring-offset-black focus-visible:ring-pink-400"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isPosting}
                    />
                    <Button type="submit" size="icon" className="flex-shrink-0 bg-neutral-200 hover:bg-neutral-300 text-black" disabled={isPosting || inputValue.trim() === ""}>
                        {isPosting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
            <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
                <DialogContent className="max-w-4xl w-auto h-auto p-0 bg-transparent border-0 shadow-none">
                    <DialogHeader><DialogTitle className="sr-only">Image en grand</DialogTitle></DialogHeader>
                    {viewingImage && <img src={viewingImage} alt="Pièce jointe en grand" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
                </DialogContent>
            </Dialog>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      <AppSidebar activePage="private" />
      <main className="flex-grow overflow-hidden pb-20 md:pb-0">{renderContent()}</main>
       <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement ce message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={buttonVariants({ variant: "destructive" })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
