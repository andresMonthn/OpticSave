import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import NotificacionesAPI from './_components/notificaciones_api';
import Link from 'next/link';
import Image from 'next/image';
import { Home, CalendarDays, Settings, BarChart3 } from 'lucide-react';
import pathsConfig from '~/config/paths.config';
import { UserNotifications } from './_components/user-notifications';
// local imports
import { HomeLayoutPageHeader } from './_components/home-page-header';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';
import { Card, CardHeader, CardTitle } from '@kit/ui/card';
import { DashboardDemo } from '../[account]/_components/dashboard-demo';
import { DateTimeDisplay } from './_components/date-time-display';
import BuscarPaciente from './buscarpaciente/page';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@kit/ui/accordion';


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
        <div className="pb-[120px]">
          {/* <NotificacionesAPI /> */}
          <div className="w-full flex items-end justify-end" style={{ height: "100px" }}>
            <div className="flex text-[0.425rem]">
              <DateTimeDisplay />
            </div>
          </div>
          <BuscarPaciente />
          <div className="fixed bottom-[64px] sm:bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] md:right-auto md:w-[calc(100vw-var(--sidebar-width))] px-4 pb-4 z-[900]">
            <Accordion type='single' collapsible>
              <AccordionItem value="analitics" className="group">
                <div className="m-[10px]">
                  <AccordionTrigger className="relative z-[900] w-full h-[100px] rounded-xl bg-white px-4 text-[clamp(1rem,3vw,1.25rem)] sm:text-[clamp(1.125rem,2.5vw,1.5rem)] md:text-[clamp(1.25rem,2vw,1.75rem)] font-semibold shadow-[0_10px_30px_rgba(0,100,255,0.35)] ring-1 ring-primary/10 hover:shadow-[0_14px_40px_rgba(0,100,255,0.45)]">
                    <span className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2 truncate">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span className="truncate">Análiticas</span>
                      </span>
                    </span>
                  </AccordionTrigger>
                </div>
                <div className="fixed inset-0 bg-black/35 backdrop-blur-sm hidden group-data-[state=open]:block z-[850] pointer-events-none" />
                <AccordionContent className="relative z-[950] origin-bottom max-h-[70vh] overflow-y-auto rounded-t-xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,100,255,0.25)]">
                  <DashboardDemo />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
         
         
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
