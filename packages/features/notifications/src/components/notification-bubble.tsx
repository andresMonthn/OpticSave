'use client';

import { useCallback, useEffect, useState } from 'react';

import { CheckCircle2, CircleAlert, Info, TriangleAlert, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Database } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { cn } from '@kit/ui/utils';

import { useDismissNotification, useFetchNotifications } from '../hooks';

// Estilos de animación para la notificación
const toastAnimationStyles = `
  @keyframes slide-in-right {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slide-out-right {
    0% {
      transform: translateX(0);
      opacity: 1;
    }
    100% {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  
  @keyframes fade-out {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;

// Agregar los estilos al documento
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = toastAnimationStyles;
  document.head.appendChild(styleElement);
}

type Notification = Database['public']['Tables']['notifications']['Row'];

type PartialNotification = Pick<
  Notification,
  'id' | 'body' | 'dismissed' | 'type' | 'created_at' | 'link'
>;

export function NotificationBubble(params: {
  realtime: boolean;
  accountIds: string[];
  autoCloseDelay?: number; // Tiempo en ms para cerrar automáticamente (por defecto 5000ms)
  onClick?: (notification: PartialNotification) => void;
}) {
  const { i18n, t } = useTranslation();
  const [activeNotifications, setActiveNotifications] = useState<PartialNotification[]>([]);
  const [notifications, setNotifications] = useState<PartialNotification[]>([]);
  
  const autoCloseDelay = params.autoCloseDelay || 5000;

  // Eliminada la función updateActiveNotifications para evitar ciclos infinitos

  const onNotifications = useCallback(
    (newNotifications: PartialNotification[]) => {
      console.log('Notificaciones recibidas:', newNotifications);
      
      setNotifications((existing) => {
        const unique = new Set(existing.map((notification) => notification.id));

        // Filtrar notificaciones que ya existen
        const notificationsFiltered = newNotifications.filter(
          (notification) => !unique.has(notification.id)
        );
        
        // Solo actualizar si hay nuevas notificaciones
        if (notificationsFiltered.length === 0) {
          return existing;
        }
        
        const updatedNotifications = [...notificationsFiltered, ...existing];
        console.log('Notificaciones actualizadas:', updatedNotifications);
        
        return updatedNotifications;
      });
    },
    [],
  );

  const dismissNotification = useDismissNotification();

  // Manejar el cierre de una notificación
  const handleDismiss = useCallback((notificationId: number) => {
    setActiveNotifications((current) => 
      current.filter(notification => notification.id !== notificationId)
    );
    
    setNotifications((current) => 
      current.map(notification => 
        notification.id === notificationId 
          ? { ...notification, dismissed: true } 
          : notification
      )
    );
    
    return dismissNotification(notificationId);
  }, [dismissNotification]);

  useFetchNotifications({
    onNotifications,
    accountIds: params.accountIds,
    realtime: params.realtime,
  });

  const timeAgo = (createdAt: string) => {
    const date = new Date(createdAt);

    let time: number;

    const daysAgo = Math.floor(
      (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    const formatter = new Intl.RelativeTimeFormat(i18n.language, {
      numeric: 'auto',
    });

    if (daysAgo < 1) {
      time = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));

      if (time < 5) {
        return t('common:justNow');
      }

      if (time < 60) {
        return formatter.format(-time, 'minute');
      }

      const hours = Math.floor(time / 60);

      return formatter.format(-hours, 'hour');
    }

    const unit = (() => {
      const minutesAgo = Math.floor(
        (new Date().getTime() - date.getTime()) / (1000 * 60),
      );

      if (minutesAgo <= 60) {
        return 'minute';
      }

      if (daysAgo <= 1) {
        return 'hour';
      }

      if (daysAgo <= 30) {
        return 'day';
      }

      if (daysAgo <= 365) {
        return 'month';
      }

      return 'year';
    })();

    const text = formatter.format(-daysAgo, unit);

    return text.slice(0, 1).toUpperCase() + text.slice(1);
  };

  // Actualizar las notificaciones cuando se refresque la página
  useEffect(() => {
    // Configurar actualización al refrescar la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Página visible, actualizando notificaciones');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Sin dependencias para evitar ciclos
  
  // Actualizar activeNotifications cuando cambian las notificaciones
  useEffect(() => {
    // Actualizar las notificaciones activas cuando cambian las notificaciones
    const unreadNotifications = notifications.filter(
      notification => notification.dismissed === false
    );
    console.log('Actualizando notificaciones activas:', unreadNotifications);
    setActiveNotifications(unreadNotifications);
  }, [notifications]);
  
  // Configurar el cierre automático de notificaciones después de 5 segundos
  useEffect(() => {
    if (activeNotifications.length > 0) {
      const timers = activeNotifications.map(notification => {
        return setTimeout(() => {
          handleDismiss(notification.id);
        }, autoCloseDelay);
      });
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [activeNotifications, autoCloseDelay, handleDismiss]);

  // Si no hay notificaciones activas, no renderizar nada
  if (activeNotifications.length === 0) {
    return null;
  }

  // Función para renderizar el icono según el tipo de notificación
  const getIcon = (type: string | null) => {
    switch (type) {
      case 'warning':
        return <TriangleAlert className={'h-5 text-yellow-500'} />;
      case 'error':
        return <CircleAlert className={'text-destructive h-5'} />;
      case 'success':
        return <CheckCircle2 className={'h-5 text-green-500'} />;
      default:
        return <Info className={'h-5 text-blue-500'} />;
    }
  };

  // Formatear el cuerpo del mensaje
  const formatBody = (notificationBody: string) => {
    let body = t(notificationBody, {
      defaultValue: notificationBody,
    });

    const maxChars = 150; // Aumentado para el nuevo ancho
    if (body.length > maxChars) {
      body = body.substring(0, maxChars) + '...';
    }
    
    return body;
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-4">
      {activeNotifications.map((notification, index) => (
        <div 
          key={notification.id.toString()}
          role="alert"
          aria-live="polite"
          className={cn(
            'rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'animate-in fade-in duration-300'
          )}
          style={{
            width: 'calc(2.2 * 24rem)', // Doble del tamaño original (max-w-sm = 24rem) + 20%
            animation: `fade-in 0.3s ease-in-out both`,
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {getIcon(notification.type)}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                <If condition={notification.link} fallback={formatBody(notification.body)}>
                  {(link) => (
                    <a href={link} className="hover:underline">
                      {formatBody(notification.body)}
                    </a>
                  )}
                </If>
              </div>
              
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {timeAgo(notification.created_at)}
              </p>
            </div>
            
            <div className="ml-4 flex flex-shrink-0">
              <Button
                className="inline-flex h-7 w-7 rounded-md"
                size="icon"
                variant="ghost"
                onClick={() => handleDismiss(notification.id)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
