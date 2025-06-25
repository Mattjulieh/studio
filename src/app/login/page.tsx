
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthHeader } from "@/components/auth-header";

const formSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur est requis."),
  password: z.string().min(1, "Mot de passe est requis."),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/chat');
    }
  }, [currentUser, loading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const result = await login(data.username, data.password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Succès!",
        description: result.message,
      });
      router.push("/chat");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: result.message,
      });
    }
  };

  if (loading || (!loading && currentUser)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="w-full flex flex-col items-center z-10">
        <AuthHeader />
        <Card className="w-full max-w-lg mt-8 bg-card/10 backdrop-blur-sm border-border/30 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline">Connecter-vous</CardTitle>
            <CardDescription className="text-white/80 pt-2">
              Entrez vos identifiants pour discuter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  placeholder="Votre nom d'utilisateur"
                  {...form.register("username")}
                  className="bg-white/10 placeholder:text-white/60"
                />
                {form.formState.errors.username && (
                  <p className="text-destructive text-sm">{form.formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  {...form.register("password")}
                  className="bg-white/10 placeholder:text-white/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-white/80 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {form.formState.errors.password && (
                  <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full text-lg h-12 rounded-full bg-white/90 text-black hover:bg-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4">
            <Link href="#" className="text-sm text-white/80 hover:text-white hover:underline">
              Mot de passe oublié?
            </Link>
            <p className="text-sm text-white/80">
              Pas encore de compte?{" "}
              <Link href="/register" className="font-bold text-white hover:underline">
                Créez-en un
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
