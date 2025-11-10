import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { SitePageHeader } from '../_components/site-page-header';
// No renderizamos páginas específicas aquí; se muestran al navegar por la barra lateral

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:documentation'),
  };
};

async function DocsPage() {
  const { t } = await createI18nServerInstance();
  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title={t('marketing:documentation')}
        subtitle={t('marketing:documentationSubtitle')}
      />
      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-3xl px-6'}>
          <p className={'text-muted-foreground'}>
            Selecciona una sección en la barra lateral para explorar la documentación.
          </p>
        </div>
      </div>
    </div>
  );
}

export default withI18n(DocsPage);
