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
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

type RegisterFormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, currentUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const spaceBgUrl = "https://images.pexels.com/photos/956981/milky-way-starry-sky-night-sky-star-956981.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/chat');
    }
  }, [currentUser, loading, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    const result = await register(data.username, data.email, data.password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Inscription réussie!",
        description: result.message,
      });
      router.push("/login");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: result.message,
      });
    }
  };

  if (loading || (!loading && currentUser)) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center animated-space-bg" style={{ backgroundImage: `url(${spaceBgUrl})` }}/>
        <div className="absolute inset-0 bg-black/60" />
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden"
    >
      <div className="absolute inset-0 bg-cover bg-center animated-space-bg" style={{ backgroundImage: `url(${spaceBgUrl})` }}/>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <AuthHeader />
        <Card className="w-full max-w-lg mt-8 bg-white/10 border-2 border-white/20 shadow-lg backdrop-blur-md text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-headline">Inscrivez-vous</CardTitle>
            <CardDescription className="text-white/80 pt-2">
              Créez votre compte pour rejoindre la famille.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  placeholder="Choisissez un nom d'utilisateur"
                  {...form.register("username")}
                  className="bg-transparent text-white placeholder:text-white/70 border-white/30 focus:border-white"
                />
                {form.formState.errors.username && <p className="text-red-400 text-sm">{form.formState.errors.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Votre adresse e-mail"
                  {...form.register("email")}
                  className="bg-transparent text-white placeholder:text-white/70 border-white/30 focus:border-white"
                />
                {form.formState.errors.email && <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Créez un mot de passe"
                  {...form.register("password")}
                  className="bg-transparent text-white placeholder:text-white/70 border-white/30 focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-white/80 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {form.formState.errors.password && <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary/80 hover:bg-primary text-lg h-12 rounded-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Créer un compte"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center">
            <p className="text-sm text-white/80">
              Déjà un compte?{" "}
              <Link href="/login" className="font-bold text-white hover:underline">
                Connectez-vous
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
