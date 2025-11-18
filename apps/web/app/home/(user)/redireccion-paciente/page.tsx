"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
export default function RedireccionPaciente() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarPacienteReciente = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Obtener el usuario actual
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error("Usuario no autenticado");
        }
        
        // Buscar el paciente más reciente creado por este usuario
        const { data: pacientes, error } = await supabase
          .from("pacientes" as any)
          .select("id")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (error) throw error;
        if (!pacientes || !Array.isArray(pacientes) || pacientes.length === 0) {
          throw new Error("No se encontraron pacientes recientes");
        }   
        // Asegurarse de que pacientes[0] existe y tiene una propiedad id
        const pacienteReciente = pacientes[0] as unknown as { id: string };
        const pacienteId = pacienteReciente?.id || null;
        
        // Redirigir al historial clínico después de un breve retraso
        setTimeout(() => {
          router.push(`/home/historialclinico/${pacienteId}`);
        }, 1000);
      } catch (err: any) {
        console.error("Error al buscar paciente reciente:", err);
        setError(err.message || "Error al buscar paciente reciente");
        
        // En caso de error, redirigir a la página principal después de mostrar el error
        setTimeout(() => {
          router.push("/home");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    buscarPacienteReciente();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">Cargando paciente...</h1>
      <p className="text-gray-600">
        Accediendo al historial clínico del paciente más reciente
      </p>
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}