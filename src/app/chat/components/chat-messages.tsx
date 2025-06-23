"use client";

import { useAuth, type Profile } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessagesProps {
  contact: Profile;
}

const dummyMessages = [
    { id: 1, sender: "other", text: "Salut! Comment ça va?", time: "10:00" },
    { id: 2, sender: "me", text: "Ça va bien, merci! Et toi?", time: "10:01" },
    { id: 3, sender: "other", text: "Super! Quoi de neuf?", time: "10:01" },
    { id: 4, sender: "me", text: "Pas grand chose, je teste cette nouvelle app de chat. Elle est plutôt cool!", time: "10:02" },
    { id: 5, sender: "other", text: "Oh vraiment? Montre-moi!", time: "10:03" },
];

export function ChatMessages({ contact }: ChatMessagesProps) {
  const { currentUser } = useAuth();

  return (
    <ScrollArea className="flex-grow p-4">
      <div className="flex flex-col gap-4">
        {dummyMessages.map((msg) => {
          const isSent = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-2 shadow ${
                  isSent
                    ? 'bg-accent rounded-br-none'
                    : 'bg-white rounded-bl-none'
                }`}
              >
                <p className="text-foreground">{msg.text}</p>
                <p className="text-xs text-right mt-1 text-gray-500">{msg.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
