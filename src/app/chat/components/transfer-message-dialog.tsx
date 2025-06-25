
"use client";

import { useState, useEffect } from "react";
import { useAuth, type Chat, type Message } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPrivateChatId } from "@/lib/utils";

interface TransferMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
}

export function TransferMessageDialog({ open, onOpenChange, message }: TransferMessageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const { profile, getGroupsForUser, sendMessage, getAllUsers, currentUser } = useAuth();
  const { toast } = useToast();
  const [potentialChats, setPotentialChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (open) {
      const fetchChats = async () => {
        const allUsers = await getAllUsers();
        const groups = getGroupsForUser();
        const friendUsernames = profile?.friends?.map(f => f.username) || [];
        const friends = allUsers.filter(u => friendUsernames.includes(u.username));
        setPotentialChats([...groups, ...friends]);
      };
      fetchChats();
    }
  }, [open, profile, getGroupsForUser, getAllUsers]);

  const handleToggleChat = (chatId: string, checked: boolean) => {
    setSelectedChats(prev =>
      checked ? [...prev, chatId] : prev.filter(id => id !== chatId)
    );
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedChats([]);
    }
    onOpenChange(isOpen);
  };

  const handleTransfer = async () => {
    if (!message || selectedChats.length === 0) return;
    
    setIsLoading(true);
    let failedCount = 0;

    // Use a sequential loop to avoid race conditions
    for (const chatId of selectedChats) {
      const result = await sendMessage(chatId, message.text, message.attachment, { isTransfer: true });
      if (!result.success) {
        failedCount++;
      }
    }

    setIsLoading(false);

    if (failedCount > 0) {
       toast({
        variant: "destructive",
        title: "Erreur de transfert",
        description: `${failedCount} message(s) n'ont pas pu être transférés.`,
      });
    } else {
      toast({
        title: "Message transféré",
        description: `Le message a été transféré avec succès à ${selectedChats.length} discussion(s).`,
      });
    }
    
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transférer le message</DialogTitle>
          <DialogDescription>
            Sélectionnez les discussions où vous souhaitez transférer ce message.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <ScrollArea className="h-64 rounded-md border p-2">
                <div className="space-y-2">
                    {potentialChats.length > 0 ? (
                        potentialChats.map(chat => {
                            const chatName = chat.isGroup ? chat.name : chat.username;
                            const chatId = chat.isGroup ? chat.id : getPrivateChatId(currentUser!, chat.username);

                            // Don't show the current chat in the list of chats to transfer to
                            if (message && chatId === message.chatId) {
                              return null;
                            }

                            return (
                                <div key={chatId} className="flex items-center space-x-3 p-1 rounded-md hover:bg-accent">
                                     <Checkbox
                                        id={`transfer-chat-${chatId}`}
                                        onCheckedChange={(checked) => handleToggleChat(chatId, !!checked)}
                                        checked={selectedChats.includes(chatId)}
                                    />
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={chat.profilePic} alt={chatName} data-ai-hint={chat.isGroup ? 'group avatar' : 'user avatar'} />
                                        <AvatarFallback>{chatName.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <label htmlFor={`transfer-chat-${chatId}`} className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                                        {chatName}
                                    </label>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-sm text-center text-muted-foreground p-4">Ajoutez des amis ou créez des groupes pour transférer des messages.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button onClick={handleTransfer} disabled={isLoading || selectedChats.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Transférer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
