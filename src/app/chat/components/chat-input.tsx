
"use client";

import { useState, useRef } from "react";
import type { Chat } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Paperclip, Image, Video, FileText } from "lucide-react";
import { getPrivateChatId } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  chat: Chat;
}

export function ChatInput({ chat }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, currentUser } = useAuth();
  const { toast } = useToast();
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "" || !chatId) return;

    setIsSending(true);
    const result = await sendMessage(chatId, inputValue.trim(), undefined);
    if (result.success) {
      setInputValue("");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: result.message || "Impossible d'envoyer le message.",
      });
    }
    setIsSending(false);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_FILE_SIZE) {
        toast({
            variant: "destructive",
            title: "Fichier trop volumineux",
            description: "La taille du fichier ne peut pas dépasser 8 Mo.",
        });
        e.target.value = ''; // Reset the input
        return;
    }


    setIsSending(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target?.result as string;
      const result = await sendMessage(chatId, null, { type, url: dataUri, name: file.name });
      if (!result.success) {
        toast({
            variant: 'destructive',
            title: 'Erreur d\'envoi',
            description: result.message || 'Impossible d\'envoyer le fichier. Il est peut-être trop volumineux.',
        });
      }
      setIsSending(false);
    };
    reader.onerror = () => {
        setIsSending(false);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de lire le fichier.' });
    };
    reader.readAsDataURL(file);

    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };


  return (
    <form onSubmit={handleSubmit} className="flex items-center p-3 gap-2 border-t bg-background flex-shrink-0">
       <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
       <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
       <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
      <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 flex-shrink-0">
                <Paperclip className="h-6 w-6 text-foreground" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
            <div className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={() => imageInputRef.current?.click()}>
                    <Image className="mr-2 h-4 w-4" />
                    Image
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => videoInputRef.current?.click()}>
                    <Video className="mr-2 h-4 w-4" />
                    Vidéo
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => fileInputRef.current?.click()}>
                    <FileText className="mr-2 h-4 w-4" />
                    Fichier
                </Button>
            </div>
        </PopoverContent>
      </Popover>
      <Input
        placeholder="Écrivez un message..."
        className="flex-grow bg-card rounded-full h-12 px-5 text-foreground placeholder:text-muted-foreground"
        style={{borderColor: 'hsl(var(--border))'}}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isSending}
      />
      <Button
        type="submit"
        size="icon"
        className="bg-foreground text-background hover:bg-foreground/90 rounded-full h-12 w-12 flex-shrink-0"
        disabled={isSending || inputValue.trim() === ""}
      >
        {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
      </Button>
    </form>
  );
}
