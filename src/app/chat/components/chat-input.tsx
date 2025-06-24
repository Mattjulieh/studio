
"use client";

import { useState } from "react";
import type { Chat } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { getPrivateChatId } from "@/lib/utils";

interface ChatInputProps {
  chat: Chat;
}

export function ChatInput({ chat }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, currentUser } = useAuth();
  
  const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "" || !chatId) return;

    setIsSending(true);
    await sendMessage(chatId, inputValue.trim());
    setInputValue("");
    setIsSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-3 gap-3 border-t bg-card flex-shrink-0" style={{borderColor: 'hsl(var(--border))'}}>
      <Input
        placeholder="Écrivez un message..."
        className="flex-grow bg-background rounded-full h-12 px-5 text-foreground placeholder:text-muted-foreground"
        style={{borderColor: 'hsl(var(--border))'}}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isSending}
      />
      <Button
        type="submit"
        size="icon"
        className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 flex-shrink-0"
        disabled={isSending || inputValue.trim() === ""}
      >
        {isSending ? <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" /> : <Send className="h-6 w-6 text-primary-foreground" />}
      </Button>
    </form>
  );
}
