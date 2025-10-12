"use client";

import React from "react";
import MagicBento from "./MagicBento";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { Users, Activity, TrendingUp } from "lucide-react";

export default function MagicBentoDemo() {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">MagicBento como Contenedor</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Variante: container (básico) */}
        <MagicBento 
          variant="container"
          className="p-4 border rounded-lg bg-background"
          enableSpotlight
          enableStars
          glowColor="59, 130, 246"
        >
          <h3 className="text-lg font-semibold mb-2">Container Básico</h3>
          <p className="text-muted-foreground">
            MagicBento como contenedor simple con efectos de spotlight y estrellas.
          </p>
        </MagicBento>

        {/* Variante: card (con contenido propio) */}
        <MagicBento
          variant="card"
          title="Card con Efectos"
          description="Card estilizado con efectos visuales integrados"
          icon={<Users className="h-6 w-6 text-primary" />}
          enableSpotlight
          enableBorderGlow
          enableTilt
          clickEffect
          glowColor="168, 85, 247"
        />

        {/* Variante: overlay (envolviendo Card existente) */}
        <MagicBento
          variant="overlay"
          enableSpotlight
          enableStars
          enableBorderGlow
          clickEffect
          glowColor="34, 197, 94"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Overlay Mode
              </CardTitle>
              <CardDescription>
                MagicBento envolviendo un Card existente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Los efectos se aplican sobre el componente hijo sin modificar su estructura.
              </p>
            </CardContent>
          </Card>
        </MagicBento>

        {/* Como contenedor de elementos personalizados */}
        <MagicBento
          as="section"
          variant="container"
          className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-xl"
          enableSpotlight
          enableTilt
          clickEffect
          glowColor="99, 102, 241"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div>
              <h3 className="text-xl font-bold">Contenedor Custom</h3>
              <p className="text-sm text-muted-foreground">Como elemento &lt;section&gt;</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-indigo-200 dark:bg-indigo-800 rounded-full">
              <div className="h-2 bg-indigo-600 rounded-full w-3/4"></div>
            </div>
            <p className="text-sm">Progreso: 75%</p>
          </div>
        </MagicBento>

        {/* Sin efectos - contenedor puro */}
        <MagicBento
          variant="container"
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg"
          disableAnimations
        >
          <h3 className="text-lg font-semibold mb-2">Sin Efectos</h3>
          <p className="text-muted-foreground text-sm">
            MagicBento usado como contenedor simple sin animaciones ni efectos.
          </p>
        </MagicBento>

        {/* Con eventos personalizados */}
        <MagicBento
          variant="card"
          title="Con Eventos"
          description="Click para ver eventos personalizados"
          icon={<Activity className="h-6 w-6 text-green-600" />}
          enableSpotlight
          enableBorderGlow
          clickEffect
          glowColor="34, 197, 94"
          onClick={() => alert("¡MagicBento clickeado!")}
          onMouseEnter={() => console.log("Mouse enter")}
          onMouseLeave={() => console.log("Mouse leave")}
        />
      </div>
    </div>
  );
}