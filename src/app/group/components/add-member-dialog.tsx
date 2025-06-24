"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, type Profile, type Group } from "@/hooks/use-auth";
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
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formSchema = z.object({
  members: z.array(z.string()).min(1, "Sélectionnez au moins un membre à ajouter."),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onMembersAdded: () => void;
}

export function AddMemberDialog({ open, onOpenChange, group, onMembersAdded }: AddMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { profile, getAllUsers, addMembersToGroup } = useAuth();
  const { toast } = useToast();
  const [availableFriends, setAvailableFriends] = useState<Profile[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { members: [] },
  });

  useEffect(() => {
    if (profile?.friends && open) {
      const allUsers = getAllUsers();
      const friendProfiles = allUsers.filter(u => 
        profile.friends!.includes(u.username) && 
        !group.members.includes(u.username)
      );
      setAvailableFriends(friendProfiles);
    }
  }, [profile, getAllUsers, group, open]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const result = await addMembersToGroup(group.id, data.members);
    setIsLoading(false);

    if (result.success) {
      onMembersAdded();
      onOpenChange(false);
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.message,
      });
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter des membres</DialogTitle>
          <DialogDescription>
            Sélectionnez des amis à ajouter au groupe "{group.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <ScrollArea className="h-48 rounded-md border p-2">
                <div className="space-y-2">
                    {availableFriends.map(friend => (
                        <div key={friend.username} className="flex items-center space-x-3 p-1 rounded-md hover:bg-accent">
                             <Checkbox
                                id={`add-member-${friend.username}`}
                                onCheckedChange={(checked) => {
                                    const currentMembers = form.getValues("members");
                                    const updatedMembers = checked
                                        ? [...currentMembers, friend.username]
                                        : currentMembers.filter(m => m !== friend.username);
                                    form.setValue("members", updatedMembers, { shouldValidate: true });
                                }}
                                checked={form.watch('members').includes(friend.username)}
                            />
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={friend.profilePic} alt={friend.username} data-ai-hint="user avatar" />
                                <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <label htmlFor={`add-member-${friend.username}`} className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                                {friend.username}
                            </label>
                        </div>
                    ))}
                    {availableFriends.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">Tous vos amis sont déjà dans ce groupe.</p>}
                </div>
            </ScrollArea>
             {form.formState.errors.members && (
              <p className="text-red-400 text-sm">
                {form.formState.errors.members.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter au groupe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
