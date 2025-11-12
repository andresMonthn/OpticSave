import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import NotificacionesAPI from './_components/notificaciones_api';
import Link from 'next/link';
import Image from 'next/image';
import { Home, CalendarDays, Settings } from 'lucide-react';
import pathsConfig from '~/config/paths.config';
import { UserNotifications } from './_components/user-notifications';

// local imports
import { HomeLayoutPageHeader } from './_components/home-page-header';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';
import { Card, CardHeader, CardTitle } from '@kit/ui/card';
import { DashboardDemo } from '../[account]/_components/dashboard-demo';
import { DateTimeDisplay } from './_components/date-time-display';


export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:homePage');
  return {
    title,
  };
};


//inportante modificacion de dependencias prueba para realizar rama
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
        <div className="mb-6 pb-20 sm:pb-0">
          <NotificacionesAPI />
          <Card className="shadow-sm scale-50 origin-top-left w-fit">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 space-y-0">
              <CardTitle className="text-[0.625rem] sm:text-2xl font-bold tracking-tight">{`Bienvenido ${nombre}`}</CardTitle>
              <div className="text-[0.625rem] sm:text-base">
                <DateTimeDisplay />
              </div>
            </CardHeader>
          </Card>
          <DashboardDemo />
        </div>
        
      </PageBody>

      {/* Header inferior fijo (solo móviles) */}
      <nav className="fixed bottom-0 left-0 right-0 sm:hidden border-t border-gray-200 dark:border-primary/10 bg-background/80 backdrop-blur-md z-[1000]">
        <div className="mx-auto max-w-md">
          <ul className="grid grid-cols-5 items-center px-4 py-2">
            <li className="flex justify-center">
              <Link href={pathsConfig.app.home} aria-label="Inicio">
                <Home className="h-6 w-6" />
              </Link>
            </li>
            <li className="flex justify-center">
              <Link href={pathsConfig.app.agenda} aria-label="Agenda">
                <CalendarDays className="h-6 w-6" />
              </Link>
            </li>
            {/* Logo centrado */}
            <li className="flex justify-center">
              <Link href={"/home"} aria-label="Logo OptiSave">
                <Image
                  src="/images/logos/logoOpticsave-patreke.png"
                  alt="OptiSave"
                  width={40}
                  height={40}
                  priority
                  className="h-10 w-auto rounded-full"
                />
              </Link>
            </li>
            <li className="flex justify-center">
              {/* Notificaciones reales basadas en componente */}
              <UserNotifications userId={user.id} />
            </li>
            <li className="flex justify-center">
              <Link href={pathsConfig.app.personalAccountSettings} aria-label="Opciones">
                <Settings className="h-6 w-6" />
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
});
