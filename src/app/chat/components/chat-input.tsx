"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export function ChatInput() {
  return (
    <form className="flex items-center p-3 gap-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
      <Input
        placeholder="Écrivez un message..."
        className="flex-grow bg-white rounded-full h-12 px-5"
      />
      <Button
        type="submit"
        size="icon"
        className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 flex-shrink-0"
      >
        <Send className="h-6 w-6 text-white" />
      </Button>
    </form>
  );
}
