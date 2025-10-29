import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import NotificacionesAPI from './_components/notificaciones_api';

// local imports
import { HomeLayoutPageHeader } from './_components/home-page-header';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';
import { Card, CardHeader, CardTitle } from '@kit/ui/card';
import { DashboardDemo } from '../[account]/_components/dashboard-demo';
import { CalendarDays, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:homePage');

  return {
    title,
  };
};

// Componente de reloj digital que se actualiza cada segundo
const DigitalClock = () => {
  const [time, setTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar con la hora actual
    try {
      setTime(new Date());
    } catch (err) {
      setError('Error al obtener la hora del sistema');
      console.error('Error al obtener la hora:', err);
    }

    // Actualizar cada segundo
    const intervalId = setInterval(() => {
      try {
        setTime(new Date());
      } catch (err) {
        setError('Error al actualizar la hora');
        console.error('Error al actualizar la hora:', err);
        clearInterval(intervalId);
      }
    }, 1000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <span className="text-destructive">{error}</span>;
  }

  if (!time) {
    return <span>Cargando...</span>;
  }

  // Formatear la hora con horas, minutos y segundos
  const formattedTime = time.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <span className="font-mono text-base tabular-nums">{formattedTime}</span>
  );
};

// Componente de fecha estilizado según la imagen de referencia
const DateDisplay = () => {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  useEffect(() => {
    try {
      setCurrentDate(new Date());
    } catch (err) {
      console.error('Error al obtener la fecha:', err);
    }
  }, []);

  if (!currentDate) {
    return <div>Cargando fecha...</div>;
  }

  const day = currentDate.getDate();
  const month = currentDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
  const year = currentDate.getFullYear();
  const weekday = currentDate.toLocaleString('es-ES', { weekday: 'long' });
  
  return (
    <div className="flex flex-col items-center justify-center bg-red-500 text-white p-3 rounded-md shadow-md w-24 h-24">
      <div className="text-xs capitalize mb-1">{weekday}</div>
      <div className="text-4xl font-bold">{day}</div>
      <div className="text-xs uppercase mt-1">{month} {year}</div>
    </div>
  );
};

export default withI18n(async function UserHomePage() {
  const { user } = await loadUserWorkspace();
  const nombre = user?.user_metadata?.name || user?.email || 'Usuario';

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.home'} />}
        description={<Trans i18nKey={'common:homeTabDescription'} />}
      />
      <PageBody>
        <div className="mb-6">
          <NotificacionesAPI />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-2xl font-bold tracking-tight">{`Bienvenido ${nombre}`}</CardTitle>
              <div className="flex items-center gap-4">
                <DateDisplay />
                <div className="bg-gray-100 px-4 py-2 rounded-md flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-600" />
                  <DigitalClock />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
        <DashboardDemo />
      </PageBody>
    </>
  );
});
