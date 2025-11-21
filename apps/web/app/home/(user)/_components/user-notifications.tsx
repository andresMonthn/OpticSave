"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationsPopover } from '@kit/notifications/components';
import featuresFlagConfig from '~/config/feature-flags.config';
import { Card, CardContent } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Paciente {
  id: string;
  user_id: string;
  nombre: string | null;
  apellido?: string | null;
  fecha_de_cita: string | null;
  updated_at: string;
  created_at: string;
}

export function UserNotifications(props: { userId: string }) {
  if (!featuresFlagConfig.enableNotifications) {
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [closedNotifications, setClosedNotifications] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem('closedNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const formatearFecha = useCallback((fechaStr: string | null) => {
    if (!fechaStr) return 'Fecha no disponible';
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  }, []);

  const closeNotification = useCallback((id: string) => {
    setClosedNotifications((prev) => {
      const updated = [...prev, id];
      try {
        window.localStorage.setItem('closedNotifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setPacientes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const fetchPacientes = useCallback(async () => {
    try {
      const { data: pacientesData, error } = await supabase
        .from('pacientes' as any)
        .select('*')
        .eq('user_id', props.userId);
      if (error) return;
      const lista = (pacientesData as unknown as Paciente[]) || [];
      const filtrados = lista.filter((p) => !closedNotifications.includes(p.id));
      setPacientes(filtrados);
      if (filtrados.length > 0) {
        setIsCardVisible(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setIsCardVisible(false), 4000);
      }
    } catch {}
  }, [supabase, props.userId, closedNotifications]);

  useEffect(() => {
    void fetchPacientes();
    pollingInterval.current = setInterval(() => {
      void fetchPacientes();
    }, 30000);

    const channel = supabase
      .channel('pacientes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pacientes' },
        () => void fetchPacientes(),
      )
      .subscribe();

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchPacientes]);

  const containerStyle = useMemo(
    () => ({
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      maxWidth: '350px',
      zIndex: 1000,
    }) as React.CSSProperties,
    [],
  );

  return (
    <>
      <NotificationsPopover
        accountIds={[props.userId]}
        realtime={featuresFlagConfig.realtimeNotifications}
      />

      {isCardVisible && pacientes.length > 0 && (
        <div style={containerStyle} className="space-y-2">
          {pacientes.slice(0, 3).map((p) => (
            <Card key={p.id} className="shadow-md">
              <CardContent className="p-3 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Cita</Badge>
                    <span className="text-sm font-medium">{p.nombre ?? ''} {p.apellido ?? ''}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatearFecha(p.fecha_de_cita)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => closeNotification(p.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
