"use client";
import { Button } from "@kit/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessMessageProps {
  onClose: () => void;
}

export function SuccessMessage({ onClose }: SuccessMessageProps) {
  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="text-white text-center p-8 scale-in-center rounded-lg shadow-xl bg-primary">
        <CheckCircle2 className="w-24 h-24 mx-auto mb-6 animate-bounce text-white" />
        <div className="text-5xl font-bold mb-4 text-white">SU CITA YA ESTÁ REGISTRADA</div>
        <div className="text-xl text-white">¡Gracias por confiar en nosotros!</div>
        <div className="text-lg mt-4 text-white">Esta ventana se cerrará automáticamente en 5 segundos...</div>
        <Button onClick={onClose} className="mt-6 bg-white text-primary hover:bg-white/90 font-bold">
          Cerrar ventana
        </Button>
      </div>
    </div>
  );
}