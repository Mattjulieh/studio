"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { currentUser, loading } = useAuth();
  const spaceBgUrl = "https://images.pexels.com/photos/956981/milky-way-starry-sky-night-sky-star-956981.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  if (loading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center animated-space-bg" style={{ backgroundImage: `url(${spaceBgUrl})` }}/>
        <div className="absolute inset-0 bg-black/60" />
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-white" />
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
       <div className="absolute inset-0 bg-cover bg-center animated-space-bg" style={{ backgroundImage: `url(${spaceBgUrl})` }}/>
       <div className="absolute inset-0 bg-black/60" />
      
       <div className="relative z-10 w-full flex flex-col items-center">
        <AuthHeader />
        <div className="mt-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight font-headline">
            Bienvenue sur ChatFamily
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            La meilleure façon de rester connecté avec vos proches. Discutez, partagez et créez des souvenirs, le tout au même endroit.
          </p>
          <div className="mt-8">
              <Button asChild size="lg" className="bg-primary/80 hover:bg-primary text-lg h-14 rounded-full px-10">
                  <Link href={currentUser ? "/chat" : "/login"}>
                      {currentUser ? "Aller au Chat" : "Commencer"}
                  </Link>
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
