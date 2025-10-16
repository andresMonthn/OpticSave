"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function RedireccionPaciente() {
  const params = useParams();
  const router = useRouter();
  const pacienteId = params.id as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  const [fechaCita, setFechaCita] = useState<string | null>(null);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botonHabilitado, setBotonHabilitado] = useState(false);

  useEffect(() => {
    const obtenerFechaCita = async () => {
      try {
        // Obtener la fecha de cita del paciente
        const { data: paciente, error } = await supabase
          .from('pacientes')
          .select('fecha_de_cita')
          .eq('id', pacienteId)
          .single();

        if (error) throw error;
        
        if (!paciente || !paciente.fecha_de_cita) {
          setError("No se encontró la fecha de cita para este paciente");
          setCargando(false);
          return;
        }

        // Guardar la fecha de cita
        setFechaCita(paciente.fecha_de_cita);
        
        // Calcular días restantes
        const fechaCitaObj = new Date(paciente.fecha_de_cita);
        const hoy = new Date();
        
        // Normalizar las fechas para comparar solo días (sin horas)
        const fechaCitaNormalizada = new Date(fechaCitaObj.getFullYear(), fechaCitaObj.getMonth(), fechaCitaObj.getDate());
        const hoyNormalizada = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        
        // Calcular diferencia en días
        const diferenciaTiempo = fechaCitaNormalizada.getTime() - hoyNormalizada.getTime();
        const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));
        
        setDiasRestantes(diferenciaDias);
        
        // Habilitar el botón de diagnóstico solo si es el día de la cita
        setBotonHabilitado(diferenciaDias === 0);
        
        // Redirigir después de mostrar la información
        const timer = setTimeout(() => {
          router.push(`/home/dashboard/historialclinico/${pacienteId}`);
        }, 3000);
        
        setCargando(false);
        return () => clearTimeout(timer);
      } catch (err) {
        console.error("Error al obtener fecha de cita:", err);
        setError("Error al obtener información de la cita");
        setCargando(false);
      }
    };

    obtenerFechaCita();
  }, [pacienteId, router, supabase]);

  // Función para formatear la fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      {cargando ? (
        <div className="text-center">
          <RefreshCw className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4 mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Verificando cita...</h1>
        </div>
      ) : error ? (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
          <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4 mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => router.push(`/home/dashboard/historialclinico/${pacienteId}`)}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md text-sm sm:text-base transition-colors hover:bg-primary/90"
          >
            Continuar de todos modos
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            {diasRestantes === 0 ? (
              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500 mx-auto mb-3 sm:mb-4" />
            ) : (
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
            )}
            
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Información de la cita</h1>
            
            {fechaCita && (
              <p className="text-base sm:text-lg mb-2">
                Fecha programada: <span className="font-semibold">{formatearFecha(fechaCita)}</span>
              </p>
            )}
            
            {diasRestantes !== null && (
              <div className="mt-2 px-2 py-1 rounded-md bg-gray-50">
                {diasRestantes === 0 ? (
                  <p className="text-green-600 font-bold text-base sm:text-lg">¡Hoy es el día de la cita!</p>
                ) : diasRestantes > 0 ? (
                  <p className="text-amber-600 text-sm sm:text-base">
                    Faltan <span className="font-bold">{diasRestantes}</span> día{diasRestantes !== 1 ? 's' : ''} para la cita
                  </p>
                ) : (
                  <p className="text-red-600 text-sm sm:text-base">
                    La cita expiró hace <span className="font-bold">{Math.abs(diasRestantes)}</span> día{Math.abs(diasRestantes) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-4 sm:mt-6 border-t pt-3">
              <p className="text-xs sm:text-sm text-gray-500 mb-2">
                {botonHabilitado 
                  ? "El botón de diagnóstico está habilitado para hoy" 
                  : "El botón de diagnóstico solo está habilitado el día de la cita"}
              </p>
              
              <p className="text-xs sm:text-sm text-gray-500">Redirigiendo al historial clínico...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}