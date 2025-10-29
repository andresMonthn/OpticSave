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
        <div className="mb-6">
          <NotificacionesAPI />
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-2xl font-bold tracking-tight">{`Bienvenido ${nombre}`}</CardTitle>
              <DateTimeDisplay />
            </CardHeader>
          </Card>
        </div>
        <DashboardDemo />
      </PageBody>
    </>
  );
});
