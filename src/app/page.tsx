"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url(https://download.ffnews.cn/ppt_test/7389fbd26a1444d45ebf8912a90cccf6.jpg)" }}>
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }
  
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url(https://download.ffnews.cn/ppt_test/7389fbd26a1444d45ebf8912a90cccf6.jpg)" }}
    >
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
  );
}
