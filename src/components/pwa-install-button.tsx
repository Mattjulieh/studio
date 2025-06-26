"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    // The prompt can only be used once.
    installPrompt.userChoice.then(() => {
        setInstallPrompt(null);
    });
  };

  if (!installPrompt) return null;

  return (
     <div className="w-full max-w-7xl mx-auto my-8 px-4 text-center">
        <Card className="inline-block bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle>Installer l'application</CardTitle>
                <CardDescription>
                    Pour une meilleure expérience, ajoutez ChatFamily à votre écran d'accueil.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleInstallClick} size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Télécharger l'application
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
