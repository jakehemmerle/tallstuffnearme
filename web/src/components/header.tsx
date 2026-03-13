"use client";

import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  objectCount: number;
  loading: boolean;
}

export function Header({ objectCount, loading }: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm border-b">
      <h1 className="text-lg font-bold tracking-tight">Tall Stuff Near Me</h1>
      <div className="flex items-center gap-2">
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
        <Badge variant="secondary" data-testid="object-count">
          {objectCount} objects
        </Badge>
      </div>
    </header>
  );
}
