"use client";
import { Button } from "@kit/ui/button";
import { Moon, Sun } from "lucide-react";

interface ThemeButtonProps {
  mounted: boolean;
  currentTheme: 'light' | 'dark' | string;
  onToggle: () => void;
}

export function ThemeButton({ mounted, currentTheme, onToggle }: ThemeButtonProps) {
  if (!mounted) return null;
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={`rounded-full fixed top-4 right-4 z-50 ${
        currentTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-100'
      }`}
      aria-label="Cambiar tema"
    >
      {currentTheme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </Button>
  );
}