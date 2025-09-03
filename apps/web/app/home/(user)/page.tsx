import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

// local imports
import { HomeLayoutPageHeader } from './_components/home-page-header';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:homePage');

  return {
    title,
  };
};

import { Calendar, } from '@kit/ui/calendar';
import { Button } from '@kit/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kit/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { DropdownMenu } from '@kit/ui/dropdown-menu';
import Dashboard from './dashboard/page';


function UserHomePage() {
  return (
    <>

      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.home'} />}
        description={<Trans i18nKey={'common:homeTabDescription'} />}
      />
      <PageBody>
        <Dashboard />
      </PageBody>
    </>
  );
}

export default withI18n(UserHomePage);
