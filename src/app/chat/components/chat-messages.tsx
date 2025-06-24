
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth, type Chat, type Message, type Profile } from "@/hooks/use-auth";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPrivateChatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Copy, Trash2, Send, X, Check, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ChatMessagesProps {
  chat: Chat;
}

export function ChatMessages({ chat }: ChatMessagesProps) {
  const { currentUser, profile, getMessagesForChat, deleteMessage, editMessage, getAllUsers } = useAuth();
  const { toast } = useToast();
  const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);
  const messages = getMessagesForChat(chatId);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, Profile>>({});
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfiles = async () => {
        const allUsers = await getAllUsers();
        const profilesMap = allUsers.reduce((acc, user) => {
            acc[user.username] = user;
            return acc;
        }, {} as Record<string, Profile>);
        if (profile) {
            profilesMap[profile.username] = profile;
        }
        setUserProfiles(profilesMap);
    };
    fetchUserProfiles();
  }, [getAllUsers, profile]);

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
    <>
      <ScrollArea className="flex-grow p-4 bg-transparent" viewportRef={viewportRef}>
        <div className="flex flex-col gap-1">
          {messages.length > 0 ? (
            messages.map((msg, index) => {
              const isSent = msg.sender === currentUser;
              const messageDate = new Date(msg.timestamp);
              const timeString = messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const isDeleted = msg.text === 'message supprimer';

              let isJumbo = false;
              if (msg.text && !msg.attachment && !isDeleted) {
                  const trimmedText = msg.text.trim();
                  // Use a regex to find any character that is not an emoji or whitespace.
                  // \P{Emoji_Presentation} matches any character that is not a "displayable" emoji.
                  // This is a good way to check if the message is emoji-only.
                  const nonEmojiRegex = /\P{Emoji_Presentation}/u;
                  
                  // We test against the text with whitespace removed.
                  if (trimmedText && !nonEmojiRegex.test(trimmedText.replace(/\s/g, ''))) {
                      try {
                          // Intl.Segmenter correctly counts grapheme clusters (i.e., "visible" emojis)
                          const segments = [...new Intl.Segmenter().segment(trimmedText)];
                          const emojiCount = segments.filter(s => s.segment.trim().length > 0).length;
                          if (emojiCount > 0 && emojiCount <= 3) {
                              isJumbo = true;
                          }
                      } catch (e) {
                          // Fallback for older environments that don't support Intl.Segmenter
                      }
                  }
              }

              const senderProfile = userProfiles[msg.sender];
              const nextMsg = messages[index + 1];
              const showAvatar = !nextMsg || nextMsg.sender !== msg.sender || new Date(nextMsg.timestamp).getTime() - messageDate.getTime() > 60000;
              
              return (
                <div
                  key={msg.id}
                  className={`group flex items-end gap-2 w-full ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  {!isSent && (
                    <div className="w-8 self-end flex-shrink-0">
                      {showAvatar && senderProfile ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={senderProfile.profilePic} alt={senderProfile.username} data-ai-hint="user avatar" />
                          <AvatarFallback>{senderProfile.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ) : null}
                    </div>
                  )}

                  {isSent && !isDeleted && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 order-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleStartEdit(msg)} disabled={!!msg.attachment || isJumbo}>
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
                    className={`flex flex-col max-w-xs md:max-w-md lg:max-w-lg ${
                      isJumbo
                        ? `bg-transparent ${isSent ? 'order-1' : ''}`
                        : `rounded-lg ${
                            isSent
                              ? 'bg-sent-message text-sent-message-foreground order-1'
                              : 'bg-muted text-muted-foreground'
                          } ${msg.attachment && !msg.text ? 'p-1' : 'px-3 py-2'}`
                    }`}
                  >
                    {chat.isGroup && !isSent && !isJumbo && (
                      <p className="text-xs font-bold text-primary mb-1">{msg.sender}</p>
                    )}

                    {msg.attachment && (
                      <div className={`mb-1 ${msg.attachment.type === 'file' ? 'w-full' : ''}`}>
                        {msg.attachment.type === 'image' && (
                           <button onClick={() => setViewingImage(msg.attachment.url)} className="block outline-none">
                            <img src={msg.attachment.url} alt="Pièce jointe" className="rounded-lg max-w-[250px] h-auto cursor-pointer" />
                          </button>
                        )}
                        {msg.attachment.type === 'video' && (
                          <video src={msg.attachment.url} controls className="rounded-lg max-w-[250px] h-auto" />
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
                          <p className={`whitespace-pre-wrap break-words ${isDeleted ? 'italic opacity-70' : ''} ${isJumbo ? 'text-5xl leading-tight' : ''}`}>{isDeleted ? "Message supprimé" : msg.text}</p>
                        )}
                      </>
                    )}
                    
                    {!isDeleted && (
                      <p className={`text-xs mt-1 text-right ${editingMessageId === msg.id || isJumbo ? 'hidden' : ''} ${isSent ? 'text-sent-message-foreground/70' : 'text-muted-foreground/70'}`}>{timeString}</p>
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

                  {isSent && (
                    <div className="w-8 self-end flex-shrink-0 order-3">
                      {showAvatar && senderProfile ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={senderProfile.profilePic} alt={senderProfile.username} data-ai-hint="user avatar"/>
                          <AvatarFallback>{senderProfile.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ) : null}
                    </div>
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
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-auto h-auto p-0 bg-transparent border-0 shadow-none">
            <DialogHeader>
                <DialogTitle className="sr-only">Image en grand</DialogTitle>
            </DialogHeader>
          {viewingImage && <img src={viewingImage} alt="Pièce jointe en grand" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

