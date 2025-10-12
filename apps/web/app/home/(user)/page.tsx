import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

// local imports
import { HomeLayoutPageHeader } from './_components/home-page-header';
import { loadUserWorkspace } from './_lib/server/load-user-workspace';
import { Card, CardHeader, CardTitle } from '@kit/ui/card';
import { DashboardDemo } from '../[account]/_components/dashboard-demo';
import { CalendarDays, Clock } from 'lucide-react';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:homePage');

  return {
    title,
  };
};

export default withI18n(async function UserHomePage() {
  const { user } = await loadUserWorkspace();
  const nombre = user?.user_metadata?.name || user?.email || 'Usuario';
  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.home'} />}
        description={<Trans i18nKey={'common:homeTabDescription'} />}
      />
      <PageBody>
        <div className="mb-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-2xl font-bold tracking-tight">{`Bienvenido ${nombre}`}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                  <CalendarDays className="h-4 w-4" />
                  {fechaStr}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 tabular-nums">
                  <Clock className="h-4 w-4" />
                  {horaStr}
                </span>
              </div>
            </CardHeader>
          </Card>
        </div>
        <DashboardDemo />
      </PageBody>
    </>
  );
});
