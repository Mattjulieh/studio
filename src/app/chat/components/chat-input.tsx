"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export function ChatInput() {
  return (
    <form className="flex items-center p-3 gap-3 border-t bg-card flex-shrink-0" style={{borderColor: 'hsl(var(--border))'}}>
      <Input
        placeholder="Écrivez un message..."
        className="flex-grow bg-background rounded-full h-12 px-5 text-foreground placeholder:text-muted-foreground"
         style={{borderColor: 'hsl(var(--border))'}}
      />
      <Button
        type="submit"
        size="icon"
        className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 flex-shrink-0"
      >
        <Send className="h-6 w-6 text-primary-foreground" />
      </Button>
    </form>
  );
}
