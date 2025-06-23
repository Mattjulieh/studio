"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis."),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFriendDialog({ open, onOpenChange }: AddFriendDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addFriend } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const result = await addFriend(data.username);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Succès!",
        description: result.message,
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un ami</DialogTitle>
          <DialogDescription>
            Entrez le nom d'utilisateur de la personne que vous souhaitez ajouter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-right">
              Nom d'utilisateur
            </Label>
            <Input
              id="username"
              placeholder="Nom d'utilisateur de l'ami"
              {...form.register("username")}
              className="col-span-3"
            />
             {form.formState.errors.username && (
              <p className="text-red-400 text-sm">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter un ami
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
