
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";

export default function HomePage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="h-screen w-screen flex bg-background">
        <AppSidebar activePage="home" />
        <main className="flex-grow flex flex-col overflow-hidden">
            <AuthHeader />
            <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-headline">
                  Bienvenue, {currentUser}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Utilisez la barre de navigation à gauche pour explorer l'application.
                </p>
            </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
       <AuthHeader />
       <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-headline">
            Bienvenue sur ChatFamily
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            La meilleure façon de rester connecté avec vos proches. Discutez, partagez et créez des souvenirs, le tout au même endroit.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 ease-in-out text-lg h-14 rounded-full px-10">
                  <Link href="/login">
                      Commencer
                  </Link>
              </Button>
          </div>
        </div>
    </div>
  );
}
