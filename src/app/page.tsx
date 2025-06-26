
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/auth-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Newspaper } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { getNewsFeed, type NewsItem } from "@/app/actions";
import * as actions from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PwaInstallButton } from "@/components/pwa-install-button";

const NewsSection = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      setNewsLoading(true);
      const newsItems = await getNewsFeed();
      setNews(newsItems);
      setNewsLoading(false);
    }
    loadNews();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto mt-12 mb-8 px-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="news-section" className="border-b-0">
          <AccordionTrigger className="w-full flex justify-between p-4 rounded-lg bg-card border shadow-sm hover:no-underline hover:bg-accent/50 transition-colors">
            <h3 className="text-2xl font-bold text-foreground font-headline flex items-center gap-3">
              <Newspaper className="h-7 w-7" />
              Le Monde
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            {newsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-4 w-full mt-4" />
                      <Skeleton className="h-4 w-5/6 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item, index) => (
                  <Card key={index} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex flex-col h-full bg-card">
                      {item.imageUrl && (
                        <div className="relative w-full h-48">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            style={{objectFit: 'cover'}}
                            data-ai-hint="news article"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg leading-tight font-body">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                        <p className="text-sm text-muted-foreground flex-grow">{item.content}</p>
                        <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                          {new Date(item.pubDate).toLocaleString('fr-FR')}
                        </p>
                      </CardContent>
                    </a>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Impossible de charger les actualités pour le moment.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const TopicNewsGrid = ({ feedUrl }: { feedUrl: string }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadNews() {
            setIsLoading(true);
            const newsItems = await actions.getNewsFeed(feedUrl);
            setNews(newsItems);
            setIsLoading(false);
        }
        loadNews();
    }, [feedUrl]);
    
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader><Skeleton className="h-4 w-3/4" /></CardHeader>
                        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (news.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Aucune actualité trouvée pour cette catégorie.</p>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, index) => (
                <Card key={index} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex flex-col h-full bg-card">
                    {item.imageUrl && (
                        <div className="relative w-full h-40"><Image src={item.imageUrl} alt={item.title} fill style={{objectFit: 'cover'}} data-ai-hint="news article"/></div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-base leading-tight font-body">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                        <p className="text-sm text-muted-foreground flex-grow">{item.content}</p>
                        <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">{new Date(item.pubDate).toLocaleString('fr-FR')}</p>
                    </CardContent>
                    </a>
                </Card>
            ))}
        </div>
    )
};


const leParisienFeeds = [
    { name: "À la une", url: "https://feeds.leparisien.fr/leparisien/rss" },
    { name: "Faits divers", url: "https://feeds.leparisien.fr/leparisien/rss/faits-divers" },
    { name: "Politique", url: "https://feeds.leparisien.fr/leparisien/rss/politique" },
    { name: "Economie", url: "https://feeds.leparisien.fr/leparisien/rss/economie" },
    { name: "International", url: "https://feeds.leparisien.fr/leparisien/rss/international" },
    { name: "Sports", url: "https://feeds.leparisien.fr/leparisien/rss/sports" },
    { name: "JO 2024", url: "https://feeds.leparisien.fr/leparisien/rss/jo-paris-2024" },
    { name: "Culture Loisirs", url: "https://feeds.leparisien.fr/leparisien/rss/culture-loisirs" },
    { name: "Immobilier", url: "https://feeds.leparisien.fr/leparisien/rss/immobilier" },
    { name: "Environnement", url: "https://feeds.leparisien.fr/leparisien/rss/environnement" },
    { name: "Société", url: "https://feeds.leparisien.fr/leparisien/rss/societe" },
    { name: "Futurs", url: "https://feeds.leparisien.fr/leparisien/rss/futurs" },
    { name: "Podcasts", url: "https://feeds.leparisien.fr/leparisien/rss/podcasts" },
    { name: "Le Parisien Etudiant", url: "https://feeds.leparisien.fr/leparisien/rss/etudiant" },
    { name: "Vie étudiante", url: "https://feeds.leparisien.fr/leparisien/rss/etudiant/vie-etudiante" },
    { name: "Examens", url: "https://feeds.leparisien.fr/leparisien/rss/etudiant/examens" },
    { name: "Orientation", url: "https://feeds.leparisien.fr/leparisien/rss/etudiant/orientation" },
    { name: "Jobs & Stages", url: "https://feeds.leparisien.fr/leparisien/rss/etudiant/jobs-stages" },
    { name: "Guide d'achat", url: "https://feeds.leparisien.fr/leparisien/rss/guide-shopping" },
    { name: "Jardin", url: "https://feeds.leparisien.fr/leparisien/rss/jardin" },
];


const LeParisienSection = () => {
  return (
    <div className="w-full max-w-7xl mx-auto mt-8 mb-8 px-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="le-parisien-main" className="border-b-0">
          <AccordionTrigger className="w-full flex justify-between p-4 rounded-lg bg-card border shadow-sm hover:no-underline hover:bg-accent/50 transition-colors">
            <h3 className="text-2xl font-bold text-foreground font-headline flex items-center gap-3">
              <Newspaper className="h-7 w-7" />
              Le Parisien
            </h3>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <Accordion type="multiple" className="w-full space-y-2">
                {leParisienFeeds.map((feed) => (
                    <AccordionItem key={feed.url} value={feed.name} className="border rounded-md bg-card/50">
                        <AccordionTrigger className="px-4 hover:no-underline">{feed.name}</AccordionTrigger>
                        <AccordionContent className="p-4 border-t">
                            <TopicNewsGrid feedUrl={feed.url} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};


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
            <AuthHeader variant="light" />
            <div className="flex-grow flex flex-col items-center p-4 overflow-y-auto">
                <div className="text-center pt-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-headline">
                    Bienvenue, {currentUser}
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Utilisez la barre de navigation à gauche pour explorer l'application.
                  </p>
                </div>
                <PwaInstallButton />
                <NewsSection />
                <LeParisienSection />
            </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
       <AuthHeader variant="light" />
       <div className="flex-grow flex flex-col items-center p-4 overflow-y-auto">
          <div className="text-center pt-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-headline">
              Bienvenue sur ChatFamily
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              La meilleure façon de rester connecté avec vos proches. Discutez, partagez et créez des souvenirs, le tout au même endroit.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">S'inscrire</Link>
              </Button>
            </div>
          </div>
          <PwaInstallButton />
          <NewsSection />
          <LeParisienSection />
        </div>
    </div>
  );
}
