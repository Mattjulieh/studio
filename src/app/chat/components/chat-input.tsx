
"use client";

import { useState } from "react";
import type { Chat } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Paperclip, Image, Video } from "lucide-react";
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
  
  const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "" || !chatId) return;

    setIsSending(true);
    await sendMessage(chatId, inputValue.trim());
    setInputValue("");
    setIsSending(false);
  };

  const handleAttachment = (type: 'image' | 'vidéo') => {
    toast({
      title: "Bientôt disponible",
      description: `La fonctionnalité d'envoi de ${type} n'est pas encore implémentée.`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-3 gap-2 border-t bg-background flex-shrink-0">
      <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 flex-shrink-0">
                <Paperclip className="h-6 w-6 text-muted-foreground" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
            <div className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={() => handleAttachment('image')}>
                    <Image className="mr-2 h-4 w-4" />
                    Image
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleAttachment('vidéo')}>
                    <Video className="mr-2 h-4 w-4" />
                    Vidéo
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
