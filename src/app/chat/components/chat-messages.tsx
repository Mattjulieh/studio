
"use client";

import React, { useEffect, useRef } from 'react';
import { useAuth, type Chat, type Message } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPrivateChatId } from '@/lib/utils';

interface ChatMessagesProps {
  chat: Chat;
}

export function ChatMessages({ chat }: ChatMessagesProps) {
  const { currentUser, getMessagesForChat } = useAuth();
  const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);
  const messages = getMessagesForChat(chatId);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
            if (viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
            }
        }, 0);
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-grow p-4 bg-transparent" viewportRef={viewportRef}>
      <div className="flex flex-col gap-4">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isSent = msg.sender === currentUser;
            const messageDate = new Date(msg.timestamp);
            const timeString = messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
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
                  {chat.isGroup && !isSent && (
                    <p className="text-xs font-bold text-primary mb-1">{msg.sender}</p>
                  )}
                  <p className="text-foreground whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className="text-xs text-right mt-1 text-muted-foreground">{timeString}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="bg-green-100/80 p-4 rounded-lg shadow-md max-w-sm text-green-900 backdrop-blur-sm border border-green-200">
              <p className="font-semibold">Ceci est le début de votre conversation.</p>
              <p className="text-sm mt-1">Les messages que vous envoyez apparaîtront ici.</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
