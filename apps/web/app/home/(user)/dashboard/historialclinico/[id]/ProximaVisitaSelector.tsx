"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@kit/ui/button";
import { Calendar } from "@kit/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kit/ui/popover";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { cn } from "@kit/ui/utils";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

interface ProximaVisitaSelectorProps {
  pacienteId: string;
  diagnosticoId?: string;
  onSuccess?: () => void;
}

export function ProximaVisitaSelector({ pacienteId, diagnosticoId, onSuccess }: ProximaVisitaSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });
  
  const supabase = getSupabaseBrowserClient();

  const handleSaveDate = async () => {
    if (!date) {
      setAlert({
        show: true,
        type: 'error',
        message: 'Por favor selecciona una fecha para la próxima visita'
      });
      setTimeout(() => setAlert({ ...alert, show: false }), 3000);
      return;
    }

    setLoading(true);

    try {
      // Verificar autenticación
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuario no autenticado');
      }

      // Si hay un diagnosticoId proporcionado, actualizamos ese diagnóstico específico
      if (diagnosticoId) {
        const { error } = await supabase
          .from('diagnostico' as any)
          .update({ 
            proxima_visita: date.toISOString()
          })
          .eq('id', diagnosticoId);

        if (error) throw error;
      } else {
        // Si no hay diagnosticoId, buscamos primero si existe un diagnóstico para este paciente
        const { data: existingDiagnostico, error: searchError } = await supabase
          .from('diagnostico' as any)
          .select('id')
          .eq('paciente_id', pacienteId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (searchError) throw searchError;
        
        
        if (existingDiagnostico && existingDiagnostico.length > 0) {
          // Si existe un diagnóstico, lo actualizamos solo con proxima_visita
          const { error } = await supabase
            .from('diagnostico' as any)
            .update({ 
              proxima_visita: date.toISOString()
            })
            .eq('id', (existingDiagnostico[0] as any).id);
            
          if (error) throw error;
        } 
      }

      setAlert({
        show: true,
        type: 'success',
        message: 'Fecha de próxima visita guardada correctamente revise agenda para confirmar'
      });
      
      setIsOpen(false);
      
      // Llamar al callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
      
      // Ocultar la alerta después de 3 segundos
      setTimeout(() => setAlert({ ...alert, show: false }), 3000);
    } catch (error: any) {
      console.error('Error al guardar la fecha:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Error al guardar la fecha'
      });
      setTimeout(() => setAlert({ ...alert, show: false }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {alert.show && (
        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'} className="mb-4">
          {alert.type === 'success' ? (
            <CheckCircle2Icon className="h-4 w-4" />
          ) : (
            <AlertCircleIcon className="h-4 w-4" />
          )}
          <AlertTitle>
            {alert.type === 'success' ? 'Éxito' : 'Error'}
          </AlertTitle>
          <AlertDescription>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-medium">Programar próxima visita</h3>
        <div className="flex items-center gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                }}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleSaveDate} 
            disabled={loading || !date}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}