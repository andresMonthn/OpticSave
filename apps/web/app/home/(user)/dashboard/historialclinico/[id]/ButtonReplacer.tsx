"use client";

import React from 'react';
import { Button } from "@kit/ui/button";
import { ButtonWithSound } from "./ButtonWithSound";

// Este componente reemplaza todos los botones de la aplicación con ButtonWithSound
export function setupButtonReplacer() {
  // Guarda la referencia original del componente Button
  const OriginalButton = Button;
  
  // Reemplaza el componente Button con ButtonWithSound
  (global as any).OriginalButton = OriginalButton;
  (global as any).Button = ButtonWithSound;
  
  console.log("Todos los botones han sido reemplazados con ButtonWithSound");
  
  return () => {
    // Función para restaurar el botón original si es necesario
    (global as any).Button = OriginalButton;
  };
}