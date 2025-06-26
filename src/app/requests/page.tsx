
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { RequestList } from "./components/request-list";

export default function RequestsPage() {
  return (
    <div className="flex h-screen w-screen bg-background">
      <AppSidebar activePage="requests" />
      <main className="flex-grow min-h-screen flex flex-col items-center p-4 overflow-y-auto pb-20 md:pb-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-6 font-headline">Demandes d'ami</h1>
          <RequestList />
        </div>
      </main>
    </div>
  );
}
