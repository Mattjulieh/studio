
"use client";

import { useAuth, type Chat } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessagesProps {
  chat: Chat;
}

export function ChatMessages({ chat }: ChatMessagesProps) {
  const { currentUser } = useAuth();
  const messages: any[] = [];

  return (
    <ScrollArea className="flex-grow p-4 bg-transparent">
      <div className="flex flex-col gap-4 h-full">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isSent = msg.sender === 'me';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-2 shadow ${
                    isSent
                      ? 'bg-accent text-accent-foreground rounded-br-none'
                      : 'bg-card text-card-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-foreground">{msg.text}</p>
                  <p className="text-xs text-right mt-1 text-muted-foreground">{msg.time}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="bg-accent/80 p-4 rounded-lg shadow-md max-w-sm text-accent-foreground backdrop-blur-sm">
              <p className="font-semibold">Ceci est le début de votre conversation.</p>
              <p className="text-sm mt-1">Les messages que vous envoyez apparaîtront ici.</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
