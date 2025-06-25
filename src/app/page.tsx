
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Home, MessageSquare, CircleUser } from "lucide-react";

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
          <div className="mt-8 flex items-center justify-center gap-4">
              {currentUser ? (
                <>
                    <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-20 w-28 flex-col gap-2">
                        <Link href="/">
                            <Home className="h-7 w-7" />
                            <span>Accueil</span>
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-20 w-28 flex-col gap-2">
                        <Link href="/chat">
                            <MessageSquare className="h-7 w-7" />
                            <span>Messages</span>
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-20 w-28 flex-col gap-2">
                        <Link href="/profile">
                            <CircleUser className="h-7 w-7" />
                            <span>Profil</span>
                        </Link>
                    </Button>
                </>
              ) : (
                <Button asChild size="lg" className="bg-black text-white border-2 border-white hover:bg-white hover:text-black hover:border-black transition-colors duration-300 ease-in-out text-lg h-14 rounded-full px-10">
                    <Link href="/login">
                        Commencer
                    </Link>
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
