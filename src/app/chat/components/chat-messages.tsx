
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth, type Chat, type Message } from "@/hooks/use-auth";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPrivateChatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Copy, Trash2, Send, X, Check, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatMessagesProps {
  chat: Chat;
}

export function ChatMessages({ chat }: ChatMessagesProps) {
  const { currentUser, getMessagesForChat, deleteMessage, editMessage } = useAuth();
  const { toast } = useToast();
  const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);
  const messages = getMessagesForChat(chatId);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
            if (viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
            }
        }, 0);
    }
  }, [messages, editingMessageId]);

  const handleCopy = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: "Message copié dans le presse-papiers." });
  };

  const handleDelete = (messageId: string) => {
    deleteMessage(messageId);
  };
  
  const handleStartEdit = (message: Message) => {
    if (message.text === 'message supprimer' || message.attachment) return;
    setEditingMessageId(message.id);
    setEditingText(message.text || "");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) {
      handleCancelEdit();
      return;
    }
    await editMessage(editingMessageId, editingText.trim());
    handleCancelEdit();
  };

  return (
    <ScrollArea className="flex-grow p-4 bg-transparent" viewportRef={viewportRef}>
      <div className="flex flex-col gap-1">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isSent = msg.sender === currentUser;
            const messageDate = new Date(msg.timestamp);
            const timeString = messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const isDeleted = msg.text === 'message supprimer';
            
            return (
              <div
                key={msg.id}
                className={`group flex items-end gap-2 w-full ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                {isSent && !isDeleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 order-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleStartEdit(msg)} disabled={!!msg.attachment}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Modifier</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleCopy(msg.text)} disabled={!msg.text}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copier</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toast({ description: "Fonctionnalité pas encore disponible." })}>
                        <Send className="mr-2 h-4 w-4" />
                        <span>Transférer</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(msg.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div
                  className={`flex flex-col max-w-xs md:max-w-md lg:max-w-2xl rounded-lg ${
                    isSent
                      ? 'bg-sent-message text-sent-message-foreground order-1'
                      : 'bg-muted text-muted-foreground'
                  } ${msg.attachment && !msg.text ? 'p-1' : 'px-3 py-2'}`}
                >
                  {chat.isGroup && !isSent && (
                    <p className="text-xs font-bold text-primary mb-1">{msg.sender}</p>
                  )}

                  {msg.attachment && (
                    <div className={`mb-1 ${msg.attachment.type === 'file' ? 'w-full' : ''}`}>
                      {msg.attachment.type === 'image' && (
                        <img src={msg.attachment.url} alt="Pièce jointe" className="rounded-lg max-w-full h-auto" />
                      )}
                      {msg.attachment.type === 'video' && (
                        <video src={msg.attachment.url} controls className="rounded-lg max-w-full h-auto" />
                      )}
                      {msg.attachment.type === 'file' && (
                         <a 
                          href={msg.attachment.url} 
                          download={msg.attachment.name}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors w-full cursor-pointer"
                        >
                          <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold truncate">{msg.attachment.name}</span>
                            <span className="text-xs opacity-70">Fichier</span>
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                  
                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col gap-2">
                       <Input
                         value={editingText}
                         onChange={(e) => setEditingText(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit()}}
                         className="bg-background/80"
                         autoFocus
                       />
                       <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}><X className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveEdit}><Check className="h-4 w-4"/></Button>
                       </div>
                    </div>
                  ) : (
                    <>
                      {msg.text && (
                        <p className={`whitespace-pre-wrap break-words ${isDeleted ? 'italic opacity-70' : ''}`}>{isDeleted ? "Message supprimé" : msg.text}</p>
                      )}
                    </>
                  )}
                  
                  {!isDeleted && (
                    <p className={`text-xs mt-1 text-right ${editingMessageId === msg.id ? 'hidden' : ''} ${isSent ? 'text-sent-message-foreground/70' : 'text-muted-foreground/70'}`}>{timeString}</p>
                  )}
                </div>
                
                {!isSent && !isDeleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onSelect={() => handleCopy(msg.text)} disabled={isDeleted || !msg.text}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copier</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toast({ description: "Fonctionnalité pas encore disponible." })}>
                        <Send className="mr-2 h-4 w-4" />
                        <span>Transférer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
