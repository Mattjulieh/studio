
"use client";

import { useState, useEffect, useRef } from "react";
import * as actions from "@/app/actions";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Paperclip, Image, Video, FileText, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PASSWORD = "secret";

export default function PrivateSpacePage() {
  const { currentUser, profile } = useAuth();
  const { toast } = useToast();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [error, setError] = useState("");

  const [posts, setPosts] = useState<actions.PrivatePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    const unlockedInSession = sessionStorage.getItem("privateSpaceUnlocked");
    if (unlockedInSession === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const fetchPosts = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const userPosts = await actions.getPrivatePosts(currentUser);
    setPosts(userPosts);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchPosts();
    }
  }, [isUnlocked, currentUser]);

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
    const result = await actions.addPrivatePost(currentUser, text, attachment);
    if (result.success) {
      setInputValue("");
      fetchPosts(); // Refresh posts
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.message || "Impossible de publier.",
      });
    }
    setIsPosting(false);
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
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock /> Espace Privé
              </CardTitle>
              <CardDescription>
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
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleUnlock} className="w-full">
                Déverrouiller
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-muted/20">
        <ScrollArea className="flex-grow p-4" viewportRef={viewportRef}>
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-10" />
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id} className="w-full overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={profile?.profilePic} alt={profile?.username} data-ai-hint="profile avatar" />
                        <AvatarFallback>{profile?.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{profile?.username}</p>
                            <p className="text-xs text-muted-foreground">{new Date(post.timestamp).toLocaleString('fr-FR')}</p>
                        </div>
                        {post.attachment && (
                            <div className="mt-2 rounded-lg overflow-hidden max-w-md">
                                {post.attachment.type === 'image' && (
                                    <button onClick={() => setViewingImage(post.attachment.url)} className="block outline-none">
                                        <img src={post.attachment.url} alt="Pièce jointe" className="max-w-full h-auto cursor-pointer" />
                                    </button>
                                )}
                                {post.attachment.type === 'video' && (
                                    <video src={post.attachment.url} controls className="max-w-full h-auto" />
                                )}
                                {post.attachment.type === 'file' && (
                                    <a href={post.attachment.url} download={post.attachment.name} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors w-full cursor-pointer">
                                        <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-semibold truncate">{post.attachment.name}</span>
                                            <span className="text-xs opacity-70">Fichier</span>
                                        </div>
                                    </a>
                                )}
                            </div>
                        )}
                        {post.text && <p className="mt-2 whitespace-pre-wrap">{post.text}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Votre espace privé est vide.</p>
                <p className="text-sm">Commencez par ajouter une pensée ou un fichier.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
                <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                        <div className="grid gap-2">
                             <Button variant="outline" className="justify-start" onClick={() => imageInputRef.current?.click()}>
                                <Image className="mr-2 h-4 w-4" /> Image
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => videoInputRef.current?.click()}>
                                <Video className="mr-2 h-4 w-4" /> Vidéo
                            </Button>
                            <Button variant="outline" className="justify-start" onClick={() => fileInputRef.current?.click()}>
                                <FileText className="mr-2 h-4 w-4" /> Fichier
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
                <Input
                    placeholder="Écrivez quelque chose..."
                    className="flex-grow"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isPosting}
                />
                <Button type="submit" size="icon" className="flex-shrink-0" disabled={isPosting || inputValue.trim() === ""}>
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
    );
  };

  return (
    <div className="flex h-screen w-screen bg-background">
      <AppSidebar activePage="private" />
      <main className="flex-grow">{renderContent()}</main>
    </div>
  );
}
