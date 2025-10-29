"use client";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Card, CardContent } from "@kit/ui/card";
import { format, compareDesc } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { motion, AnimatePresence } from "framer-motion";

// Tipo para los pacientes - usando la definición correcta
interface Paciente {
  id: string;
  user_id: string;
  nombre: string | null;
  apellido: string | null;
  fecha_de_cita: string | null;
  // Otros campos que podrían ser necesarios
  edad: number | null;
  sexo: string | null;
  telefono: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
}
// Componente de tarjeta de paciente optimizado con memo
const PacienteCard = memo(({ 
  paciente, 
  formatearFecha, 
  onClose 
}: { 
  paciente: Paciente, 
  formatearFecha: (fecha: string | null) => string,
  onClose: (id: string) => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      layout
      className="w-full"
    >
      <Card className="w-full max-w-[300px] mx-auto shadow-md hover:shadow-lg transition-all duration-300 bg-card/90 border border-primary/10 hover:border-primary/30 relative">
        <button 
          onClick={() => onClose(paciente.id)}
          className="absolute top-2 right-2 text-foreground/50 hover:text-destructive transition-colors duration-300 p-1 rounded-full hover:bg-destructive/10"
          aria-label="Cerrar notificación">
          <X size={16} />
        </button>
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <span className="mr-2 font-medium">{paciente.nombre} {paciente.apellido}</span>
          </div>
          <p className="text-sm text-card-foreground/80">
            Cita: {formatearFecha(paciente.fecha_de_cita)}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
});
PacienteCard.displayName = "PacienteCard";

export default function NotificacionesAPI() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closedNotifications, setClosedNotifications] = useState<string[]>(() => {
    // Cargar notificaciones cerradas desde localStorage al iniciar
    const saved = localStorage.getItem('closedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  // Estado para controlar la visibilidad del card
  const [isCardVisible, setIsCardVisible] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para ordenar pacientes por fecha de cita (más reciente primero)
  const ordenarPacientes = useCallback((lista: Paciente[]) => {
    return [...lista].sort((a, b) => {
      // Primero ordenar por fecha de cita
      if (a.fecha_de_cita && b.fecha_de_cita) {
        return compareDesc(new Date(a.fecha_de_cita), new Date(b.fecha_de_cita));
      } else if (a.fecha_de_cita) {
        return -1;
      } else if (b.fecha_de_cita) {
        return 1;
      }
      // Si no hay fechas de cita, ordenar por fecha de actualización
      return compareDesc(new Date(a.updated_at || a.created_at), new Date(b.updated_at || b.created_at));
    });
  }, []);

  // Función para cerrar una notificación específica
  const closeNotification = useCallback((id: string) => {
    setClosedNotifications(prev => {
      const updated = [...prev, id];
      // Guardar en localStorage para persistencia
      localStorage.setItem('closedNotifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchPacientes = useCallback(async () => {
    try {
      setError(null);
      // Verificar autenticación
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('Usuario no autenticado');
        return;
      }
      // Obtener todos los pacientes del usuario
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes' as any)
        .select('*')
        .eq('user_id', userData.user.id);//solo muestra los registros que ha loggeado.
      if (pacientesError) {
        console.error('Error fetching pacientes:', pacientesError);
        setError('Error al cargar las citas de pacientes');
        return;
      }
      const pacientesList = (pacientesData as unknown as Paciente[]) || [];
      
      // Filtrar pacientes que no están en la lista de cerrados
      const pacientesFiltrados = pacientesList.filter(
        paciente => !closedNotifications.includes(paciente.id)
      );
      
      // Si hay pacientes, mostrar el card y configurar el temporizador para ocultarlo
      if (pacientesFiltrados.length > 0) {
        setIsCardVisible(true); 
        // Limpiar cualquier temporizador existente
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        } 
        // Configurar nuevo temporizador para ocultar el card después de 4 segundos
        hideTimeoutRef.current = setTimeout(() => {
          setIsCardVisible(false);
        }, 4000);
      }
      
      setPacientes(ordenarPacientes(pacientesFiltrados));
    } catch (err) {
      console.error("Error al cargar los pacientes:", err);
      setError("No se pudieron cargar los datos de pacientes");
    } finally {
      setLoading(false);
    }
  }, [supabase, ordenarPacientes, closedNotifications]);

  // Configurar suscripción en tiempo real a cambios en la tabla de pacientes
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Iniciar con una carga de datos
        await fetchPacientes();
        
        // Configurar polling para actualizaciones en tiempo real (cada 30 segundos)
        pollingInterval.current = setInterval(() => {
          fetchPacientes();
        }, 30000);

        // Intentar configurar suscripción en tiempo real con Supabase
        const channel = supabase
          .channel('pacientes-changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'pacientes' 
            }, 
            () => {
              // Cuando hay cambios, actualizar los datos
              fetchPacientes();
            }
          )
          .subscribe();

        // Limpiar suscripción al desmontar
        return () => {
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
          }
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error al configurar suscripción en tiempo real:", error);
        // Si falla la suscripción en tiempo real, mantener el polling
      }
    };

    setupRealtimeSubscription();
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [supabase, fetchPacientes]);

  // Limpiar el temporizador al desmontar el componente
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const formatearFecha = useCallback((fechaStr: string | null) => {
    if (!fechaStr) return "Fecha no disponible";
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (error) {
      return "Fecha no disponible";
    }
  }, []);

  // Estilos para el contenedor principal en la esquina superior derecha
  const containerStyle = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    maxWidth: '350px',
    maxHeight: '80vh',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    borderRadius: '0.75rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  } as React.CSSProperties;

  if (loading) {
    return (
      <div style={containerStyle} className="p-4 bg-card/90 border border-primary/10">
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-foreground text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle} className="p-4 bg-card/90 border border-destructive/20">
        <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Si no hay notificaciones o el card no es visible, no renderizar nada
  if (pacientes.length === 0 || !isCardVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <div style={containerStyle} className="bg-transparent">
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-y-auto p-3"
          style={{ maxHeight: '70vh' }}
        >
          <div className="space-y-3">
            {pacientes.map((paciente) => (
              <PacienteCard 
                key={paciente.id} 
                paciente={paciente} 
                formatearFecha={formatearFecha}
                onClose={closeNotification}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}